// Endpoint para gestión de inscripciones individuales por ID
// DELETE /api/inscripciones/[id] - Cancelar inscripción específica
// GET /api/inscripciones/[id] - Obtener inscripción específica

import { requireAuth } from '../_middleware';

export async function onRequest(context) {
  const { request, env, params } = context;
  const method = request.method;
  const inscripcionId = params.id;

  const corsHeaders = {
    'Access-Control-Allow-Origin': env.CORS_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'GET, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // Manejar preflight requests
  if (method === 'OPTIONS') {
    return new Response(null, { 
      status: 204, 
      headers: corsHeaders 
    });
  }

  try {
    if (method === 'GET') {
      return await handleGetInscripcionById(request, inscripcionId, env, corsHeaders);
    }
    
    if (method === 'DELETE') {
      return await handleCancelarInscripcion(request, inscripcionId, env, corsHeaders);
    }

    return new Response(JSON.stringify({
      success: false,
      error: `Método ${method} no permitido`
    }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error) {
    console.error('Error in inscripciones/[id] endpoint:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error interno del servidor'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
}

// GET /api/inscripciones/[id] - Obtener inscripción específica
async function handleGetInscripcionById(request, inscripcionId, env, corsHeaders) {
  try {
    let authUser;
    try {
      authUser = await requireAuth(request, env);
    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Autenticación requerida'
      }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    const inscripcionData = await env.ACA_KV.get(`inscripcion:${inscripcionId}`);

    if (!inscripcionData) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Inscripción no encontrada'
      }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    const inscripcion = JSON.parse(inscripcionData);

    if (authUser.userId !== inscripcion.userId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No autorizado'
      }), {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      data: inscripcion
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error) {
    console.error('Error getting inscripcion by ID:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error obteniendo inscripción'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
}

// DELETE /api/inscripciones/[id] - Cancelar inscripción específica
async function handleCancelarInscripcion(request, inscripcionId, env, corsHeaders) {
  try {
    let authUser;
    try {
      authUser = await requireAuth(request, env);
    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Autenticación requerida'
      }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    const currentUserId = authUser.userId;

    const result = await cancelarInscripcion(env, inscripcionId, currentUserId);

    if (!result.success) {
      return new Response(JSON.stringify({
        success: false,
        error: result.error
      }), {
        status: result.error === 'Inscripción no encontrada' ? 404 : 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Inscripción cancelada exitosamente'
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error) {
    console.error('Error canceling inscripcion:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error cancelando inscripción'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
}

// Función de servicio para cancelar inscripción
async function cancelarInscripcion(env, inscripcionId, currentUserId) {
  try {
    // Verificar que la inscripción existe
    const inscripcionData = await env.ACA_KV.get(`inscripcion:${inscripcionId}`);
    
    if (!inscripcionData) {
      return {
        success: false,
        error: 'Inscripción no encontrada'
      };
    }

    const inscripcion = JSON.parse(inscripcionData);
    const { userId, eventoId } = inscripcion;

    if (currentUserId !== userId) {
      return {
        success: false,
        error: 'No autorizado para cancelar esta inscripción'
      };
    }

    // Eliminar inscripción individual
    await env.ACA_KV.delete(`inscripcion:${inscripcionId}`);

    // Eliminar de la lista de inscripciones del usuario
    const userInscripcionesData = await env.ACA_KV.get(`inscripciones:usuario:${userId}`);
    if (userInscripcionesData) {
      const userInscripciones = JSON.parse(userInscripcionesData);
      const updatedUserInscripciones = userInscripciones.filter(i => i.id !== inscripcionId);
      await env.ACA_KV.put(`inscripciones:usuario:${userId}`, JSON.stringify(updatedUserInscripciones));
    }

    // Eliminar de la lista de inscripciones del evento
    const eventInscripcionesData = await env.ACA_KV.get(`inscripciones:evento:${eventoId}`);
    if (eventInscripcionesData) {
      const eventInscripciones = JSON.parse(eventInscripcionesData);
      const updatedEventInscripciones = eventInscripciones.filter(i => i.id !== inscripcionId);
      await env.ACA_KV.put(`inscripciones:evento:${eventoId}`, JSON.stringify(updatedEventInscripciones));

      // Actualizar contador de participantes del evento
      const eventoData = await env.ACA_KV.get(`evento:${eventoId}`);
      if (eventoData) {
        const evento = JSON.parse(eventoData);
        evento.currentParticipants = updatedEventInscripciones.length;
        await env.ACA_KV.put(`evento:${eventoId}`, JSON.stringify(evento));

        // Actualizar en la lista general de eventos
        const eventosData = await env.ACA_KV.get('eventos:all');
        const eventos = eventosData ? JSON.parse(eventosData) : [];
        const eventoIndex = eventos.findIndex(e => e.id === eventoId);
        if (eventoIndex !== -1) {
          eventos[eventoIndex] = evento;
          await env.ACA_KV.put('eventos:all', JSON.stringify(eventos));
        }
      }
    }

    // Eliminar de la lista general de inscripciones
    const allInscripcionesData = await env.ACA_KV.get('inscripciones:all');
    if (allInscripcionesData) {
      const allInscripciones = JSON.parse(allInscripcionesData);
      const updatedAllInscripciones = allInscripciones.filter(i => i.id !== inscripcionId);
      await env.ACA_KV.put('inscripciones:all', JSON.stringify(updatedAllInscripciones));
    }

    // Decrementar contador de participantes en D1
    try {
      await env.DB.prepare(
        'UPDATE eventos SET current_participants = CASE WHEN current_participants > 0 THEN current_participants - 1 ELSE 0 END WHERE id = ?'
      ).bind(eventoId).run();
      console.log('[cancelarInscripcion] Decremented current_participants for evento', eventoId);
    } catch (dbError) {
      console.error('[cancelarInscripcion] Error updating current_participants in D1:', dbError);
      // No fallar la cancelación si el contador no se actualiza
    }

    // Invalidar caché de eventos para forzar refresh desde BD
    if (env.ACA_KV) {
      // Eliminar las claves de caché principales de eventos
      const cacheKeys = [
        'eventos:list:published:all:none:1:12',
        'eventos:list:draft:all:none:1:12',
        'eventos:list:all:all:none:1:12'
      ];
      for (const key of cacheKeys) {
        await env.ACA_KV.delete(key);
      }
      console.log('[cancelarInscripcion] Invalidated eventos cache');
    }

    return {
      success: true
    };

  } catch (error) {
    console.error('Error in cancelarInscripcion:', error);
    return {
      success: false,
      error: 'Error cancelando inscripción'
    };
  }
}
