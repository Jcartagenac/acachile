// Endpoint para gestionar likes de artículos
// GET /api/likes/[articleId] - Obtener likes
// POST /api/likes/[articleId] - Toggle like

export async function onRequestGet(context) {
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

    // Obtener userId del query param o IP
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId') || request.headers.get('CF-Connecting-IP') || 'anonymous';

    // Obtener likes del KV
    const likesData = await env.ACA_KV.get(`likes:article:${articleId}`);
    const likes = likesData ? JSON.parse(likesData) : { count: 0, users: [] };

    // Verificar si el usuario ya dio like
    const userLiked = likes.users && likes.users.includes(userId);

    return new Response(JSON.stringify({
      success: true,
      data: {
        totalLikes: likes.count || 0,
        userLiked: userLiked
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

    // Obtener body para userId (generado en el cliente)
    const body = await request.json();
    const userId = body.userId || request.headers.get('CF-Connecting-IP') || 'anonymous';

    // Obtener datos actuales de likes
    const likesData = await env.ACA_KV.get(`likes:article:${articleId}`);
    const likes = likesData ? JSON.parse(likesData) : { count: 0, users: [] };

    // Verificar si el usuario ya dio like
    const userIndex = likes.users.findIndex(u => u === userId);
    let newCount;
    let userLiked;

    if (userIndex !== -1) {
      // Usuario ya dio like, removerlo (unlike)
      likes.users.splice(userIndex, 1);
      newCount = Math.max(0, (likes.count || 0) - 1);
      userLiked = false;
    } else {
      // Usuario no ha dado like, agregarlo
      likes.users.push(userId);
      newCount = (likes.count || 0) + 1;
      userLiked = true;
    }
    
    const updatedLikes = {
      count: newCount,
      users: likes.users,
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

    console.log(`[LIKES] Article ${articleId}: User ${userId} ${userLiked ? 'liked' : 'unliked'}. Total: ${newCount}`);

    return new Response(JSON.stringify({
      success: true,
      data: {
        totalLikes: newCount,
        userLiked: userLiked
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
