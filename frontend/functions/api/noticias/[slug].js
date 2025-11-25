import { requireAuth } from '../../_middleware';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

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

function formatArticle(article) {
  // Parsear gallery si es un string JSON
  let gallery = [];
  if (article.gallery) {
    try {
      gallery = typeof article.gallery === 'string' ? JSON.parse(article.gallery) : article.gallery;
    } catch (e) {
      console.error('Error parsing gallery:', e);
      gallery = [];
    }
  }

  return {
    id: article.id,
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt || '',
    content: article.content,
    featured_image: article.featured_image || '/images/default-news.jpg',
    gallery: gallery,
    video_url: article.video_url || '',
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
  };
}

export async function onRequestOptions(context) {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function onRequestGet(context) {
  const { env, params } = context;
  try {
    if (!params.slug) {
      return new Response(JSON.stringify({ success: false, error: 'Slug requerido' }), {
        status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    let query, binding;
    if (!isNaN(params.slug)) {
      query = 'SELECT * FROM news_articles WHERE id = ? AND deleted_at IS NULL';
      binding = parseInt(params.slug);
    } else {
      query = 'SELECT * FROM news_articles WHERE slug = ? AND deleted_at IS NULL';
      binding = params.slug;
    }
    const article = await env.DB.prepare(query).bind(binding).first();
    if (!article) {
      return new Response(JSON.stringify({ success: false, error: 'Noticia no encontrada' }), {
        status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    await env.DB.prepare('UPDATE news_articles SET view_count = view_count + 1 WHERE id = ?').bind(article.id).run();
    const formatted = formatArticle(article);
    formatted.view_count = article.view_count + 1;
    formatted.views = article.view_count + 1;
    return new Response(JSON.stringify({ success: true, data: formatted }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    console.error('[NOTICIAS/SLUG] GET Error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Error interno del servidor' }), {
      status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

export async function onRequestDelete(context) {
  const { request, env, params } = context;
  try {
    let authUser;
    try { authUser = await requireAuth(request, env); } 
    catch (error) {
      return new Response(JSON.stringify({ success: false, error: 'No autorizado' }), {
        status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    const isAdmin = authUser.role === 'admin' || (Array.isArray(authUser.roles) && authUser.roles.includes('admin'));
    if (!isAdmin) {
      return new Response(JSON.stringify({ success: false, error: 'No tienes permisos' }), {
        status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    if (!params.slug) {
      return new Response(JSON.stringify({ success: false, error: 'Slug requerido' }), {
        status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    let query, binding;
    if (!isNaN(params.slug)) {
      query = 'SELECT id FROM news_articles WHERE id = ? AND deleted_at IS NULL';
      binding = parseInt(params.slug);
    } else {
      query = 'SELECT id FROM news_articles WHERE slug = ? AND deleted_at IS NULL';
      binding = params.slug;
    }
    const article = await env.DB.prepare(query).bind(binding).first();
    if (!article) {
      return new Response(JSON.stringify({ success: false, error: 'Noticia no encontrada' }), {
        status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    const now = new Date().toISOString();
    await env.DB.prepare('UPDATE news_articles SET deleted_at = ?, status = ? WHERE id = ?').bind(now, 'archived', article.id).run();
    return new Response(JSON.stringify({ success: true, message: 'Noticia movida a la papelera' }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    console.error('[NOTICIAS/SLUG] DELETE Error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Error al eliminar noticia' }), {
      status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

export async function onRequestPut(context) {
  const { request, env, params } = context;
  try {
    console.log('[NOTICIAS/SLUG] PUT request for:', params.slug);
    
    // Verificar autenticación
    let authUser;
    try { authUser = await requireAuth(request, env); }
    catch (error) {
      return new Response(JSON.stringify({ success: false, error: 'No autorizado' }), {
        status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
    
    // Verificar permisos de admin
    const isAdmin = authUser.role === 'admin' || (Array.isArray(authUser.roles) && authUser.roles.includes('admin'));
    if (!isAdmin) {
      return new Response(JSON.stringify({ success: false, error: 'No tienes permisos para actualizar noticias' }), {
        status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    if (!params.slug) {
      return new Response(JSON.stringify({ success: false, error: 'Slug requerido' }), {
        status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    const body = await request.json();
    console.log('[NOTICIAS/SLUG] Update data:', body.title);

    // Buscar artículo existente
    let query, binding;
    if (!isNaN(params.slug)) {
      query = 'SELECT * FROM news_articles WHERE id = ? AND deleted_at IS NULL';
      binding = parseInt(params.slug);
    } else {
      query = 'SELECT * FROM news_articles WHERE slug = ? AND deleted_at IS NULL';
      binding = params.slug;
    }

    const article = await env.DB.prepare(query).bind(binding).first();
    if (!article) {
      return new Response(JSON.stringify({ success: false, error: 'Noticia no encontrada' }), {
        status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Actualizar en D1
    const now = new Date().toISOString();
    const updateQuery = `
      UPDATE news_articles 
      SET title = ?, slug = ?, excerpt = ?, content = ?, featured_image = ?,
          gallery = ?, video_url = ?, category_id = ?, status = ?, is_featured = ?, updated_at = ?
      WHERE id = ?
    `;

    // Extraer category_id del objeto category si viene
    let categoryId = article.category_id;
    if (body.category) {
      categoryId = typeof body.category === 'object' ? body.category.id : body.category;
    } else if (body.category_id) {
      categoryId = body.category_id;
    }

    // Convertir gallery a JSON string si es un array
    let galleryJson = article.gallery;
    if (body.gallery !== undefined) {
      galleryJson = Array.isArray(body.gallery) ? JSON.stringify(body.gallery) : body.gallery;
    }

    await env.DB.prepare(updateQuery).bind(
      body.title || article.title,
      body.slug || article.slug,
      body.excerpt !== undefined ? body.excerpt : article.excerpt,
      body.content || article.content,
      body.featured_image !== undefined ? body.featured_image : article.featured_image,
      galleryJson,
      body.video_url !== undefined ? body.video_url : article.video_url,
      categoryId,
      body.status || article.status,
      body.is_featured !== undefined ? (body.is_featured ? 1 : 0) : article.is_featured,
      now,
      article.id
    ).run();

    // Obtener artículo actualizado
    const updated = await env.DB.prepare('SELECT * FROM news_articles WHERE id = ?').bind(article.id).first();
    
    console.log('[NOTICIAS/SLUG] Article updated:', updated.title);

    return new Response(JSON.stringify({
      success: true,
      data: formatArticle(updated),
      message: 'Noticia actualizada exitosamente'
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    console.error('[NOTICIAS/SLUG] PUT Error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Error al actualizar noticia: ' + error.message }), {
      status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}
