// Endpoint para ver las inscripciones de un evento específico
// GET /api/eventos/[id]/inscripciones - Ver inscripciones del evento

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
      data: result.data,
      stats: result.stats
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
    // Verificar que el evento existe
    const eventoData = await env.ACA_KV.get(`evento:${eventoId}`);
    if (!eventoData) {
      return {
        success: false,
        error: 'Evento no encontrado'
      };
    }

    const evento = JSON.parse(eventoData);

    // Obtener inscripciones del evento
    const inscripcionesData = await env.ACA_KV.get(`inscripciones:evento:${eventoId}`);
    const inscripciones = inscripcionesData ? JSON.parse(inscripcionesData) : [];

    // Enriquecer con datos de usuarios (simulado por ahora)
    const inscripcionesConUsuarios = inscripciones.map((inscripcion) => {
      return {
        ...inscripcion,
        usuario: {
          id: inscripcion.userId,
          email: `usuario${inscripcion.userId}@ejemplo.com`, // TODO: Obtener desde D1
          name: `Usuario ${inscripcion.userId}`, // TODO: Obtener desde D1
        }
      };
    });

    // Ordenar por fecha de inscripción
    inscripcionesConUsuarios.sort((a, b) => 
      new Date(a.fechaInscripcion).getTime() - new Date(b.fechaInscripcion).getTime()
    );

    // Estadísticas
    const stats = {
      totalInscripciones: inscripciones.length,
      maxParticipants: evento.maxParticipants,
      espaciosDisponibles: evento.maxParticipants ? evento.maxParticipants - inscripciones.length : null,
      porcentajeOcupacion: evento.maxParticipants ? 
        Math.round((inscripciones.length / evento.maxParticipants) * 100) : null,
      estadosInscripciones: {
        confirmada: inscripciones.filter(i => i.estado === 'confirmada').length,
        pendiente: inscripciones.filter(i => i.estado === 'pendiente').length,
        cancelada: inscripciones.filter(i => i.estado === 'cancelada').length,
      }
    };

    return {
      success: true,
      data: {
        evento: evento,
        inscripciones: inscripcionesConUsuarios
      },
      stats: stats
    };

  } catch (error) {
    console.error('Error in getInscripcionesEventoCompletas:', error);
    return {
      success: false,
      error: 'Error obteniendo inscripciones del evento'
    };
  }
}
