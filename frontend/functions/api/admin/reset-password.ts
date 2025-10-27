/**
 * Admin endpoint para resetear contraseña de un usuario
 * Solo accesible por administradores
 */

import type { PagesFunction, Env } from '../../types';
import { jsonResponse, errorResponse, requireAdmin, authErrorResponse } from './_middleware';
import { hashPassword } from '../../utils/password';

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  
  try {
    console.log('[ADMIN/RESET-PASSWORD] Processing admin password reset request');

    try {
      await requireAdmin(request, env);
    } catch (error) {
      return authErrorResponse(error, env);
    }
    
    const body = await request.json() as {
      email: string;
      newPassword: string;
    };

    const { email, newPassword } = body;

    if (!email || !newPassword) {
      return errorResponse('Email y nueva contraseña son requeridos', 400);
    }

    if (newPassword.length < 6) {
      return errorResponse('La contraseña debe tener al menos 6 caracteres', 400);
    }

    console.log('[ADMIN/RESET-PASSWORD] Resetting password for:', email);

    // Verificar que el usuario existe
    const user = await env.DB.prepare(`
      SELECT id, email, nombre, apellido FROM usuarios WHERE email = ?
    `).bind(email.toLowerCase()).first();

    if (!user) {
      console.log('[ADMIN/RESET-PASSWORD] User not found:', email);
      return errorResponse('Usuario no encontrado', 404);
    }

    // Generar nuevo hash
    const passwordHash = await hashPassword(newPassword);
    console.log('[ADMIN/RESET-PASSWORD] New hash generated for user:', user.id);

    // Actualizar contraseña
    const result = await env.DB.prepare(`
      UPDATE usuarios 
      SET password_hash = ?, 
          updated_at = datetime('now')
      WHERE email = ?
    `).bind(passwordHash, email.toLowerCase()).run();

    if (result.success) {
      console.log('[ADMIN/RESET-PASSWORD] Password updated successfully for:', email);
      return jsonResponse({
        success: true,
        message: 'Contraseña actualizada exitosamente',
        data: {
          userId: user.id,
          email: user.email,
          nombre: user.nombre,
          apellido: user.apellido
        }
      });
    } else {
      console.error('[ADMIN/RESET-PASSWORD] Database error updating password');
      return errorResponse('Error actualizando contraseña', 500);
    }

  } catch (error) {
    console.error('[ADMIN/RESET-PASSWORD] Error:', error);
    return errorResponse('Error procesando solicitud', 500);
  }
};

// OPTIONS handler for CORS
export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
};
