import type { PagesFunction, Env } from './types';
import { verifyToken } from './utils/jwt';
import { validateEnv } from './utils/env';

/**
 * Middleware de CORS y autenticación para Pages Functions
 */

// Configurar CORS headers
function setCORSHeaders(response: Response, origin?: string): Response {
  const corsOrigin = origin || '*';

  response.headers.set('Access-Control-Allow-Origin', corsOrigin);
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Max-Age', '86400');

  return response;
}

// Manejar preflight OPTIONS requests
function handleOptions(origin?: string): Response {
  const response = new Response(null, { status: 204 });
  return setCORSHeaders(response, origin);
}



// Middleware principal - Solo aplicar a rutas de API
export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env, next } = context;
  const url = new URL(request.url);

  // Solo aplicar middleware a rutas de API
  if (!url.pathname.startsWith('/api/')) {
    return next();
  }

  // Validar bindings críticos
  try {
    validateEnv(env);
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Server configuration error',
        message: error instanceof Error ? error.message : 'Missing critical bindings'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  // console.log(`[MIDDLEWARE] ${request.method} ${url.pathname}`);

  // Manejar preflight OPTIONS requests
  if (request.method === 'OPTIONS') {
    return handleOptions(env.CORS_ORIGIN);
  }

  // Continuar con la siguiente función
  try {
    const response = await next();

    // Agregar headers CORS solo a respuestas de API
    return setCORSHeaders(response, env.CORS_ORIGIN);
  } catch (error) {
    console.error('[MIDDLEWARE] Error:', error);

    const errorResponse = new Response(
      JSON.stringify({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );

    return setCORSHeaders(errorResponse, env.CORS_ORIGIN);
  }
};

// Utilidad para verificar autenticación en rutas protegidas
export async function requireAuth(request: Request, env: Env): Promise<{ userId: number } & Record<string, unknown>> {
  const authorization = request.headers.get('Authorization');

  if (!authorization) {
    throw new Error('Authorization header required');
  }

  const token = authorization.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    throw new Error('Valid token required');
  }

  if (!env.JWT_SECRET) {
    throw new Error('JWT_SECRET not configured');
  }

  const payload = await verifyToken(token, env.JWT_SECRET);

  // Extract user id from common JWT fields
  const idCandidate = payload && (payload.userId || payload.user_id || payload.sub || payload.id);

  if (!idCandidate) {
    throw new Error('Invalid token payload: missing user id');
  }

  const userId = Number(idCandidate);
  if (!Number.isFinite(userId) || userId <= 0) {
    throw new Error('Invalid token payload: user id is not a valid number');
  }

  // Attach normalized userId to payload for backward compatibility
  try {
    payload.userId = userId;
  } catch (e) {
    // If payload is not an object, ignore
  }

  // Return payload (augmented) to keep compatibility with existing code that
  // expects token payload fields such as `role`, `email`, etc.
  return payload as { userId: number } & Record<string, unknown>;
}

function normalizeRole(role: unknown): string | null {
  if (!role || typeof role !== 'string') {
    return null;
  }
  return role.toLowerCase();
}

export function getUserRole(payload: any): string | null {
  const directRole = normalizeRole(payload?.role);
  if (directRole) {
    return directRole;
  }

  if (Array.isArray(payload?.roles) && payload.roles.length > 0) {
    const primaryRole = normalizeRole(payload.roles[0]);
    if (primaryRole) {
      return primaryRole;
    }
  }

  const legacyRole = normalizeRole(payload?.userRole);
  return legacyRole;
}

function buildUnauthorizedError(message: string, status: number = 403): Error {
  const error = new Error(message);
  (error as any).status = status;
  return error;
}

export async function requireRole(
  request: Request,
  env: Env,
  allowedRoles: string[] = ['admin']
): Promise<{ userId: number } & Record<string, unknown>> {
  const authPayload = await requireAuth(request, env);
  const role = getUserRole(authPayload);

  if (!role) {
    throw buildUnauthorizedError('User role missing', 403);
  }

  const normalizedAllowed = new Set(allowedRoles.map(r => r.toLowerCase()));

  if (role === 'super_admin' || normalizedAllowed.has(role)) {
    try {
      authPayload.role = role;
      if (!Array.isArray(authPayload.roles) || authPayload.roles.length === 0) {
        authPayload.roles = [role];
      }
    } catch (error) {
      // ignore immutable payload
    }
    return authPayload;
  }

  throw buildUnauthorizedError('Permission denied', 403);
}

export async function requireAdmin(request: Request, env: Env) {
  return requireRole(request, env, ['admin']);
}

export async function requireAdminOrDirector(request: Request, env: Env) {
  return requireRole(request, env, ['admin', 'director', 'director_editor']);
}

export function authErrorResponse(
  error: unknown,
  env: Env,
  defaultMessage: string = 'Autenticación requerida',
  headers?: Record<string, string>
): Response {
  const status =
    typeof (error as any)?.status === 'number'
      ? (error as any).status
      : 401;
  const message = error instanceof Error ? error.message : defaultMessage;

  return errorResponse(
    message,
    status,
    env.ENVIRONMENT === 'development'
      ? { details: error instanceof Error ? error.stack || error.message : String(error) }
      : undefined,
    headers
  );
}

// Utilidad para crear respuestas JSON
export function jsonResponse(
  data: any,
  status: number = 200,
  headers: Record<string, string> = {}
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  });
}

// Utilidad para crear respuestas de error
export function errorResponse(
  message: string,
  status: number = 400,
  details?: any,
  headers?: Record<string, string>
): Response {
  return jsonResponse({
    success: false,
    error: message,
    ...(details && { details })
  }, status, headers);
}
