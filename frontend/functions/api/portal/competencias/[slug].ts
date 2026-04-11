import { jsonResponse, errorResponse } from '../../_middleware';
import type { Env } from '../../../types';
import { getCompetitionTeam } from '../../_utils/portalCompetencias';

export const onRequestGet = async ({ env, params }: { env: Env; params: { slug?: string } }) => {
  try {
    const slug = params.slug;
    if (!slug) return errorResponse('Slug requerido', 400);
    const team = await getCompetitionTeam(env, slug, { publicOnly: true });
    if (!team) return errorResponse('Equipo no encontrado', 404);
    return jsonResponse({ success: true, team });
  } catch (error) {
    console.error('[PORTAL/COMPETENCIAS/:slug] Error:', error);
    return errorResponse('Error obteniendo equipo', 500);
  }
};
