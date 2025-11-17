import { requireAuth } from '../../../_middleware';

// PATCH /api/noticias/[slug]/restore - Restaurar noticia desde papelera

export async function onRequestPatch(context) {
  const { request, env, params } = context;

  try {
    console.log('[NOTICIAS/RESTORE] PATCH request for slug:', params.slug);

    // Verificar autenticación usando JWT
    let authUser;
    try {
      authUser = await requireAuth(request, env);
      console.log('[NOTICIAS/RESTORE] Auth user:', JSON.stringify({
        id: authUser.id,
        email: authUser.email,
        role: authUser.role,
        roles: authUser.roles
      }));
    } catch (error) {
      console.log('[NOTICIAS/RESTORE] Auth error:', error.message);
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
    
    console.log('[NOTICIAS/RESTORE] Is admin:', isAdmin);
    
    if (!isAdmin) {
      console.log('[NOTICIAS/RESTORE] User is not admin, role:', authUser.role, 'roles:', authUser.roles);
      return new Response(JSON.stringify({
        success: false,
        error: 'No tienes permisos para restaurar noticias. Se requiere rol de administrador.'
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
    
    // Buscar la noticia a restaurar
    const slugOrId = params.slug;
    console.log('[NOTICIAS/RESTORE] Searching for:', slugOrId);
    
    const noticiaIndex = noticias.findIndex(n => {
      if (!isNaN(slugOrId)) {
        return n.id === parseInt(slugOrId);
      }
      return n.slug === slugOrId;
    });
    
    console.log('[NOTICIAS/RESTORE] Found at index:', noticiaIndex);
    
    if (noticiaIndex === -1) {
      console.log('[NOTICIAS/RESTORE] Noticia not found');
      return new Response(JSON.stringify({
        success: false,
        error: 'Noticia no encontrada'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const noticia = noticias[noticiaIndex];
    
    // Verificar que esté en la papelera
    if (!noticia.deleted_at) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Esta noticia no está en la papelera'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('[NOTICIAS/RESTORE] Restoring noticia:', noticia.title, 'ID:', noticia.id);
    
    // Restaurar: quitar deleted_at y volver a estado original
    delete noticia.deleted_at;
    noticia.status = 'published'; // Restaurar como publicada
    noticia.updated_at = new Date().toISOString();
    
    // Actualizar la noticia en el array
    noticias[noticiaIndex] = noticia;
    
    // Guardar el array actualizado
    await env.ACA_KV.put('noticias:all', JSON.stringify(noticias));
    
    // Actualizar también la entrada individual
    await env.ACA_KV.put(`noticia:${noticia.id}`, JSON.stringify(noticia));

    console.log(`[NOTICIAS/RESTORE] Noticia restaurada: ${noticia.title}`);

    return new Response(JSON.stringify({
      success: true,
      message: 'Noticia restaurada correctamente',
      data: noticia
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[NOTICIAS/RESTORE] Error al restaurar:', error);
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
