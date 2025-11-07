// Endpoint para ver las inscripciones de un evento específico
// GET /api/eventos/[id]/inscripciones - Ver inscripciones del evento

// Función para verificar autenticación
async function requireAuth(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Token no proporcionado');
  }

  const token = authHeader.substring(7);
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload;
  } catch (e) {
    throw new Error('Token inválido');
  }
}

export async function onRequest(context) {
  const { request, env, params } = context;
  const method = request.method;
  const eventId = parseInt(params.id);

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

  // Validar ID del evento
  if (isNaN(eventId)) {
    return new Response(JSON.stringify({
      success: false,
      error: 'ID de evento inválido'
    }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }

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

    const result = await getInscripcionesEventoCompletas(env, eventId);

    if (!result.success) {
      return new Response(JSON.stringify({
        success: false,
        error: result.error
      }), {
        status: result.error === 'Evento no encontrado' ? 404 : 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      data: result.data, // Array de inscripciones directamente
      count: result.count
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error) {
    console.error('Error in evento inscripciones endpoint:', error);
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

// Función para obtener inscripciones completas del evento con datos de usuarios
async function getInscripcionesEventoCompletas(env, eventoId) {
  try {
    // Verificar que el evento existe en D1
    const eventoResult = await env.DB.prepare(
      'SELECT id, title, max_participants FROM eventos WHERE id = ?'
    ).bind(eventoId).first();

    if (!eventoResult) {
      return {
        success: false,
        error: 'Evento no encontrado'
      };
    }

    // Obtener inscripciones del evento desde KV
    const inscripcionesData = await env.ACA_KV.get(`inscripciones:evento:${eventoId}`);
    const inscripciones = inscripcionesData ? JSON.parse(inscripcionesData) : [];

    console.log(`Inscripciones encontradas para evento ${eventoId}:`, inscripciones.length);

    // Ordenar por fecha de creación (más recientes primero)
    inscripciones.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return {
      success: true,
      data: inscripciones, // Retornar array directamente
      count: inscripciones.length
    };

  } catch (error) {
    console.error('Error in getInscripcionesEventoCompletas:', error);
    return {
      success: false,
      error: 'Error obteniendo inscripciones del evento'
    };
  }
}
