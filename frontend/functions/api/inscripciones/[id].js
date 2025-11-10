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

    const { results } = await env.DB.prepare(
      'SELECT * FROM inscriptions WHERE id = ?'
    ).bind(inscripcionId).all();

    if (!results || results.length === 0) {
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

    const row = results[0];
    const inscripcion = {
      id: row.id,
      userId: row.user_id,
      eventoId: row.event_id,
      estado: row.status,
      fechaInscripcion: row.inscription_date,
      metodoPago: row.payment_status,
      notas: row.notes
    };

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
    // Verificar que la inscripción existe en D1
    const { results } = await env.DB.prepare(
      'SELECT * FROM inscriptions WHERE id = ?'
    ).bind(inscripcionId).all();
    
    if (!results || results.length === 0) {
      return {
        success: false,
        error: 'Inscripción no encontrada'
      };
    }

    const inscripcion = results[0];
    const userId = inscripcion.user_id;
    const eventoId = inscripcion.event_id;

    if (currentUserId !== userId) {
      return {
        success: false,
        error: 'No autorizado para cancelar esta inscripción'
      };
    }

    // Eliminar inscripción de D1 y decrementar contador en una transacción
    try {
      await env.DB.prepare(
        'DELETE FROM inscriptions WHERE id = ?'
      ).bind(inscripcionId).run();
      
      await env.DB.prepare(
        'UPDATE eventos SET current_participants = CASE WHEN current_participants > 0 THEN current_participants - 1 ELSE 0 END WHERE id = ?'
      ).bind(eventoId).run();
      
      console.log('[cancelarInscripcion] Deleted inscription and decremented current_participants for evento', eventoId);
    } catch (dbError) {
      console.error('[cancelarInscripcion] Error deleting inscription from D1:', dbError);
      return {
        success: false,
        error: 'Error al cancelar la inscripción en la base de datos'
      };
    }

    // Invalidar TODAS las claves de caché de eventos para forzar refresh desde BD
    if (env.ACA_KV) {
      // Lista de todas las combinaciones posibles de status, type, page
      const statuses = ['published', 'draft', 'all'];
      const types = ['all', 'encuentro', 'taller', 'webinar'];
      const searches = ['none'];
      const pages = Array.from({length: 5}, (_, i) => i + 1); // páginas 1-5
      const limit = 12;
      
      const cacheKeys = [];
      for (const status of statuses) {
        for (const type of types) {
          for (const search of searches) {
            for (const page of pages) {
              cacheKeys.push(`eventos:list:${status}:${type}:${search}:${page}:${limit}`);
            }
          }
        }
      }
      
      for (const key of cacheKeys) {
        await env.ACA_KV.delete(key);
      }
      console.log('[cancelarInscripcion] Invalidated all eventos cache keys');
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
