// API Endpoint: GET /api/guestbook - List guestbook entries
// POST /api/guestbook - Create new entry (auto-approved)

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method;

  const corsHeaders = {
    'Access-Control-Allow-Origin': env.CORS_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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
      return await handleGet(url, env, corsHeaders);
    }
    
    if (method === 'POST') {
      return await handlePost(request, env, corsHeaders);
    }

    return new Response(JSON.stringify({
      success: false,
      error: `Método ${method} no permitido`
    }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    console.error('Error in guestbook endpoint:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error interno del servidor'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

// GET - Listar entradas del libro de visitas
async function handleGet(url, env, corsHeaders) {
  try {
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const includeDeleted = url.searchParams.get('includeDeleted') === 'true';
    
    const offset = (page - 1) * limit;

    // Query base
    let whereClause = 'WHERE status = ?';
    let bindings = ['published'];

    // Si includeDeleted=true (para admin/papelera), mostrar todos
    if (includeDeleted) {
      whereClause = 'WHERE 1=1';
      bindings = [];
    } else {
      // Público: solo published y sin deleted_at
      whereClause = 'WHERE status = ? AND deleted_at IS NULL';
    }

    // Obtener entradas
    const query = `
      SELECT id, name, email, social_network, social_handle, 
             title, message, image_url, status, created_at, deleted_at
      FROM guestbook 
      ${whereClause}
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `;

    const { results } = await env.DB.prepare(query)
      .bind(...bindings, limit, offset)
      .all();

    // Contar total (para paginación)
    const countQuery = `SELECT COUNT(*) as total FROM guestbook ${whereClause}`;
    const { total } = await env.DB.prepare(countQuery)
      .bind(...bindings)
      .first();

    const totalPages = Math.ceil(total / limit);

    return new Response(JSON.stringify({
      success: true,
      data: results || [],
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    console.error('Error in handleGet:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error obteniendo entradas'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

// POST - Crear nueva entrada (auto-aprobada)
async function handlePost(request, env, corsHeaders) {
  try {
    const body = await request.json();

    // Validaciones
    if (!body.name || !body.name.trim()) {
      return new Response(JSON.stringify({
        success: false,
        error: 'El nombre es obligatorio'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    if (!body.email || !body.email.trim()) {
      return new Response(JSON.stringify({
        success: false,
        error: 'El email es obligatorio'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Email inválido'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    if (!body.title || !body.title.trim()) {
      return new Response(JSON.stringify({
        success: false,
        error: 'El título es obligatorio'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    if (!body.message || !body.message.trim()) {
      return new Response(JSON.stringify({
        success: false,
        error: 'El mensaje es obligatorio'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Social network es obligatorio
    if (!body.social_network) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Debes seleccionar una red social'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Si NO es "none", social_handle es obligatorio
    if (body.social_network !== 'none' && (!body.social_handle || !body.social_handle.trim())) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Debes proporcionar tu usuario de la red social seleccionada'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Obtener IP y User-Agent para tracking
    const ip = request.headers.get('CF-Connecting-IP') || 
               request.headers.get('X-Forwarded-For') || 
               'unknown';
    const userAgent = request.headers.get('User-Agent') || 'unknown';

    // Insertar en D1 (auto-aprobada con status='published')
    const now = new Date().toISOString();
    const insertQuery = `
      INSERT INTO guestbook (
        name, email, social_network, social_handle, 
        title, message, image_url, status, 
        ip_address, user_agent, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await env.DB.prepare(insertQuery)
      .bind(
        body.name.trim(),
        body.email.trim().toLowerCase(),
        body.social_network,
        body.social_network !== 'none' ? body.social_handle.trim() : null,
        body.title.trim(),
        body.message.trim(),
        body.image_url || null,
        'published', // Auto-aprobado
        ip,
        userAgent,
        now,
        now
      )
      .run();

    if (!result.success) {
      throw new Error('Error al insertar en la base de datos');
    }

    // Obtener el ID insertado
    const insertedId = result.meta.last_row_id;

    // Obtener la entrada creada
    const entry = await env.DB.prepare(
      'SELECT * FROM guestbook WHERE id = ?'
    ).bind(insertedId).first();

    return new Response(JSON.stringify({
      success: true,
      data: entry,
      message: '¡Gracias por dejar tu mensaje en nuestro libro de visitas!'
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    console.error('Error in handlePost:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error al crear la entrada'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}
