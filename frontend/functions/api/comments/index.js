// Endpoint principal de comentarios
// GET /api/comments?article_id={id}&type={noticia|evento}&limit={number}
// POST /api/comments - Crear comentario

export async function onRequestGet(context) {
  const { request, env } = context;

  try {
    const url = new URL(request.url);
    const articleId = url.searchParams.get('article_id');
    const type = url.searchParams.get('type') || 'noticia'; // noticia, evento
    const limit = parseInt(url.searchParams.get('limit')) || 20;

    console.log(`[COMMENTS] GET - Article ID: ${articleId}, Type: ${type}, Limit: ${limit}`);

    if (!articleId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'article_id es requerido'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Obtener comentarios del KV
    const commentsKey = `comments:${type}:${articleId}`;
    const commentsData = await env.ACA_KV.get(commentsKey);
    
    let comments = [];
    if (commentsData) {
      comments = JSON.parse(commentsData);
    }

    // Filtrar solo comentarios aprobados (a menos que sea admin)
    // TODO: Verificar si el usuario es admin para mostrar todos
    comments = comments.filter(c => c.status === 'approved');

    // Ordenar por fecha (más recientes primero) y limitar
    comments = comments
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, limit);

    console.log(`[COMMENTS] Encontrados: ${comments.length} comentarios aprobados`);

    return new Response(JSON.stringify({
      success: true,
      data: {
        comments,
        total: comments.length,
        article_id: articleId,
        type
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[COMMENTS] Error en GET:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error interno del servidor'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Helper: Validar campos requeridos del comentario
function validateRequiredFields(body) {
  const { article_id, type, content, author_name, author_email } = body;
  if (!article_id || !type || !content || !author_name || !author_email) {
    return 'article_id, type, content, author_name y author_email son requeridos';
  }
  return null;
}

// Helper: Validar contenido del comentario
function validateCommentContent(content) {
  if (content.length < 5) {
    return 'El comentario debe tener al menos 5 caracteres';
  }
  if (content.length > 1000) {
    return 'El comentario no puede exceder 1000 caracteres';
  }
  return null;
}

// Helper: Validar email
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Email inválido';
  }
  return null;
}

// Helper: Crear objeto de comentario
function createCommentObject(body, commentId) {
  const { article_id, type, content, author_name, author_email, parent_id } = body;
  
  return {
    id: commentId,
    article_id,
    type,
    content: content.trim(),
    author_name: author_name.trim(),
    author_email: author_email.toLowerCase().trim(),
    parent_id: parent_id || null,
    created_at: new Date().toISOString(),
    status: 'pending',
    likes: 0,
    replies: []
  };
}

// Helper: Agregar comentario a la lista
function addCommentToList(existingComments, newComment, parent_id) {
  if (parent_id) {
    const parentIndex = existingComments.findIndex(c => c.id === parent_id);
    if (parentIndex === -1) {
      return { success: false, error: 'Comentario padre no encontrado' };
    }
    if (!existingComments[parentIndex].replies) {
      existingComments[parentIndex].replies = [];
    }
    existingComments[parentIndex].replies.push(newComment);
  } else {
    existingComments.push(newComment);
  }
  return { success: true };
}

// Helper: Actualizar estadísticas de comentarios
async function updateCommentStats(env, type, article_id) {
  const statsKey = `comments:stats:${type}:${article_id}`;
  const currentStats = await env.ACA_KV.get(statsKey);
  const stats = currentStats ? JSON.parse(currentStats) : { total: 0, pending: 0, approved: 0 };
  stats.total += 1;
  stats.pending += 1;
  await env.ACA_KV.put(statsKey, JSON.stringify(stats));
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    console.log('[COMMENTS] Processing POST request');

    const body = await request.json();
    const { article_id, type, parent_id } = body;

    // Validaciones
    const requiredError = validateRequiredFields(body);
    if (requiredError) {
      return new Response(JSON.stringify({
        success: false,
        error: requiredError
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const contentError = validateCommentContent(body.content);
    if (contentError) {
      return new Response(JSON.stringify({
        success: false,
        error: contentError
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const emailError = validateEmail(body.author_email);
    if (emailError) {
      return new Response(JSON.stringify({
        success: false,
        error: emailError
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const commentsKey = `comments:${type}:${article_id}`;
    
    // Obtener comentarios existentes
    const existingCommentsData = await env.ACA_KV.get(commentsKey);
    const existingComments = existingCommentsData ? JSON.parse(existingCommentsData) : [];

    // Generar ID único y crear comentario
    const commentId = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    const newComment = createCommentObject(body, commentId);

    // Agregar comentario a la lista
    const addResult = addCommentToList(existingComments, newComment, parent_id);
    if (!addResult.success) {
      return new Response(JSON.stringify({
        success: false,
        error: addResult.error
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Guardar comentarios actualizados
    await env.ACA_KV.put(commentsKey, JSON.stringify(existingComments));

    // Actualizar estadísticas
    await updateCommentStats(env, type, article_id);

    console.log(`[COMMENTS] Comentario creado: ${commentId} para ${type}:${article_id}`);

    return new Response(JSON.stringify({
      success: true,
      data: {
        comment: newComment,
        message: 'Comentario enviado. Será revisado antes de publicarse.'
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[COMMENTS] Error en POST:', error);
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