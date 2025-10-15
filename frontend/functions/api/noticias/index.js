// Endpoint principal para gestión de noticias
// GET /api/noticias - Listar noticias con filtros
// POST /api/noticias - Crear nueva noticia

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
    if (method === 'GET') {
      return await handleGetNoticias(url, env, corsHeaders);
    }
    
    if (method === 'POST') {
      return await handleCreateNoticia(request, env, corsHeaders);
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
    console.error('Error in noticias endpoint:', error);
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

// GET /api/noticias - Listar noticias
async function handleGetNoticias(url, env, corsHeaders) {
  try {
    // Obtener noticias desde KV (o crear datos de ejemplo si no existen)
    let noticias = await getNoticias(env);

    // Aplicar filtros básicos
    const category = url.searchParams.get('category');
    const featured = url.searchParams.get('featured');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');

    if (category) {
      noticias = noticias.filter(noticia => noticia.category === category);
    }

    if (featured === 'true') {
      noticias = noticias.filter(noticia => noticia.featured);
    }

    // Ordenar por fecha (más recientes primero)
    noticias.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    // Paginación
    const total = noticias.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedNoticias = noticias.slice(start, end);

    return new Response(JSON.stringify({
      success: true,
      data: paginatedNoticias,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error) {
    console.error('Error getting noticias:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error obteniendo noticias'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
}

// POST /api/noticias - Crear nueva noticia
async function handleCreateNoticia(request, env, corsHeaders) {
  try {
    // Verificar autenticación de admin
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Token de autorización requerido'
      }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    const body = await request.json();
    
    // Crear noticia
    const result = await createNoticia(env, body);

    if (!result.success) {
      return new Response(JSON.stringify({
        success: false,
        error: result.error
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      data: result.data,
      message: 'Noticia creada exitosamente'
    }), {
      status: 201,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error) {
    console.error('Error creating noticia:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error creando noticia'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
}

// Funciones de servicio
async function getNoticias(env) {
  try {
    // Intentar obtener desde KV
    const noticiasData = await env.ACA_KV.get('noticias:all');
    
    if (noticiasData) {
      return JSON.parse(noticiasData);
    }

    // Si no existen, crear noticias de la ACA Chile
    const noticiasEjemplo = [
      {
        id: 1,
        title: "Campeonato Mundial de Barbacoa 2024: Chile Participará",
        slug: "campeonato-mundial-barbacoa-2024-chile-participara",
        excerpt: "La Asociación Chilena de Asadores enviará su selección al prestigioso campeonato mundial en Kansas City.",
        content: `
          <p>La <strong>Asociación Chilena de Asadores (ACA)</strong> se enorgullece en anunciar que Chile participará en el <strong>Campeonato Mundial de Barbacoa 2024</strong> en Kansas City, Estados Unidos.</p>
          
          <h3>Detalles de la Participación:</h3>
          <ul>
            <li><strong>Fecha:</strong> 15-17 de Noviembre, 2024</li>
            <li><strong>Lugar:</strong> Kansas City, Missouri, USA</li>
            <li><strong>Delegación:</strong> 8 maestros asadores chilenos</li>
            <li><strong>Categorías:</strong> Cerdo, Vacuno, Pollo y Costillas</li>
          </ul>
          
          <p>Nuestros representantes competirán contra más de 500 equipos internacionales, llevando las técnicas tradicionales del asado chileno al escenario mundial.</p>
        `,
        image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&h=400&fit=crop&auto=format",
        category: "competencias",
        tags: ["mundial", "barbacoa", "2024", "internacional"],
        author: "ACA Chile",
        publishedAt: "2025-10-14T10:00:00Z",
        status: "published",
        featured: true,
        views: 245,
        commentsEnabled: true
      },
      {
        id: 2,
        title: "Curso de Técnicas Básicas de Asado: Cupos Limitados",
        slug: "curso-tecnicas-basicas-asado-cupos-limitados",
        excerpt: "Aprende las técnicas fundamentales del asado chileno con nuestros maestros certificados.",
        content: `
          <p>¿Quieres dominar el arte del asado desde cero? Nuestro <strong>Curso de Técnicas Básicas de Asado</strong> es perfecto para principiantes.</p>
          
          <h3>¿Qué aprenderás?</h3>
          <ul>
            <li>Selección y cortes de carne premium</li>
            <li>Técnicas de encendido y manejo del fuego</li>
            <li>Tiempos de cocción y puntos de carne</li>
            <li>Marinados y condimentación tradicional</li>
          </ul>
          
          <p>El curso incluye degustación y material teórico. ¡Solo 20 cupos disponibles!</p>
        `,
        image: "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=600&h=400&fit=crop&auto=format",
        category: "educacion",
        tags: ["curso", "principiantes", "técnicas", "educación"],
        author: "Maestro Asador Juan Pérez",
        publishedAt: "2025-10-12T15:30:00Z",
        status: "published",
        featured: false,
        views: 128,
        commentsEnabled: true
      },
      {
        id: 3,
        title: "Resultados del Campeonato Regional de Asadores 2024",
        slug: "resultados-campeonato-regional-asadores-2024",
        excerpt: "Conoce a los nuevos campeones regionales y sus increíbles técnicas de asado.",
        content: `
          <p>El pasado fin de semana se realizó el <strong>Campeonato Regional de Asadores 2024</strong> con excelente participación de maestros asadores de todo Chile.</p>
          
          <h3>Ganadores por categorías:</h3>
          <ul>
            <li><strong>Asado de Vacuno:</strong> Carlos Mendoza (Región Metropolitana)</li>
            <li><strong>Asado de Cerdo:</strong> Roberto Silva (Valparaíso)</li>
            <li><strong>Parrilla Mixta:</strong> Ana García (Maule)</li>
            <li><strong>Cordero al Palo:</strong> Diego Fernández (Magallanes)</li>
          </ul>
          
          <p>Felicitamos a todos los participantes por su técnica excepcional y el compañerismo demostrado durante la competencia.</p>
        `,
        image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop&auto=format",
        category: "resultados",
        tags: ["regional", "campeonato", "resultados", "asadores"],
        author: "Comité de Competencias ACA",
        publishedAt: "2025-10-10T09:15:00Z",
        status: "published",
        featured: false,
        views: 89,
        commentsEnabled: true
      },
      {
        id: 4,
        title: "Nueva Sede de la ACA en Valparaíso: Centro de Excelencia",
        slug: "nueva-sede-aca-valparaiso-centro-excelencia",
        excerpt: "ACA Chile inaugura un moderno centro de capacitación en asados en la Región de Valparaíso.",
        content: `
          <p>Con gran orgullo anunciamos la <strong>inauguración de nuestro Centro de Excelencia en Valparaíso</strong>, fortaleciendo la formación de asadores en la región.</p>
          
          <h3>Instalaciones del nuevo centro:</h3>
          <ul>
            <li>15 parrillas profesionales individuales</li>
            <li>Aula teórica con capacidad para 40 personas</li>
            <li>Cámara frigorífica para carnes premium</li>
            <li>Laboratorio de marinados y especias</li>
          </ul>
          
          <p>La inauguración será el 25 de octubre con un gran asado comunitario y demostraciones gratuitas.</p>
        `,
        image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&h=400&fit=crop&auto=format",
        category: "institucional",
        tags: ["sede", "valparaíso", "inauguración", "capacitación"],
        author: "Directorio ACA Chile",
        publishedAt: "2025-10-08T12:00:00Z",
        status: "published",
        featured: true,
        views: 167,
        commentsEnabled: true
      },
      {
        id: 5,
        title: "Masterclass: Secretos del Asado Patagónico",
        slug: "masterclass-secretos-asado-patagonico",
        excerpt: "Clase magistral sobre las técnicas ancestrales del asado patagónico con el Maestro Raúl Barrientos.",
        content: `
          <p>No te pierdas esta <strong>Masterclass sobre los Secretos del Asado Patagónico</strong> impartida por el legendario Maestro Asador Raúl Barrientos.</p>
          
          <h3>Temas a desarrollar:</h3>
          <ul>
            <li>Técnicas ancestrales de los gauchos patagónicos</li>
            <li>Cordero al palo: desde la selección hasta el emplatado</li>
            <li>Manejo del fuego con leña de ñire y calafate</li>
            <li>Marinados con hierbas autóctonas de la Patagonia</li>
          </ul>
          
          <p>Una oportunidad única para aprender de uno de los mayores exponentes del asado tradicional chileno.</p>
        `,
        image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=400&fit=crop&auto=format",
        category: "educacion",
        tags: ["masterclass", "patagónico", "tradicional", "avanzado"],
        author: "Maestro Raúl Barrientos",
        publishedAt: "2025-10-06T16:45:00Z",
        status: "published",
        featured: false,
        views: 203,
        commentsEnabled: true
      }
    ];

    // Guardar noticias de ejemplo en KV
    await env.ACA_KV.put('noticias:all', JSON.stringify(noticiasEjemplo));
    await env.ACA_KV.put('noticias:lastId', '5');

    return noticiasEjemplo;

  } catch (error) {
    console.error('Error in getNoticias:', error);
    return [];
  }
}

async function createNoticia(env, noticiaData) {
  try {
    // Obtener el siguiente ID
    const lastIdData = await env.ACA_KV.get('noticias:lastId');
    const lastId = lastIdData ? parseInt(lastIdData) : 0;
    const newId = lastId + 1;

    // Crear slug desde el título
    const slug = noticiaData.title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, "-")
      .substring(0, 100);

    // Crear la noticia
    const now = new Date().toISOString();
    const noticia = {
      id: newId,
      title: noticiaData.title,
      slug: slug,
      excerpt: noticiaData.excerpt || '',
      content: noticiaData.content,
      image: noticiaData.image || '/images/default-news.jpg',
      category: noticiaData.category || 'general',
      tags: noticiaData.tags || [],
      author: noticiaData.author || 'ACA Chile',
      publishedAt: noticiaData.publishedAt || now,
      status: noticiaData.status || 'draft',
      featured: noticiaData.featured || false,
      views: 0,
      commentsEnabled: noticiaData.commentsEnabled !== false
    };

    // Guardar noticia individual
    await env.ACA_KV.put(`noticia:${newId}`, JSON.stringify(noticia));

    // Actualizar lista de todas las noticias
    const noticiasData = await env.ACA_KV.get('noticias:all');
    const noticias = noticiasData ? JSON.parse(noticiasData) : [];
    noticias.push(noticia);
    await env.ACA_KV.put('noticias:all', JSON.stringify(noticias));

    // Actualizar último ID
    await env.ACA_KV.put('noticias:lastId', newId.toString());

    return {
      success: true,
      data: noticia
    };

  } catch (error) {
    console.error('Error in createNoticia:', error);
    return {
      success: false,
      error: 'Error creando noticia'
    };
  }
}