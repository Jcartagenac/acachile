// Endpoint de estadísticas de comentarios
// GET /api/comments/stats?article_id={id}&type={noticia|evento}

export async function onRequestGet(context) {
  const { request, env } = context;

  try {
    const url = new URL(request.url);
    const articleId = url.searchParams.get('article_id');
    const type = url.searchParams.get('type') || 'noticia';

    console.log(`[COMMENTS STATS] GET - Article ID: ${articleId}, Type: ${type}`);

    if (!articleId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'article_id es requerido'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Obtener estadísticas desde KV
    const statsKey = `comments:stats:${type}:${articleId}`;
    const statsData = await env.ACA_KV.get(statsKey);
    
    let stats = {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0
    };

    if (statsData) {
      stats = { ...stats, ...JSON.parse(statsData) };
    }

    // Obtener comentarios para calcular estadísticas adicionales
    const commentsKey = `comments:${type}:${articleId}`;
    const commentsData = await env.ACA_KV.get(commentsKey);
    
    let additionalStats = {
      total_likes: 0,
      replies_count: 0,
      most_liked_count: 0,
      recent_comments: 0 // últimas 24 horas
    };

    if (commentsData) {
      const comments = JSON.parse(commentsData);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      function calculateStats(commentsList) {
        commentsList.forEach(comment => {
          // Contar likes
          additionalStats.total_likes += comment.likes || 0;
          
          // Comentario más likeado
          if ((comment.likes || 0) > additionalStats.most_liked_count) {
            additionalStats.most_liked_count = comment.likes || 0;
          }

          // Comentarios recientes
          const commentDate = new Date(comment.created_at);
          if (commentDate > yesterday) {
            additionalStats.recent_comments += 1;
          }

          // Contar respuestas
          if (comment.replies && comment.replies.length > 0) {
            additionalStats.replies_count += comment.replies.length;
            calculateStats(comment.replies); // Recursivo para respuestas
          }
        });
      }

      calculateStats(comments);
    }

    const finalStats = {
      ...stats,
      ...additionalStats,
      article_id: articleId,
      type,
      last_updated: new Date().toISOString()
    };

    console.log(`[COMMENTS STATS] Estadísticas calculadas:`, finalStats);

    return new Response(JSON.stringify({
      success: true,
      data: finalStats
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[COMMENTS STATS] Error en GET:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error interno del servidor'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// POST para actualizar estadísticas manualmente (admin)
export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    console.log('[COMMENTS STATS] Processing POST request');

    const body = await request.json();
    const { article_id, type, recalculate } = body;

    if (!article_id || !type) {
      return new Response(JSON.stringify({
        success: false,
        error: 'article_id y type son requeridos'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (recalculate) {
      // Recalcular estadísticas desde los comentarios existentes
      const commentsKey = `comments:${type}:${article_id}`;
      const commentsData = await env.ACA_KV.get(commentsKey);
      
      let newStats = {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0
      };

      if (commentsData) {
        const comments = JSON.parse(commentsData);

        function countComments(commentsList) {
          commentsList.forEach(comment => {
            newStats.total += 1;
            
            switch (comment.status) {
              case 'pending':
                newStats.pending += 1;
                break;
              case 'approved':
                newStats.approved += 1;
                break;
              case 'rejected':
                newStats.rejected += 1;
                break;
            }

            // Contar respuestas recursivamente
            if (comment.replies && comment.replies.length > 0) {
              countComments(comment.replies);
            }
          });
        }

        countComments(comments);
      }

      // Guardar estadísticas recalculadas
      const statsKey = `comments:stats:${type}:${article_id}`;
      await env.ACA_KV.put(statsKey, JSON.stringify(newStats));

      console.log(`[COMMENTS STATS] Estadísticas recalculadas para ${type}:${article_id}`);

      return new Response(JSON.stringify({
        success: true,
        data: {
          article_id,
          type,
          stats: newStats,
          message: 'Estadísticas recalculadas correctamente'
        }
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: false,
      error: 'Acción no especificada. Use recalculate: true para recalcular estadísticas'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[COMMENTS STATS] Error en POST:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error interno del servidor'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}