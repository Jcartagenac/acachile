import type { PagesFunction, Env } from '../../types';
import { jsonResponse, errorResponse } from '../../_middleware';
import { hashPassword, verifyPassword } from '../../utils/password';
import { createJWT } from '../../utils/jwt';

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



// Handler principal de login
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  try {
    console.log('[AUTH/LOGIN] Processing login request');

    // Validar bindings críticos
    if (!env.JWT_SECRET) {
      console.error('[AUTH/LOGIN] JWT_SECRET not configured');
      return errorResponse('Authentication system not configured', 500);
    }

    if (!env.DB) {
      console.error('[AUTH/LOGIN] Database not configured');
      return errorResponse('Database not available', 500);
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
    const verification = await verifyPassword(password, user.password_hash as string);
    if (!verification.valid) {
      console.log('[AUTH/LOGIN] Invalid password for user:', email);
      return errorResponse('Credenciales inválidas', 401);
    }

    if (verification.needsUpgrade) {
      try {
        const upgradedHash = await hashPassword(password);
        await env.DB.prepare(`
          UPDATE usuarios SET password_hash = ? WHERE id = ?
        `).bind(upgradedHash, user.id).run();
        user.password_hash = upgradedHash;
        console.log('[AUTH/LOGIN] Upgraded password hash for user:', user.id);
      } catch (upgradeError) {
        console.warn('[AUTH/LOGIN] Failed to upgrade password hash:', upgradeError);
      }
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

    // Solo exponer detalles en desarrollo (incluye stack trace limitado)
    const details = env.ENVIRONMENT === 'development' && error instanceof Error
      ? {
        error: error.message,
        stack: error.stack?.split('\n').slice(0, 3).join('\n')
      }
      : undefined;

    return errorResponse(
      'Error interno del servidor',
      500,
      details
    );
  }
};
