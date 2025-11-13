// Endpoint para gestionar likes de artículos
// GET /api/likes/[articleId] - Obtener likes
// POST /api/likes/[articleId] - Toggle like

export async function onRequestGet(context) {
  const { env, params } = context;

  try {
    const articleId = parseInt(params.articleId);
    
    if (isNaN(articleId)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'ID de artículo inválido'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Obtener likes del KV
    const likesData = await env.ACA_KV.get(`likes:article:${articleId}`);
    const likes = likesData ? JSON.parse(likesData) : { count: 0, users: [] };

    // Por ahora, sin autenticación de usuario, solo devolver el conteo
    return new Response(JSON.stringify({
      success: true,
      data: {
        totalLikes: likes.count || 0,
        userLiked: false // TODO: Implementar cuando haya autenticación de usuario
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[LIKES] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error obteniendo likes'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestPost(context) {
  const { env, params, request } = context;

  try {
    const articleId = parseInt(params.articleId);
    
    if (isNaN(articleId)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'ID de artículo inválido'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Obtener datos actuales de likes
    const likesData = await env.ACA_KV.get(`likes:article:${articleId}`);
    const likes = likesData ? JSON.parse(likesData) : { count: 0, users: [] };

    // Por ahora sin autenticación, solo incrementar el contador
    // TODO: Cuando haya autenticación, verificar si el usuario ya dio like
    const newCount = (likes.count || 0) + 1;
    
    const updatedLikes = {
      count: newCount,
      users: likes.users || [],
      lastUpdated: new Date().toISOString()
    };

    // Guardar en KV
    await env.ACA_KV.put(`likes:article:${articleId}`, JSON.stringify(updatedLikes));

    // También actualizar el contador en la noticia
    const noticiasData = await env.ACA_KV.get('noticias:all');
    if (noticiasData) {
      const noticias = JSON.parse(noticiasData);
      const noticiaIndex = noticias.findIndex(n => n.id === articleId);
      
      if (noticiaIndex !== -1) {
        noticias[noticiaIndex].likes = newCount;
        await env.ACA_KV.put('noticias:all', JSON.stringify(noticias));
        await env.ACA_KV.put(`noticia:${articleId}`, JSON.stringify(noticias[noticiaIndex]));
      }
    }

    return new Response(JSON.stringify({
      success: true,
      data: {
        totalLikes: newCount,
        userLiked: true
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[LIKES] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error procesando like'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
