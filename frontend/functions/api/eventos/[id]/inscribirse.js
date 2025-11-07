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
    // Verificar que el evento existe en D1
    const eventoResult = await getEventoById(env, eventoId);
    if (!eventoResult.success || !eventoResult.data) {
      return {
        success: false,
        error: 'Evento no encontrado'
      };
    }

    const evento = eventoResult.data;

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

// Función para obtener evento por ID desde D1
async function getEventoById(env, id) {
  try {
    const { results } = await env.DB.prepare(
      `SELECT id, title, description, event_date, location, image_url, type, status,
              registration_open, max_participants, price, organizer_id, created_at, updated_at, end_date
       FROM eventos
       WHERE id = ?`
    ).bind(id).all();

    if (!results || results.length === 0) {
      return {
        success: false,
        error: 'Evento no encontrado'
      };
    }

    const evento = results[0];
    
    // Convertir snake_case a camelCase
    const eventoFormatted = {
      id: evento.id,
      title: evento.title,
      description: evento.description,
      eventDate: evento.event_date,
      location: evento.location,
      imageUrl: evento.image_url,
      type: evento.type,
      status: evento.status,
      registrationOpen: evento.registration_open === 1,
      maxParticipants: evento.max_participants,
      currentParticipants: 0, // Esto se calcula desde inscripciones
      price: evento.price,
      organizerId: evento.organizer_id,
      createdAt: evento.created_at,
      updatedAt: evento.updated_at,
      endDate: evento.end_date
    };

    return {
      success: true,
      data: eventoFormatted
    };

  } catch (error) {
    console.error('Error getting evento by ID from D1:', error);
    return {
      success: false,
      error: 'Error obteniendo evento de la base de datos'
    };
  }
}
