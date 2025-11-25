// Endpoint principal de comentarios
// GET /api/comments?article_id={id}&type={noticia|evento}&limit={number}
// POST /api/comments - Crear comentario

export async function onRequestGet(context) {
  const { request, env } = context;

  try {
    const url = new URL(request.url);
    const articleId = url.searchParams.get('article_id');
    const limit = parseInt(url.searchParams.get('limit')) || 20;

    console.log(`[COMMENTS] GET - Article ID: ${articleId}, Limit: ${limit}`);

    if (!articleId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'article_id es requerido'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Obtener comentarios aprobados de D1
    const query = `
      SELECT id, article_id, author_name, author_email, content, status, parent_id, created_at
      FROM news_comments
      WHERE article_id = ? AND status = 'approved'
      ORDER BY created_at DESC
      LIMIT ?
    `;

    const { results } = await env.DB.prepare(query)
      .bind(articleId, limit)
      .all();

    console.log(`[COMMENTS] Encontrados: ${results.length} comentarios aprobados`);

    return new Response(JSON.stringify({
      success: true,
      data: {
        comments: results,
        total: results.length,
        article_id: articleId
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

    // Insertar comentario en D1 (news_comments table)
    const insertQuery = `
      INSERT INTO news_comments (article_id, author_name, author_email, content, status, parent_id, created_at)
      VALUES (?, ?, ?, ?, 'pending', ?, datetime('now'))
    `;

    const result = await env.DB.prepare(insertQuery)
      .bind(
        article_id,
        body.author_name.trim(),
        body.author_email.toLowerCase().trim(),
        body.content.trim(),
        parent_id || null
      )
      .run();

    if (!result.success) {
      throw new Error('Failed to insert comment into D1');
    }

    console.log(`[COMMENTS] Comentario creado en D1 para article_id: ${article_id}`);

    return new Response(JSON.stringify({
      success: true,
      data: {
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