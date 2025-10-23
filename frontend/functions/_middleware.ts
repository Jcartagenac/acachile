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

function base64UrlToUint8Array(base64Url: string): Uint8Array {
  let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }

  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

// Verificar JWT token
async function verifyToken(token: string, jwtSecret: string): Promise<any> {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid token format');
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;

  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(jwtSecret);
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const signatureBytes = base64UrlToUint8Array(encodedSignature);
    const dataBytes = encoder.encode(`${encodedHeader}.${encodedPayload}`);

    const isValid = await crypto.subtle.verify('HMAC', key, signatureBytes, dataBytes);
    if (!isValid) {
      throw new Error('Invalid token signature');
    }

    const payloadBytes = base64UrlToUint8Array(encodedPayload);
    const payloadJson = new TextDecoder().decode(payloadBytes);
    const payload = JSON.parse(payloadJson);

    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      throw new Error('Token expired');
    }

    return payload;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Invalid token');
  }
}

// Middleware principal - Solo aplicar a rutas de API
export const onRequest: PagesFunction<Env> = async (context) => {
  const { request, env, next } = context;
  const url = new URL(request.url);
  
  // Solo aplicar middleware a rutas de API
  if (!url.pathname.startsWith('/api/')) {
    return next();
  }
  
  console.log(`[MIDDLEWARE] ${request.method} ${url.pathname}`);
  
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
export async function requireAuth(request: Request, env: Env): Promise<{ userId: number; payload: any }> {
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
  return payload;
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
