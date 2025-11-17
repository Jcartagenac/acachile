import { requireAuth } from '../../../_middleware';

// DELETE /api/noticias/[slug]/permanent - Eliminar noticia permanentemente de la papelera

export async function onRequestDelete(context) {
  const { request, env, params } = context;

  try {
    console.log('[NOTICIAS/PERMANENT] DELETE request for slug:', params.slug);

    // Verificar autenticación usando JWT
    let authUser;
    try {
      authUser = await requireAuth(request, env);
      console.log('[NOTICIAS/PERMANENT] Auth user:', JSON.stringify({
        id: authUser.id,
        email: authUser.email,
        role: authUser.role,
        roles: authUser.roles
      }));
    } catch (error) {
      console.log('[NOTICIAS/PERMANENT] Auth error:', error.message);
      return new Response(JSON.stringify({
        success: false,
        error: 'No autorizado - ' + error.message
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Verificar que el usuario sea admin
    const isAdmin = authUser.role === 'admin' || 
                    (Array.isArray(authUser.roles) && authUser.roles.includes('admin'));
    
    console.log('[NOTICIAS/PERMANENT] Is admin:', isAdmin);
    
    if (!isAdmin) {
      console.log('[NOTICIAS/PERMANENT] User is not admin, role:', authUser.role, 'roles:', authUser.roles);
      return new Response(JSON.stringify({
        success: false,
        error: 'No tienes permisos para eliminar noticias permanentemente. Se requiere rol de administrador.'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!params.slug) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Slug requerido'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Obtener todas las noticias
    const noticiasData = await env.ACA_KV.get('noticias:all');
    if (!noticiasData) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No hay noticias disponibles'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const noticias = JSON.parse(noticiasData);
    
    // Buscar la noticia a eliminar permanentemente
    const slugOrId = params.slug;
    console.log('[NOTICIAS/PERMANENT] Searching for:', slugOrId);
    
    const noticiaIndex = noticias.findIndex(n => {
      if (!isNaN(slugOrId)) {
        return n.id === parseInt(slugOrId);
      }
      return n.slug === slugOrId;
    });
    
    console.log('[NOTICIAS/PERMANENT] Found at index:', noticiaIndex);
    
    if (noticiaIndex === -1) {
      console.log('[NOTICIAS/PERMANENT] Noticia not found');
      return new Response(JSON.stringify({
        success: false,
        error: 'Noticia no encontrada'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const noticia = noticias[noticiaIndex];
    
    // Verificar que esté en la papelera (tiene deleted_at)
    if (!noticia.deleted_at) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Esta noticia no está en la papelera. Debes moverla a la papelera primero.'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('[NOTICIAS/PERMANENT] Permanently deleting noticia:', noticia.title, 'ID:', noticia.id);
    
    // HARD DELETE: Eliminar permanentemente del array
    noticias.splice(noticiaIndex, 1);
    
    // Guardar el array actualizado
    await env.ACA_KV.put('noticias:all', JSON.stringify(noticias));
    
    // Eliminar también la entrada individual
    await env.ACA_KV.delete(`noticia:${noticia.id}`);

    console.log(`[NOTICIAS/PERMANENT] Noticia eliminada permanentemente: ${noticia.title}`);

    return new Response(JSON.stringify({
      success: true,
      message: 'Noticia eliminada permanentemente'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[NOTICIAS/PERMANENT] Error al eliminar permanentemente:', error);
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
