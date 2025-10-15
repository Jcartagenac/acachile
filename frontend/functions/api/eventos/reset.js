// Endpoint temporal para resetear eventos con datos de ACA Chile (SIN autenticación)
// POST /api/eventos/reset - Resetear eventos con datos actualizados

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
    // Inicializar datos directamente sin autenticación
    await resetEventosData(env);

    return new Response(JSON.stringify({
      success: true,
      message: 'Eventos de ACA Chile inicializados exitosamente',
      count: 5
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error) {
    console.error('Error in eventos/reset endpoint:', error);
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

// Función para resetear eventos con datos de ACA Chile
async function resetEventosData(env) {
  try {
    const now = new Date();
    
    // Eventos actualizados de la Asociación Chilena de Asadores
    const eventosACA = [
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
        tags: ["taller", "principiantes", "asado", "técnicas"],
        contactInfo: {
          email: "talleres@acachile.cl",
          phone: "+56923456789"
        }
      },
      {
        id: 3,
        title: "Encuentro Regional de Asadores Zona Centro",
        date: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +14 días
        time: "12:00",
        location: "Club de Campo Los Leones",
        description: "Reunión de asadores de la zona centro del país. Intercambio de experiencias, técnicas regionales y degustación de especialidades locales. Actividad familiar con área para niños.",
        image: "/api/images?path=eventos/encuentro-asadores.jpg",
        type: "encuentro",
        registrationOpen: true,
        maxParticipants: 80,
        currentParticipants: 0,
        price: 15000,
        requirements: [
          "Residir en zona centro (RM, V, VI región)",
          "Traer especialidad regional para compartir",
          "Inscripción previa obligatoria"
        ],
        organizerId: 1,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        status: "published",
        tags: ["encuentro", "regional", "centro", "intercambio"],
        contactInfo: {
          email: "regiones@acachile.cl",
          phone: "+56934567890"
        }
      },
      {
        id: 4,
        title: "Competencia de Asado Rápido",
        date: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +21 días
        time: "16:00",
        location: "Plaza de Armas de Rancagua",
        description: "Desafío de velocidad y sabor. Los participantes deben preparar un asado completo en tiempo récord manteniendo la calidad. Categorías por experiencia y premiación especial.",
        image: "/api/images?path=eventos/competencia-rapida.jpg",
        type: "competencia",
        registrationOpen: true,
        maxParticipants: 40,
        currentParticipants: 0,
        price: 35000,
        requirements: [
          "Experiencia mínima de 2 años en asado",
          "Traer herramientas propias",
          "Seguro de accidentes personal",
          "Certificado médico de aptitud"
        ],
        organizerId: 1,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        status: "published",
        tags: ["competencia", "rapidez", "desafío", "rancagua"],
        contactInfo: {
          email: "competencias@acachile.cl",
          phone: "+56945678901"
        }
      },
      {
        id: 5,
        title: "Masterclass: Asado Patagónico Tradicional",
        date: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +45 días
        time: "11:00",
        location: "Estancia El Calafate, Región de Magallanes",
        description: "Clase magistral sobre las técnicas ancestrales del asado patagónico. Aprende el manejo del cordero al palo, cocción a fuego abierto y marinados tradicionales de la zona austral.",
        image: "/api/images?path=eventos/masterclass-parrilla.jpg",
        type: "masterclass",
        registrationOpen: true,
        maxParticipants: 15,
        currentParticipants: 0,
        price: 150000,
        requirements: [
          "Nivel intermedio o avanzado en asado",
          "Alojamiento incluido (2 noches)",
          "Traer ropa de abrigo adecuada",
          "Vuelos no incluidos"
        ],
        organizerId: 1,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        status: "published",
        tags: ["masterclass", "patagonia", "tradicional", "cordero"],
        contactInfo: {
          email: "masterclass@acachile.cl",
          phone: "+56956789012"
        }
      }
    ];

    // Limpiar datos existentes y guardar nuevos
    console.log('Resetting eventos data with ACA Chile content...');
    
    // Guardar cada evento individualmente
    for (const evento of eventosACA) {
      await env.ACA_KV.put(`evento:${evento.id}`, JSON.stringify(evento));
    }

    // Guardar índice de eventos
    const eventosIndex = eventosACA.map(e => ({ id: e.id, title: e.title, date: e.date, type: e.type }));
    await env.ACA_KV.put('eventos:index', JSON.stringify(eventosIndex));

    console.log(`Successfully reset ${eventosACA.length} eventos with ACA Chile data`);
    
    return {
      success: true,
      count: eventosACA.length,
      eventos: eventosACA.map(e => ({ id: e.id, title: e.title, image: e.image }))
    };

  } catch (error) {
    console.error('Error resetting eventos data:', error);
    throw error;
  }
}