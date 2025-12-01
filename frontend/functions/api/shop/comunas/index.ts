/**
 * GET /api/shop/comunas
 * Get comunas filtered by region
 */

interface Env {
  DB: any;
}

export const onRequestGet = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const regionCode = url.searchParams.get('region');

  try {
    if (!regionCode) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Region code is required',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Get comunas for the specified region
    const result = await env.DB.prepare(
      `SELECT id, region_code, comuna_name 
       FROM shop_comunas 
       WHERE region_code = ?
       ORDER BY comuna_name ASC`
    )
      .bind(regionCode)
      .all();

    return new Response(
      JSON.stringify({
        success: true,
        data: result.results || [],
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error fetching comunas:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to fetch comunas',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
};
