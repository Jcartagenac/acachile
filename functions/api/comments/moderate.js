// Endpoint de moderación de comentarios
// PATCH /api/comments/moderate - Aprobar/rechazar comentario
// DELETE /api/comments/moderate - Eliminar comentario

export async function onRequestPatch(context) {
  const { request, env } = context;

  try {
    console.log('[COMMENTS MODERATE] Processing PATCH request');

    const body = await request.json();
    const { comment_id, action, article_id, type } = body;

    // Validaciones
    if (!comment_id || !action || !article_id || !type) {
      return new Response(JSON.stringify({
        success: false,
        error: 'comment_id, action, article_id y type son requeridos'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!['approve', 'reject'].includes(action)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'action debe ser "approve" o "reject"'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

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
    let commentFound = false;
    let oldStatus = null;

    // Buscar y actualizar el comentario (incluyendo respuestas)
    function updateCommentStatus(commentsList) {
      for (let i = 0; i < commentsList.length; i++) {
        if (commentsList[i].id === comment_id) {
          oldStatus = commentsList[i].status;
          commentsList[i].status = action === 'approve' ? 'approved' : 'rejected';
          commentsList[i].moderated_at = new Date().toISOString();
          commentFound = true;
          return;
        }
        // Buscar en respuestas
        if (commentsList[i].replies && commentsList[i].replies.length > 0) {
          updateCommentStatus(commentsList[i].replies);
          if (commentFound) return;
        }
      }
    }

    updateCommentStatus(comments);

    if (!commentFound) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Comentario no encontrado'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Actualizar comentarios en KV
    await env.ACA_KV.put(commentsKey, JSON.stringify(comments));

    // Actualizar estadísticas
    const statsKey = `comments:stats:${type}:${article_id}`;
    const currentStats = await env.ACA_KV.get(statsKey);
    const stats = currentStats ? JSON.parse(currentStats) : { total: 0, pending: 0, approved: 0, rejected: 0 };
    
    // Actualizar contadores según el cambio de estado
    if (oldStatus === 'pending') {
      stats.pending -= 1;
    } else if (oldStatus === 'approved') {
      stats.approved -= 1;
    } else if (oldStatus === 'rejected') {
      stats.rejected -= 1;
    }

    if (action === 'approve') {
      stats.approved += 1;
    } else {
      stats.rejected += 1;
    }

    await env.ACA_KV.put(statsKey, JSON.stringify(stats));

    console.log(`[COMMENTS MODERATE] Comentario ${comment_id} ${action}d`);

    return new Response(JSON.stringify({
      success: true,
      data: {
        comment_id,
        action,
        new_status: action === 'approve' ? 'approved' : 'rejected',
        message: `Comentario ${action === 'approve' ? 'aprobado' : 'rechazado'} correctamente`
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[COMMENTS MODERATE] Error en PATCH:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error interno del servidor'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestDelete(context) {
  const { request, env } = context;

  try {
    console.log('[COMMENTS MODERATE] Processing DELETE request');

    const body = await request.json();
    const { comment_id, article_id, type } = body;

    if (!comment_id || !article_id || !type) {
      return new Response(JSON.stringify({
        success: false,
        error: 'comment_id, article_id y type son requeridos'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

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
    let commentFound = false;
    let deletedComment = null;

    // Función para eliminar comentario (incluyendo respuestas)
    function deleteComment(commentsList, parentList = null, parentIndex = null) {
      for (let i = 0; i < commentsList.length; i++) {
        if (commentsList[i].id === comment_id) {
          deletedComment = commentsList[i];
          commentsList.splice(i, 1);
          commentFound = true;
          return;
        }
        // Buscar en respuestas
        if (commentsList[i].replies && commentsList[i].replies.length > 0) {
          deleteComment(commentsList[i].replies, commentsList, i);
          if (commentFound) return;
        }
      }
    }

    deleteComment(comments);

    if (!commentFound) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Comentario no encontrado'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Actualizar comentarios en KV
    await env.ACA_KV.put(commentsKey, JSON.stringify(comments));

    // Actualizar estadísticas
    const statsKey = `comments:stats:${type}:${article_id}`;
    const currentStats = await env.ACA_KV.get(statsKey);
    if (currentStats) {
      const stats = JSON.parse(currentStats);
      stats.total = Math.max(0, stats.total - 1);
      
      // Restar del contador correspondiente
      if (deletedComment.status === 'pending') {
        stats.pending = Math.max(0, stats.pending - 1);
      } else if (deletedComment.status === 'approved') {
        stats.approved = Math.max(0, stats.approved - 1);
      } else if (deletedComment.status === 'rejected') {
        stats.rejected = Math.max(0, stats.rejected - 1);
      }

      await env.ACA_KV.put(statsKey, JSON.stringify(stats));
    }

    console.log(`[COMMENTS MODERATE] Comentario ${comment_id} eliminado`);

    return new Response(JSON.stringify({
      success: true,
      data: {
        comment_id,
        message: 'Comentario eliminado correctamente'
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[COMMENTS MODERATE] Error en DELETE:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error interno del servidor'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}