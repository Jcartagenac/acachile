import { requireAuth } from '../../_middleware';

// Endpoint para obtener noticia individual por slug
// GET /api/noticias/[slug]

export async function onRequestGet(context) {
  const { request, env, params } = context;

  try {
    console.log('[NOTICIAS/SLUG] Processing request for slug:', params.slug);

    if (!params.slug) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Slug requerido'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Obtener todas las noticias del KV
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
    
    // Buscar la noticia por slug o ID
    const slugOrId = params.slug;
    const noticia = noticias.find(n => {
      // Si el parámetro es numérico, buscar por ID
      if (!isNaN(slugOrId)) {
        return n.id === parseInt(slugOrId);
      }
      // Si no, buscar por slug
      return n.slug === slugOrId;
    });
    
    if (!noticia) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Noticia no encontrada'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Incrementar contador de vistas
    noticia.views = (noticia.views || 0) + 1;
    
    // Guardar las noticias actualizadas
    const updatedNoticias = noticias.map(n => 
      n.id === noticia.id ? noticia : n
    );
    await env.ACA_KV.put('noticias:all', JSON.stringify(updatedNoticias));

    // También actualizar la noticia individual en KV
    await env.ACA_KV.put(`noticia:${noticia.id}`, JSON.stringify(noticia));

    console.log(`[NOTICIAS/SLUG] Noticia encontrada: ${noticia.title}, views: ${noticia.views}`);

    return new Response(JSON.stringify({
      success: true,
      data: noticia
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[NOTICIAS/SLUG] Error:', error);
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

// PUT /api/noticias/[slug] - Actualizar noticia
export async function onRequestPut(context) {
  const { request, env, params } = context;

  try {
    console.log('[NOTICIAS/SLUG] PUT request for slug:', params.slug);

    // Verificar autenticación usando JWT
    let authUser;
    try {
      authUser = await requireAuth(request, env);
      console.log('[NOTICIAS/SLUG] Auth user:', JSON.stringify({
        id: authUser.id,
        email: authUser.email,
        role: authUser.role,
        roles: authUser.roles
      }));
    } catch (error) {
      console.log('[NOTICIAS/SLUG] Auth error:', error.message);
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
    
    console.log('[NOTICIAS/SLUG] Is admin:', isAdmin);
    
    if (!isAdmin) {
      console.log('[NOTICIAS/SLUG] User is not admin, role:', authUser.role, 'roles:', authUser.roles);
      return new Response(JSON.stringify({
        success: false,
        error: 'No tienes permisos para actualizar noticias. Se requiere rol de administrador.'
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

    // Obtener los datos de la noticia actualizada
    const body = await request.json();
    console.log('[NOTICIAS/SLUG] Update data:', JSON.stringify(body, null, 2));

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
    
    // Buscar la noticia a actualizar
    const slugOrId = params.slug;
    console.log('[NOTICIAS/SLUG] Searching for:', slugOrId);
    
    const noticiaIndex = noticias.findIndex(n => {
      if (!isNaN(slugOrId)) {
        return n.id === parseInt(slugOrId);
      }
      return n.slug === slugOrId;
    });
    
    console.log('[NOTICIAS/SLUG] Found at index:', noticiaIndex);
    
    if (noticiaIndex === -1) {
      console.log('[NOTICIAS/SLUG] Noticia not found');
      return new Response(JSON.stringify({
        success: false,
        error: 'Noticia no encontrada'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const noticiaActual = noticias[noticiaIndex];
    
    // Actualizar los campos de la noticia
    const noticiaActualizada = {
      ...noticiaActual,
      title: body.title || noticiaActual.title,
      slug: body.slug || noticiaActual.slug,
      excerpt: body.excerpt || noticiaActual.excerpt,
      content: body.content || noticiaActual.content,
      featured_image: body.featured_image !== undefined ? body.featured_image : noticiaActual.featured_image,
      category: body.category || noticiaActual.category,
      tags: body.tags || noticiaActual.tags,
      status: body.status || noticiaActual.status,
      is_featured: body.is_featured !== undefined ? body.is_featured : noticiaActual.is_featured,
      commentsEnabled: body.commentsEnabled !== undefined ? body.commentsEnabled : noticiaActual.commentsEnabled,
      updated_at: new Date().toISOString()
    };
    
    // Reemplazar la noticia en el array
    noticias[noticiaIndex] = noticiaActualizada;
    
    // Guardar el array actualizado
    await env.ACA_KV.put('noticias:all', JSON.stringify(noticias));
    
    // Actualizar también la entrada individual
    await env.ACA_KV.put(`noticia:${noticiaActualizada.id}`, JSON.stringify(noticiaActualizada));

    console.log(`[NOTICIAS/SLUG] Noticia actualizada: ${noticiaActualizada.title}`);

    return new Response(JSON.stringify({
      success: true,
      data: noticiaActualizada,
      message: 'Noticia actualizada correctamente'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[NOTICIAS/SLUG] Error al actualizar:', error);
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

// DELETE /api/noticias/[slug] - Eliminar noticia
export async function onRequestDelete(context) {
  const { request, env, params } = context;

  try {
    console.log('[NOTICIAS/SLUG] DELETE request for slug:', params.slug);

    // Verificar autenticación usando JWT
    let authUser;
    try {
      authUser = await requireAuth(request, env);
      console.log('[NOTICIAS/SLUG] Auth user:', JSON.stringify({
        id: authUser.id,
        email: authUser.email,
        role: authUser.role,
        roles: authUser.roles
      }));
    } catch (error) {
      console.log('[NOTICIAS/SLUG] Auth error:', error.message);
      return new Response(JSON.stringify({
        success: false,
        error: 'No autorizado - ' + error.message
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Verificar que el usuario sea admin (verificar tanto role como roles array)
    const isAdmin = authUser.role === 'admin' || 
                    (Array.isArray(authUser.roles) && authUser.roles.includes('admin'));
    
    console.log('[NOTICIAS/SLUG] Is admin:', isAdmin);
    
    if (!isAdmin) {
      console.log('[NOTICIAS/SLUG] User is not admin, role:', authUser.role, 'roles:', authUser.roles);
      return new Response(JSON.stringify({
        success: false,
        error: 'No tienes permisos para eliminar noticias. Se requiere rol de administrador.'
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
    
    // Buscar la noticia a eliminar - puede ser por slug o por ID
    const slugOrId = params.slug;
    console.log('[NOTICIAS/SLUG] Searching for:', slugOrId);
    
    const noticiaIndex = noticias.findIndex(n => {
      // Si el parámetro es numérico, buscar por ID
      if (!isNaN(slugOrId)) {
        return n.id === parseInt(slugOrId);
      }
      // Si no, buscar por slug
      return n.slug === slugOrId;
    });
    
    console.log('[NOTICIAS/SLUG] Found at index:', noticiaIndex);
    
    if (noticiaIndex === -1) {
      console.log('[NOTICIAS/SLUG] Noticia not found, available IDs:', noticias.map(n => n.id));
      return new Response(JSON.stringify({
        success: false,
        error: 'Noticia no encontrada'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const noticia = noticias[noticiaIndex];
    console.log('[NOTICIAS/SLUG] Found noticia:', noticia.title, 'ID:', noticia.id);
    
    // Eliminar la noticia del array
    noticias.splice(noticiaIndex, 1);
    
    // Guardar el array actualizado
    await env.ACA_KV.put('noticias:all', JSON.stringify(noticias));
    
    // Eliminar también la entrada individual
    await env.ACA_KV.delete(`noticia:${noticia.id}`);

    console.log(`[NOTICIAS/SLUG] Noticia eliminada: ${noticia.title}`);

    return new Response(JSON.stringify({
      success: true,
      message: 'Noticia eliminada correctamente'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[NOTICIAS/SLUG] Error al eliminar:', error);
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