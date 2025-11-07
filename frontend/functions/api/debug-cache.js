/**
 * Endpoint temporal para verificar y limpiar el cache KV
 */

export async function onRequestGet(context) {
  const { env } = context;
  const url = new URL(context.request.url);
  const action = url.searchParams.get('action');
  const page = url.searchParams.get('page') || 'home';
  
  const cacheKey = `site_sections:${page}`;

  if (action === 'clear') {
    // Limpiar el cache
    if (env.ACA_KV) {
      await env.ACA_KV.delete(cacheKey);
      return new Response(JSON.stringify({ 
        success: true, 
        message: `Cache cleared for page: ${page}`,
        cacheKey 
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'KV not available' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Ver qué hay en el cache
  if (env.ACA_KV) {
    const cached = await env.ACA_KV.get(cacheKey);
    
    return new Response(JSON.stringify({ 
      success: true,
      page,
      cacheKey,
      hasCachedData: !!cached,
      cachedData: cached ? JSON.parse(cached) : null
    }, null, 2), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response(JSON.stringify({ 
    success: false, 
    error: 'KV not available' 
  }), {
    status: 500,
    headers: { 'Content-Type': 'application/json' }
  });
}
