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
    
    // Eventos de ejemplo
    const eventosIniciales = [
      {
        id: 1,
        title: "Campeonato Nacional de Ajedrez Clásico",
        date: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +30 días
        time: "09:00",
        location: "Centro de Convenciones Santiago",
        description: "El torneo más importante del año con participantes de todo Chile. Modalidad clásica con controles de tiempo largos para partidas de máxima calidad.",
        image: "/images/campeonato-clasico.jpg",
        type: "campeonato",
        registrationOpen: true,
        maxParticipants: 200,
        currentParticipants: 0,
        price: 25000,
        requirements: [
          "Ser socio de ACA Chile",
          "Presentar carnet de identidad",
          "Completar formulario de inscripción"
        ],
        organizerId: 1,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        status: "published",
        tags: ["campeonato", "clásico", "nacional"],
        contactInfo: {
          email: "torneos@acachile.cl",
          phone: "+56912345678"
        }
      },
      {
        id: 2,
        title: "Taller de Aperturas para Principiantes",
        date: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +7 días
        time: "15:00",
        location: "Sede ACA Chile - Sala Principal",
        description: "Aprende los fundamentos de las aperturas más importantes. Taller interactivo con análisis de partidas y ejercicios prácticos.",
        image: "/images/taller-aperturas.jpg",
        type: "taller",
        registrationOpen: true,
        maxParticipants: 30,
        currentParticipants: 0,
        price: 8000,
        requirements: [
          "Nivel principiante a intermedio",
          "Conocimientos básicos de ajedrez"
        ],
        organizerId: 1,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        status: "published",
        tags: ["taller", "principiantes", "aperturas", "educativo"],
        contactInfo: {
          email: "talleres@acachile.cl"
        }
      },
      {
        id: 3,
        title: "Encuentro de Ajedrez Rápido",
        date: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +3 días
        time: "18:30",
        location: "Plaza de Armas - Stand ACA",
        description: "Partidas casuales de ajedrez rápido al aire libre. Ambiente relajado para conocer otros jugadores y disfrutar del juego.",
        image: "/images/encuentro-rapido.jpg",
        type: "encuentro",
        registrationOpen: true,
        maxParticipants: null, // Sin límite
        currentParticipants: 0,
        price: null, // Gratis
        requirements: [],
        organizerId: 1,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        status: "published",
        tags: ["encuentro", "rápido", "casual", "gratis"],
        contactInfo: {
          email: "eventos@acachile.cl"
        }
      },
      {
        id: 4,
        title: "Torneo Blitz Nocturno",
        date: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +14 días
        time: "20:00",
        location: "Sede ACA Chile - Salón Principal",
        description: "Torneo de partidas blitz (5 minutos por jugador). Alta adrenalina y diversión garantizada en formato suizo.",
        image: "/images/torneo-blitz.jpg",
        type: "torneo",
        registrationOpen: true,
        maxParticipants: 64,
        currentParticipants: 0,
        price: 5000,
        requirements: [
          "Nivel intermedio mínimo",
          "Inscripción previa obligatoria"
        ],
        organizerId: 1,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        status: "published",
        tags: ["torneo", "blitz", "nocturno", "rápido"],
        contactInfo: {
          email: "torneos@acachile.cl",
          phone: "+56912345678"
        }
      },
      {
        id: 5,
        title: "Masterclass: Finales de Torres",
        date: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +21 días
        time: "11:00",
        location: "Aula Magna Universidad Católica",
        description: "Clase magistral sobre finales de torres impartida por el MI Carlos Matamoros. Análisis profundo de posiciones complejas.",
        image: "/images/masterclass-finales.jpg",
        type: "taller",
        registrationOpen: true,
        maxParticipants: 50,
        currentParticipants: 0,
        price: 15000,
        requirements: [
          "Nivel intermedio-avanzado",
          "Conocimientos básicos de finales"
        ],
        organizerId: 1,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        status: "published",
        tags: ["masterclass", "finales", "torres", "avanzado"],
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
          torneo: eventosIniciales.filter(e => e.type === 'torneo').length
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