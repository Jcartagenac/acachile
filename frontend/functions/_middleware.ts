import type { PagesFunction, Env } from './types';

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

// Verificar JWT token
function verifyToken(token: string, jwtSecret: string): any {
  try {
    // Implementación simplificada de JWT verification
    // En producción usar una librería como jose o similar
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }
    
    const payload = JSON.parse(atob(parts[1]));
    
    // Verificar expiración
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      throw new Error('Token expired');
    }
    
    return payload;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

// Middleware principal
export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env, next } = context;
  const url = new URL(request.url);
  
  console.log(`[MIDDLEWARE] ${request.method} ${url.pathname}`);
  
  // Manejar preflight OPTIONS requests
  if (request.method === 'OPTIONS') {
    return handleOptions(env.CORS_ORIGIN);
  }
  
  // Continuar con la siguiente función
  try {
    const response = await next();
    
    // Agregar headers CORS a todas las respuestas
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
export function requireAuth(request: Request, env: Env): any {
  const authorization = request.headers.get('Authorization');
  
  if (!authorization) {
    throw new Error('Authorization header required');
  }
  
  const token = authorization.replace('Bearer ', '');
  if (!token) {
    throw new Error('Valid token required');
  }
  
  if (!env.JWT_SECRET) {
    throw new Error('JWT_SECRET not configured');
  }
  
  return verifyToken(token, env.JWT_SECRET);
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
  details?: any
): Response {
  return jsonResponse({
    success: false,
    error: message,
    ...(details && { details })
  }, status);
}