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
  RESEND_API_KEY?: string;
  FROM_EMAIL?: string;
  FRONTEND_URL?: string;
}

// Importamos las funciones de autenticación
import {
  handleForgotPassword,
  handleResetPassword,
  handleChangePassword,
  handlePendingRegistrations,
  handleApproveRegistration,
  handleRejectRegistration
} from './auth-system';

// Importamos las funciones de migración y gestión de usuarios
import {
  migrateUsersToKV,
  findUserByEmail,
  findUserById,
  verifyUserPassword,
  updateUserPassword,
  getNextUserId,
  getAllUsers
} from './user-migration';

// Importamos las funciones de gestión de eventos
import {
  initializeEventos,
  getEventos,
  getEventoById,
  createEvento,
  updateEvento,
  deleteEvento
} from './eventos-service';

// Importamos el handler de inicialización de eventos
import { handleInitEventos } from './eventos-handler';

// Importamos los handlers de inscripciones
import {
  handleInscribirseEvento,
  handleMisInscripciones,
  handleCancelarInscripcion,
  handleInscripcionesEvento
} from './inscripciones-handlers';

// CORS headers para permitir requests del frontend
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Permitimos todos los orígenes por simplicidad
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
        
        case '/api/admin/migrate-users':
          return handleMigrateUsers(request, env);
        
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
        
        case '/api/auth/forgot-password':
          return handleForgotPassword(request, env);
        
        case '/api/auth/reset-password':
          return handleResetPassword(request, env);
        
        case '/api/auth/change-password':
          return handleChangePassword(request, env);
        
        case '/api/admin/registrations/pending':
          return handlePendingRegistrations(request, env);
        
        case '/api/admin/registrations/approve':
          return handleApproveRegistration(request, env);
        
        case '/api/admin/registrations/reject':
          return handleRejectRegistration(request, env);
        
        case '/api/admin/eventos/init':
          return handleInitEventos(request, env);
        
        case '/api/mis-inscripciones':
          return handleMisInscripciones(request, env);
        
        default:
          // Handle dynamic routes
          if (url.pathname.startsWith('/api/eventos/') && url.pathname.includes('/inscribirse')) {
            return handleInscribirseEvento(request, env);
          }
          
          if (url.pathname.startsWith('/api/eventos/') && url.pathname.includes('/inscripciones')) {
            return handleInscripcionesEvento(request, env);
          }
          
          if (url.pathname.startsWith('/api/inscripciones/')) {
            return handleCancelarInscripcion(request, env);
          }
          
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

    // Obtener eventos desde KV con filtros
    const result = await getEventos(env, {
      type: type || undefined,
      status: status,
      search: search || undefined,
      page,
      limit
    });

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
      data: result.data,
      pagination: result.pagination
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
      // Verificar autenticación
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

      // TODO: Verificar y decodificar JWT para obtener userId
      const userId = 1; // Por ahora usamos un ID fijo

      const eventoData = await request.json() as any;
      
      // Crear evento en KV
      const result = await createEvento(env, eventoData, userId);

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

// Función de migración de usuarios
async function handleMigrateUsers(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    // Ejecutar migración automáticamente al hacer el primer deploy
    const result = await migrateUsersToKV(env);
    
    return new Response(JSON.stringify(result), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Error interno durante la migración'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
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

    // Buscar usuario en KV storage
    const user = await findUserByEmail(email, env);
    
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

    // Verificar contraseña usando KV storage
    const passwordValid = await verifyUserPassword(user.id, password, env);
    
    if (!passwordValid) {
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
      motivation?: string;
      experience?: string;
      references?: string;
      preferredRole?: 'user' | 'organizer';
    };
    const { email, password, name, phone, region, motivation, experience, references, preferredRole } = body;

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

    // Verificar si el email ya existe (en usuarios existentes y pendientes)
    const existingUsers = await env.ACA_KV.get('users:all');
    const pendingRegistrations = await env.ACA_KV.get('registrations:pending');
    
    if (existingUsers) {
      const users = JSON.parse(existingUsers);
      if (users.find((u: any) => u.email === email)) {
        return new Response(JSON.stringify({
          success: false,
          error: 'El email ya está registrado'
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        });
      }
    }

    if (pendingRegistrations) {
      const pending = JSON.parse(pendingRegistrations);
      if (pending.find((p: any) => p.userData.email === email)) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Ya existe una solicitud de registro pendiente con este email'
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        });
      }
    }

    // Crear solicitud de registro pendiente
    const registrationId = `reg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const pendingRegistration = {
      id: registrationId,
      userData: {
        email,
        password: btoa(password), // Codificar password (en producción usar hash)
        name,
        phone: phone || null,
        region: region || null,
        motivation: motivation || null,
        experience: experience || null,
        references: references || null,
        preferredRole: preferredRole || 'user'
      },
      status: 'pending',
      submittedAt: new Date().toISOString()
    };

    // Guardar en KV
    const currentPending = pendingRegistrations ? JSON.parse(pendingRegistrations) : [];
    currentPending.push(pendingRegistration);
    await env.ACA_KV.put('registrations:pending', JSON.stringify(currentPending));

    return new Response(JSON.stringify({
      success: true,
      message: 'Solicitud de registro enviada exitosamente. Un administrador revisará tu solicitud pronto.',
      data: {
        registrationId,
        status: 'pending',
        submittedAt: pendingRegistration.submittedAt
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
    const result = await getEventoById(env, eventId);

    if (!result.success) {
      return new Response(JSON.stringify({
        success: false,
        error: result.error
      }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      data: result.data
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
      // Verificar autenticación
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

      // TODO: Verificar y decodificar JWT para obtener userId
      const userId = 1; // Por ahora usamos un ID fijo

      const eventoData = await request.json() as any;
      
      const result = await updateEvento(env, eventId, eventoData, userId);

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
    try {
      // Verificar autenticación
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

      // TODO: Verificar y decodificar JWT para obtener userId
      const userId = 1; // Por ahora usamos un ID fijo

      const result = await deleteEvento(env, eventId, userId);

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
        message: 'Evento eliminado exitosamente'
      }), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Error al eliminar evento'
      }), {
        status: 500,
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