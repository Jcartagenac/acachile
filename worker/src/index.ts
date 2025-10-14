/**
 * ACA Chile Cloudflare Worker
 * API Backend para la Asociación Chilena de Asadores
 */

export interface Env {
  ACA_KV: KVNamespace;
  ENVIRONMENT: string;
  JWT_SECRET?: string;
  ADMIN_EMAIL?: string;
  CORS_ORIGIN?: string;
}

// CORS headers para permitir requests del frontend
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Manejar preflight CORS requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders,
      });
    }

    const url = new URL(request.url);
    
    try {
      // Router básico
      switch (url.pathname) {
        case '/':
          return handleHome();
        
        case '/api/health':
          return handleHealth();
        
        case '/api/eventos':
          return handleEventos(request, env);
        
        case '/api/noticias':
          return handleNoticias(request, env);
        
        case '/api/auth/login':
          return handleLogin(request, env);
        
        case '/api/auth/register':
          return handleRegister(request, env);
        
        case '/api/auth/profile':
          return handleProfile(request, env);
        
        default:
          // Handle dynamic routes
          if (url.pathname.startsWith('/api/eventos/')) {
            return handleEventosById(request, env);
          }
          
          return new Response('Not Found', { 
            status: 404,
            headers: corsHeaders 
          });
      }
    } catch (error) {
      console.error('Worker error:', error);
      return new Response('Internal Server Error', { 
        status: 500,
        headers: corsHeaders 
      });
    }
  },
};

// Handlers
function handleHome(): Response {
  return new Response(JSON.stringify({
    message: 'ACA Chile Worker API',
    version: '1.0.0',
    endpoints: [
      '/api/health',
      '/api/eventos',
      '/api/noticias'
    ]
  }), {
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
}

function handleHealth(): Response {
  return new Response(JSON.stringify({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'ACA Chile Worker'
  }), {
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
}

async function handleEventos(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const method = request.method;

  // GET /api/eventos - Listar eventos con filtros
  if (method === 'GET') {
    const type = url.searchParams.get('type');
    const status = url.searchParams.get('status') || 'published';
    const search = url.searchParams.get('search');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '12');

    // Datos de ejemplo más completos
    let eventos = [
      {
        id: 1,
        title: 'Campeonato Nacional de Asadores 2025',
        date: '2025-11-15',
        time: '09:00',
        location: 'Parque O\'Higgins, Santiago',
        description: 'El evento más importante del año para asadores chilenos. Competencia por categorías con premiación especial y degustación para el público.',
        image: 'https://acachile.com/wp-content/uploads/2025/03/64694334-bbdc-4e97-b4a7-ef75e6bbe50d-500x375.jpg',
        type: 'campeonato' as const,
        registrationOpen: true,
        maxParticipants: 50,
        currentParticipants: 32,
        price: 15000,
        organizerId: 1,
        createdAt: '2024-10-01T10:00:00Z',
        updatedAt: '2024-10-14T15:30:00Z',
        status: 'published' as const,
        requirements: ['Parrilla propia', 'Implementos de cocina', 'Delantal'],
        tags: ['campeonato', 'nacional', 'asadores'],
        contactInfo: {
          email: 'campeonato@acachile.com',
          phone: '+56912345678'
        }
      },
      {
        id: 2,
        title: 'Taller: Técnicas de Ahumado',
        date: '2025-10-25',
        time: '14:00',
        location: 'Escuela Culinaria ACA, Las Condes',
        description: 'Aprende las mejores técnicas de ahumado con el chef internacional Pablo Ibáñez. Incluye degustación y certificado.',
        image: 'https://acachile.com/wp-content/uploads/2025/06/post-_2025-12-500x375.png',
        type: 'taller' as const,
        registrationOpen: true,
        maxParticipants: 20,
        currentParticipants: 8,
        price: 45000,
        organizerId: 1,
        createdAt: '2024-09-15T09:00:00Z',
        updatedAt: '2024-10-10T11:20:00Z',
        status: 'published' as const,
        requirements: ['Sin experiencia previa necesaria'],
        tags: ['taller', 'ahumado', 'técnicas'],
        contactInfo: {
          email: 'talleres@acachile.com',
          phone: '+56987654321'
        }
      },
      {
        id: 3,
        title: 'Encuentro Regional Valparaíso',
        date: '2025-12-08',
        time: '11:00',
        location: 'Viña del Mar, Quinta Región',
        description: 'Encuentro gastronómico regional con asadores de la V Región. Actividades familiares y competencias amistosas.',
        image: 'https://acachile.com/wp-content/uploads/2024/08/post-alemania-500x375.jpg',
        type: 'encuentro' as const,
        registrationOpen: true,
        maxParticipants: undefined,
        currentParticipants: 15,
        price: 0,
        organizerId: 2,
        createdAt: '2024-10-05T16:00:00Z',
        updatedAt: '2024-10-12T09:45:00Z',
        status: 'published' as const,
        requirements: ['Solo ganas de compartir'],
        tags: ['encuentro', 'regional', 'familia'],
        contactInfo: {
          email: 'valparaiso@acachile.com'
        }
      },
      {
        id: 4,
        title: 'Torneo de Costillares',
        date: '2025-11-30',
        time: '10:00',
        location: 'Club de Campo Los Leones',
        description: 'Torneo especializado en preparación de costillares. Modalidad equipos de 3 personas.',
        image: 'https://acachile.com/wp-content/uploads/2024/08/1697587321850-500x375.jpg',
        type: 'torneo' as const,
        registrationOpen: false,
        maxParticipants: 30,
        currentParticipants: 30,
        price: 25000,
        organizerId: 1,
        createdAt: '2024-09-20T12:00:00Z',
        updatedAt: '2024-10-01T14:15:00Z',
        status: 'published' as const,
        requirements: ['Equipo de 3 personas', 'Costillar por equipo'],
        tags: ['torneo', 'costillares', 'equipos'],
        contactInfo: {
          email: 'torneos@acachile.com',
          website: 'https://torneos.acachile.com'
        }
      }
    ];

    // Aplicar filtros
    if (type) {
      eventos = eventos.filter(evento => evento.type === type);
    }

    if (status) {
      eventos = eventos.filter(evento => evento.status === status);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      eventos = eventos.filter(evento => 
        evento.title.toLowerCase().includes(searchLower) ||
        evento.description.toLowerCase().includes(searchLower) ||
        evento.location.toLowerCase().includes(searchLower)
      );
    }

    // Paginación
    const total = eventos.length;
    const pages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedEventos = eventos.slice(startIndex, endIndex);

    return new Response(JSON.stringify({
      success: true,
      data: paginatedEventos,
      pagination: {
        page,
        limit,
        total,
        pages
      }
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }

  // POST /api/eventos - Crear nuevo evento
  if (method === 'POST') {
    try {
      const body = await request.json() as any;
      
      // Simular creación de evento
      const nuevoEvento = {
        id: Date.now(),
        ...body,
        currentParticipants: 0,
        organizerId: 1, // TODO: Obtener del token
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'published' as const
      };

      return new Response(JSON.stringify({
        success: true,
        data: nuevoEvento,
        message: 'Evento creado exitosamente'
      }), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Error al crear evento'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }
  }

  return new Response('Method not allowed', {
    status: 405,
    headers: corsHeaders,
  });
}

async function handleNoticias(request: Request, env: Env): Promise<Response> {
  // Ejemplo de datos de noticias
  const noticias = [
    {
      id: 1,
      title: 'Chile Brilla en Campeonato Internacional',
      date: '2024-09-15',
      excerpt: 'Equipo QUINTA PARRILLA logra tercer lugar en competencia internacional.',
      image: 'https://acachile.com/wp-content/uploads/2024/08/1697587321850-500x375.jpg'
    },
    {
      id: 2,
      title: 'ACA en el Mundial de Alemania',
      date: '2024-07-28',
      excerpt: 'Tres equipos chilenos compitieron en Stuttgart contra 106 equipos.',
      image: 'https://acachile.com/wp-content/uploads/2024/08/post-alemania-500x375.jpg'
    }
  ];

  return new Response(JSON.stringify(noticias), {
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
}

// Funciones de autenticación
async function handleLogin(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    const body = await request.json() as { email: string; password: string };
    const { email, password } = body;

    // Validación básica
    if (!email || !password) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Email y contraseña son requeridos'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    // Usuarios de demo (en producción usar base de datos)
    const demoUsers = [
      {
        id: 1,
        email: 'admin@acachile.com',
        password: '123456', // En producción usar hash
        name: 'Administrador ACA',
        membershipType: 'vip',
        region: 'Metropolitana',
        joinDate: '2024-01-01',
        active: true
      },
      {
        id: 2,
        email: 'usuario@acachile.com',
        password: '123456',
        name: 'Usuario Demo',
        membershipType: 'basic',
        region: 'Valparaíso',
        joinDate: '2024-06-15',
        active: true
      }
    ];

    const user = demoUsers.find(u => u.email === email && u.password === password);
    
    if (!user) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Credenciales inválidas'
      }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    // Crear token JWT simple (en producción usar librería JWT)
    const token = btoa(JSON.stringify({
      userId: user.id,
      email: user.email,
      exp: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 días
    }));

    // Respuesta sin la contraseña
    const { password: _, ...userResponse } = user;

    return new Response(JSON.stringify({
      success: true,
      data: {
        user: userResponse,
        token,
        expiresAt: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)).toISOString()
      }
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error) {
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

async function handleRegister(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    const body = await request.json() as { 
      email: string; 
      password: string; 
      name: string; 
      phone?: string; 
      region?: string; 
    };
    const { email, password, name, phone, region } = body;

    // Validación básica
    if (!email || !password || !name) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Email, contraseña y nombre son requeridos'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    // Simulación de registro exitoso
    const newUser = {
      id: Date.now(),
      email,
      name,
      phone: phone || null,
      region: region || null,
      membershipType: 'basic',
      joinDate: new Date().toISOString().split('T')[0],
      active: true
    };

    // Crear token
    const token = btoa(JSON.stringify({
      userId: newUser.id,
      email: newUser.email,
      exp: Date.now() + (7 * 24 * 60 * 60 * 1000)
    }));

    return new Response(JSON.stringify({
      success: true,
      data: {
        user: newUser,
        token,
        expiresAt: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)).toISOString()
      },
      message: 'Cuenta creada exitosamente'
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error) {
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

async function handleProfile(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'GET') {
    return new Response('Method not allowed', {
      status: 405,
      headers: corsHeaders,
    });
  }

  // TODO: Implementar verificación de token
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

  return new Response(JSON.stringify({
    success: true,
    message: 'Perfil de usuario (implementar)'
  }), {
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
}

// Manejar rutas específicas de eventos (/api/eventos/:id)
async function handleEventosById(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const eventId = parseInt(pathParts[3]);

  if (isNaN(eventId)) {
    return new Response(JSON.stringify({
      success: false,
      error: 'ID de evento inválido'
    }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }

  // GET /api/eventos/:id - Obtener evento específico
  if (request.method === 'GET') {
    // Evento de ejemplo (normalmente desde base de datos)
    const evento = {
      id: eventId,
      title: 'Campeonato Nacional de Asadores 2025',
      date: '2025-11-15',
      time: '09:00',
      location: 'Parque O\'Higgins, Santiago',
      description: 'El evento más importante del año para asadores chilenos. Competencia por categorías con premiación especial y degustación para el público.\n\nEn este campeonato nacional participarán los mejores asadores de todas las regiones del país, compitiendo en diferentes categorías como mejor asado, mejor chorizo, y mejor acompañamiento.\n\nEl evento incluye:\n- Competencias oficiales por categorías\n- Degustación abierta al público\n- Actividades para toda la familia\n- Premiación con trofeos y premios en efectivo\n- Música en vivo y entretenimiento',
      image: 'https://acachile.com/wp-content/uploads/2025/03/64694334-bbdc-4e97-b4a7-ef75e6bbe50d-500x375.jpg',
      type: 'campeonato' as const,
      registrationOpen: true,
      maxParticipants: 50,
      currentParticipants: 32,
      price: 15000,
      organizerId: 1,
      createdAt: '2024-10-01T10:00:00Z',
      updatedAt: '2024-10-14T15:30:00Z',
      status: 'published' as const,
      requirements: [
        'Parrilla propia (tamaño mínimo 60x40cm)',
        'Implementos de cocina básicos',
        'Delantal y gorro de cocinero',
        'Carne proporcionada por la organización'
      ],
      tags: ['campeonato', 'nacional', 'asadores', '2025'],
      contactInfo: {
        email: 'campeonato@acachile.com',
        phone: '+56912345678',
        website: 'https://campeonato.acachile.com'
      }
    };

    return new Response(JSON.stringify({
      success: true,
      data: evento
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }

  // PUT /api/eventos/:id - Actualizar evento
  if (request.method === 'PUT') {
    try {
      const body = await request.json() as any;
      
      // TODO: Verificar permisos y actualizar en base de datos
      const eventoActualizado = {
        id: eventId,
        ...body,
        updatedAt: new Date().toISOString()
      };

      return new Response(JSON.stringify({
        success: true,
        data: eventoActualizado,
        message: 'Evento actualizado exitosamente'
      }), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Error al actualizar evento'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }
  }

  // DELETE /api/eventos/:id - Eliminar evento
  if (request.method === 'DELETE') {
    // TODO: Verificar permisos y eliminar de base de datos
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Evento eliminado exitosamente'
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }

  return new Response('Method not allowed', {
    status: 405,
    headers: corsHeaders,
  });
}