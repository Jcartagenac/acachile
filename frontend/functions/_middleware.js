// Configurar CORS headers
function setCORSHeaders(response, origin) {
  const corsOrigin = origin || '*';

  response.headers.set('Access-Control-Allow-Origin', corsOrigin);
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Max-Age', '86400');

  return response;
}

function handleOptions(origin) {
  const response = new Response(null, { status: 204 });
  return setCORSHeaders(response, origin);
}

function base64UrlToUint8Array(base64Url) {
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

async function verifyToken(token, jwtSecret) {
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

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);

  if (!url.pathname.startsWith('/api/')) {
    return next();
  }

  console.log(`[MIDDLEWARE] ${request.method} ${url.pathname}`);

  if (request.method === 'OPTIONS') {
    return handleOptions(env.CORS_ORIGIN);
  }

  try {
    const response = await next();
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
}

export async function requireAuth(request, env) {
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

  return verifyToken(token, env.JWT_SECRET);
}

export function jsonResponse(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  });
}

export function errorResponse(message, status = 400, details) {
  return jsonResponse(
    {
      success: false,
      error: message,
      ...(details && { details })
    },
    status
  );
}
