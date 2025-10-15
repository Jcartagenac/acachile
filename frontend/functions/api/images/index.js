// Endpoint para gestión de imágenes en R2
// POST /api/images/upload - Subir imagen a R2
// GET /api/images/[path] - Servir imagen desde R2

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const method = request.method;

  const corsHeaders = {
    'Access-Control-Allow-Origin': env.CORS_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // Manejar preflight requests
  if (method === 'OPTIONS') {
    return new Response(null, { 
      status: 204, 
      headers: corsHeaders 
    });
  }

  try {
    if (method === 'POST') {
      return await handleUpload(request, env, corsHeaders);
    }
    
    if (method === 'GET') {
      return await handleGetImage(url, env, corsHeaders);
    }

    return new Response(JSON.stringify({
      success: false,
      error: `Método ${method} no permitido`
    }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error) {
    console.error('Error in images endpoint:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error interno del servidor'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
}

async function handleUpload(request, env, corsHeaders) {
  try {
    // Verificar autenticación (opcional para admin)
    const authHeader = request.headers.get('Authorization');
    // TODO: Implementar verificación JWT si es necesario

    const formData = await request.formData();
    const file = formData.get('file');
    const path = formData.get('path') || 'uploads';
    const filename = formData.get('filename') || file.name;

    if (!file) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No se encontró archivo para subir'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Tipo de archivo no permitido. Solo se permiten: JPG, PNG, WebP'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    // Generar key única para R2
    const timestamp = Date.now();
    const key = `${path}/${timestamp}-${filename}`;

    // Subir a R2
    await env.IMAGES.put(key, file.stream(), {
      httpMetadata: {
        contentType: file.type,
        cacheControl: 'public, max-age=31536000', // 1 año de cache
      },
    });

    // URL pública (cuando configuremos custom domain)
    const publicUrl = `https://images.acachile.pages.dev/${key}`;

    return new Response(JSON.stringify({
      success: true,
      data: {
        key,
        url: publicUrl,
        filename,
        size: file.size,
        type: file.type
      },
      message: 'Imagen subida exitosamente'
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error) {
    console.error('Error uploading image:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error subiendo imagen'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
}

async function handleGetImage(url, env, corsHeaders) {
  try {
    // Extraer path de la imagen
    const pathname = url.pathname.replace('/api/images/', '');
    
    if (!pathname) {
      return new Response('Imagen no encontrada', { 
        status: 404,
        headers: corsHeaders 
      });
    }

    // Obtener de R2
    const object = await env.IMAGES.get(pathname);
    
    if (!object) {
      return new Response('Imagen no encontrada', { 
        status: 404,
        headers: corsHeaders 
      });
    }

    // Servir la imagen
    return new Response(object.body, {
      headers: {
        'Content-Type': object.httpMetadata?.contentType || 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000',
        'ETag': object.etag,
        ...corsHeaders,
      },
    });

  } catch (error) {
    console.error('Error getting image:', error);
    return new Response('Error obteniendo imagen', { 
      status: 500,
      headers: corsHeaders 
    });
  }
}