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

interface ChampionshipResultsResponse {
  success: boolean;
  data: TeamResult[];
  meta: {
    championshipId: number;
    totalTeams: number;
    categories: Array<{
      key: string;
      name: string;
    }>;
  };
  error?: string;
}

/**
 * Get complete championship results
 * @param championshipId - Optional championship ID (defaults to current/latest)
 * @param year - Optional year to filter by
 */
export async function getChampionshipResults(
  championshipId?: number,
  year?: number
): Promise<TeamResult[]> {
  try {
    const params = new URLSearchParams();
    
    if (championshipId) {
      params.append('championshipId', championshipId.toString());
    } else if (year) {
      params.append('year', year.toString());
    }

    const url = `/api/championship-results${params.toString() ? `?${params.toString()}` : ''}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch results: ${response.statusText}`);
    }

    const data: ChampionshipResultsResponse = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch championship results');
    }

    return data.data;
  } catch (error) {
    console.error('Error fetching championship results:', error);
    throw error;
  }
}

export type { TeamResult, ChampionshipResultsResponse };
