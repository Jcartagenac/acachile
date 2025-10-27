// Endpoint para que los usuarios vean sus propias inscripciones
// GET /api/inscripciones/mis-inscripciones - Listar inscripciones del usuario autenticado

import { requireAuth } from '../_middleware';

export async function onRequest(context) {
  const { request, env } = context;
  const method = request.method;

  const corsHeaders = {
    'Access-Control-Allow-Origin': env.CORS_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // Manejar preflight requests
  if (method === 'OPTIONS') {
    return new Response(null, { 
      status: 204, 
      headers: corsHeaders 
    });
  }

  if (method !== 'GET') {
    return new Response(JSON.stringify({
      success: false,
      error: 'Método no permitido'
    }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }

  try {
    // Verificar autenticación
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

    const userId = authUser.userId;

    const result = await getMisInscripciones(env, userId);

    if (!result.success) {
      return new Response(JSON.stringify({
        success: false,
        error: result.error
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      data: result.data
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error) {
    console.error('Error in mis-inscripciones endpoint:', error);
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

// Función para obtener las inscripciones del usuario con datos completos del evento
async function getMisInscripciones(env, userId) {
  try {
    // Obtener inscripciones del usuario
    const inscripcionesData = await env.ACA_KV.get(`inscripciones:usuario:${userId}`);
    const inscripciones = inscripcionesData ? JSON.parse(inscripcionesData) : [];

    // Enriquecer con datos de eventos
    const inscripcionesConEventos = await Promise.all(
      inscripciones.map(async (inscripcion) => {
        try {
          const eventoData = await env.ACA_KV.get(`evento:${inscripcion.eventoId}`);
          const evento = eventoData ? JSON.parse(eventoData) : null;

          return {
            ...inscripcion,
            evento: evento
          };
        } catch (error) {
          console.error(`Error getting evento ${inscripcion.eventoId}:`, error);
          return {
            ...inscripcion,
            evento: null
          };
        }
      })
    );

    // Ordenar por fecha de inscripción (más recientes primero)
    inscripcionesConEventos.sort((a, b) => 
      new Date(b.fechaInscripcion).getTime() - new Date(a.fechaInscripcion).getTime()
    );

    return {
      success: true,
      data: inscripcionesConEventos
    };

  } catch (error) {
    console.error('Error in getMisInscripciones:', error);
    return {
      success: false,
      error: 'Error obteniendo inscripciones del usuario'
    };
  }
}
