import { requireAuth } from '../../_middleware';

// PUT /api/noticias/[slug]/unarchive - Desarchivar noticia

export async function onRequest(context) {
  const { request, env, params } = context;
  const method = request.method;

  const corsHeaders = {
    'Access-Control-Allow-Origin': env.CORS_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // Manejar preflight requests
  if (method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  // Solo permitir PUT
  if (method !== 'PUT') {
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
  }

  try {
    // Verificar autenticación
    let authUser;
    try {
      authUser = await requireAuth(request, env);
    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Autenticación requerida'
      }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    // Verificar permisos (admin)
    const isAdmin = authUser.role === 'admin' || 
                    (Array.isArray(authUser.roles) && authUser.roles.includes('admin'));
    
    if (!isAdmin) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Permisos insuficientes'
      }), {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    if (!params.slug) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Slug requerido'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    // Obtener todas las noticias del KV
    const noticiasData = await env.ACA_KV.get('noticias:all');
    if (!noticiasData) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No hay noticias disponibles'
      }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    const noticias = JSON.parse(noticiasData);
    
    // Buscar la noticia por slug o ID
    const slugOrId = params.slug;
    const noticiaIndex = noticias.findIndex(n => {
      if (!isNaN(slugOrId)) {
        return n.id === parseInt(slugOrId);
      }
      return n.slug === slugOrId;
    });
    
    if (noticiaIndex === -1) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Noticia no encontrada'
      }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    // Desarchivar noticia
    noticias[noticiaIndex].archived = false;
    noticias[noticiaIndex].updated_at = new Date().toISOString();
    
    // Guardar las noticias actualizadas en KV
    await env.ACA_KV.put('noticias:all', JSON.stringify(noticias), {
      expirationTtl: 86400 // 24 horas
    });

    // Actualizar la noticia individual en KV
    await env.ACA_KV.put(`noticia:${noticias[noticiaIndex].id}`, JSON.stringify(noticias[noticiaIndex]), {
      expirationTtl: 86400 // 24 horas
    });

    return new Response(JSON.stringify({
      success: true,
      data: noticias[noticiaIndex],
      message: 'Noticia desarchivada exitosamente'
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error) {
    console.error('Error unarchiving noticia:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error desarchivando noticia'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
}
