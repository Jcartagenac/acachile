import { jsonResponse, errorResponse } from '../_middleware';
import type { Env } from '../../types';
import { parsePageParam, getSectionsForPage } from '../_utils/content';

export const onRequestGet = async ({ request, env }: { request: Request; env: Env }) => {
  try {
    const page = parsePageParam(new URL(request.url).searchParams.get('page'));
    const sections = await getSectionsForPage(env, page);

    return jsonResponse({ success: true, sections });
  } catch (error) {
    console.error('[CONTENT] Error obteniendo secciones públicas:', error);
    return errorResponse('Error obteniendo contenido público', 500);
  }
};
