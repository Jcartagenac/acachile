import { jsonResponse, errorResponse, requireAdminOrDirector, authErrorResponse } from '../../_middleware';
import { ensurePostulacionesSchema } from '../../../_utils/postulaciones';

export const onRequestPut = async ({ request, env, params }: any) => {
  try {
    let auth;
    try {
      auth = await requireAdminOrDirector(request, env);
    } catch (error) {
      return authErrorResponse(error, env);
    }

    const postulacionId = Number(params.id);
    if (!postulacionId || postulacionId < 1) {
      return errorResponse('ID de postulación inválido', 400);
    }

    const body = await request.json();
    const feedback = typeof body.feedback === 'string' ? body.feedback.trim() : '';

    if (feedback.length > 5000) {
      return errorResponse('El feedback no puede exceder 5000 caracteres', 400);
    }

    await ensurePostulacionesSchema(env.DB);

    // Verificar que la postulación existe
    const postulacion = await env.DB.prepare(`
      SELECT id, status 
      FROM postulaciones 
      WHERE id = ?
    `)
      .bind(postulacionId)
      .first();

    if (!postulacion) {
      return errorResponse('Postulación no encontrada', 404);
    }

    // Verificar que el usuario es un revisor asignado
    const reviewer = await env.DB.prepare(`
      SELECT id
      FROM postulacion_reviewers
      WHERE postulacion_id = ? AND reviewer_id = ?
    `)
      .bind(postulacionId, auth.userId)
      .first();

    if (!reviewer) {
      return errorResponse('Solo los revisores asignados pueden agregar feedback', 403);
    }

    // Actualizar feedback
    const result = await env.DB.prepare(`
      UPDATE postulacion_reviewers
      SET feedback = ?, updated_at = CURRENT_TIMESTAMP
      WHERE postulacion_id = ? AND reviewer_id = ?
    `)
      .bind(feedback || null, postulacionId, auth.userId)
      .run();

    if (!result.success) {
      console.error('[feedback] Error updating:', result.error);
      return errorResponse('Error al actualizar feedback', 500);
    }

    // Obtener los revisores actualizados con feedback
    const reviewersResult = await env.DB.prepare(`
      SELECT 
        r.id,
        r.reviewer_id,
        r.feedback,
        r.created_at,
        r.updated_at,
        u.nombre,
        u.apellido,
        u.email,
        u.role
      FROM postulacion_reviewers r
      JOIN usuarios u ON u.id = r.reviewer_id
      WHERE r.postulacion_id = ?
      ORDER BY r.created_at ASC
    `)
      .bind(postulacionId)
      .all();

    const reviewers = (reviewersResult.results || []).map((row: any) => ({
      id: row.id,
      reviewerId: row.reviewer_id,
      reviewerName: `${row.nombre} ${row.apellido}`.trim() || row.email,
      reviewerEmail: row.email,
      reviewerRole: row.role,
      feedback: row.feedback || null,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return jsonResponse({
      success: true,
      data: {
        postulacionId,
        reviewers,
      },
    });
  } catch (error) {
    console.error('[feedback] Error:', error);
    return errorResponse('Error al actualizar feedback', 500);
  }
};
