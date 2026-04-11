import { requireAdmin, authErrorResponse, errorResponse, jsonResponse } from '../_middleware';
import type { Env } from '../../../types';
import { deletePortalDocument, updatePortalDocument } from '../../_utils/portalDocuments';

export async function onRequestPut(context: { request: Request; env: Env; params: { id?: string } }) {
  const { request, env, params } = context;
  try {
    try {
      await requireAdmin(request, env);
    } catch (error) {
      return authErrorResponse(error, env);
    }

    const id = Number(params.id);
    if (!Number.isFinite(id) || id <= 0) return errorResponse('ID inválido', 400);

    const body = await request.json().catch(() => ({}));
    const visibleName = typeof body?.visible_name === 'string' ? body.visible_name.trim() : '';
    if (!visibleName) return errorResponse('Debes indicar un nombre visible', 400);

    const document = await updatePortalDocument(env, id, { visible_name: visibleName });
    if (!document) return errorResponse('Documento no encontrado', 404);

    return jsonResponse({ success: true, document });
  } catch (error) {
    console.error('[ADMIN/PORTAL-DOCUMENTS/:id] PUT Error:', error);
    return errorResponse('Internal server error', 500);
  }
}

export async function onRequestDelete(context: { request: Request; env: Env; params: { id?: string } }) {
  const { request, env, params } = context;
  try {
    try {
      await requireAdmin(request, env);
    } catch (error) {
      return authErrorResponse(error, env);
    }

    const id = Number(params.id);
    if (!Number.isFinite(id) || id <= 0) return errorResponse('ID inválido', 400);

    const document = await deletePortalDocument(env, id);
    if (!document) return errorResponse('Documento no encontrado', 404);

    return jsonResponse({ success: true, document });
  } catch (error) {
    console.error('[ADMIN/PORTAL-DOCUMENTS/:id] DELETE Error:', error);
    return errorResponse('Internal server error', 500);
  }
}
