import { requireAuth } from '../_middleware';

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
    // Solo usar 'published' por defecto si no se incluyen archivados
    const includeArchived = searchParams.get('includeArchived') === 'true';
    const status = searchParams.get('status') || (includeArchived ? null : 'published');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');

    const result = await getEventos(env.DB, env.ACA_KV, { type, status, search, page, limit, includeArchived });

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
    let authUser;
    try {
      authUser = await requireAuth(request, env);
    } catch (error) {
      return new Response(JSON.stringify({ success: false, error: 'Autenticación requerida' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const userId = authUser.userId;

    const body = await request.json();
    const result = await createEvento(env.DB, env.ACA_KV, body, userId);

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

async function getEventos(db, kv, filters) {
  try {
    const { type, status, search, page = 1, limit = 12, includeArchived = false } = filters;
    
    // NO usar caché para queries del admin (includeArchived) o con búsqueda
    // Solo cachear queries públicas básicas
    const shouldCache = kv && !includeArchived && !search;
    
    // Crear clave de caché basada en los filtros
    const cacheKey = `eventos:list:${status || 'all'}:${type || 'all'}:${page}:${limit}`;
    
    // Intentar obtener desde caché KV solo para queries públicas
    if (shouldCache) {
      const cached = await kv.get(cacheKey);
      if (cached) {
        console.log('[getEventos] Returning from KV cache');
        return JSON.parse(cached);
      }
    }

    const offset = (page - 1) * limit;

    let whereClauses = [];
    let bindings = [];

    // Si hay un status específico, filtrarlo
    if (status) {
      whereClauses.push('status = ?');
      bindings.push(status);
    } else if (!includeArchived) {
      // Si no hay status específico y no se incluyen archivados, excluirlos
      whereClauses.push('status != ?');
      bindings.push('archived');
    }
    // Si includeArchived=true y no hay status, mostrar todos (no agregar filtro)
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

    console.log('[getEventos] Query filters:', { status, type, search, includeArchived, page, limit });
    const startTime = Date.now();

    // Query para obtener los eventos paginados (solo traer un registro extra para saber si hay más)
    const dataQuery = `SELECT * FROM eventos ${whereString} ORDER BY date DESC LIMIT ? OFFSET ?`;
    const { results } = await db.prepare(dataQuery).bind(...bindings, limit + 1, offset).all();
    
    // Si hay más de 'limit' resultados, significa que hay más páginas
    const hasMore = results.length > limit;
    const eventos = hasMore ? results.slice(0, limit) : results;
    
    const queryTime = Date.now() - startTime;
    console.log(`[getEventos] Query completed in ${queryTime}ms, returned ${eventos.length} eventos`);

    // Mapear nombres de columnas de DB a nombres de propiedades del frontend
    const mappedResults = eventos.map(evento => ({
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
    }));

    const result = {
      success: true,
      data: mappedResults,
      pagination: {
        page,
        limit,
        hasMore,
        total: eventos.length, // Solo el count de esta página
        totalPages: hasMore ? page + 1 : page, // Estimado
      }
    };

    // Guardar en caché KV solo para queries públicas con TTL de 5 minutos
    if (shouldCache) {
      await kv.put(cacheKey, JSON.stringify(result), {
        expirationTtl: 300 // 5 minutos
      });
      console.log('[getEventos] Cached in KV with 5min TTL');
    }

    return result;

  } catch (error) {
    console.error('Error in getEventos (D1):', error);
    return { success: false, error: 'Error obteniendo eventos desde la base de datos' };
  }
}

async function createEvento(db, kv, eventoData, organizerId) {
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
      price,
      endDate,
      isPublic,
      paymentLink
    } = eventoData;

    if (!title || !date || !location || !organizerId) {
      return { success: false, error: 'Faltan campos requeridos (título, fecha, ubicación, organizador)' };
    }

    const query = `
      INSERT INTO eventos (title, description, date, time, location, image, type, status, registration_open, max_participants, price, organizer_id, end_date, is_public, payment_link)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
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
      organizerId,
      endDate || null,
      isPublic !== false ? 1 : 0, // Default true (1)
      paymentLink || null
    ).run();

    if (!success) {
      return { success: false, error: 'No se pudo crear el evento en la base de datos.' };
    }
    
    // D1 no devuelve el objeto insertado directamente en `run()`, 
    // por lo que devolvemos el ID si es posible o simplemente confirmamos la creación.
    const insertedId = meta.last_row_id;

    // Invalidar caché de eventos para forzar refresh desde BD
    if (kv) {
      // Eliminar todas las claves de caché relacionadas con eventos
      const cacheKeys = [
        'eventos:list:published:all:none:1:12',
        'eventos:list:draft:all:none:1:12',
        'eventos:list:all:all:none:1:12'
      ];
      for (const key of cacheKeys) {
        await kv.delete(key);
      }
      console.log('[createEvento] Invalidated eventos cache');
    }

    return {
      success: true,
      data: { id: insertedId, ...eventoData, organizer_id: organizerId }
    };

  } catch (error) {
    console.error('Error in createEvento (D1):', error);
    return { success: false, error: 'Error creando el evento en la base de datos' };
  }
}
