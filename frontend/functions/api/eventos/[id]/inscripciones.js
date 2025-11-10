// Endpoint para ver las inscripciones de un evento específico
// GET /api/eventos/[id]/inscripciones - Ver inscripciones del evento

// Función para verificar autenticación
async function requireAuth(request, env) {
  const authHeader = request.headers.get('Authorization');
  
  console.log('Authorization header:', authHeader ? 'Present' : 'Missing');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Token no proporcionado');
  }

  const token = authHeader.substring(7);
  
  console.log('Token length:', token.length);
  
  try {
    // Decodificar el token JWT
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Token malformado');
    }
    
    const payload = JSON.parse(atob(parts[1]));
    console.log('Token payload user:', payload.id, payload.email);
    return payload;
  } catch (e) {
    console.error('Error parsing token:', e.message);
    throw new Error('Token inválido: ' + e.message);
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
      console.log('User authenticated:', authUser.id, authUser.email);
    } catch (error) {
      console.error('Auth error:', error.message);
      return new Response(JSON.stringify({
        success: false,
        error: 'Autenticación requerida: ' + error.message
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

    // Obtener inscripciones del evento desde D1
    const { results } = await env.DB.prepare(
      `SELECT id, user_id, event_id, status, inscription_date, payment_status, 
              payment_amount, notes, nombre, apellido, email, telefono, tipo, created_at
       FROM inscriptions 
       WHERE event_id = ? 
       ORDER BY created_at DESC`
    ).bind(eventoId).all();

    console.log(`Inscripciones encontradas para evento ${eventoId}:`, results ? results.length : 0);

    // Mapear a formato esperado por el frontend
    const inscripciones = (results || []).map(row => ({
      id: row.id,
      userId: row.user_id,
      eventoId: row.event_id,
      status: row.status,
      fechaInscripcion: row.inscription_date,
      metodoPago: row.payment_status,
      montoApagar: row.payment_amount,
      notas: row.notes,
      nombre: row.nombre,
      apellido: row.apellido,
      email: row.email,
      telefono: row.telefono,
      tipo: row.tipo || 'usuario',
      createdAt: row.created_at || row.inscription_date
    }));

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
