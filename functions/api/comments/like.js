// Endpoint para likes de comentarios
// POST /api/comments/like - Dar/quitar like a un comentario

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    console.log('[COMMENTS LIKE] Processing POST request');

    const body = await request.json();
    const { comment_id, article_id, type, user_identifier } = body;

    // Validaciones
    if (!comment_id || !article_id || !type) {
      return new Response(JSON.stringify({
        success: false,
        error: 'comment_id, article_id y type son requeridos'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generar identificador único para el usuario (IP + User Agent hash)
    const userIp = request.headers.get('CF-Connecting-IP') || 
                  request.headers.get('X-Forwarded-For') || 
                  'unknown';
    const userAgent = request.headers.get('User-Agent') || '';
    const identifier = user_identifier || `${userIp}-${btoa(userAgent).slice(0, 10)}`;

    const commentsKey = `comments:${type}:${article_id}`;
    const commentsData = await env.ACA_KV.get(commentsKey);
    
    if (!commentsData) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No se encontraron comentarios para este artículo'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const comments = JSON.parse(commentsData);
    // Helper: Procesar toggle de like en un comentario
    function processLikeToggle(comment, identifier) {
      if (!comment.liked_by) {
        comment.liked_by = [];
      }

      const existingLikeIndex = comment.liked_by.indexOf(identifier);
      
      if (existingLikeIndex > -1) {
        // Quitar like
        comment.liked_by.splice(existingLikeIndex, 1);
        comment.likes = Math.max(0, comment.likes - 1);
        return { likeAdded: false, newLikeCount: comment.likes };
      } else {
        // Agregar like
        comment.liked_by.push(identifier);
        comment.likes = (comment.likes || 0) + 1;
        return { likeAdded: true, newLikeCount: comment.likes };
      }
    }

    // Helper: Buscar y actualizar comentario recursivamente
    function findAndUpdateComment(commentsList, comment_id, identifier) {
      for (const comment of commentsList) {
        if (comment.id === comment_id) {
          return { found: true, result: processLikeToggle(comment, identifier) };
        }

        // Buscar en respuestas
        if (comment.replies && comment.replies.length > 0) {
          const nested = findAndUpdateComment(comment.replies, comment_id, identifier);
          if (nested.found) {
            return nested;
          }
        }
      }
      return { found: false };
    }

    const updateResult = findAndUpdateComment(comments, comment_id, identifier);

    if (!updateResult.found) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Comentario no encontrado'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { likeAdded, newLikeCount } = updateResult.result;

    // Actualizar comentarios en KV
    await env.ACA_KV.put(commentsKey, JSON.stringify(comments));

    // Guardar registro de like para prevenir spam
    const likeKey = `like:${comment_id}:${identifier}`;
    if (likeAdded) {
      await env.ACA_KV.put(likeKey, JSON.stringify({
        timestamp: new Date().toISOString(),
        user_identifier: identifier
      }), { expirationTtl: 86400 * 30 }); // 30 días
    } else {
      await env.ACA_KV.delete(likeKey);
    }

    console.log(`[COMMENTS LIKE] Comentario ${comment_id} - Like ${likeAdded ? 'agregado' : 'removido'} por ${identifier}`);

    return new Response(JSON.stringify({
      success: true,
      data: {
        comment_id,
        liked: likeAdded,
        likes_count: newLikeCount,
        message: likeAdded ? 'Like agregado' : 'Like removido'
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[COMMENTS LIKE] Error en POST:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error interno del servidor'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestGet(context) {
  const { request, env } = context;

  try {
    const url = new URL(request.url);
    const commentId = url.searchParams.get('comment_id');
    const userIdentifier = url.searchParams.get('user_identifier');

    if (!commentId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'comment_id es requerido'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Si se proporciona user_identifier, verificar si el usuario ya dio like
    let hasLiked = false;
    if (userIdentifier) {
      const likeKey = `like:${commentId}:${userIdentifier}`;
      const likeData = await env.ACA_KV.get(likeKey);
      hasLiked = !!likeData;
    }

    return new Response(JSON.stringify({
      success: true,
      data: {
        comment_id: commentId,
        has_liked: hasLiked,
        user_identifier: userIdentifier
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[COMMENTS LIKE] Error en GET:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error interno del servidor'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}