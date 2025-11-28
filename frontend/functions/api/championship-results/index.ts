import type { PagesFunction, Env } from '../../types';
import { jsonResponse } from '../../_middleware';

interface TeamResult {
  position: number;
  team: string;
  country: string | null;
  overall: number;
  chicken: number;
  beef: number;
  porkWithBone: number;
  porkWithoutBone: number;
  fish: number;
  rabbit: number;
  vegetarian: number;
}

/**
 * GET /api/championship-results - Get complete championship results
 * Query params:
 *   - championshipId: ID of championship (default: 1 for 2025)
 *   - year: Year of championship (alternative to championshipId)
 */
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { searchParams } = new URL(context.request.url);
    const championshipIdParam = searchParams.get('championshipId');
    const yearParam = searchParams.get('year');

    // Get championship ID
    let championshipId = championshipIdParam ? parseInt(championshipIdParam) : null;

    // If year is provided instead, get championship by year
    if (!championshipId && yearParam) {
      const champResult = await context.env.DB.prepare(
        'SELECT id FROM championships WHERE year = ? AND status = ? LIMIT 1'
      )
        .bind(parseInt(yearParam), 'active')
        .first<{ id: number }>();

      if (!champResult) {
        return jsonResponse({
          success: false,
          error: `No championship found for year ${yearParam}`
        }, 404);
      }

      championshipId = champResult.id;
    }

    // Default to championship ID 1 (2025)
    if (!championshipId) {
      championshipId = 1;
    }

    // Get categories with their IDs and keys
    const categoriesResult = await context.env.DB.prepare(`
      SELECT id, key, name, sort_order
      FROM championship_categories
      WHERE championship_id = ?
      ORDER BY sort_order ASC
    `)
      .bind(championshipId)
      .all<{ id: number; key: string; name: string; sort_order: number }>();

    const categories = categoriesResult.results || [];

    // Create a map of category_id -> key
    const categoryMap = new Map<number, string>();
    categories.forEach((cat: { id: number; key: string }) => {
      categoryMap.set(cat.id, cat.key);
    });

    // Get teams with all their results
    const teamsResult = await context.env.DB.prepare(`
      SELECT 
        t.id,
        t.name,
        t.country
      FROM championship_teams t
      WHERE t.championship_id = ?
      ORDER BY t.id ASC
    `)
      .bind(championshipId)
      .all<{ id: number; name: string; country: string | null }>();

    const teams = teamsResult.results || [];

    // Get all results for this championship
    const resultsResult = await context.env.DB.prepare(`
      SELECT 
        r.team_id,
        r.category_id,
        r.score
      FROM championship_results r
      WHERE r.championship_id = ?
    `)
      .bind(championshipId)
      .all<{ team_id: number; category_id: number; score: number }>();

    const results = resultsResult.results || [];

    // Build the results structure
    const teamResults: Map<number, any> = new Map();

    // Initialize all teams with their basic info
    teams.forEach((team: { id: number; name: string; country: string | null }) => {
      teamResults.set(team.id, {
        team: team.name,
        country: team.country,
        overall: 0,
        chicken: 0,
        beef: 0,
        porkWithBone: 0,
        porkWithoutBone: 0,
        fish: 0,
        rabbit: 0,
        vegetarian: 0
      });
    });

    // Fill in the scores
    results.forEach((result: { team_id: number; category_id: number; score: number }) => {
      const teamData = teamResults.get(result.team_id);
      if (teamData) {
        const categoryKey = categoryMap.get(result.category_id);
        if (categoryKey) {
          teamData[categoryKey] = result.score;
        }
      }
    });

    // Convert to array and sort by overall score (descending)
    const sortedResults: TeamResult[] = Array.from(teamResults.values())
      .sort((a, b) => b.overall - a.overall)
      .map((result, index) => ({
        position: index + 1,
        ...result
      }));

    return jsonResponse({
      success: true,
      data: sortedResults,
      meta: {
        championshipId,
        totalTeams: sortedResults.length,
        categories: categories.map((c: { key: string; name: string }) => ({
          key: c.key,
          name: c.name
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching championship results:', error);
    return jsonResponse({
      success: false,
      error: 'Failed to fetch championship results',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
};
