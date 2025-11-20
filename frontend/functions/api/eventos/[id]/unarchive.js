import { requireAuth } from '../../_middleware';

// PUT /api/eventos/[id]/unarchive - Desarchivar evento (cambiar status a 'published')

export async function onRequest(context) {
  const { request, env, params } = context;
  const method = request.method;
  const eventId = parseInt(params.id);

  const corsHeaders = {
    'Access-Control-Allow-Origin': env.CORS_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // Manejar preflight requests
  if (method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  // Solo permitir PUT
  if (method !== 'PUT') {
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
  }

  // Validar ID
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

    // Validar permisos (admin/director)
    if (authUser.role && !['admin', 'director', 'director_editor'].includes(authUser.role)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Permisos insuficientes'
      }), {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    // Desarchivar evento
    const result = await unarchiveEvento(env, eventId);

    if (!result.success) {
      return new Response(JSON.stringify({
        success: false,
        error: result.error
      }), {
        status: result.error === 'Evento no encontrado' ? 404 : 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      data: result.data,
      message: 'Evento desarchivado exitosamente'
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error) {
    console.error('Error unarchiving evento:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error desarchivando evento'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
}

async function unarchiveEvento(env, id) {
  try {
    // Verificar que el evento existe
    const existingQuery = `SELECT * FROM eventos WHERE id = ?`;
    const { results } = await env.DB.prepare(existingQuery).bind(id).all();

    if (results.length === 0) {
      return {
        success: false,
        error: 'Evento no encontrado'
      };
    }

    // Actualizar status a 'published'
    const updateQuery = `
      UPDATE eventos 
      SET status = 'published', updated_at = ?
      WHERE id = ?
    `;

    const { success } = await env.DB.prepare(updateQuery)
      .bind(new Date().toISOString(), id)
      .run();

    if (!success) {
      return {
        success: false,
        error: 'Error desarchivando evento en la base de datos'
      };
    }

    // Obtener el evento actualizado
    const updatedResult = await env.DB.prepare(existingQuery).bind(id).all();
    const evento = updatedResult.results[0];

    // Mapear nombres de columnas
    const mappedEvento = {
      ...evento,
      registrationOpen: evento.registration_open,
      maxParticipants: evento.max_participants,
      currentParticipants: evento.current_participants || 0,
      organizerId: evento.organizer_id,
      createdAt: evento.created_at,
      updatedAt: evento.updated_at,
      endDate: evento.end_date,
      isPublic: Boolean(evento.is_public),
      paymentLink: evento.payment_link,
      buttonText: evento.button_text,
    };

    // Invalidar caché KV
    if (env.ACA_KV) {
      // Eliminar cachés relacionadas con eventos
      const keys = [
        'eventos:list:published:all:none:1:12:false',
        'eventos:list:all:all:none:1:12:true'
      ];
      for (const key of keys) {
        await env.ACA_KV.delete(key);
      }
    }

    return {
      success: true,
      data: mappedEvento
    };

  } catch (error) {
    console.error('Error in unarchiveEvento (D1):', error);
    return {
      success: false,
      error: 'Error desarchivando evento'
    };
  }
}
