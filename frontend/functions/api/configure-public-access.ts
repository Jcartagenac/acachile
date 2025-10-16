// Función para configurar acceso público del bucket
// /functions/api/configure-public-access.ts

interface Env {
  IMAGES: any; // R2Bucket
}

interface CloudflareContext {
  request: Request;
  env: Env;
}

export async function onRequestPost(context: CloudflareContext) {
  const { env } = context;

  try {
    if (!env.IMAGES) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'R2 binding no configurado' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Probar subida de un objeto público de prueba
    const testContent = `Test de acceso público - ${new Date().toISOString()}`;
    await env.IMAGES.put('public-test.txt', testContent, {
      httpMetadata: {
        contentType: 'text/plain',
        cacheControl: 'public, max-age=3600',
      },
      customMetadata: {
        purpose: 'public-access-test',
      },
    });

    return new Response(JSON.stringify({
      success: true,
      message: 'Archivo de prueba subido. Verificar acceso público en Cloudflare Dashboard.',
      data: {
        testFile: 'public-test.txt',
        instructions: [
          '1. Ir a Cloudflare Dashboard > R2 Object Storage',
          '2. Seleccionar bucket: aca-chile-images',
          '3. Ir a Settings tab',
          '4. Habilitar "Allow Access" en Public URL access',
          '5. Confirmar URL pública'
        ]
      }
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Error configurando acceso público',
      details: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}