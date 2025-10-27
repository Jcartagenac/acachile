import type { PagesFunction, Env } from '../../types';
import { jsonResponse, errorResponse } from '../../_middleware';
import { hashPassword } from '../../utils/password';

/**
 * Handler de registro de usuarios
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

// Handler principal de registro
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  
  try {
    console.log('[AUTH/REGISTER] Processing registration request');
    
    // Parsear body
    const body = await request.json() as {
      email: string;
      nombre: string;
      apellido: string;
      password: string;
      telefono?: string;
      rut?: string;
      ciudad?: string;
      role?: 'admin' | 'editor' | 'user';
    };

    const { 
      email, 
      nombre, 
      apellido, 
      password, 
      telefono, 
      rut, 
      ciudad, 
      role = 'user' 
    } = body;

    // Validaciones básicas
    if (!email || !nombre || !apellido || !password) {
      console.log('[AUTH/REGISTER] Missing required fields');
      return errorResponse('Email, nombre, apellido y contraseña son requeridos');
    }

    if (password.length < 6) {
      console.log('[AUTH/REGISTER] Password too short');
      return errorResponse('La contraseña debe tener al menos 6 caracteres');
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('[AUTH/REGISTER] Invalid email format:', email);
      return errorResponse('Formato de email inválido');
    }

    console.log('[AUTH/REGISTER] Attempting registration for:', email);

    // Verificar si el usuario ya existe
    const existingUser = await env.DB.prepare(`
      SELECT id FROM usuarios WHERE email = ?
    `).bind(email.toLowerCase()).first();

    if (existingUser) {
      console.log('[AUTH/REGISTER] User already exists:', email);
      return errorResponse('El usuario ya existe', 409);
    }

    const passwordHash = await hashPassword(password);

    console.log('[AUTH/REGISTER] Creating new user:', email);

    // Crear usuario
    const result = await env.DB.prepare(`
      INSERT INTO usuarios (
        email, nombre, apellido, password_hash, telefono, rut, ciudad, role, activo
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
    `).bind(
      email.toLowerCase(),
      nombre,
      apellido,
      passwordHash,
      telefono || null,
      rut || null,
      ciudad || null,
      role
    ).run();

    if (!result.success) {
      console.error('[AUTH/REGISTER] Failed to create user:', result.error);
      return errorResponse('Error creando usuario', 500);
    }

    const userId = result.meta.last_row_id as number;
    console.log('[AUTH/REGISTER] User created with ID:', userId);

    // Obtener usuario creado
    const newUser = await env.DB.prepare(`
      SELECT id, email, nombre, apellido, telefono, rut, ciudad, role, activo, created_at
      FROM usuarios WHERE id = ?
    `).bind(userId).first();

    if (!newUser) {
      console.error('[AUTH/REGISTER] Could not retrieve created user');
      return errorResponse('Error obteniendo usuario creado', 500);
    }

    // Preparar respuesta del usuario
    const userData: User = {
      id: newUser.id as number,
      email: newUser.email as string,
      nombre: newUser.nombre as string,
      apellido: newUser.apellido as string,
      telefono: newUser.telefono as string,
      rut: newUser.rut as string,
      ciudad: newUser.ciudad as string,
      role: newUser.role as 'admin' | 'editor' | 'user',
      activo: Boolean(newUser.activo),
      created_at: newUser.created_at as string
    };

    console.log('[AUTH/REGISTER] Registration successful for user:', userId);

    return jsonResponse({
      success: true,
      message: 'Usuario creado exitosamente',
      data: {
        user: userData
      }
    }, 201);

  } catch (error) {
    console.error('[AUTH/REGISTER] Error:', error);
    return errorResponse(
      'Error interno del servidor',
      500,
      env.ENVIRONMENT === 'development' ? { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      } : undefined
    );
  }
};
