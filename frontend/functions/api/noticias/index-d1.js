// MIGRACIÓN URGENTE: API de noticias usando D1 en lugar de KV
// Este archivo reemplaza /frontend/functions/api/noticias/index.js

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
    return new Response(null, { status: 204, headers: corsHeaders });
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
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error) {
    console.error('Error in noticias endpoint:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error interno del servidor'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}

// GET - Listar noticias
async function handleGetNoticias(url, env, corsHeaders) {
  try {
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const includeDeleted = url.searchParams.get('includeDeleted') === 'true';
    
    const offset = (page - 1) * limit;

    // Query base - solo noticias no eliminadas por defecto
    let whereClause = includeDeleted ? 'WHERE 1=1' : 'WHERE deleted_at IS NULL';
    
    // Obtener noticias de D1
    const query = `
      SELECT id, title, slug, excerpt, content, featured_image, author_id, category_id,
             status, is_featured, view_count, published_at, created_at, updated_at, deleted_at
      FROM news_articles 
      ${whereClause}
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `;

    const { results } = await env.DB.prepare(query)
      .bind(limit, offset)
      .all();

    // Contar total
    const countQuery = `SELECT COUNT(*) as total FROM news_articles ${whereClause}`;
    const { total } = await env.DB.prepare(countQuery).first();

    const totalPages = Math.ceil(total / limit);

    // Mapear categorías
    const categories = {
      1: { id: 1, name: 'Competencias', slug: 'competencias', color: '#DC2626' },
      2: { id: 2, name: 'Educación', slug: 'educacion', color: '#059669' },
      3: { id: 3, name: 'Eventos', slug: 'eventos', color: '#2563EB' },
      4: { id: 4, name: 'Institucional', slug: 'institucional', color: '#7C3AED' },
      5: { id: 5, name: 'Internacional', slug: 'internacional', color: '#EA580C' },
      6: { id: 6, name: 'Comunidad', slug: 'comunidad', color: '#0891B2' },
      7: { id: 7, name: 'Técnicas', slug: 'tecnicas', color: '#CA8A04' },
      8: { id: 8, name: 'General', slug: 'general', color: '#64748B' }
    };

    // Formatear noticias para el frontend
    const formattedNews = results.map(article => ({
      id: article.id,
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt || '',
      content: article.content,
      featured_image: article.featured_image || '/images/default-news.jpg',
      gallery: [],
      video_url: '',
      category: categories[article.category_id] || categories[8],
      tags: [],
      author_name: 'ACA Chile',
      published_at: article.published_at,
      created_at: article.created_at,
      updated_at: article.updated_at,
      deleted_at: article.deleted_at,
      status: article.status,
      is_featured: article.is_featured,
      view_count: article.view_count,
      views: article.view_count,
      commentsEnabled: true
    }));

    return new Response(JSON.stringify({
      success: true,
      data: formattedNews,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error) {
    console.error('Error loading noticias from D1:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error al cargar noticias'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}

// POST - Crear noticia
async function handleCreateNoticia(request, env, corsHeaders) {
  try {
    // Verificar autenticación
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Token de autorización requerido'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const body = await request.json();
    console.log('[createNoticia] Creating noticia:', body.title);

    // Crear slug si no viene
    const slug = body.slug || body.title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, "-")
      .substring(0, 100);

    const now = new Date().toISOString();

    // Insertar en D1
    const insertQuery = `
      INSERT INTO news_articles (
        title, slug, excerpt, content, featured_image, author_id, category_id,
        status, is_featured, view_count, published_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await env.DB.prepare(insertQuery)
      .bind(
        body.title,
        slug,
        body.excerpt || '',
        body.content,
        body.featured_image || '/images/default-news.jpg',
        1, // author_id por defecto
        body.category_id || 8,
        body.status || 'published',
        body.is_featured || false,
        0, // view_count inicial
        body.published_at || now,
        now,
        now
      )
      .run();

    if (!result.success) {
      throw new Error('Error al insertar en D1');
    }

    const insertedId = result.meta.last_row_id;
    console.log('[createNoticia] Created noticia with ID:', insertedId);

    // Obtener la noticia creada
    const article = await env.DB.prepare(
      'SELECT * FROM news_articles WHERE id = ?'
    ).bind(insertedId).first();

    // Formatear para frontend
    const categories = {
      1: { id: 1, name: 'Competencias', slug: 'competencias', color: '#DC2626' },
      2: { id: 2, name: 'Educación', slug: 'educacion', color: '#059669' },
      3: { id: 3, name: 'Eventos', slug: 'eventos', color: '#2563EB' },
      4: { id: 4, name: 'Institucional', slug: 'institucional', color: '#7C3AED' },
      5: { id: 5, name: 'Internacional', slug: 'internacional', color: '#EA580C' },
      6: { id: 6, name: 'Comunidad', slug: 'comunidad', color: '#0891B2' },
      7: { id: 7, name: 'Técnicas', slug: 'tecnicas', color: '#CA8A04' },
      8: { id: 8, name: 'General', slug: 'general', color: '#64748B' }
    };

    const formatted = {
      id: article.id,
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt,
      content: article.content,
      featured_image: article.featured_image,
      gallery: [],
      video_url: '',
      category: categories[article.category_id] || categories[8],
      tags: [],
      author_name: 'ACA Chile',
      published_at: article.published_at,
      created_at: article.created_at,
      status: article.status,
      is_featured: article.is_featured,
      view_count: article.view_count,
      commentsEnabled: true
    };

    return new Response(JSON.stringify({
      success: true,
      data: formatted,
      message: 'Noticia creada exitosamente'
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error) {
    console.error('Error creating noticia in D1:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error creando noticia: ' + error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}
