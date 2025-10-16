// Función temporal para listar todos los objetos en R2
// /functions/api/list-objects.ts

interface Env {
  IMAGES: any; // R2Bucket
}

interface CloudflareContext {
  request: Request;
  env: Env;
}

export async function onRequestGet(context: CloudflareContext) {
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

    // Listar todos los objetos
    const objects = await env.IMAGES.list();
    
    // Extraer carpetas únicas de los objetos
    const folders = new Set<string>();
    const allObjects: any[] = [];
    
    objects.objects.forEach((obj: any) => {
      const key = obj.key;
      allObjects.push({
        key: key,
        size: obj.size,
        uploaded: obj.uploaded
      });
      
      // Extraer carpeta si existe
      if (key.includes('/')) {
        const folder = key.split('/')[0];
        folders.add(folder);
      }
    });

    return new Response(JSON.stringify({
      success: true,
      data: {
        totalObjects: objects.objects.length,
        truncated: objects.truncated,
        folders: Array.from(folders).sort((a, b) => a.localeCompare(b)),
        objects: allObjects.sort((a, b) => a.key.localeCompare(b.key))
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
      error: 'Error listando objetos',
      details: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}