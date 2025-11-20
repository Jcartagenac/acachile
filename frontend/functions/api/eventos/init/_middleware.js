// Endpoint para inicialización de eventos (solo admin)
// POST /api/eventos/init - Inicializar eventos con datos de ejemplo

export async function onRequestPost(context) {
  const { request, env } = context;

  const corsHeaders = {
    'Access-Control-Allow-Origin': env.CORS_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ success: false, error: 'Token de autorización requerido' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const result = await initializeEventos(env.DB);

    if (!result.success) {
      return new Response(JSON.stringify({ success: false, error: result.error }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: result.message,
      data: result.data
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error) {
    console.error('Error in eventos/init endpoint:', error);
    return new Response(JSON.stringify({ success: false, error: 'Error interno del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}

export async function onRequestOptions(context) {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
}

// Función para inicializar eventos con datos de ejemplo en D1
async function initializeEventos(db) {
  try {
    const now = new Date();
    const eventosIniciales = [
      {
        title: "Campeonato Nacional de Asado 2024",
        date: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        time: "10:00",
        location: "Parque O'Higgins, Santiago",
        description: "El evento más importante del año para los asadores de Chile. Competencia oficial con jurado internacional.",
        image: "/api/images?path=eventos/campeonato-nacional-asado.jpg",
        type: "campeonato",
        status: "published",
        registration_open: true,
        max_participants: 100,
        price: 50000,
        organizer_id: 1,
      },
      {
        title: "Taller de Asado para Principiantes",
        date: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        time: "15:00",
        location: "Sede ACA Chile",
        description: "Aprende las técnicas fundamentales del asado chileno con nuestros maestros asadores.",
        image: "/api/images?path=eventos/taller-principiantes-asado.jpg",
        type: "taller",
        status: "published",
        registration_open: true,
        max_participants: 20,
        price: 25000,
        organizer_id: 1,
      },
      {
        title: "Encuentro de Asadores del Fin de Semana",
        date: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        time: "12:00",
        location: "Quintas de Recreo Las Condes",
        description: "Encuentro informal para compartir experiencias y disfrutar de un buen asado.",
        image: "/api/images?path=eventos/encuentro-asadores.jpg",
        type: "encuentro",
        status: "published",
        registration_open: true,
        max_participants: null,
        price: 0,
        organizer_id: 1,
      },
      {
        title: "Competencia de Asado Rápido",
        date: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        time: "11:00",
        location: "Centro de Eventos ACA",
        description: "Desafío contra el tiempo para preparar un asado completo en tiempo récord.",
        image: "/api/images?path=eventos/competencia-rapida.jpg",
        type: "competencia",
        status: "published",
        registration_open: true,
        max_participants: 40,
        price: 15000,
        organizer_id: 1,
      },
      {
        title: "Masterclass: Parrilla Argentina",
        date: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000).toISOString(),
        time: "14:00",
        location: "Auditorio Gourmet, Hotel Ritz Carlton",
        description: "Clase magistral sobre técnicas de parrilla argentina con un chef invitado.",
        image: "/api/images?path=eventos/masterclass-parrilla.jpg",
        type: "masterclass",
        status: "published",
        registration_open: true,
        max_participants: 30,
        price: 45000,
        organizer_id: 1,
      },
    ];

    // Limpiar tablas (solo eventos por ahora)
    await db.exec('DELETE FROM eventos');

    // Preparar inserción
    const stmt = db.prepare(`
      INSERT INTO eventos (title, description, date, time, location, image, type, status, registration_open, max_participants, price, organizer_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertions = eventosIniciales.map(evento =>
      stmt.bind(
        evento.title,
        evento.description,
        evento.date,
        evento.time,
        evento.location,
        evento.image,
        evento.type,
        evento.status,
        evento.registration_open,
        evento.max_participants,
        evento.price,
        evento.organizer_id
      )
    );

    await db.batch(insertions);

    return {
      success: true,
      message: `${eventosIniciales.length} eventos han sido inicializados en la base de datos.`,
      data: { eventosCreados: eventosIniciales.length }
    };

  } catch (error) {
    console.error('Error in initializeEventos (D1):', error);
    return {
      success: false,
      error: 'Error al inicializar eventos en la base de datos'
    };
  }
}
