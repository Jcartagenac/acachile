// Endpoint para inicialización de eventos (solo admin)
// POST /api/eventos/init - Inicializar eventos con datos de ejemplo

export async function onRequest(context) {
  const { request, env } = context;
  const method = request.method;

  const corsHeaders = {
    'Access-Control-Allow-Origin': env.CORS_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // Manejar preflight requests
  if (method === 'OPTIONS') {
    return new Response(null, { 
      status: 204, 
      headers: corsHeaders 
    });
  }

  if (method !== 'POST') {
    return new Response(JSON.stringify({
      success: false,
      error: 'Método no permitido'
    }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }

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

    // TODO: Verificar que es admin mediante JWT

    // Inicializar eventos
    const result = await initializeEventos(env);

    if (!result.success) {
      return new Response(JSON.stringify({
        success: false,
        error: result.error
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: result.message,
      data: result.data
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error) {
    console.error('Error in eventos/init endpoint:', error);
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

// Función para inicializar eventos con datos de ejemplo
async function initializeEventos(env) {
  try {
    const now = new Date();
    
    // Eventos de la Asociación Chilena de Asadores
    const eventosIniciales = [
      {
        id: 1,
        title: "Campeonato Nacional de Asado 2024",
        date: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +30 días
        time: "10:00",
        location: "Parque O'Higgins, Santiago",
        description: "El evento más importante del año para los asadores de Chile. Competencia oficial con jurado internacional y participación de los mejores asadores del país. Categorías: Vacuno, Cerdo, Cordero y Parrilla Mixta.",
        image: "/api/images?path=eventos/campeonato-nacional-asado.jpg",
        type: "campeonato",
        registrationOpen: true,
        maxParticipants: 100,
        currentParticipants: 0,
        price: 50000,
        requirements: [
          "Ser socio activo de ACA Chile",
          "Presentar certificado de manipulación de alimentos",
          "Completar formulario de inscripción oficial",
          "Traer equipos propios de asado"
        ],
        organizerId: 1,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        status: "published",
        tags: ["campeonato", "nacional", "asado", "competencia"],
        contactInfo: {
          email: "campeonatos@acachile.cl",
          phone: "+56912345678"
        }
      },
      {
        id: 2,
        title: "Taller de Técnicas de Asado para Principiantes",
        date: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +7 días
        time: "15:00",
        location: "Sede ACA Chile - Parrillas de Práctica",
        description: "Aprende las técnicas fundamentales del asado chileno. Taller práctico con maestros asadores que enseñan cortes de carne, manejo del fuego, tiempos de cocción y secretos tradicionales.",
        image: "/api/images?path=eventos/taller-principiantes-asado.jpg",
        type: "taller",
        registrationOpen: true,
        maxParticipants: 20,
        currentParticipants: 0,
        price: 25000,
        requirements: [
          "Sin experiencia previa necesaria",
          "Traer delantal y guantes",
          "Certificado de salud vigente"
        ],
        organizerId: 1,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        status: "published",
        tags: ["taller", "principiantes", "técnicas", "educativo"],
        contactInfo: {
          email: "talleres@acachile.cl"
        }
      },
      {
        id: 3,
        title: "Encuentro de Asadores del Fin de Semana",
        date: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +3 días
        time: "12:00",
        location: "Quintas de Recreo Las Condes",
        description: "Encuentro informal de asadores para compartir experiencias, técnicas y disfrutar de un buen asado en ambiente familiar. Cada participante trae sus ingredientes y compartimos conocimientos.",
        image: "/api/images?path=eventos/encuentro-asadores.jpg",
        type: "encuentro",
        registrationOpen: true,
        maxParticipants: null, // Sin límite
        currentParticipants: 0,
        price: null, // Gratis
        requirements: [
          "Traer sus propios ingredientes",
          "Actitud de compartir y aprender"
        ],
        organizerId: 1,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        status: "published",
        tags: ["encuentro", "informal", "compartir", "gratis"],
        contactInfo: {
          email: "eventos@acachile.cl"
        }
      },
      {
        id: 4,
        title: "Competencia de Asado Rápido",
        date: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +14 días
        time: "11:00",
        location: "Centro de Eventos ACA - Zona de Parrillas",
        description: "Desafío contra el tiempo: los participantes deben preparar un asado completo en tiempo récord manteniendo la calidad. Categorías por experiencia y premios especiales.",
        image: "/api/images?path=eventos/competencia-rapida.jpg",
        type: "competencia",
        registrationOpen: true,
        maxParticipants: 40,
        currentParticipants: 0,
        price: 15000,
        requirements: [
          "Experiencia previa en asados",
          "Inscripción anticipada obligatoria",
          "Traer equipos básicos propios"
        ],
        organizerId: 1,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        status: "published",
        tags: ["competencia", "rápido", "desafío", "tiempo"],
        contactInfo: {
          email: "competencias@acachile.cl",
          phone: "+56912345678"
        }
      },
      {
        id: 5,
        title: "Masterclass: Parrilla Argentina con Chef Invitado",
        date: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +21 días
        time: "14:00",
        location: "Auditorio Gourmet - Hotel Ritz Carlton",
        description: "Clase magistral sobre técnicas de parrilla argentina impartida por el reconocido parrillero Martín Fierro. Aprende cortes especiales, marinados únicos y el arte del fuego perfecto.",
        image: "/api/images?path=eventos/masterclass-parrilla.jpg",
        type: "masterclass",
        registrationOpen: true,
        maxParticipants: 30,
        currentParticipants: 0,
        price: 45000,
        requirements: [
          "Nivel intermedio-avanzado",
          "Conocimientos básicos de asado",
          "Material de apuntes incluido"
        ],
        organizerId: 1,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        status: "published",
        tags: ["masterclass", "argentina", "chef", "avanzado"],
        contactInfo: {
          email: "masterclass@acachile.cl",
          website: "https://acachile.cl/masterclass"
        }
      }
    ];

    // Guardar cada evento individualmente
    for (const evento of eventosIniciales) {
      await env.ACA_KV.put(`evento:${evento.id}`, JSON.stringify(evento));
    }

    // Guardar lista completa
    await env.ACA_KV.put('eventos:all', JSON.stringify(eventosIniciales));

    // Actualizar último ID
    await env.ACA_KV.put('eventos:lastId', '5');

    return {
      success: true,
      message: `${eventosIniciales.length} eventos inicializados correctamente`,
      data: {
        eventosCreados: eventosIniciales.length,
        tipos: {
          campeonato: eventosIniciales.filter(e => e.type === 'campeonato').length,
          taller: eventosIniciales.filter(e => e.type === 'taller').length,
          encuentro: eventosIniciales.filter(e => e.type === 'encuentro').length,
          competencia: eventosIniciales.filter(e => e.type === 'competencia').length,
          masterclass: eventosIniciales.filter(e => e.type === 'masterclass').length
        }
      }
    };

  } catch (error) {
    console.error('Error in initializeEventos:', error);
    return {
      success: false,
      error: 'Error inicializando eventos'
    };
  }
}