// API Endpoint: /api/guestbook/[id]/restore
// PATCH - Restore from trash (admin only)

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

export async function onRequestPatch(context) {
  const { request, env, params } = context;
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': env.CORS_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'PATCH, OPTIONS',
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

    // Verificar que existe y está en papelera
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

    if (!existing.deleted_at) {
      return new Response(JSON.stringify({
        success: false,
        error: 'La entrada no está en la papelera'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Restaurar: quitar deleted_at y volver a published
    await env.DB.prepare(
      'UPDATE guestbook SET deleted_at = NULL, status = ?, updated_at = ? WHERE id = ?'
    ).bind('published', new Date().toISOString(), id).run();

    const restored = await env.DB.prepare(
      'SELECT * FROM guestbook WHERE id = ?'
    ).bind(id).first();

    return new Response(JSON.stringify({
      success: true,
      data: restored,
      message: 'Entrada restaurada correctamente'
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    console.error('Error in restore:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error al restaurar'
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
      'Access-Control-Allow-Methods': 'PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
}
