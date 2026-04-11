import { jsonResponse, errorResponse } from '../_middleware';
import type { Env } from '../../types';
import { getPortalDocuments } from '../_utils/portalDocuments';

export const onRequestGet = async ({ env }: { env: Env }) => {
  try {
    const documents = await getPortalDocuments(env);
    return jsonResponse({ success: true, documents });
  } catch (error) {
    console.error('[PORTAL/DOCUMENTS] Error obteniendo documentos:', error);
    return errorResponse('Error obteniendo documentos del portal', 500);
  }
};
