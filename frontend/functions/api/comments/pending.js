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

    // Obtener todas las noticias para mapear IDs a títulos
    const noticiasData = await env.ACA_KV.get('noticias:all');
    const noticias = noticiasData ? JSON.parse(noticiasData) : [];
    const noticiasMap = {};
    noticias.forEach(n => {
      noticiasMap[n.slug] = n.title;
      noticiasMap[n.id.toString()] = n.title;
    });

    // Obtener todos los comentarios pendientes
    const allPendingComments = [];

    // Iterar sobre cada noticia para obtener sus comentarios
    for (const noticia of noticias) {
      const commentsKey = `comments:noticia:${noticia.slug}`;
      const commentsData = await env.ACA_KV.get(commentsKey);
      
      if (commentsData) {
        const comments = JSON.parse(commentsData);
        const pendingComments = comments.filter(c => c.status === 'pending');
        
        // Agregar título del artículo a cada comentario
        pendingComments.forEach(comment => {
          allPendingComments.push({
            ...comment,
            article_title: noticia.title,
            article_slug: noticia.slug
          });
        });
      }
    }

    // Ordenar por fecha (más recientes primero)
    allPendingComments.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    console.log(`[PENDING-COMMENTS] Found ${allPendingComments.length} pending comments`);

    return new Response(JSON.stringify({
      success: true,
      data: allPendingComments
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
