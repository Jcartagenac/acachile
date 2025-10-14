/**
 * ACA Chile Cloudflare Worker
 * API Backend para la Asociación Chilena de Asadores
 */

export interface Env {
  ACA_KV: KVNamespace;
  ENVIRONMENT: string;
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
  // Ejemplo de datos de eventos
  const eventos = [
    {
      id: 1,
      title: 'Campeonato Nacional de Asadores',
      date: '2025-11-15',
      location: 'Santiago, Chile',
      description: 'El evento más importante del año para asadores chilenos.',
      image: 'https://acachile.com/wp-content/uploads/2025/03/64694334-bbdc-4e97-b4a7-ef75e6bbe50d-500x375.jpg'
    },
    {
      id: 2,
      title: 'Fuego y Sabor Internacional',
      date: '2025-11-22',
      location: 'Valparaíso, Chile',
      description: 'Competencia internacional con participantes de toda América.',
      image: 'https://acachile.com/wp-content/uploads/2024/08/post-alemania-500x375.jpg'
    }
  ];

  return new Response(JSON.stringify(eventos), {
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
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