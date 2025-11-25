// Endpoint para obtener comentarios pendientes de moderación
// GET /api/comments/pending

import { requireAuth } from '../../_middleware';

export async function onRequestGet(context) {
  const { request, env } = context;

  try {
    // Verificar autenticación de admin
    let authUser;
    try {
      authUser = await requireAuth(request, env);
    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No autorizado'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verificar que el usuario sea admin
    const isAdmin = authUser.role === 'admin' || 
                    (Array.isArray(authUser.roles) && authUser.roles.includes('admin'));
    
    if (!isAdmin) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Se requiere rol de administrador'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Obtener comentarios pendientes desde D1 con JOIN a news_articles
    const query = `
      SELECT 
        c.id, c.article_id, c.author_name, c.author_email, c.content, 
        c.status, c.parent_id, c.created_at,
        n.title as article_title, n.slug as article_slug
      FROM news_comments c
      LEFT JOIN news_articles n ON c.article_id = n.id
      WHERE c.status = 'pending'
      ORDER BY c.created_at DESC
    `;

    const { results } = await env.DB.prepare(query).all();
    
    console.log(`[PENDING-COMMENTS] Found ${results.length} pending comments from D1`);

    return new Response(JSON.stringify({
      success: true,
      data: results
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[PENDING-COMMENTS] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error interno del servidor'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
