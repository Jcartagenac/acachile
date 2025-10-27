import type { PagesFunction, Env } from '../../types';
import { jsonResponse, errorResponse } from '../../_middleware';
import { hashPassword } from '../../utils/password';

/**
 * Handler de reset password
 * Migrado desde worker/src/auth-system.ts
 */

// Handler principal de reset password
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  
  try {
    console.log('[AUTH/RESET-PASSWORD] Processing reset password request');
    
    // Parsear body
    const body = await request.json() as { 
      token: string; 
      password: string; 
      confirmPassword: string;
    };
    const { token, password, confirmPassword } = body;

    // Validaciones
    if (!token || !password || !confirmPassword) {
      console.log('[AUTH/RESET-PASSWORD] Missing required fields');
      return errorResponse('Token, contraseña y confirmación son requeridos');
    }

    if (password !== confirmPassword) {
      console.log('[AUTH/RESET-PASSWORD] Passwords do not match');
      return errorResponse('Las contraseñas no coinciden');
    }

    if (password.length < 6) {
      console.log('[AUTH/RESET-PASSWORD] Password too short');
      return errorResponse('La contraseña debe tener al menos 6 caracteres');
    }

    console.log('[AUTH/RESET-PASSWORD] Processing token:', token.substring(0, 10) + '...');

    // Buscar token válido
    const resetRecord = await env.DB.prepare(`
      SELECT pr.user_id, pr.expires_at, u.email, u.nombre, u.apellido
      FROM password_resets pr
      JOIN usuarios u ON pr.user_id = u.id
      WHERE pr.token = ? AND pr.expires_at > datetime('now') AND u.activo = 1
    `).bind(token).first();

    if (!resetRecord) {
      console.log('[AUTH/RESET-PASSWORD] Invalid or expired token');
      return errorResponse('Token inválido o expirado', 400);
    }

    const userId = resetRecord.user_id as number;
    console.log('[AUTH/RESET-PASSWORD] Valid token for user:', userId);

    // Hash de la nueva contraseña
    const passwordHash = await hashPassword(password);

    // Actualizar contraseña
    const updateResult = await env.DB.prepare(`
      UPDATE usuarios SET password_hash = ?, updated_at = datetime('now') WHERE id = ?
    `).bind(passwordHash, userId).run();

    if (!updateResult.success) {
      console.error('[AUTH/RESET-PASSWORD] Failed to update password for user:', userId);
      return errorResponse('Error actualizando contraseña', 500);
    }

    // Eliminar token usado
    await env.DB.prepare(`
      DELETE FROM password_resets WHERE token = ?
    `).bind(token).run();

    // Eliminar todos los tokens expirados del usuario (limpieza)
    await env.DB.prepare(`
      DELETE FROM password_resets WHERE user_id = ? OR expires_at < datetime('now')
    `).bind(userId).run();

    console.log('[AUTH/RESET-PASSWORD] Password updated successfully for user:', userId);

    return jsonResponse({
      success: true,
      message: 'Contraseña restablecida exitosamente'
    });

  } catch (error) {
    console.error('[AUTH/RESET-PASSWORD] Error:', error);
    return errorResponse(
      'Error interno del servidor',
      500,
      env.ENVIRONMENT === 'development' ? { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      } : undefined
    );
  }
};
