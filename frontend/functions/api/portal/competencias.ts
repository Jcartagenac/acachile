import { jsonResponse, errorResponse } from '../_middleware';
import type { Env } from '../../types';
import { getCompetitionTeams } from '../_utils/portalCompetencias';

export const onRequestGet = async ({ env }: { env: Env }) => {
  try {
    const teams = await getCompetitionTeams(env, { publicOnly: true });
    return jsonResponse({ success: true, teams });
  } catch (error) {
    console.error('[PORTAL/COMPETENCIAS] Error:', error);
    return errorResponse('Error obteniendo equipos de competencias', 500);
  }
};
