// Endpoint principal para gestión de noticias
// GET /api/noticias - Listar noticias con filtros
// POST /api/noticias - Crear nueva noticia

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
      return await handleGetNoticias(url, env, corsHeaders);
    }
    
    if (method === 'POST') {
      return await handleCreateNoticia(request, env, corsHeaders);
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
    console.error('Error in noticias endpoint:', error);
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

// GET /api/noticias - Listar noticias
async function handleGetNoticias(url, env, corsHeaders) {
  try {
    // Obtener noticias desde KV (o crear datos de ejemplo si no existen)
    let noticias = await getNoticias(env);

    // Aplicar filtros básicos
    const category = url.searchParams.get('category');
    const featured = url.searchParams.get('featured');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');

    if (category) {
      noticias = noticias.filter(noticia => noticia.category === category);
    }

    if (featured === 'true') {
      noticias = noticias.filter(noticia => noticia.featured);
    }

    // Ordenar por fecha (más recientes primero)
    noticias.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    // Paginación
    const total = noticias.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedNoticias = noticias.slice(start, end);

    return new Response(JSON.stringify({
      success: true,
      data: paginatedNoticias,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error) {
    console.error('Error getting noticias:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error obteniendo noticias'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
}

// POST /api/noticias - Crear nueva noticia
async function handleCreateNoticia(request, env, corsHeaders) {
  try {
    // Verificar autenticación de admin
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

    const body = await request.json();
    
    // Crear noticia
    const result = await createNoticia(env, body);

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
      message: 'Noticia creada exitosamente'
    }), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error) {
    console.error('Error creating noticia:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error creando noticia'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
}

// Funciones de servicio
async function getNoticias(env) {
  try {
    // Intentar obtener desde KV con metadata de TTL
    const noticiasData = await env.ACA_KV.get('noticias:all');
    
    if (noticiasData) {
      console.log('[getNoticias] Returning from KV cache');
      return JSON.parse(noticiasData);
    }

    console.log('[getNoticias] No cache found, returning empty array');
    // No crear noticias de ejemplo, devolver array vacío
    // Las noticias se crean manualmente desde el panel admin
    return [];

  } catch (error) {
    console.error('Error in getNoticias:', error);
    return [];
  }
}

async function createNoticia(env, noticiaData) {
  try {
    // Obtener el siguiente ID
    const lastIdData = await env.ACA_KV.get('noticias:lastId');
    const lastId = lastIdData ? parseInt(lastIdData) : 0;
    const newId = lastId + 1;

    // Crear slug desde el título si no viene
    const slug = noticiaData.slug || noticiaData.title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, "-")
      .substring(0, 100);

    // Obtener categoría completa
    const categories = [
      { id: 1, name: 'Competencias', slug: 'competencias', color: '#DC2626' },
      { id: 2, name: 'Educación', slug: 'educacion', color: '#059669' },
      { id: 3, name: 'Eventos', slug: 'eventos', color: '#2563EB' },
      { id: 4, name: 'Institucional', slug: 'institucional', color: '#7C3AED' },
      { id: 5, name: 'Internacional', slug: 'internacional', color: '#EA580C' },
      { id: 6, name: 'Comunidad', slug: 'comunidad', color: '#0891B2' },
      { id: 7, name: 'Técnicas', slug: 'tecnicas', color: '#CA8A04' },
      { id: 8, name: 'General', slug: 'general', color: '#64748B' }
    ];
    
    const categoryObj = categories.find(c => c.id === noticiaData.category_id) || categories[7]; // Default: General

    // Crear la noticia con los campos correctos para el frontend
    const now = new Date().toISOString();
    const noticia = {
      id: newId,
      title: noticiaData.title,
      slug: slug,
      excerpt: noticiaData.excerpt || '',
      content: noticiaData.content,
      featured_image: noticiaData.featured_image || '/images/default-news.jpg', // featured_image no image
      category: categoryObj, // Objeto completo con id, name, slug, color
      tags: noticiaData.tags || [],
      author_name: noticiaData.author_name || 'ACA Chile', // author_name no author
      published_at: noticiaData.published_at || now, // published_at no publishedAt
      created_at: now,
      status: noticiaData.status || 'draft',
      is_featured: noticiaData.is_featured || false, // is_featured no featured
      view_count: 0, // view_count no views
      commentsEnabled: noticiaData.commentsEnabled !== false
    };

    // Guardar noticia individual con TTL de 24 horas
    await env.ACA_KV.put(`noticia:${newId}`, JSON.stringify(noticia), {
      expirationTtl: 86400 // 24 horas
    });

    // Actualizar lista de todas las noticias con TTL de 24 horas
    const noticiasData = await env.ACA_KV.get('noticias:all');
    const noticias = noticiasData ? JSON.parse(noticiasData) : [];
    noticias.push(noticia);
    await env.ACA_KV.put('noticias:all', JSON.stringify(noticias), {
      expirationTtl: 86400 // 24 horas
    });

    // Actualizar último ID con TTL de 24 horas
    await env.ACA_KV.put('noticias:lastId', newId.toString(), {
      expirationTtl: 86400 // 24 horas
    });
    console.log('[createNoticia] Cached new noticia in KV with 24h TTL');

    return {
      success: true,
      data: noticia
    };

  } catch (error) {
    console.error('Error in createNoticia:', error);
    return {
      success: false,
      error: 'Error creando noticia'
    };
  }
}