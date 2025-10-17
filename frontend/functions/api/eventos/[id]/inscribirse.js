import { requireAuth, errorResponse, jsonResponse } from '../../../_middleware';

// Endpoint para inscribirse a un evento específico
// POST /api/eventos/[id]/inscribirse - Inscribirse al evento

export async function onRequest(context) {
  const { request, env, params } = context;
  const method = request.method;
  const eventId = parseInt(params.id);

  const corsHeaders = {
    'Access-Control-Allow-Origin': env.CORS_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // Manejar preflight requests
  if (method === 'OPTIONS') {
    return new Response(null, { 
      status: 204, 
      headers: corsHeaders 
    });
  }

  if (method !== 'POST') {
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
      return errorResponse(
        error instanceof Error ? error.message : 'Token inválido',
        401,
        env.ENVIRONMENT === 'development' ? { details: error } : undefined
      );
    }

    const userId = authUser.userId;
    if (!userId) {
      return errorResponse('Token sin información de usuario', 401);
    }

    const result = await inscribirseEvento(env, userId, eventId);

    if (!result.success) {
      return new Response(JSON.stringify({
        success: false,
        error: result.error
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    return jsonResponse({
      success: true,
      data: result.data,
      message: 'Te has inscrito exitosamente al evento'
    }, 201, corsHeaders);

  } catch (error) {
    console.error('Error in evento inscribirse endpoint:', error);
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

// Función para inscribirse a un evento (reutilizada desde inscripciones/index.js)
async function inscribirseEvento(env, userId, eventoId) {
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

    // Verificar que las inscripciones están abiertas
    if (!evento.registrationOpen) {
      return {
        success: false,
        error: 'Las inscripciones para este evento están cerradas'
      };
    }

    // Verificar límite de participantes
    if (evento.maxParticipants && evento.currentParticipants >= evento.maxParticipants) {
      return {
        success: false,
        error: 'El evento ha alcanzado el límite máximo de participantes'
      };
    }

    // Verificar si ya está inscrito
    const inscripcionesUsuario = await getInscripcionesUsuario(env, userId);
    if (inscripcionesUsuario.success) {
      const yaInscrito = inscripcionesUsuario.data.some(i => i.eventoId === eventoId);
      if (yaInscrito) {
        return {
          success: false,
          error: 'Ya estás inscrito en este evento'
        };
      }
    }

    // Crear inscripción
    const inscripcionId = `${userId}_${eventoId}`;
    const now = new Date().toISOString();
    
    const inscripcion = {
      id: inscripcionId,
      userId: userId,
      eventoId: eventoId,
      fechaInscripcion: now,
      estado: 'confirmada',
      metodoPago: 'pendiente',
      notas: ''
    };

    // Guardar inscripción
    await env.ACA_KV.put(`inscripcion:${inscripcionId}`, JSON.stringify(inscripcion));

    // Actualizar lista de inscripciones del usuario
    const userInscripciones = inscripcionesUsuario.success ? inscripcionesUsuario.data : [];
    userInscripciones.push(inscripcion);
    await env.ACA_KV.put(`inscripciones:usuario:${userId}`, JSON.stringify(userInscripciones));

    // Actualizar lista de inscripciones del evento
    const eventoInscripciones = await getInscripcionesEvento(env, eventoId);
    const eventInscripciones = eventoInscripciones.success ? eventoInscripciones.data : [];
    eventInscripciones.push(inscripcion);
    await env.ACA_KV.put(`inscripciones:evento:${eventoId}`, JSON.stringify(eventInscripciones));

    // Actualizar contador de participantes del evento
    evento.currentParticipants = eventInscripciones.length;
    await env.ACA_KV.put(`evento:${eventoId}`, JSON.stringify(evento));

    // Actualizar lista general de eventos
    const eventosData = await env.ACA_KV.get('eventos:all');
    const eventos = eventosData ? JSON.parse(eventosData) : [];
    const eventoIndex = eventos.findIndex(e => e.id === eventoId);
    if (eventoIndex !== -1) {
      eventos[eventoIndex] = evento;
      await env.ACA_KV.put('eventos:all', JSON.stringify(eventos));
    }

    // Actualizar lista general de inscripciones
    const allInscripcionesData = await env.ACA_KV.get('inscripciones:all');
    const allInscripciones = allInscripcionesData ? JSON.parse(allInscripcionesData) : [];
    allInscripciones.push(inscripcion);
    await env.ACA_KV.put('inscripciones:all', JSON.stringify(allInscripciones));

    // Retornar inscripción con datos del evento
    return {
      success: true,
      data: {
        ...inscripcion,
        evento: evento
      }
    };

  } catch (error) {
    console.error('Error in inscribirseEvento:', error);
    return {
      success: false,
      error: 'Error al inscribirse en el evento'
    };
  }
}

async function getInscripcionesUsuario(env, userId) {
  try {
    const inscripcionesData = await env.ACA_KV.get(`inscripciones:usuario:${userId}`);
    const inscripciones = inscripcionesData ? JSON.parse(inscripcionesData) : [];

    return {
      success: true,
      data: inscripciones
    };

  } catch (error) {
    console.error('Error in getInscripcionesUsuario:', error);
    return {
      success: false,
      error: 'Error obteniendo inscripciones del usuario'
    };
  }
}

async function getInscripcionesEvento(env, eventoId) {
  try {
    const inscripcionesData = await env.ACA_KV.get(`inscripciones:evento:${eventoId}`);
    const inscripciones = inscripcionesData ? JSON.parse(inscripcionesData) : [];

    return {
      success: true,
      data: inscripciones
    };

  } catch (error) {
    console.error('Error in getInscripcionesEvento:', error);
    return {
      success: false,
      error: 'Error obteniendo inscripciones del evento'
    };
  }
}
