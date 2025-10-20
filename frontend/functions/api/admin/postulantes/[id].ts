import { jsonResponse, errorResponse, requireAuth } from '../../../_middleware';
import {
  ensurePostulacionesSchema,
  mapPostulacionRow,
  isDirectorRole,
} from '../../_utils/postulaciones';

export const onRequestGet = async ({ request, env, params }) => {
  try {
    const auth = await requireAuth(request, env);
    const user = await env.DB.prepare(
      `SELECT id, role FROM usuarios WHERE id = ?`,
    )
      .bind(auth.userId)
      .first();

    if (!user || !isDirectorRole(user.role)) {
      return errorResponse('No tienes permisos para revisar postulaciones', 403);
    }

    await ensurePostulacionesSchema(env.DB);

    const postulacionId = Number(params.id);
    if (Number.isNaN(postulacionId)) {
      return errorResponse('Identificador de postulación inválido', 400);
    }

    const row = await env.DB.prepare(
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
        ) as approvals_json
      FROM postulaciones p
      LEFT JOIN postulacion_aprobaciones a ON a.postulacion_id = p.id
      LEFT JOIN usuarios u ON u.id = a.approver_id
      WHERE p.id = ?
      GROUP BY p.id
    `,
    )
      .bind(postulacionId)
      .first();

    if (!row) {
      return errorResponse('Postulación no encontrada', 404);
    }

    const postulacion = mapPostulacionRow(row);
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

    return jsonResponse({
      success: true,
      data: {
        ...postulacion,
        approvals,
        approvalsCount: approvals.length,
        pendingApprovals: Math.max(0, (postulacion?.approvalsRequired ?? 2) - approvals.length),
      },
    });
  } catch (error) {
    console.error('[admin/postulantes/:id] Error fetching postulacion:', error);
    return errorResponse('Error interno al obtener la postulación', 500);
  }
};
