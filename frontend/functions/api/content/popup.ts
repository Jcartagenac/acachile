import { jsonResponse, errorResponse } from '../_middleware';
import type { Env } from '../../types';
import { getPopupConfig } from '../_utils/popup';

export const onRequestGet = async ({ env }: { env: Env }) => {
  try {
    const popup = await getPopupConfig(env, { activeOnly: true });
    return jsonResponse({ success: true, popup });
  } catch (error) {
    console.error('[CONTENT/POPUP] Error obteniendo popup activo:', error);
    return errorResponse('Error obteniendo popup', 500);
  }
};
