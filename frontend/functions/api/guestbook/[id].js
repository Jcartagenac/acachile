// API Endpoint: /api/guestbook/[id]
// GET - Get single entry
// PUT - Update entry (admin only)
// DELETE - Soft delete (move to trash, admin only)

// Helper: Verificar autenticación
async function requireAuth(request) {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Token no proporcionado');
  }

  const token = authHeader.substring(7);
  
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Token malformado');
    }
    
    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch (e) {
    throw new Error('Token inválido: ' + e.message);
  }
}

// Helper: Verificar si es admin
function isAdmin(user) {
  return user.role === 'admin' || 
         user.role === 'super_admin' ||
         (Array.isArray(user.roles) && user.roles.includes('admin'));
}

export async function onRequestGet(context) {
  const { request, env, params } = context;
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': env.CORS_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'ID inválido'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    const entry = await env.DB.prepare(
      'SELECT * FROM guestbook WHERE id = ?'
    ).bind(id).first();

    if (!entry) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Entrada no encontrada'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      data: entry
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    console.error('Error in GET:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error interno del servidor'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

export async function onRequestPut(context) {
  const { request, env, params } = context;
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': env.CORS_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  try {
    // Verificar autenticación
    let authUser;
    try {
      authUser = await requireAuth(request);
    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Autenticación requerida: ' + error.message
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Verificar que sea admin
    if (!isAdmin(authUser)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Permisos insuficientes. Se requiere rol de administrador.'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'ID inválido'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    const body = await request.json();

    // Verificar que la entrada existe
    const existing = await env.DB.prepare(
      'SELECT * FROM guestbook WHERE id = ?'
    ).bind(id).first();

    if (!existing) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Entrada no encontrada'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Actualizar solo los campos proporcionados
    const updateQuery = `
      UPDATE guestbook 
      SET name = ?, email = ?, social_network = ?, social_handle = ?,
          title = ?, message = ?, image_url = ?, status = ?,
          updated_at = ?
      WHERE id = ?
    `;

    await env.DB.prepare(updateQuery)
      .bind(
        body.name || existing.name,
        body.email || existing.email,
        body.social_network || existing.social_network,
        body.social_handle || existing.social_handle,
        body.title || existing.title,
        body.message || existing.message,
        body.image_url !== undefined ? body.image_url : existing.image_url,
        body.status || existing.status,
        new Date().toISOString(),
        id
      )
      .run();

    // Obtener la entrada actualizada
    const updated = await env.DB.prepare(
      'SELECT * FROM guestbook WHERE id = ?'
    ).bind(id).first();

    return new Response(JSON.stringify({
      success: true,
      data: updated,
      message: 'Entrada actualizada correctamente'
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    console.error('Error in PUT:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error al actualizar'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

export async function onRequestDelete(context) {
  const { request, env, params } = context;
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': env.CORS_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  try {
    // Verificar autenticación
    let authUser;
    try {
      authUser = await requireAuth(request);
    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Autenticación requerida: ' + error.message
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Verificar que sea admin
    if (!isAdmin(authUser)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Permisos insuficientes. Se requiere rol de administrador.'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'ID inválido'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Verificar que existe
    const existing = await env.DB.prepare(
      'SELECT * FROM guestbook WHERE id = ?'
    ).bind(id).first();

    if (!existing) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Entrada no encontrada'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // SOFT DELETE: Marcar como eliminada
    await env.DB.prepare(
      'UPDATE guestbook SET deleted_at = ?, status = ? WHERE id = ?'
    ).bind(new Date().toISOString(), 'archived', id).run();

    return new Response(JSON.stringify({
      success: true,
      message: 'Entrada movida a la papelera. Se eliminará permanentemente en 30 días.'
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    console.error('Error in DELETE:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error al eliminar'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

export async function onRequestOptions(context) {
  const { env } = context;
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': env.CORS_ORIGIN || '*',
      'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
}
