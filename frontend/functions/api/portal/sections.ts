import { jsonResponse, errorResponse } from '../_middleware';
import type { Env } from '../../types';
import { getPortalSections } from '../_utils/portal';

export const onRequestGet = async ({ env }: { env: Env }) => {
  try {
    const sections = await getPortalSections(env);
    return jsonResponse({ success: true, sections });
  } catch (error) {
    console.error('[PORTAL] Error obteniendo secciones:', error);
    return errorResponse('Error obteniendo Portal del Socio', 500);
  }
};
