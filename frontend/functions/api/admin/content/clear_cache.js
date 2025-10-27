import { requireAdmin, authErrorResponse, errorResponse, jsonResponse } from '../../../_middleware';
import { SECTION_CACHE_KEY } from '../../../../../shared/siteSections';

const DEFAULT_PAGE = 'home';

function parsePage(url) {
  const page = new URL(url).searchParams.get('page');
  if (page === 'about' || page === 'contact') return page;
  return DEFAULT_PAGE;
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    try {
      await requireAdmin(request, env);
    } catch (err) {
      return authErrorResponse(err, env);
    }

    if (env.ACA_KV) {
      const page = parsePage(request.url);
      await env.ACA_KV.delete(`${SECTION_CACHE_KEY}:${page}`);
      return jsonResponse({ success: true, message: 'KV cache cleared' });
    } else {
      return errorResponse('KV not configured', 500);
    }
  } catch (error) {
    console.error('[CONTENT CLEAR] Error:', error);
    return errorResponse('Internal server error', 500, env.ENVIRONMENT === 'development' ? { details: error instanceof Error ? error.message : error } : undefined);
  }
}
