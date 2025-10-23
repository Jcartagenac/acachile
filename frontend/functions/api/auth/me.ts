import type { PagesFunction, Env } from '../../types';
import { jsonResponse, errorResponse, requireAuth } from '../../_middleware';
import { validateRut, normalizeRut, normalizePhone, normalizeAddress } from '../../../../shared/utils/validators';

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
      authUser = await requireAuth(request, env);
    } catch (error) {
      console.log('[AUTH/ME] Authentication failed:', error instanceof Error ? error.message : 'Unknown error');
      return errorResponse('Autenticación requerida', 401);
    }

    const userId = authUser && authUser.userId;
    if (!userId || typeof userId !== 'number') {
      console.log('[AUTH/ME] Invalid auth user id:', userId);
      return errorResponse('Autenticación inválida', 401);
    }
    console.log('[AUTH/ME] Getting profile for user:', userId);

    // Obtener datos del usuario
    const user = await env.DB.prepare(`
      SELECT id, email, nombre, apellido, telefono, rut, ciudad, direccion, foto_url, role, activo, created_at, last_login
      FROM usuarios WHERE id = ? AND activo = 1
    `).bind(userId).first();

    if (!user) {
      console.log('[AUTH/ME] User not found or inactive:', userId);
      return errorResponse('Usuario no encontrado', 404);
    }

    // Preparar respuesta del usuario
    const userData: any = {
      id: user.id as number,
      email: user.email as string,
      nombre: user.nombre as string,
      apellido: user.apellido as string,
      telefono: user.telefono as string,
      rut: user.rut as string,
      ciudad: user.ciudad as string,
      direccion: user.direccion as string,
      foto_url: user.foto_url as string,
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
  direccion?: string;
}): { valid: boolean; error?: string } {
  const { nombre, apellido, telefono, rut } = body;

  console.log('[AUTH/ME] Validating fields:', { nombre, apellido, telefono, rut });

  // Solo validar nombre si está presente en el body y no es null/undefined
  if (body.hasOwnProperty('nombre') && nombre !== null && nombre !== undefined && nombre.trim().length < 2) {
    console.log('[AUTH/ME] Nombre validation failed:', nombre);
    return { valid: false, error: 'El nombre debe tener al menos 2 caracteres' };
  }

  // Solo validar apellido si está presente en el body y no es null/undefined
  if (body.hasOwnProperty('apellido') && apellido !== null && apellido !== undefined && apellido.trim().length < 2) {
    console.log('[AUTH/ME] Apellido validation failed:', apellido);
    return { valid: false, error: 'El apellido debe tener al menos 2 caracteres' };
  }

  if (telefono !== undefined && telefono) {
    try {
      normalizePhone(telefono);
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  if (rut !== undefined && rut) {
    try {
      normalizeRut(rut);
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  return { valid: true };
}

/**
 * Construye los campos y valores para el UPDATE
 */
async function buildUpdateFields(body: {
  nombre?: string;
  apellido?: string;
  telefono?: string;
  rut?: string;
  ciudad?: string;
  direccion?: string;
  foto_url?: string;
}): Promise<{ fields: string[]; values: any[] }> {
  const updateFields: string[] = [];
  const updateValues: any[] = [];
  const { nombre, apellido, telefono, rut, ciudad, direccion, foto_url } = body;

  // Solo actualizar campos que realmente cambian y no son nulos/undefined
  if (typeof nombre === 'string' && nombre.trim() !== '') {
    updateFields.push('nombre = ?');
    updateValues.push(nombre.trim());
  }
  if (typeof apellido === 'string' && apellido.trim() !== '') {
    updateFields.push('apellido = ?');
    updateValues.push(apellido.trim());
  }
  if (typeof telefono === 'string' && telefono.trim() !== '') {
    try {
      const normalizedPhone = normalizePhone(telefono.trim());
      updateFields.push('telefono = ?');
      updateValues.push(normalizedPhone);
    } catch (error) {
      // Si el teléfono no es válido, no lo actualices
      console.warn('[AUTH/ME] Teléfono inválido, ignorando:', telefono);
    }
  }
  if (typeof rut === 'string' && rut.trim() !== '') {
    try {
      const normalizedRut = normalizeRut(rut.trim());
      updateFields.push('rut = ?');
      updateValues.push(normalizedRut);
    } catch (error) {
      // Si el RUT no es válido, no lo actualices
      console.warn('[AUTH/ME] RUT inválido, ignorando:', rut);
    }
  }
  if (typeof ciudad === 'string' && ciudad.trim() !== '') {
    updateFields.push('ciudad = ?');
    updateValues.push(ciudad.trim());
  }
  if (typeof direccion === 'string' && direccion.trim() !== '') {
    try {
      const normalizedAddress = await normalizeAddress(direccion.trim());
      updateFields.push('direccion = ?');
      updateValues.push(normalizedAddress);
    } catch (error) {
      // Si la normalización falla, usar el valor original
      updateFields.push('direccion = ?');
      updateValues.push(direccion.trim());
    }
  }
  if (typeof foto_url === 'string' && foto_url.trim() !== '') {
    updateFields.push('foto_url = ?');
    updateValues.push(foto_url.trim());
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
    return { success: false, error: 'No hay campos válidos para actualizar' };
  }

  updateFields.push('updated_at = datetime(\'now\')');
  updateValues.push(userId);

  try {
    const sql = `UPDATE usuarios SET ${updateFields.join(', ')} WHERE id = ?`;
    console.log('[AUTH/ME] Executing SQL:', sql);
    console.log('[AUTH/ME] Bind values:', updateValues);

    const updateResult = await env.DB.prepare(sql).bind(...updateValues).run();
    console.log('[AUTH/ME] Update result:', updateResult);

    if (!updateResult || updateResult.success === false) {
      console.error('[AUTH/ME] Failed to update user (result indicates failure):', userId, updateResult);
      return { success: false, error: 'Error actualizando perfil' };
    }

    return { success: true };
  } catch (error) {
    console.error('[AUTH/ME] SQL exception:', error instanceof Error ? error.message : error);
    // Expose error details in development for faster debugging
    if (env.ENVIRONMENT === 'development') {
      return { success: false, error: `SQL exception: ${error instanceof Error ? error.message : String(error)}` };
    }
    return { success: false, error: 'Error interno al actualizar perfil' };
  }
}

// Handler PUT para actualizar perfil
export const onRequestPut: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  
  try {
    console.log('[AUTH/ME] Processing update profile request');
    
    // Verificar autenticación
    let authUser;
    try {
      authUser = await requireAuth(request, env);
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
      direccion?: string;
      foto_url?: string;
    };

    const userId = authUser && authUser.userId;
    if (!userId || typeof userId !== 'number') {
      console.log('[AUTH/ME] Invalid auth user id for update:', userId);
      return errorResponse('Autenticación inválida', 401);
    }

    console.log('[AUTH/ME] Updating profile for user:', userId);
    console.log('[AUTH/ME] Body received:', JSON.stringify(body, null, 2));
    console.log('[AUTH/ME] Body keys:', Object.keys(body));
    console.log('[AUTH/ME] Has nombre:', body.hasOwnProperty('nombre'));
    console.log('[AUTH/ME] Has apellido:', body.hasOwnProperty('apellido'));

    // Validar campos - SOLO si están presentes en el body
    const validation = validateProfileFields(body);
    console.log('[AUTH/ME] Validation result:', validation);
    if (!validation.valid) {
      console.log('[AUTH/ME] Validation failed:', validation.error);
      return errorResponse(validation.error || 'Error de validación');
    }

    // Construir campos de actualización
    const { fields: updateFields, values: updateValues } = await buildUpdateFields(body);
    console.log('[AUTH/ME] Update fields:', updateFields);
    console.log('[AUTH/ME] Update values:', updateValues);

    // Ejecutar actualización
    const updateResult = await executeProfileUpdate(env, userId, updateFields, updateValues);
    if (!updateResult.success) {
      return errorResponse(updateResult.error || 'Error actualizando perfil', 500);
    }

    // Obtener datos actualizados
    const updatedUser = await env.DB.prepare(`
      SELECT id, email, nombre, apellido, telefono, rut, ciudad, direccion, foto_url, role, activo, created_at, last_login
      FROM usuarios WHERE id = ?
    `).bind(userId).first();

    if (!updatedUser) {
      return errorResponse('Error obteniendo datos actualizados', 500);
    }

    // Preparar respuesta del usuario
    const userData: any = {
      id: updatedUser.id as number,
      email: updatedUser.email as string,
      nombre: updatedUser.nombre as string,
      apellido: updatedUser.apellido as string,
      telefono: updatedUser.telefono as string,
      rut: updatedUser.rut as string,
      ciudad: updatedUser.ciudad as string,
      direccion: updatedUser.direccion as string,
      foto_url: updatedUser.foto_url as string,
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