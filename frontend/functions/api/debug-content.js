// Endpoint temporal de debug para ver qué hay en la BD
export async function onRequestGet(context) {
  const { env } = context;
  const page = new URL(context.request.url).searchParams.get('page') || 'home';

  try {
    // Query directo a la BD
    const dbResults = await env.DB
      .prepare('SELECT * FROM site_sections WHERE page = ? ORDER BY sort_order ASC')
      .bind(page)
      .all();

    // Query al KV cache
    const cacheKey = `site:sections:${page}`;
    const kvData = await env.ACA_KV.get(cacheKey);

    return new Response(JSON.stringify({
      page,
      database: {
        count: dbResults.results?.length || 0,
        data: dbResults.results || []
      },
      cache: {
        exists: !!kvData,
        data: kvData ? JSON.parse(kvData) : null
      }
    }, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: error.message,
      stack: error.stack
    }, null, 2), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}
