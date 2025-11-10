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

    // Crear inscripción en D1
    const inscripcionId = `${userId}_${eventoId}`;
    const now = new Date().toISOString();
    
    try {
      // Insertar inscripción en D1
      await env.DB.prepare(
        `INSERT INTO inscriptions (id, user_id, event_id, status, inscription_date, payment_status, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).bind(
        inscripcionId,
        userId,
        eventoId,
        'confirmed',
        now,
        'pending',
        ''
      ).run();

      console.log('[inscribirseEvento] Inserted inscription in D1 for evento', eventoId);

      // Actualizar contador de participantes en D1
      await env.DB.prepare(
        'UPDATE eventos SET current_participants = current_participants + 1 WHERE id = ?'
      ).bind(eventoId).run();
      console.log('[inscribirseEvento] Incremented current_participants for evento', eventoId);

    } catch (dbError) {
      console.error('[inscribirseEvento] Error inserting inscription in D1:', dbError);
      return {
        success: false,
        error: 'Error al guardar la inscripción en la base de datos'
      };
    }

    const inscripcion = {
      id: inscripcionId,
      userId: userId,
      eventoId: eventoId,
      fechaInscripcion: now,
      estado: 'confirmed',
      metodoPago: 'pending',
      notas: ''
    };

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
      console.log('[inscribirseEvento] Invalidated eventos cache');
    }

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
    const { results } = await env.DB.prepare(
      'SELECT * FROM inscriptions WHERE user_id = ?'
    ).bind(userId).all();

    const inscripciones = results.map(row => ({
      id: row.id,
      userId: row.user_id,
      eventoId: row.event_id,
      estado: row.status,
      fechaInscripcion: row.inscription_date,
      metodoPago: row.payment_status,
      notas: row.notes
    }));

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
    const { results } = await env.DB.prepare(
      'SELECT COUNT(*) as count FROM inscriptions WHERE event_id = ?'
    ).bind(eventoId).all();

    const count = results && results.length > 0 ? results[0].count : 0;

    return {
      success: true,
      data: [],
      count: count
    };

  } catch (error) {
    console.error('Error in getInscripcionesEvento:', error);
    return {
      success: false,
      error: 'Error obteniendo inscripciones del evento',
      count: 0
    };
  }
}

// Función para obtener evento por ID desde D1
async function getEventoById(env, id) {
  try {
    const { results } = await env.DB.prepare(
      `SELECT id, title, description, date, time, location, image, type, status,
              registration_open, max_participants, current_participants, price, organizer_id, 
              created_at, updated_at, is_public, payment_link
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
      date: evento.date,
      time: evento.time,
      location: evento.location,
      image: evento.image,
      type: evento.type,
      status: evento.status,
      registrationOpen: evento.registration_open === 1,
      maxParticipants: evento.max_participants,
      currentParticipants: evento.current_participants || 0,
      price: evento.price,
      organizerId: evento.organizer_id,
      isPublic: Boolean(evento.is_public),
      paymentLink: evento.payment_link,
      createdAt: evento.created_at,
      updatedAt: evento.updated_at
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
