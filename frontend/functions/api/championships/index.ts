import type { PagesFunction, Env } from '../../types';
import { jsonResponse } from '../../_middleware';

interface Championship {
  id: number;
  name: string;
  year: number;
  location: string;
  description: string;
  status: string;
}

// GET /api/championships - List all championships
// GET /api/championships?year=2025 - Get specific year
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { searchParams } = new URL(context.request.url);
    const year = searchParams.get('year');

    let query = 'SELECT * FROM championships WHERE status = ?';
    const params: any[] = ['active'];

    if (year) {
      query += ' AND year = ?';
      params.push(parseInt(year));
    }

    query += ' ORDER BY year DESC';

    const result = await context.env.DB.prepare(query)
      .bind(...params)
      .all<Championship>();

    return jsonResponse({
      success: true,
      data: result.results
    });
  } catch (error) {
    console.error('Error fetching championships:', error);
    return jsonResponse({
      success: false,
      error: 'Failed to fetch championships'
    }, 500);
  }
};
