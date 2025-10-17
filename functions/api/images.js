// Proxy principal para servir imágenes desde R2 con CORS apropiado  
// GET /api/images?path=categoria/archivo.jpg - Servir imágenes desde R2
// Usa R2 binding nativo de Cloudflare Workers (sin AWS SDK)
// Build: 2025-10-15 v2.0

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method;

  const corsHeaders = {
    'Access-Control-Allow-Origin': env.CORS_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'public, max-age=86400', // Cache por 24 horas
  };

  // Manejar preflight requests
  if (method === 'OPTIONS') {
    return new Response(null, { 
      status: 204, 
      headers: corsHeaders 
    });
  }

  if (method !== 'GET') {
    return new Response('Method not allowed', {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    // Obtener path de la imagen desde query parameter
    const imagePath = url.searchParams.get('path');
    
    if (!imagePath) {
      return new Response('Image path required', {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Verificar que el binding IMAGES esté disponible
    if (!env.IMAGES) {
      console.error('R2 binding IMAGES not found');
      return new Response('Image service not available', {
        status: 503,
        headers: corsHeaders,
      });
    }

    // Obtener imagen desde R2 usando binding nativo
    const object = await env.IMAGES.get(imagePath);
    
    if (!object) {
      return new Response('Image not found', {
        status: 404,
        headers: corsHeaders,
      });
    }

    // Determinar content type
    const extension = imagePath.split('.').pop()?.toLowerCase();
    const contentType = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'webp': 'image/webp',
      'gif': 'image/gif'
    }[extension] || 'image/jpeg';

    // Servir la imagen directamente
    return new Response(object.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'ETag': object.etag,
        'Cache-Control': 'public, max-age=31536000', // 1 año
        'Content-Length': object.size.toString(),
        ...corsHeaders,
      },
    });

  } catch (error) {
    console.error('Error serving image:', error);
    
    return new Response('Internal server error', {
      status: 500,
      headers: corsHeaders,
    });
  }
}