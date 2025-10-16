import type { PagesFunction, Env } from '../../types';
import { jsonResponse, errorResponse, requireAuth } from '../../_middleware';

/**
 * Handler de perfil de usuario (me)
 * Obtiene los datos del usuario autenticado
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

// Handler GET para obtener perfil
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  
  try {
    console.log('[AUTH/ME] Processing get profile request');
    
    // Verificar autenticación
    let authUser;
    try {
      authUser = requireAuth(request, env);
    } catch (error) {
      console.log('[AUTH/ME] Authentication failed:', error instanceof Error ? error.message : 'Unknown error');
      return errorResponse('Autenticación requerida', 401);
    }

    const userId = authUser.userId;
    console.log('[AUTH/ME] Getting profile for user:', userId);

    // Obtener datos del usuario
    const user = await env.DB.prepare(`
      SELECT id, email, nombre, apellido, telefono, rut, ciudad, role, activo, created_at, last_login
      FROM usuarios WHERE id = ? AND activo = 1
    `).bind(userId).first();

    if (!user) {
      console.log('[AUTH/ME] User not found or inactive:', userId);
      return errorResponse('Usuario no encontrado', 404);
    }

    // Preparar respuesta del usuario
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

    console.log('[AUTH/ME] Profile retrieved successfully for user:', userId);

    return jsonResponse({
      success: true,
      data: userData
    });

  } catch (error) {
    console.error('[AUTH/ME] Error:', error);
    return errorResponse(
      'Error interno del servidor',
      500,
      env.ENVIRONMENT === 'development' ? { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      } : undefined
    );
  }
};

/**
 * Valida los campos del perfil
 */
function validateProfileFields(body: {
  nombre?: string;
  apellido?: string;
  telefono?: string;
  rut?: string;
  ciudad?: string;
}): { valid: boolean; error?: string } {
  const { nombre, apellido } = body;
  
  if (nombre !== undefined && (!nombre || nombre.trim().length < 2)) {
    return { valid: false, error: 'El nombre debe tener al menos 2 caracteres' };
  }

  if (apellido !== undefined && (!apellido || apellido.trim().length < 2)) {
    return { valid: false, error: 'El apellido debe tener al menos 2 caracteres' };
  }

  return { valid: true };
}

/**
 * Construye los campos y valores para el UPDATE
 */
function buildUpdateFields(body: {
  nombre?: string;
  apellido?: string;
  telefono?: string;
  rut?: string;
  ciudad?: string;
}): { fields: string[]; values: any[] } {
  const updateFields: string[] = [];
  const updateValues: any[] = [];
  const { nombre, apellido, telefono, rut, ciudad } = body;

  if (nombre !== undefined) {
    updateFields.push('nombre = ?');
    updateValues.push(nombre.trim());
  }

  if (apellido !== undefined) {
    updateFields.push('apellido = ?');
    updateValues.push(apellido.trim());
  }

  if (telefono !== undefined) {
    updateFields.push('telefono = ?');
    updateValues.push(telefono || null);
  }

  if (rut !== undefined) {
    updateFields.push('rut = ?');
    updateValues.push(rut || null);
  }

  if (ciudad !== undefined) {
    updateFields.push('ciudad = ?');
    updateValues.push(ciudad || null);
  }

  return { fields: updateFields, values: updateValues };
}

/**
 * Ejecuta la actualización del perfil en la base de datos
 */
async function executeProfileUpdate(
  env: Env,
  userId: number,
  updateFields: string[],
  updateValues: any[]
): Promise<{ success: boolean; error?: string }> {
  if (updateFields.length === 0) {
    return { success: false, error: 'No hay campos para actualizar' };
  }

  updateFields.push('updated_at = datetime(\'now\')');
  updateValues.push(userId);

  const updateResult = await env.DB.prepare(`
    UPDATE usuarios SET ${updateFields.join(', ')} WHERE id = ?
  `).bind(...updateValues).run();

  if (!updateResult.success) {
    console.error('[AUTH/ME] Failed to update user:', userId);
    return { success: false, error: 'Error actualizando perfil' };
  }

  return { success: true };
}

// Handler PUT para actualizar perfil
export const onRequestPut: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  
  try {
    console.log('[AUTH/ME] Processing update profile request');
    
    // Verificar autenticación
    let authUser;
    try {
      authUser = requireAuth(request, env);
    } catch (error) {
      console.log('[AUTH/ME] Authentication failed:', error instanceof Error ? error.message : 'Unknown error');
      return errorResponse('Autenticación requerida', 401);
    }

    // Parsear body
    const body = await request.json() as {
      nombre?: string;
      apellido?: string;
      telefono?: string;
      rut?: string;
      ciudad?: string;
    };

    const userId = authUser.userId;
    console.log('[AUTH/ME] Updating profile for user:', userId);

    // Validar campos
    const validation = validateProfileFields(body);
    if (!validation.valid) {
      return errorResponse(validation.error || 'Error de validación');
    }

    // Construir campos de actualización
    const { fields: updateFields, values: updateValues } = buildUpdateFields(body);

    // Ejecutar actualización
    const updateResult = await executeProfileUpdate(env, userId, updateFields, updateValues);
    if (!updateResult.success) {
      return errorResponse(updateResult.error || 'Error actualizando perfil', 500);
    }

    // Obtener datos actualizados
    const updatedUser = await env.DB.prepare(`
      SELECT id, email, nombre, apellido, telefono, rut, ciudad, role, activo, created_at, last_login
      FROM usuarios WHERE id = ?
    `).bind(userId).first();

    if (!updatedUser) {
      return errorResponse('Error obteniendo datos actualizados', 500);
    }

    // Preparar respuesta del usuario
    const userData: User = {
      id: updatedUser.id as number,
      email: updatedUser.email as string,
      nombre: updatedUser.nombre as string,
      apellido: updatedUser.apellido as string,
      telefono: updatedUser.telefono as string,
      rut: updatedUser.rut as string,
      ciudad: updatedUser.ciudad as string,
      role: updatedUser.role as 'admin' | 'editor' | 'user',
      activo: Boolean(updatedUser.activo),
      created_at: updatedUser.created_at as string,
      last_login: updatedUser.last_login as string
    };

    console.log('[AUTH/ME] Profile updated successfully for user:', userId);

    return jsonResponse({
      success: true,
      message: 'Perfil actualizado exitosamente',
      data: userData
    });

  } catch (error) {
    console.error('[AUTH/ME] Error:', error);
    return errorResponse(
      'Error interno del servidor',
      500,
      env.ENVIRONMENT === 'development' ? { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      } : undefined
    );
  }
};