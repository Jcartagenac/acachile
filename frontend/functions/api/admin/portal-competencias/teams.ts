import { requireAdmin, authErrorResponse, errorResponse, jsonResponse } from '../_middleware';
import type { Env } from '../../types';
import { getCompetitionTeams, saveCompetitionTeam } from '../_utils/portalCompetencias';

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;
  try {
    try {
      await requireAdmin(request, env);
    } catch (error) {
      return authErrorResponse(error, env);
    }
    const teams = await getCompetitionTeams(env);
    return jsonResponse({ success: true, teams });
  } catch (error) {
    console.error('[ADMIN/PORTAL-COMPETENCIAS/TEAMS] GET Error:', error);
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
    const team = await saveCompetitionTeam(env, {
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
    return jsonResponse({ success: true, team }, 201);
  } catch (error) {
    console.error('[ADMIN/PORTAL-COMPETENCIAS/TEAMS] POST Error:', error);
    return errorResponse(error instanceof Error ? error.message : 'Internal server error', 400);
  }
}
