import { jsonResponse, errorResponse, requireAdminOrDirector, authErrorResponse } from '../../_middleware';
import { ensurePostulacionesSchema } from '../../../_utils/postulaciones';
import { sendEmail, generateReviewerAssignmentEmail } from '../../../_utils/email';

export const onRequestPost = async ({ request, env, params }: any) => {
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
    const reviewerId = Number(body.reviewerId);

    if (!reviewerId || reviewerId < 1) {
      return errorResponse('ID de revisor requerido', 400);
    }

    await ensurePostulacionesSchema(env.DB);

    // Verificar que la postulación existe y obtener info del postulante
    const postulacion = await env.DB.prepare(`
      SELECT id, status, full_name 
      FROM postulaciones 
      WHERE id = ?
    `)
      .bind(postulacionId)
      .first();

    if (!postulacion) {
      return errorResponse('Postulación no encontrada', 404);
    }

    // Verificar que el revisor es director/admin
    const reviewer = await env.DB.prepare(`
      SELECT id, role, nombre, apellido, email
      FROM usuarios
      WHERE id = ?
    `)
      .bind(reviewerId)
      .first();

    if (!reviewer) {
      return errorResponse('Usuario revisor no encontrado', 404);
    }

    if (reviewer.role !== 'admin' && reviewer.role !== 'organizer' && reviewer.role !== 'editor') {
      return errorResponse('El revisor debe ser un miembro del directorio', 400);
    }

    // Verificar si ya está asignado
    const existing = await env.DB.prepare(`
      SELECT id 
      FROM postulacion_reviewers 
      WHERE postulacion_id = ? AND reviewer_id = ?
    `)
      .bind(postulacionId, reviewerId)
      .first();

    if (existing) {
      return errorResponse('Este revisor ya está asignado a esta postulación', 409);
    }

    // Verificar límite de 2 revisores
    const countResult = await env.DB.prepare(`
      SELECT COUNT(*) as count
      FROM postulacion_reviewers
      WHERE postulacion_id = ?
    `)
      .bind(postulacionId)
      .first();

    if (countResult && countResult.count >= 2) {
      return errorResponse('Esta postulación ya tiene el máximo de 2 revisores asignados', 400);
    }

    // Obtener información del usuario que asigna
    const assignedBy = await env.DB.prepare(`
      SELECT nombre, apellido, email
      FROM usuarios
      WHERE id = ?
    `)
      .bind(auth.userId)
      .first();

    const assignedByName = assignedBy 
      ? `${assignedBy.nombre} ${assignedBy.apellido}`.trim() || assignedBy.email
      : 'Administrador';

    // Asignar revisor
    const result = await env.DB.prepare(`
      INSERT INTO postulacion_reviewers (postulacion_id, reviewer_id, assigned_by)
      VALUES (?, ?, ?)
    `)
      .bind(postulacionId, reviewerId, auth.userId)
      .run();

    if (!result.success) {
      console.error('[assign-reviewer] Error inserting:', result.error);
      return errorResponse('Error al asignar revisor', 500);
    }

    // Enviar notificación por email al revisor
    const reviewerName = `${reviewer.nombre} ${reviewer.apellido}`.trim() || reviewer.email;
    const emailHtml = generateReviewerAssignmentEmail({
      reviewerName,
      postulanteName: postulacion.full_name,
      postulacionId,
      assignedByName,
    });

    // Enviar email (no bloqueante, no falla si no se envía)
    sendEmail(
      {
        to: reviewer.email,
        subject: `🎯 Nueva asignación de revisión - ${postulacion.full_name}`,
        html: emailHtml,
      },
      env
    ).catch((error) => {
      console.error('[assign-reviewer] Error enviando email:', error);
      // No retornamos error, el email es opcional
    });

    // Obtener los revisores actualizados
    const reviewersResult = await env.DB.prepare(`
      SELECT 
        r.id,
        r.reviewer_id,
        r.feedback,
        r.created_at,
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
    }));

    return jsonResponse({
      success: true,
      data: {
        postulacionId,
        reviewers,
      },
    });
  } catch (error) {
    console.error('[assign-reviewer] Error:', error);
    return errorResponse('Error al asignar revisor', 500);
  }
};

export const onRequestDelete = async ({ request, env, params }: any) => {
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

    const url = new URL(request.url);
    const reviewerId = Number(url.searchParams.get('reviewerId'));

    if (!reviewerId || reviewerId < 1) {
      return errorResponse('ID de revisor requerido', 400);
    }

    await ensurePostulacionesSchema(env.DB);

    const result = await env.DB.prepare(`
      DELETE FROM postulacion_reviewers 
      WHERE postulacion_id = ? AND reviewer_id = ?
    `)
      .bind(postulacionId, reviewerId)
      .run();

    if (!result.success) {
      return errorResponse('Error al remover revisor', 500);
    }

    return jsonResponse({
      success: true,
      message: 'Revisor removido exitosamente',
    });
  } catch (error) {
    console.error('[assign-reviewer] Error deleting:', error);
    return errorResponse('Error al remover revisor', 500);
  }
};
