import { jsonResponse, errorResponse, requireAuth } from '../../../../_middleware';
import {
  ensurePostulacionesSchema,
  isDirectorRole,
  mapPostulacionRow,
} from '../../../_utils/postulaciones';

export const onRequestPost = async ({ request, env, params }) => {
  try {
    const auth = await requireAuth(request, env);
    const approver = await env.DB.prepare(
      `SELECT id, role FROM usuarios WHERE id = ?`,
    )
      .bind(auth.userId)
      .first();

    if (!approver || !isDirectorRole(approver.role)) {
      return errorResponse('No tienes permisos para gestionar postulaciones', 403);
    }

    const body = await request.json().catch(() => ({}));
    const reason =
      typeof body?.reason === 'string' && body.reason.trim().length > 0
        ? body.reason.trim().slice(0, 600)
        : null;

    if (!reason) {
      return errorResponse('Debes indicar un motivo para rechazar la postulación', 400);
    }

    await ensurePostulacionesSchema(env.DB);

    const postulacionId = Number(params.id);
    if (Number.isNaN(postulacionId)) {
      return errorResponse('Identificador de postulación inválido', 400);
    }

    const postulacionRow = await env.DB.prepare(
      `SELECT * FROM postulaciones WHERE id = ?`,
    )
      .bind(postulacionId)
      .first();

    if (!postulacionRow) {
      return errorResponse('Postulación no encontrada', 404);
    }

    if (postulacionRow.status === 'aprobada') {
      return errorResponse('La postulación ya fue aprobada y no puede rechazarse', 400);
    }

    if (postulacionRow.status === 'rechazada') {
      return errorResponse('La postulación ya se encuentra rechazada', 400);
    }

    await env.DB.prepare(
      `
      UPDATE postulaciones
      SET status = 'rechazada',
          rejection_reason = ?,
          rejected_at = CURRENT_TIMESTAMP,
          approvals_count = approvals_count
      WHERE id = ?
    `,
    )
      .bind(reason, postulacionId)
      .run();

    const refreshedRow = await env.DB.prepare(
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

    const postulacion = mapPostulacionRow(refreshedRow);

    let approvals: Array<{
      id: number;
      approverId: number;
      approverRole: string;
      comment: string | null;
      createdAt: string;
      approverName: string | null;
    }> = [];

    if (refreshedRow?.approvals_json) {
      try {
        const parsed = JSON.parse(refreshedRow.approvals_json);
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
    console.error('[admin/postulantes/:id/reject] Error rejecting postulacion:', error);
    return errorResponse('No pudimos rechazar la postulación', 500);
  }
};
