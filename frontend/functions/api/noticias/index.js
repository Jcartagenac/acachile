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

    // Si no existen, crear noticias de ejemplo
    const noticiasEjemplo = [
      {
        id: 1,
        title: "Gran Torneo Nacional de Ajedrez 2025",
        slug: "gran-torneo-nacional-ajedrez-2025",
        excerpt: "Se acerca el evento ajedrecístico más importante del año con participantes de todo el país.",
        content: `
          <p>La Asociación de Ajedrez de Chile se complace en anunciar la realización del <strong>Gran Torneo Nacional de Ajedrez 2025</strong>, el evento más esperado del calendario ajedrecístico nacional.</p>
          
          <h3>Detalles del Torneo:</h3>
          <ul>
            <li><strong>Fecha:</strong> 15-17 de Noviembre, 2025</li>
            <li><strong>Lugar:</strong> Centro de Convenciones Santiago</li>
            <li><strong>Modalidad:</strong> Suizo a 9 rondas</li>
            <li><strong>Control de tiempo:</strong> 90 minutos + 30 segundos por jugada</li>
          </ul>
          
          <p>Este año contaremos con la participación de más de 200 jugadores, incluyendo grandes maestros internacionales y los mejores talentos nacionales.</p>
        `,
        image: "/images/torneo-nacional-2025.jpg",
        category: "torneos",
        tags: ["torneo", "nacional", "2025", "competencia"],
        author: "ACA Chile",
        publishedAt: "2025-10-14T10:00:00Z",
        status: "published",
        featured: true,
        views: 245,
        commentsEnabled: true
      },
      {
        id: 2,
        title: "Nuevo Taller de Aperturas para Principiantes",
        slug: "nuevo-taller-aperturas-principiantes",
        excerpt: "Aprende las aperturas fundamentales del ajedrez en nuestro taller especializado.",
        content: `
          <p>¿Quieres mejorar tu juego desde las primeras jugadas? Nuestro <strong>Taller de Aperturas para Principiantes</strong> es perfecto para ti.</p>
          
          <h3>¿Qué aprenderás?</h3>
          <ul>
            <li>Principios fundamentales de las aperturas</li>
            <li>Las aperturas más populares: Italiana, Española, Francesa</li>
            <li>Errores comunes y cómo evitarlos</li>
            <li>Transiciones al medio juego</li>
          </ul>
          
          <p>El taller se realizará en formato presencial con análisis interactivo de partidas.</p>
        `,
        image: "/images/taller-aperturas.jpg",
        category: "educacion",
        tags: ["taller", "principiantes", "aperturas", "educación"],
        author: "MI Carlos Matamoros",
        publishedAt: "2025-10-12T15:30:00Z",
        status: "published",
        featured: false,
        views: 128,
        commentsEnabled: true
      },
      {
        id: 3,
        title: "Resultados del Campeonato Juvenil Regional",
        slug: "resultados-campeonato-juvenil-regional",
        excerpt: "Conoce a los nuevos campeones juveniles y sus destacadas actuaciones.",
        content: `
          <p>El pasado fin de semana se realizó el <strong>Campeonato Juvenil Regional</strong> con excelente participación de jóvenes talentos.</p>
          
          <h3>Resultados por categorías:</h3>
          <ul>
            <li><strong>Sub-12:</strong> María González (8.5/9 puntos)</li>
            <li><strong>Sub-14:</strong> Pedro Martínez (8/9 puntos)</li>
            <li><strong>Sub-16:</strong> Ana Silva (7.5/9 puntos)</li>
            <li><strong>Sub-18:</strong> Diego Torres (8/9 puntos)</li>
          </ul>
          
          <p>Felicitamos a todos los participantes por su dedicación y fair play demostrado durante el torneo.</p>
        `,
        image: "/images/campeonato-juvenil.jpg",
        category: "resultados",
        tags: ["juvenil", "campeonato", "resultados", "regional"],
        author: "Comité de Torneos",
        publishedAt: "2025-10-10T09:15:00Z",
        status: "published",
        featured: false,
        views: 89,
        commentsEnabled: true
      },
      {
        id: 4,
        title: "Inauguración de Nueva Sede en Valparaíso",
        slug: "inauguracion-nueva-sede-valparaiso",
        excerpt: "ACA Chile expande su presencia con una moderna sede en la Región de Valparaíso.",
        content: `
          <p>Con gran orgullo anunciamos la <strong>inauguración de nuestra nueva sede en Valparaíso</strong>, fortaleciendo nuestra presencia en la región.</p>
          
          <h3>Características de la nueva sede:</h3>
          <ul>
            <li>Salón principal para 50 jugadores</li>
            <li>Sala de estudio y análisis</li>
            <li>Biblioteca especializada</li>
            <li>Área de recreación</li>
          </ul>
          
          <p>La ceremonia de inauguración será el 25 de octubre con un torneo amistoso y actividades para toda la familia.</p>
        `,
        image: "/images/sede-valparaiso.jpg",
        category: "institucional",
        tags: ["sede", "valparaíso", "inauguración", "expansión"],
        author: "Directorio ACA Chile",
        publishedAt: "2025-10-08T12:00:00Z",
        status: "published",
        featured: true,
        views: 167,
        commentsEnabled: true
      },
      {
        id: 5,
        title: "Masterclass: Estrategia en el Final de Partida",
        slug: "masterclass-estrategia-final-partida",
        excerpt: "Clase magistral sobre técnicas avanzadas para dominar los finales de partida.",
        content: `
          <p>No te pierdas esta <strong>Masterclass sobre Estrategia en el Final de Partida</strong> impartida por el Gran Maestro Internacional Roberto Cifuentes.</p>
          
          <h3>Temas a tratar:</h3>
          <ul>
            <li>Finales de peones: técnicas de promoción</li>
            <li>Finales de torres: posiciones ganadoras</li>
            <li>Coordinación de piezas en el final</li>
            <li>Cálculo preciso en posiciones complejas</li>
          </ul>
          
          <p>Una oportunidad única para aprender de uno de los mejores jugadores del país.</p>
        `,
        image: "/images/masterclass-finales.jpg",
        category: "educacion",
        tags: ["masterclass", "finales", "estrategia", "avanzado"],
        author: "GM Roberto Cifuentes",
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