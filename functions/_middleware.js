// Middleware de CORS para todas las rutas
export async function onRequest(context) {
  const { request, next, env } = context;
  const url = new URL(request.url);
  
  console.log(`[MIDDLEWARE] ${request.method} ${url.pathname}`);
  
  // Manejar preflight OPTIONS requests
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': env.CORS_ORIGIN || '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400'
      }
    });
  }
  
  try {
    const response = await next();
    
    // Agregar headers CORS a todas las respuestas
    response.headers.set('Access-Control-Allow-Origin', env.CORS_ORIGIN || '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    
    return response;
  } catch (error) {
    console.error('[MIDDLEWARE] Error:', error);
    
    const errorResponse = new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error',
        message: error.message
      }),
      { 
        status: 500, 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': env.CORS_ORIGIN || '*'
        } 
      }
    );
    
    return errorResponse;
  }
}