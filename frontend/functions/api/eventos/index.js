// Endpoint principal para gestión de eventos
// GET /api/eventos - Listar eventos con filtros
// POST /api/eventos - Crear nuevo evento

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method;

  const corsHeaders = {
    'Access-Control-Allow-Origin': env.CORS_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (method === 'OPTIONS') {
    return new Response(null, { 
      status: 204, 
      headers: corsHeaders 
    });
  }

  try {
    if (method === 'GET') {
      return await handleGetEventos(url, env, corsHeaders);
    }
    
    if (method === 'POST') {
      return await handleCreateEvento(request, env, corsHeaders);
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
    console.error('Error in eventos endpoint:', error);
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

// GET /api/eventos - Listar eventos con filtros
async function handleGetEventos(url, env, corsHeaders) {
  try {
    const { searchParams } = url;
    const type = searchParams.get('type');
    const status = searchParams.get('status') || 'published';
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');

    const result = await getEventos(env.DB, { type, status, search, page, limit });

    if (!result.success) {
      return new Response(JSON.stringify({ success: false, error: result.error }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      data: result.data,
      pagination: result.pagination
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error) {
    console.error('Error getting eventos:', error);
    return new Response(JSON.stringify({ success: false, error: 'Error obteniendo eventos' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}

// POST /api/eventos - Crear nuevo evento
async function handleCreateEvento(request, env, corsHeaders) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ success: false, error: 'Token de autorización requerido' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // TODO: Verificar y decodificar JWT para obtener userId
    const userId = 1; // Usamos un ID fijo por ahora

    const body = await request.json();
    const result = await createEvento(env.DB, body, userId);

    if (!result.success) {
      return new Response(JSON.stringify({ success: false, error: result.error }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      data: result.data,
      message: 'Evento creado exitosamente'
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error) {
    console.error('Error creating evento:', error);
    return new Response(JSON.stringify({ success: false, error: 'Error creando evento' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}

// --- Funciones de Servicio con D1 ---

async function getEventos(db, filters) {
  try {
    const { type, status, search, page = 1, limit = 12 } = filters;
    const offset = (page - 1) * limit;

    let whereClauses = [];
    let bindings = [];

    if (status) {
      whereClauses.push('status = ?');
      bindings.push(status);
    }
    if (type) {
      whereClauses.push('type = ?');
      bindings.push(type);
    }
    if (search) {
      whereClauses.push('(title LIKE ? OR description LIKE ? OR location LIKE ?)');
      const searchTerm = `%${search}%`;
      bindings.push(searchTerm, searchTerm, searchTerm);
    }

    const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Query para obtener el total
    const countQuery = `SELECT COUNT(*) as total FROM eventos ${whereString}`;
    const totalResult = await db.prepare(countQuery).bind(...bindings).first();
    const total = totalResult.total;

    // Query para obtener los eventos paginados
    const dataQuery = `SELECT * FROM eventos ${whereString} ORDER BY date DESC LIMIT ? OFFSET ?`;
    const { results } = await db.prepare(dataQuery).bind(...bindings, limit, offset).all();

    // Mapear nombres de columnas de DB a nombres de propiedades del frontend
    const mappedResults = results.map(evento => ({
      ...evento,
      registrationOpen: evento.registration_open,
      maxParticipants: evento.max_participants,
      currentParticipants: evento.current_participants || 0,
      organizerId: evento.organizer_id,
      createdAt: evento.created_at,
      updatedAt: evento.updated_at,
    }));

    return {
      success: true,
      data: mappedResults,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    };

  } catch (error) {
    console.error('Error in getEventos (D1):', error);
    return { success: false, error: 'Error obteniendo eventos desde la base de datos' };
  }
}

async function createEvento(db, eventoData, organizerId) {
  try {
    const {
      title,
      description,
      date,
      time,
      location,
      image,
      type,
      status,
      registration_open,
      max_participants,
      price
    } = eventoData;

    if (!title || !date || !location || !organizerId) {
      return { success: false, error: 'Faltan campos requeridos (título, fecha, ubicación, organizador)' };
    }

    const query = `
      INSERT INTO eventos (title, description, date, time, location, image, type, status, registration_open, max_participants, price, organizer_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;
    
    const { success, meta } = await db.prepare(query).bind(
      title,
      description || null,
      date,
      time || null,
      location,
      image || null,
      type || 'encuentro',
      status || 'draft',
      registration_open !== false,
      max_participants || null,
      price || 0,
      organizerId
    ).run();

    if (!success) {
      return { success: false, error: 'No se pudo crear el evento en la base de datos.' };
    }
    
    // D1 no devuelve el objeto insertado directamente en `run()`, 
    // por lo que devolvemos el ID si es posible o simplemente confirmamos la creación.
    const insertedId = meta.last_row_id;

    return {
      success: true,
      data: { id: insertedId, ...eventoData, organizer_id: organizerId }
    };

  } catch (error) {
    console.error('Error in createEvento (D1):', error);
    return { success: false, error: 'Error creando el evento en la base de datos' };
  }
}
