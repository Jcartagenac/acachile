/**
 * Sistema de comentarios y interacciones para noticias
 * ACA Chile - Comentarios, likes, compartir
 */

export interface Env {
  ACA_KV: KVNamespace;
  DB: D1Database;
  ENVIRONMENT: string;
}

export interface NewsComment {
  id: number;
  article_id: number;
  author_name: string;
  author_email: string;
  content: string;
  status: 'pending' | 'approved' | 'spam' | 'rejected';
  parent_id?: number;
  created_at: string;
  replies?: NewsComment[];
}

/**
 * Crear comentario
 */
export async function createComment(
  env: Env,
  commentData: {
    article_id: number;
    author_name: string;
    author_email: string;
    content: string;
    parent_id?: number;
  }
): Promise<{ success: boolean; data?: NewsComment; error?: string }> {
  try {
    const { article_id, author_name, author_email, content, parent_id } = commentData;

    // Validaciones
    if (!content.trim() || content.length < 10) {
      return { success: false, error: 'El comentario debe tener al menos 10 caracteres' };
    }

    if (!author_name.trim() || !author_email.trim()) {
      return { success: false, error: 'Nombre y email son requeridos' };
    }

    // Verificar que el artículo existe
    const article = await env.DB.prepare(`
      SELECT id FROM news_articles WHERE id = ? AND status = 'published'
    `).bind(article_id).first();

    if (!article) {
      return { success: false, error: 'Artículo no encontrado' };
    }

    // Si es respuesta, verificar que el comentario padre existe
    if (parent_id) {
      const parentComment = await env.DB.prepare(`
        SELECT id FROM news_comments WHERE id = ? AND article_id = ?
      `).bind(parent_id, article_id).first();

      if (!parentComment) {
        return { success: false, error: 'Comentario padre no encontrado' };
      }
    }

    // Auto-aprobar comentarios por ahora (se puede cambiar a 'pending')
    const status = 'approved';

    const result = await env.DB.prepare(`
      INSERT INTO news_comments (
        article_id, author_name, author_email, content, status, parent_id
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).bind(article_id, author_name, author_email, content, status, parent_id).run();

    if (!result.success) {
      return { success: false, error: 'Error creando comentario' };
    }

    const commentId = result.meta.last_row_id as number;

    // Obtener comentario completo
    const newComment = await env.DB.prepare(`
      SELECT * FROM news_comments WHERE id = ?
    `).bind(commentId).first();

    const commentData_result: NewsComment = {
      id: newComment!.id as number,
      article_id: newComment!.article_id as number,
      author_name: newComment!.author_name as string,
      author_email: newComment!.author_email as string,
      content: newComment!.content as string,
      status: newComment!.status as 'pending' | 'approved' | 'spam' | 'rejected',
      parent_id: newComment!.parent_id as number,
      created_at: newComment!.created_at as string
    };

    // Invalidar cache de comentarios del artículo
    await env.ACA_KV.delete(`comments:article:${article_id}`);

    return { success: true, data: commentData_result };

  } catch (error) {
    console.error('Error en createComment:', error);
    return { success: false, error: 'Error interno creando comentario' };
  }
}

/**
 * Obtener comentarios de un artículo
 */
export async function getArticleComments(
  env: Env,
  articleId: number,
  status: 'approved' | 'all' = 'approved'
): Promise<{ success: boolean; data?: NewsComment[]; error?: string }> {
  try {
    // Intentar obtener de cache
    const cacheKey = `comments:article:${articleId}:${status}`;
    const cached = await env.ACA_KV.get(cacheKey);
    if (cached) {
      return { success: true, data: JSON.parse(cached) };
    }

    let query = `
      SELECT * FROM news_comments 
      WHERE article_id = ?
    `;

    const params = [articleId];

    if (status === 'approved') {
      query += ' AND status = ?';
      params.push('approved' as any);
    }

    query += ' ORDER BY created_at ASC';

    const result = await env.DB.prepare(query).bind(...params).all();

    // Organizar comentarios en estructura jerárquica
    const comments: NewsComment[] = [];
    const commentMap = new Map<number, NewsComment>();

    // Primero crear todos los comentarios
    result.results.forEach(row => {
      const comment: NewsComment = {
        id: row.id as number,
        article_id: row.article_id as number,
        author_name: row.author_name as string,
        author_email: row.author_email as string,
        content: row.content as string,
        status: row.status as 'pending' | 'approved' | 'spam' | 'rejected',
        parent_id: row.parent_id as number,
        created_at: row.created_at as string,
        replies: []
      };
      commentMap.set(comment.id, comment);
    });

    // Luego organizarlos en jerarquía
    commentMap.forEach(comment => {
      if (comment.parent_id) {
        const parent = commentMap.get(comment.parent_id);
        if (parent) {
          parent.replies!.push(comment);
        }
      } else {
        comments.push(comment);
      }
    });

    // Cache por 15 minutos
    await env.ACA_KV.put(cacheKey, JSON.stringify(comments), { expirationTtl: 900 });

    return { success: true, data: comments };

  } catch (error) {
    console.error('Error en getArticleComments:', error);
    return { success: false, error: 'Error obteniendo comentarios' };
  }
}

/**
 * Moderar comentario (cambiar status)
 */
export async function moderateComment(
  env: Env,
  commentId: number,
  status: 'approved' | 'rejected' | 'spam'
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await env.DB.prepare(`
      UPDATE news_comments 
      SET status = ? 
      WHERE id = ?
    `).bind(status, commentId).run();

    if (!result.success) {
      return { success: false, error: 'Error moderando comentario' };
    }

    // Obtener article_id para invalidar cache
    const comment = await env.DB.prepare(`
      SELECT article_id FROM news_comments WHERE id = ?
    `).bind(commentId).first();

    if (comment) {
      await env.ACA_KV.delete(`comments:article:${comment.article_id}:approved`);
      await env.ACA_KV.delete(`comments:article:${comment.article_id}:all`);
    }

    return { success: true };

  } catch (error) {
    console.error('Error en moderateComment:', error);
    return { success: false, error: 'Error interno moderando comentario' };
  }
}

/**
 * Eliminar comentario
 */
export async function deleteComment(
  env: Env,
  commentId: number
): Promise<{ success: boolean; error?: string }> {
  try {
    // Obtener info del comentario antes de eliminarlo
    const comment = await env.DB.prepare(`
      SELECT article_id FROM news_comments WHERE id = ?
    `).bind(commentId).first();

    if (!comment) {
      return { success: false, error: 'Comentario no encontrado' };
    }

    const result = await env.DB.prepare(`
      DELETE FROM news_comments WHERE id = ?
    `).bind(commentId).run();

    if (!result.success) {
      return { success: false, error: 'Error eliminando comentario' };
    }

    // Invalidar cache
    await env.ACA_KV.delete(`comments:article:${comment.article_id}:approved`);
    await env.ACA_KV.delete(`comments:article:${comment.article_id}:all`);

    return { success: true };

  } catch (error) {
    console.error('Error en deleteComment:', error);
    return { success: false, error: 'Error interno eliminando comentario' };
  }
}

/**
 * Sistema de likes/reacciones (usando KV para velocidad)
 */
export async function toggleArticleLike(
  env: Env,
  articleId: number,
  userIdentifier: string // IP o user ID
): Promise<{ success: boolean; data?: { liked: boolean; totalLikes: number }; error?: string }> {
  try {
    const likesKey = `article:${articleId}:likes`;
    const userLikeKey = `article:${articleId}:like:${userIdentifier}`;

    // Verificar si ya le dio like
    const existingLike = await env.ACA_KV.get(userLikeKey);
    const isLiked = existingLike === 'true';

    // Obtener total actual
    const currentLikes = await env.ACA_KV.get(likesKey);
    let totalLikes = currentLikes ? parseInt(currentLikes) : 0;

    if (isLiked) {
      // Quitar like
      await env.ACA_KV.delete(userLikeKey);
      totalLikes = Math.max(0, totalLikes - 1);
    } else {
      // Agregar like
      await env.ACA_KV.put(userLikeKey, 'true', { expirationTtl: 86400 * 30 }); // 30 días
      totalLikes += 1;
    }

    // Actualizar total
    await env.ACA_KV.put(likesKey, totalLikes.toString(), { expirationTtl: 86400 * 30 });

    return { 
      success: true, 
      data: { 
        liked: !isLiked, 
        totalLikes 
      } 
    };

  } catch (error) {
    console.error('Error en toggleArticleLike:', error);
    return { success: false, error: 'Error procesando like' };
  }
}

/**
 * Obtener estado de likes de un artículo
 */
export async function getArticleLikes(
  env: Env,
  articleId: number,
  userIdentifier?: string
): Promise<{ success: boolean; data?: { totalLikes: number; userLiked: boolean }; error?: string }> {
  try {
    const likesKey = `article:${articleId}:likes`;
    const currentLikes = await env.ACA_KV.get(likesKey);
    const totalLikes = currentLikes ? parseInt(currentLikes) : 0;

    let userLiked = false;
    if (userIdentifier) {
      const userLikeKey = `article:${articleId}:like:${userIdentifier}`;
      const existingLike = await env.ACA_KV.get(userLikeKey);
      userLiked = existingLike === 'true';
    }

    return { 
      success: true, 
      data: { 
        totalLikes, 
        userLiked 
      } 
    };

  } catch (error) {
    console.error('Error en getArticleLikes:', error);
    return { success: false, error: 'Error obteniendo likes' };
  }
}