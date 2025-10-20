import { requireAuth, errorResponse, jsonResponse } from '../../../_middleware';

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    let authUser;
    try {
      authUser = await requireAuth(request, env);
    } catch (err) {
      return errorResponse(err instanceof Error ? err.message : 'Token inválido', 401, env.ENVIRONMENT === 'development' ? { details: err } : undefined);
    }

    if (authUser.role !== 'admin' && authUser.role !== 'super_admin') {
      return errorResponse('Acceso denegado. Se requieren permisos de administrador.', 403);
    }

    if (env.ACA_KV) {
      // Delete cached site sections
      await env.ACA_KV.delete('site:sections');
      return jsonResponse({ success: true, message: 'KV cache cleared' });
    } else {
      return errorResponse('KV not configured', 500);
    }
  } catch (error) {
    console.error('[CONTENT CLEAR] Error:', error);
    return errorResponse('Internal server error', 500, env.ENVIRONMENT === 'development' ? { details: error instanceof Error ? error.message : error } : undefined);
  }
}
