/**
 * Handlers para endpoints de inscripciones
 * ACA Chile - Sistema de inscripciones a eventos
 */

import {
  inscribirseEvento,
  cancelarInscripcion,
  getInscripcionesUsuario,
  getInscripcionesEvento
} from './inscripciones-service';

import { findUserById } from './user-migration';

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

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Inscribirse a un evento: POST /api/eventos/:id/inscribirse
export async function handleInscribirseEvento(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', {
      status: 405,
      headers: corsHeaders,
    });
  }

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

    // TODO: Decodificar JWT real para obtener usuario
    // Por ahora simulamos obtener el usuario
    const token = authHeader.substring(7);
    const decoded = JSON.parse(atob(token)); // Decodificación simple
    const userId = decoded.userId || 1;

    // Buscar información del usuario
    const user = await findUserById(userId, env);
    if (!user) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Usuario no encontrado'
      }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    // Extraer eventId de la URL
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

    // Obtener datos del cuerpo de la petición
    let body: any = {};
    try {
      body = await request.json();
    } catch (e) {
      // Si no hay body es válido
    }
    const { notes } = body || {};

    // Inscribirse al evento
    const result = await inscribirseEvento(env, userId, eventId, user, notes);

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 400,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Error interno al procesar inscripción'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
}

// Obtener mis inscripciones: GET /api/mis-inscripciones
export async function handleMisInscripciones(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'GET') {
    return new Response('Method not allowed', {
      status: 405,
      headers: corsHeaders,
    });
  }

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

    // TODO: Decodificar JWT real
    const token = authHeader.substring(7);
    const decoded = JSON.parse(atob(token));
    const userId = decoded.userId || 1;

    // Obtener inscripciones del usuario
    const result = await getInscripcionesUsuario(env, userId);

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Error obteniendo inscripciones'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
}

// Cancelar inscripción: DELETE /api/inscripciones/:id
export async function handleCancelarInscripcion(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'DELETE') {
    return new Response('Method not allowed', {
      status: 405,
      headers: corsHeaders,
    });
  }

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

    // TODO: Decodificar JWT real
    const token = authHeader.substring(7);
    const decoded = JSON.parse(atob(token));
    const userId = decoded.userId || 1;

    // Extraer inscription ID de la URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const inscriptionId = pathParts[3];

    if (!inscriptionId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'ID de inscripción requerido'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    // Cancelar inscripción
    const result = await cancelarInscripcion(env, userId, inscriptionId);

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 400,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Error cancelando inscripción'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
}

// Obtener inscripciones de un evento (admin): GET /api/eventos/:id/inscripciones
export async function handleInscripcionesEvento(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'GET') {
    return new Response('Method not allowed', {
      status: 405,
      headers: corsHeaders,
    });
  }

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

    // TODO: Verificar permisos de admin o organizador del evento

    // Extraer eventId de la URL
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

    // Obtener inscripciones del evento
    const result = await getInscripcionesEvento(env, eventId);

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Error obteniendo inscripciones del evento'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
}