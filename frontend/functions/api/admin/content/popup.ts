import { requireAdmin, authErrorResponse, errorResponse, jsonResponse } from '../_middleware';
import type { Env } from '../../../types';
import { getPopupConfig, savePopupConfig } from '../../_utils/popup';

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;

  try {
    try {
      await requireAdmin(request, env);
    } catch (error) {
      return authErrorResponse(error, env);
    }

    const popup = await getPopupConfig(env, { activeOnly: false });
    return jsonResponse({ success: true, popup });
  } catch (error) {
    console.error('[ADMIN/POPUP] GET Error:', error);
    return errorResponse('Internal server error', 500);
  }
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;

  try {
    try {
      await requireAdmin(request, env);
    } catch (error) {
      return authErrorResponse(error, env);
    }

    const body = await request.json().catch(() => ({}));
    const imageUrl = typeof body?.image_url === 'string' ? body.image_url.trim() : '';
    const linkUrl = typeof body?.link_url === 'string' ? body.link_url.trim() : '';
    const openInNewTab = Boolean(body?.open_in_new_tab);
    const isActive = Boolean(body?.is_active);

    if (!imageUrl && isActive) {
      return errorResponse('Debes subir una imagen antes de activar el popup', 400);
    }

    const popup = await savePopupConfig(env, {
      image_url: imageUrl,
      link_url: linkUrl || null,
      open_in_new_tab: linkUrl ? openInNewTab : false,
      is_active: isActive,
    });

    return jsonResponse({ success: true, popup });
  } catch (error) {
    console.error('[ADMIN/POPUP] POST Error:', error);
    return errorResponse(
      'Internal server error',
      500,
      env.ENVIRONMENT === 'development'
        ? { message: error instanceof Error ? error.message : String(error) }
        : undefined,
    );
  }
}
