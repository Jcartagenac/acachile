// Endpoint para gestión de categorías de noticias
// GET /api/noticias/categories - Listar categorías

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
    // Categorías predefinidas para noticias de ACA Chile
    const categories = [
      {
        id: 1,
        name: 'Competencias',
        slug: 'competencias',
        color: '#DC2626', // red-600
        description: 'Campeonatos, torneos y competencias de asado'
      },
      {
        id: 2,
        name: 'Educación',
        slug: 'educacion',
        color: '#059669', // green-600
        description: 'Cursos, talleres y capacitaciones'
      },
      {
        id: 3,
        name: 'Eventos',
        slug: 'eventos',
        color: '#2563EB', // blue-600
        description: 'Eventos sociales, encuentros y celebraciones'
      },
      {
        id: 4,
        name: 'Institucional',
        slug: 'institucional',
        color: '#7C3AED', // violet-600
        description: 'Noticias oficiales de la ACA Chile'
      },
      {
        id: 5,
        name: 'Internacional',
        slug: 'internacional',
        color: '#EA580C', // orange-600
        description: 'Noticias y eventos internacionales'
      },
      {
        id: 6,
        name: 'Comunidad',
        slug: 'comunidad',
        color: '#0891B2', // cyan-600
        description: 'Historias y actividades de la comunidad'
      },
      {
        id: 7,
        name: 'Técnicas',
        slug: 'tecnicas',
        color: '#CA8A04', // yellow-600
        description: 'Tips, técnicas y mejores prácticas'
      },
      {
        id: 8,
        name: 'General',
        slug: 'general',
        color: '#64748B', // slate-600
        description: 'Noticias generales'
      }
    ];

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
