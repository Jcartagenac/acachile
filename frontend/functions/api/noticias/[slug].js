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

// DELETE /api/noticias/[slug] - Eliminar noticia
export async function onRequestDelete(context) {
  const { request, env, params } = context;

  try {
    console.log('[NOTICIAS/SLUG] DELETE request for slug:', params.slug);

    // Verificar autenticación
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No autorizado'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.substring(7);
    const sessionData = await env.ACA_KV.get(`session:${token}`);
    
    if (!sessionData) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Sesión inválida o expirada'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const session = JSON.parse(sessionData);
    
    // Verificar que el usuario sea admin
    if (session.role !== 'admin') {
      return new Response(JSON.stringify({
        success: false,
        error: 'No tienes permisos para eliminar noticias'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!params.slug) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Slug requerido'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Obtener todas las noticias
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
    
    // Buscar la noticia a eliminar
    const noticiaIndex = noticias.findIndex(n => n.slug === params.slug);
    
    if (noticiaIndex === -1) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Noticia no encontrada'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const noticia = noticias[noticiaIndex];
    
    // Eliminar la noticia del array
    noticias.splice(noticiaIndex, 1);
    
    // Guardar el array actualizado
    await env.ACA_KV.put('noticias:all', JSON.stringify(noticias));
    
    // Eliminar también la entrada individual
    await env.ACA_KV.delete(`noticia:${noticia.id}`);

    console.log(`[NOTICIAS/SLUG] Noticia eliminada: ${noticia.title}`);

    return new Response(JSON.stringify({
      success: true,
      message: 'Noticia eliminada correctamente'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[NOTICIAS/SLUG] Error al eliminar:', error);
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