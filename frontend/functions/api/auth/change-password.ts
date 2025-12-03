import type { PagesFunction, Env } from '../../types';
import { jsonResponse, errorResponse, requireAuth } from '../../_middleware';
import { hashPassword, verifyPassword } from '../../utils/password';

/**
 * Handler de change password para usuarios autenticados
 * Migrado desde worker/src/auth-system.ts
 */

// Helper: Validar que todos los campos requeridos estén presentes
function validateRequiredPasswordFields(currentPassword: string, newPassword: string, confirmPassword: string): string | null {
  if (!currentPassword || !newPassword || !confirmPassword) {
    console.log('[AUTH/CHANGE-PASSWORD] Missing required fields');
    return 'Contraseña actual, nueva contraseña y confirmación son requeridos';
  }
  return null;
}

// Helper: Validar que las nuevas contraseñas coincidan
function validatePasswordsMatch(newPassword: string, confirmPassword: string): string | null {
  if (newPassword !== confirmPassword) {
    console.log('[AUTH/CHANGE-PASSWORD] New passwords do not match');
    return 'Las nuevas contraseñas no coinciden';
  }
  return null;
}

// Helper: Validar longitud de nueva contraseña
function validatePasswordLength(newPassword: string): string | null {
  if (newPassword.length < 6) {
    console.log('[AUTH/CHANGE-PASSWORD] New password too short');
    return 'La nueva contraseña debe tener al menos 6 caracteres';
  }
  return null;
}

// Helper: Validar que la nueva contraseña sea diferente
function validatePasswordDifferent(currentPassword: string, newPassword: string): string | null {
  if (currentPassword === newPassword) {
    console.log('[AUTH/CHANGE-PASSWORD] Same password provided');
    return 'La nueva contraseña debe ser diferente a la actual';
  }
  return null;
}

// Helper: Validar todas las contraseñas
function validatePasswords(currentPassword: string, newPassword: string, confirmPassword: string): string | null {
  return validateRequiredPasswordFields(currentPassword, newPassword, confirmPassword)
    || validatePasswordsMatch(newPassword, confirmPassword)
    || validatePasswordLength(newPassword)
    || validatePasswordDifferent(currentPassword, newPassword);
}

// Helper: Actualizar contraseña en la base de datos
async function updatePasswordInDB(env: Env, userId: number, newPasswordHash: string): Promise<boolean> {
  const updateResult = await env.DB.prepare(`
    UPDATE usuarios SET password_hash = ?, updated_at = datetime('now') WHERE id = ?
  `).bind(newPasswordHash, userId).run();

  if (!updateResult.success) {
    console.error('[AUTH/CHANGE-PASSWORD] Failed to update password for user:', userId);
    return false;
  }

  // Limpiar tokens de reset de contraseña existentes (por seguridad)
  try {
    await env.DB.prepare(`
      DELETE FROM password_resets WHERE user_id = ?
    `).bind(userId).run();
  } catch (err) {
    // If the table doesn't exist or delete fails, log a warning but don't fail the password change
    console.warn('[AUTH/CHANGE-PASSWORD] Could not delete password_resets (possibly missing):', err);
  }

  return true;
}

// Handler principal de change password
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  try {
    console.log('[AUTH/CHANGE-PASSWORD] Processing change password request');

    // Validar binding de DB
    if (!env.DB) {
      console.error('[AUTH/CHANGE-PASSWORD] Database not configured');
      return errorResponse('Database not available', 500);
    }

    // Verificar autenticación
    let authUser;
    try {
      console.log('[AUTH/CHANGE-PASSWORD] Attempting to verify auth...');
      authUser = await requireAuth(request, env);
      console.log('[AUTH/CHANGE-PASSWORD] Auth successful, userId:', authUser.userId);
    } catch (error) {
      console.error('[AUTH/CHANGE-PASSWORD] Authentication failed:', error instanceof Error ? error.message : 'Unknown error');
      return errorResponse('Autenticación requerida', 401);
    }

    // Parsear body
    const body = await request.json() as {
      currentPassword: string;
      newPassword: string;
      confirmPassword: string;
    };
    const { currentPassword, newPassword, confirmPassword } = body;

    // Validar contraseñas
    const validationError = validatePasswords(currentPassword, newPassword, confirmPassword);
    if (validationError) {
      return errorResponse(validationError);
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
    const verification = await verifyPassword(currentPassword, user.password_hash as string);
    if (!verification.valid) {
      console.log('[AUTH/CHANGE-PASSWORD] Invalid current password for user:', userId);
      return errorResponse('Contraseña actual incorrecta', 400);
    }

    // Hash de la nueva contraseña y actualizar
    const newPasswordHash = await hashPassword(newPassword);
    const updateSuccess = await updatePasswordInDB(env, userId, newPasswordHash);

    if (!updateSuccess) {
      return errorResponse('Error actualizando contraseña', 500);
    }

    console.log('[AUTH/CHANGE-PASSWORD] Password changed successfully for user:', userId);

    return jsonResponse({
      success: true,
      message: 'Contraseña cambiada exitosamente'
    });

  } catch (error) {
    console.error('[AUTH/CHANGE-PASSWORD] Error:', error);

    // Solo exponer detalles en desarrollo
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
