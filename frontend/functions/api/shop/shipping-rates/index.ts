// API endpoint for shipping rates
// GET /api/shop/shipping-rates - Get all shipping rates

import type { PagesFunction, Env } from '../../../types';

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { DB } = context.env;

    const { results } = await DB.prepare(`
      SELECT 
        region_code,
        region_name,
        rate,
        estimated_days
      FROM shop_shipping_rates
      ORDER BY region_name
    `).all();

    return Response.json(results);
  } catch (error) {
    console.error('Error fetching shipping rates:', error);
    return Response.json(
      { error: 'Failed to fetch shipping rates' },
      { status: 500 }
    );
  }
};
