// Endpoint para obtener noticia individual por slug
// GET /api/noticias/[slug]

export async function onRequestGet(context) {
  const { request, env, params } = context;

  try {
    console.log('[NOTICIAS/SLUG] Processing request for slug:', params.slug);

    if (!params.slug) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Slug requerido'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Obtener todas las noticias del KV
    const noticiasData = await env.ACA_KV.get('noticias:all');
    if (!noticiasData) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No hay noticias disponibles'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const noticias = JSON.parse(noticiasData);
    
    // Buscar la noticia por slug
    const noticia = noticias.find(n => n.slug === params.slug);
    
    if (!noticia) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Noticia no encontrada'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Incrementar contador de vistas
    noticia.views = (noticia.views || 0) + 1;
    
    // Guardar las noticias actualizadas
    const updatedNoticias = noticias.map(n => 
      n.slug === params.slug ? noticia : n
    );
    await env.ACA_KV.put('noticias:all', JSON.stringify(updatedNoticias));

    // También actualizar la noticia individual en KV
    await env.ACA_KV.put(`noticia:${noticia.id}`, JSON.stringify(noticia));

    console.log(`[NOTICIAS/SLUG] Noticia encontrada: ${noticia.title}, views: ${noticia.views}`);

    return new Response(JSON.stringify({
      success: true,
      data: noticia
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[NOTICIAS/SLUG] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error interno del servidor',
      details: env.ENVIRONMENT === 'development' ? error.message : undefined
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}