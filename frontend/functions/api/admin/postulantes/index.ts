import { jsonResponse, errorResponse, requireAdminOrDirector, authErrorResponse } from '../_middleware';
import {
  ensurePostulacionesSchema,
  mapPostulacionRow,
  isDirectorRole,
  PostulacionStatus,
} from '../../_utils/postulaciones';

const STATUS_WHITELIST: PostulacionStatus[] = ['pendiente', 'en_revision', 'aprobada', 'rechazada'];

export const onRequestGet = async ({ request, env }: any) => {
  try {
    let auth;
    try {
      auth = await requireAdminOrDirector(request, env);
    } catch (error) {
      return authErrorResponse(error, env);
    }
    const user = await env.DB.prepare(
      `
      SELECT id, role, email, nombre, apellido
      FROM usuarios
      WHERE id = ?
    `,
    )
      .bind(auth.userId)
      .first();

    if (!user) {
      return errorResponse('Usuario no autorizado', 401);
    }

    if (!isDirectorRole(user.role)) {
      return errorResponse('No tienes permisos para revisar postulaciones', 403);
    }

    await ensurePostulacionesSchema(env.DB);

    const url = new URL(request.url);
    const page = Math.max(parseInt(url.searchParams.get('page') || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '20', 10), 1), 100);
    const status = url.searchParams.get('status');
    const search = url.searchParams.get('search');

    const filters: string[] = [];
    const filterParams: any[] = [];

    if (status && STATUS_WHITELIST.includes(status as PostulacionStatus)) {
      filters.push('p.status = ?');
      filterParams.push(status);
    }

    if (search) {
      const term = `%${search.trim().toLowerCase()}%`;
      filters.push(
        `(LOWER(p.full_name) LIKE ? OR LOWER(p.email) LIKE ? OR LOWER(IFNULL(p.city, '')) LIKE ? OR LOWER(IFNULL(p.region, '')) LIKE ? OR IFNULL(p.phone, '') LIKE ? OR IFNULL(p.rut, '') LIKE ?)`,
      );
      filterParams.push(term, term, term, term, term, term);
    }

    const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';

    const totalRow = await env.DB.prepare(
      `
      SELECT COUNT(*) as total
      FROM postulaciones p
      ${whereClause}
    `,
    )
      .bind(...filterParams)
      .first();

    const offset = (page - 1) * limit;
    const postulacionesResult = await env.DB.prepare(
      `
      SELECT 
        p.*,
        json_group_array(
          CASE 
            WHEN a.id IS NULL THEN NULL 
            ELSE json_object(
              'id', a.id,
              'approverId', a.approver_id,
              'approverRole', a.approver_role,
              'comment', a.comment,
              'createdAt', a.created_at,
              'approverName', COALESCE(u.nombre || ' ' || u.apellido, u.email)
            )
          END
        ) as approvals_json,
        (
          SELECT json_group_array(
            json_object(
              'id', r.id,
              'reviewerId', r.reviewer_id,
              'reviewerName', COALESCE(ur.nombre || ' ' || ur.apellido, ur.email),
              'reviewerEmail', ur.email,
              'reviewerRole', ur.role,
              'feedback', r.feedback,
              'createdAt', r.created_at,
              'updatedAt', r.updated_at
            )
          )
          FROM postulacion_reviewers r
          JOIN usuarios ur ON ur.id = r.reviewer_id
          WHERE r.postulacion_id = p.id
          ORDER BY r.created_at ASC
        ) as reviewers_json
      FROM postulaciones p
      LEFT JOIN postulacion_aprobaciones a ON a.postulacion_id = p.id
      LEFT JOIN usuarios u ON u.id = a.approver_id
      ${whereClause}
      GROUP BY p.id
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `,
    )
      .bind(...filterParams, limit, offset)
      .all();

    const postulaciones = (postulacionesResult.results || []).map((row: any) => {
      const base = mapPostulacionRow(row);
      let approvals: Array<{
        id: number;
        approverId: number;
        approverRole: string;
        comment: string | null;
        createdAt: string;
        approverName: string | null;
      }> = [];

      if (row.approvals_json) {
        try {
          const parsed = JSON.parse(row.approvals_json);
          if (Array.isArray(parsed)) {
            approvals = parsed
              .filter(Boolean)
              .map((item) => ({
                id: Number(item.id),
                approverId: Number(item.approverId),
                approverRole: item.approverRole,
                comment: item.comment ?? null,
                createdAt: item.createdAt,
                approverName: item.approverName ?? null,
              }));
          }
        } catch (error) {
          console.error('[postulaciones] Error parsing approvals_json', error);
        }
      }

      let reviewers: Array<{
        id: number;
        reviewerId: number;
        reviewerName: string;
        reviewerEmail: string;
        reviewerRole: string;
        createdAt: string;
      }> = [];

      if (row.reviewers_json) {
        try {
          const parsed = JSON.parse(row.reviewers_json);
          if (Array.isArray(parsed)) {
            reviewers = parsed
              .filter(Boolean)
              .map((item) => ({
                id: Number(item.id),
                reviewerId: Number(item.reviewerId),
                reviewerName: item.reviewerName,
                reviewerEmail: item.reviewerEmail,
                reviewerRole: item.reviewerRole,
                createdAt: item.createdAt,
              }));
          }
        } catch (error) {
          console.error('[postulaciones] Error parsing reviewers_json', error);
        }
      }

      return {
        ...base,
        approvals,
        approvalsCount: approvals.length,
        pendingApprovals: Math.max(0, (base?.approvalsRequired ?? 2) - approvals.length),
        reviewers,
      };
    });

    const total = Number(totalRow?.total || 0);
    const totalPages = Math.ceil(total / limit) || 1;

    return jsonResponse({
      success: true,
      data: postulaciones,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('[admin/postulantes] Error listing postulaciones:', error);
    return errorResponse('Error interno al listar postulaciones', 500);
  }
};
