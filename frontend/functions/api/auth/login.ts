import type { PagesFunction, Env } from '../../types';
import { jsonResponse, errorResponse } from '../../_middleware';

/**
 * Funciones de autenticación JWT para Pages Functions
 * Migrado desde worker/src/auth.ts
 */

interface User {
  id: number;
  email: string;
  nombre: string;
  apellido: string;
  telefono?: string;
  rut?: string;
  ciudad?: string;
  role: 'admin' | 'editor' | 'user';
  activo: boolean;
  created_at: string;
  last_login?: string;
}

interface AuthToken {
  userId: number;
  email: string;
  role: string;
  isAdmin: boolean;
  exp: number;
  iat: number;
}

// Utilidades JWT
function base64UrlEncode(str: string): string {
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function base64UrlDecode(str: string): string {
  str += '='.repeat((4 - str.length % 4) % 4);
  return atob(str.replace(/-/g, '+').replace(/_/g, '/'));
}

async function hmacSha256(key: string, data: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);
  const dataArray = encoder.encode(data);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  return await crypto.subtle.sign('HMAC', cryptoKey, dataArray);
}

async function createJWT(payload: any, secret: string): Promise<string> {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const data = `${encodedHeader}.${encodedPayload}`;
  
  const signature = await hmacSha256(secret, data);
  const encodedSignature = base64UrlEncode(String.fromCharCode(...new Uint8Array(signature)));
  
  return `${data}.${encodedSignature}`;
}

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'salt_aca_chile_2024');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Handler principal de login
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  
  try {
    console.log('[AUTH/LOGIN] Processing login request');
    
    if (!env.JWT_SECRET) {
      console.error('[AUTH/LOGIN] JWT_SECRET not configured');
      return errorResponse('Authentication system not configured', 500);
    }

    // Parsear body
    const body = await request.json() as { email: string; password: string };
    const { email, password } = body;

    // Validaciones
    if (!email || !password) {
      console.log('[AUTH/LOGIN] Missing email or password');
      return errorResponse('Email y contraseña son requeridos');
    }

    console.log('[AUTH/LOGIN] Attempting login for:', email);

    // Buscar usuario en la base de datos
    const user = await env.DB.prepare(`
      SELECT id, email, nombre, apellido, telefono, rut, ciudad, role, activo, password_hash, created_at, last_login
      FROM usuarios WHERE email = ? AND activo = 1
    `).bind(email.toLowerCase()).first();

    if (!user) {
      console.log('[AUTH/LOGIN] User not found or inactive:', email);
      return errorResponse('Credenciales inválidas', 401);
    }

    // Verificar contraseña
    const passwordHash = await hashPassword(password);
    if (passwordHash !== user.password_hash) {
      console.log('[AUTH/LOGIN] Invalid password for user:', email);
      return errorResponse('Credenciales inválidas', 401);
    }

    console.log('[AUTH/LOGIN] Password valid, creating token for user:', user.id);

    // Actualizar last_login
    await env.DB.prepare(`
      UPDATE usuarios SET last_login = datetime('now') WHERE id = ?
    `).bind(user.id).run();

    // Crear token JWT
    const tokenPayload: AuthToken = {
      userId: user.id as number,
      email: user.email as string,
      role: user.role as string,
      isAdmin: (user.role as string) === 'admin',
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 días
      iat: Math.floor(Date.now() / 1000)
    };

    const token = await createJWT(tokenPayload, env.JWT_SECRET);

    // Preparar respuesta del usuario (sin password_hash)
    const userData: User = {
      id: user.id as number,
      email: user.email as string,
      nombre: user.nombre as string,
      apellido: user.apellido as string,
      telefono: user.telefono as string,
      rut: user.rut as string,
      ciudad: user.ciudad as string,
      role: user.role as 'admin' | 'editor' | 'user',
      activo: Boolean(user.activo),
      created_at: user.created_at as string,
      last_login: user.last_login as string
    };

    console.log('[AUTH/LOGIN] Login successful for user:', user.id);

    return jsonResponse({
      success: true,
      data: {
        user: userData,
        token: token
      }
    });

  } catch (error) {
    console.error('[AUTH/LOGIN] Error:', error);
    return errorResponse(
      'Error interno del servidor',
      500,
      env.ENVIRONMENT === 'development' ? { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      } : undefined
    );
  }
};