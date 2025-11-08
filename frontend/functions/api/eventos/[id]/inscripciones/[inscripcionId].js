/**
 * Endpoint para actualizar el estado de una inscripción
 * PATCH /api/eventos/[id]/inscripciones/[inscripcionId]
 * 
 * Permite a admins y organizadores cambiar el estado de una inscripción
 */

export async function onRequestPatch(context) {
  const { env, params, request } = context;
  const eventoId = parseInt(params.id);
  const inscripcionId = params.inscripcionId;

  if (isNaN(eventoId) || !inscripcionId) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Parámetros inválidos'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Verificar autenticación
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No autorizado'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.substring(7);
    let user;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      user = payload;
    } catch (e) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Token inválido'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verificar que el evento existe
    const eventoResult = await env.DB.prepare(
      'SELECT id, title, organizer_id FROM eventos WHERE id = ?'
    ).bind(eventoId).first();

    if (!eventoResult) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Evento no encontrado'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verificar permisos (debe ser admin o organizador)
    const isAdmin = user.roles && user.roles.includes('admin');
    const isOrganizer = eventoResult.organizer_id === user.id;

    if (!isAdmin && !isOrganizer) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No tienes permisos para gestionar inscripciones de este evento'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Obtener el nuevo estado del body
    const body = await request.json();
    const { status: newStatus } = body;

    if (!newStatus || !['confirmed', 'waitlist', 'cancelled'].includes(newStatus)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Estado inválido. Debe ser: confirmed, waitlist o cancelled'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Obtener inscripciones actuales desde KV
    const inscripcionesData = await env.ACA_KV.get(`inscripciones:evento:${eventoId}`);
    let inscripciones = inscripcionesData ? JSON.parse(inscripcionesData) : [];

    // Buscar y actualizar la inscripción
    const inscripcionIndex = inscripciones.findIndex(i => i.id === inscripcionId);
    
    if (inscripcionIndex === -1) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Inscripción no encontrada'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Actualizar el estado
    inscripciones[inscripcionIndex] = {
      ...inscripciones[inscripcionIndex],
      status: newStatus,
      updatedAt: new Date().toISOString(),
      updatedBy: user.id
    };

    // Guardar en KV
    await env.ACA_KV.put(
      `inscripciones:evento:${eventoId}`,
      JSON.stringify(inscripciones)
    );

    // También actualizar la inscripción individual
    await env.ACA_KV.put(
      `inscripcion:${inscripcionId}`,
      JSON.stringify(inscripciones[inscripcionIndex])
    );

    console.log(`Inscripción ${inscripcionId} actualizada a estado: ${newStatus} por usuario ${user.id}`);

    return new Response(JSON.stringify({
      success: true,
      data: inscripciones[inscripcionIndex],
      message: 'Estado de inscripción actualizado exitosamente'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error actualizando inscripción:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error al actualizar la inscripción'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
