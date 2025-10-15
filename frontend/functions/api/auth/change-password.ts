import type { PagesFunction, Env } from '../../types';
import { jsonResponse, errorResponse, requireAuth } from '../../_middleware';

/**
 * Handler de change password para usuarios autenticados
 * Migrado desde worker/src/auth-system.ts
 */

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'salt_aca_chile_2024');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Handler principal de change password
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  
  try {
    console.log('[AUTH/CHANGE-PASSWORD] Processing change password request');
    
    // Verificar autenticación
    let authUser;
    try {
      authUser = requireAuth(request, env);
    } catch (error) {
      console.log('[AUTH/CHANGE-PASSWORD] Authentication failed:', error instanceof Error ? error.message : 'Unknown error');
      return errorResponse('Autenticación requerida', 401);
    }

    // Parsear body
    const body = await request.json() as { 
      currentPassword: string;
      newPassword: string; 
      confirmPassword: string;
    };
    const { currentPassword, newPassword, confirmPassword } = body;

    // Validaciones
    if (!currentPassword || !newPassword || !confirmPassword) {
      console.log('[AUTH/CHANGE-PASSWORD] Missing required fields');
      return errorResponse('Contraseña actual, nueva contraseña y confirmación son requeridos');
    }

    if (newPassword !== confirmPassword) {
      console.log('[AUTH/CHANGE-PASSWORD] New passwords do not match');
      return errorResponse('Las nuevas contraseñas no coinciden');
    }

    if (newPassword.length < 6) {
      console.log('[AUTH/CHANGE-PASSWORD] New password too short');
      return errorResponse('La nueva contraseña debe tener al menos 6 caracteres');
    }

    if (currentPassword === newPassword) {
      console.log('[AUTH/CHANGE-PASSWORD] Same password provided');
      return errorResponse('La nueva contraseña debe ser diferente a la actual');
    }

    const userId = authUser.userId;
    console.log('[AUTH/CHANGE-PASSWORD] Processing for user:', userId);

    // Obtener datos actuales del usuario
    const user = await env.DB.prepare(`
      SELECT id, email, password_hash FROM usuarios WHERE id = ? AND activo = 1
    `).bind(userId).first();

    if (!user) {
      console.log('[AUTH/CHANGE-PASSWORD] User not found or inactive:', userId);
      return errorResponse('Usuario no encontrado', 404);
    }

    // Verificar contraseña actual
    const currentPasswordHash = await hashPassword(currentPassword);
    if (currentPasswordHash !== user.password_hash) {
      console.log('[AUTH/CHANGE-PASSWORD] Invalid current password for user:', userId);
      return errorResponse('Contraseña actual incorrecta', 400);
    }

    // Hash de la nueva contraseña
    const newPasswordHash = await hashPassword(newPassword);

    // Actualizar contraseña
    const updateResult = await env.DB.prepare(`
      UPDATE usuarios SET password_hash = ?, updated_at = datetime('now') WHERE id = ?
    `).bind(newPasswordHash, userId).run();

    if (!updateResult.success) {
      console.error('[AUTH/CHANGE-PASSWORD] Failed to update password for user:', userId);
      return errorResponse('Error actualizando contraseña', 500);
    }

    // Limpiar tokens de reset de contraseña existentes (por seguridad)
    await env.DB.prepare(`
      DELETE FROM password_resets WHERE user_id = ?
    `).bind(userId).run();

    console.log('[AUTH/CHANGE-PASSWORD] Password changed successfully for user:', userId);

    return jsonResponse({
      success: true,
      message: 'Contraseña cambiada exitosamente'
    });

  } catch (error) {
    console.error('[AUTH/CHANGE-PASSWORD] Error:', error);
    return errorResponse(
      'Error interno del servidor',
      500,
      env.ENVIRONMENT === 'development' ? { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      } : undefined
    );
  }
};