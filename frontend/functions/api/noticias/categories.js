// Endpoint para gestión de categorías de noticias
// GET /api/noticias/categories - Listar categorías
import { getNewsCategoriesFromDb, getFallbackNewsCategories } from './_utils';

export async function onRequest(context) {
  const { request, env } = context;
  const method = request.method;

  const corsHeaders = {
    'Access-Control-Allow-Origin': env.CORS_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
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
    if (method === 'GET') {
      return await handleGetCategories(env, corsHeaders);
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
    console.error('Error in categories endpoint:', error);
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

// GET /api/noticias/categories - Listar categorías
async function handleGetCategories(env, corsHeaders) {
  try {
    const categoriesFromDb = await getNewsCategoriesFromDb(env);
    const categories = categoriesFromDb.length > 0 ? categoriesFromDb : getFallbackNewsCategories();

    return new Response(JSON.stringify({
      success: true,
      data: categories
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error) {
    console.error('Error getting categories:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error obteniendo categorías'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
}
