// Proxy principal para servir imágenes desde R2 con CORS apropiado
// GET /api/images?path=categoria/archivo.jpg - Servir imágenes desde R2

import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

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

    // Configurar cliente S3 para R2
    const s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      },
    });

    // Obtener imagen desde R2
    const command = new GetObjectCommand({
      Bucket: 'aca-chile-images',
      Key: imagePath,
    });

    const response = await s3Client.send(command);
    
    if (!response.Body) {
      return new Response('Image not found', {
        status: 404,
        headers: corsHeaders,
      });
    }

    // Convertir stream a buffer
    const chunks = [];
    const reader = response.Body.getReader();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
    
    const buffer = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
    let offset = 0;
    for (const chunk of chunks) {
      buffer.set(chunk, offset);
      offset += chunk.length;
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

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': buffer.length.toString(),
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