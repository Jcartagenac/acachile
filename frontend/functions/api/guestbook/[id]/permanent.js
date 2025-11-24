// API Endpoint: /api/guestbook/[id]/permanent
// DELETE - Permanently delete (hard delete, admin only)

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

function isAdmin(user) {
  return user.role === 'admin' || 
         user.role === 'super_admin' ||
         (Array.isArray(user.roles) && user.roles.includes('admin'));
}

export async function onRequestDelete(context) {
  const { request, env, params } = context;
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': env.CORS_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
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

    if (!isAdmin(authUser)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Permisos insuficientes'
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

    // HARD DELETE: Eliminar permanentemente
    await env.DB.prepare(
      'DELETE FROM guestbook WHERE id = ?'
    ).bind(id).run();

    return new Response(JSON.stringify({
      success: true,
      message: 'Entrada eliminada permanentemente'
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    console.error('Error in permanent delete:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error al eliminar permanentemente'
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
      'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
}
