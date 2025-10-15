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

  // Manejar preflight requests
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
    const type = url.searchParams.get('type');
    const status = url.searchParams.get('status') || 'published';
    const search = url.searchParams.get('search');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '12');

    // Obtener eventos desde KV con filtros
    const result = await getEventos(env, {
      type: type || undefined,
      status: status,
      search: search || undefined,
      page,
      limit
    });

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
      data: result.data,
      pagination: result.pagination
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error) {
    console.error('Error getting eventos:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error obteniendo eventos'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
}

// POST /api/eventos - Crear nuevo evento
async function handleCreateEvento(request, env, corsHeaders) {
  try {
    // Verificar autenticación
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Token de autorización requerido'
      }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    // TODO: Verificar y decodificar JWT para obtener userId
    const userId = 1; // Por ahora usamos un ID fijo

    const body = await request.json();
    
    // Crear evento
    const result = await createEvento(env, body, userId);

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

    return new Response(JSON.stringify({
      success: true,
      data: result.data,
      message: 'Evento creado exitosamente'
    }), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error) {
    console.error('Error creating evento:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error creando evento'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
}

// Funciones de servicio de eventos (migradas desde eventos-service.ts)
async function getEventos(env, filters) {
  try {
    const { type, status, search, page = 1, limit = 12 } = filters;
    
    // Obtener todos los eventos desde KV
    const eventosData = await env.ACA_KV.get('eventos:all');
    let eventos = eventosData ? JSON.parse(eventosData) : [];

    // Aplicar filtros
    if (type) {
      eventos = eventos.filter(evento => evento.type === type);
    }
    
    if (status) {
      eventos = eventos.filter(evento => evento.status === status);
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      eventos = eventos.filter(evento => 
        evento.title.toLowerCase().includes(searchLower) ||
        evento.description.toLowerCase().includes(searchLower) ||
        evento.location.toLowerCase().includes(searchLower) ||
        (evento.tags && evento.tags.some(tag => tag.toLowerCase().includes(searchLower)))
      );
    }

    // Ordenar por fecha (más recientes primero)
    eventos.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Calcular paginación
    const total = eventos.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedEventos = eventos.slice(start, end);

    return {
      success: true,
      data: paginatedEventos,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };

  } catch (error) {
    console.error('Error in getEventos:', error);
    return {
      success: false,
      error: 'Error obteniendo eventos'
    };
  }
}

async function createEvento(env, eventoData, organizerId) {
  try {
    // Obtener el siguiente ID
    const lastIdData = await env.ACA_KV.get('eventos:lastId');
    const lastId = lastIdData ? parseInt(lastIdData) : 0;
    const newId = lastId + 1;

    // Crear el evento con datos por defecto
    const now = new Date().toISOString();
    const evento = {
      id: newId,
      title: eventoData.title,
      date: eventoData.date,
      time: eventoData.time,
      location: eventoData.location,
      description: eventoData.description,
      image: eventoData.image || '/images/default-event.jpg',
      type: eventoData.type || 'encuentro',
      registrationOpen: eventoData.registrationOpen !== false,
      maxParticipants: eventoData.maxParticipants,
      currentParticipants: 0,
      price: eventoData.price,
      requirements: eventoData.requirements || [],
      organizerId: organizerId,
      createdAt: now,
      updatedAt: now,
      status: eventoData.status || 'draft',
      tags: eventoData.tags || [],
      contactInfo: eventoData.contactInfo || {}
    };

    // Guardar evento individual
    await env.ACA_KV.put(`evento:${newId}`, JSON.stringify(evento));

    // Actualizar lista de todos los eventos
    const eventosData = await env.ACA_KV.get('eventos:all');
    const eventos = eventosData ? JSON.parse(eventosData) : [];
    eventos.push(evento);
    await env.ACA_KV.put('eventos:all', JSON.stringify(eventos));

    // Actualizar último ID
    await env.ACA_KV.put('eventos:lastId', newId.toString());

    return {
      success: true,
      data: evento
    };

  } catch (error) {
    console.error('Error in createEvento:', error);
    return {
      success: false,
      error: 'Error creando evento'
    };
  }
}