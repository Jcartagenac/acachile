import { requireAdmin, authErrorResponse, errorResponse, jsonResponse } from '../../_middleware';
import type { Env } from '../../../../types';
import { deleteCompetitionTeam, getCompetitionTeam, saveCompetitionTeam } from '../../../_utils/portalCompetencias';

export async function onRequestGet(context: { request: Request; env: Env; params: { id?: string } }) {
  const { request, env, params } = context;
  try {
    try {
      await requireAdmin(request, env);
    } catch (error) {
      return authErrorResponse(error, env);
    }
    const id = Number(params.id);
    if (!Number.isFinite(id) || id <= 0) return errorResponse('ID inválido', 400);
    const team = await getCompetitionTeam(env, id);
    if (!team) return errorResponse('Equipo no encontrado', 404);
    return jsonResponse({ success: true, team });
  } catch (error) {
    console.error('[ADMIN/PORTAL-COMPETENCIAS/TEAM/:id] GET Error:', error);
    return errorResponse('Internal server error', 500);
  }
}

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
    const team = await saveCompetitionTeam(env, {
      id,
      name: body.name || '',
      main_image_url: body.main_image_url || null,
      main_image_key: body.main_image_key || null,
      achievements: body.achievements || null,
      is_active: body.is_active !== false,
      is_visible: body.is_visible !== false,
      sort_order: body.sort_order || 0,
      members: Array.isArray(body.members) ? body.members : [],
      gallery: Array.isArray(body.gallery) ? body.gallery : [],
    });
    return jsonResponse({ success: true, team });
  } catch (error) {
    console.error('[ADMIN/PORTAL-COMPETENCIAS/TEAM/:id] PUT Error:', error);
    return errorResponse(error instanceof Error ? error.message : 'Internal server error', 400);
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
    const team = await deleteCompetitionTeam(env, id);
    if (!team) return errorResponse('Equipo no encontrado', 404);
    return jsonResponse({ success: true, team });
  } catch (error) {
    console.error('[ADMIN/PORTAL-COMPETENCIAS/TEAM/:id] DELETE Error:', error);
    return errorResponse('Internal server error', 500);
  }
}
