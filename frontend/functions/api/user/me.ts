import type { PagesFunction, Env } from '../../types';
import { jsonResponse, errorResponse } from '../../_middleware';
import { verifyToken } from '../../utils/jwt';

interface User {
  id: number;
  email: string;
  nombre: string;
  apellido: string;
  telefono?: string;
  rut?: string;
  ciudad?: string;
  direccion?: string;
  comuna?: string;
  region?: string;
  fecha_nacimiento?: string;
  red_social?: string;
  foto_url?: string;
  role: 'admin' | 'editor' | 'user';
  activo: boolean;
  created_at: string;
  last_login?: string;
}

// GET /api/user/me - Obtener perfil del usuario autenticado
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  try {
    console.log('[API/USER/ME] Getting authenticated user profile');

    // Validar bindings críticos
    if (!env.JWT_SECRET) {
      console.error('[API/USER/ME] JWT_SECRET not configured');
      return errorResponse('Authentication system not configured', 500);
    }

    if (!env.DB) {
      console.error('[API/USER/ME] Database not configured');
      return errorResponse('Database not available', 500);
    }

    // Obtener token del header Authorization
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[API/USER/ME] Missing or invalid Authorization header');
      return errorResponse('No autorizado', 401);
    }

    const token = authHeader.substring(7); // Remove 'Bearer '

    // Verificar token JWT
    let payload;
    try {
      payload = await verifyToken(token, env.JWT_SECRET);
      console.log('[API/USER/ME] Token verified for user:', payload.userId);
    } catch (error) {
      console.log('[API/USER/ME] Invalid token:', error);
      return errorResponse('Token inválido o expirado', 401);
    }

    // Buscar usuario en la base de datos
    const user = await env.DB.prepare(`
      SELECT id, email, nombre, apellido, telefono, rut, ciudad, direccion, comuna, region, 
             fecha_nacimiento, red_social, foto_url, role, activo, created_at, last_login
      FROM usuarios WHERE id = ? AND activo = 1
    `).bind(payload.userId).first();

    if (!user) {
      console.log('[API/USER/ME] User not found or inactive:', payload.userId);
      return errorResponse('Usuario no encontrado', 404);
    }

    // Preparar respuesta del usuario
    const userData: User = {
      id: user.id as number,
      email: user.email as string,
      nombre: user.nombre as string,
      apellido: user.apellido as string,
      telefono: user.telefono as string || undefined,
      rut: user.rut as string || undefined,
      ciudad: user.ciudad as string || undefined,
      direccion: user.direccion as string || undefined,
      comuna: user.comuna as string || undefined,
      region: user.region as string || undefined,
      fecha_nacimiento: user.fecha_nacimiento as string || undefined,
      red_social: user.red_social as string || undefined,
      foto_url: user.foto_url as string || undefined,
      role: user.role as 'admin' | 'editor' | 'user',
      activo: Boolean(user.activo),
      created_at: user.created_at as string,
      last_login: user.last_login as string || undefined
    };

    console.log('[API/USER/ME] Profile retrieved successfully for user:', user.id);

    return jsonResponse({
      success: true,
      data: userData
    });

  } catch (error) {
    console.error('[API/USER/ME] Error:', error);

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

// PUT /api/user/me - Actualizar perfil del usuario autenticado
export const onRequestPut: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  try {
    console.log('[API/USER/ME] Updating authenticated user profile');

    // Validar bindings críticos
    if (!env.JWT_SECRET) {
      console.error('[API/USER/ME] JWT_SECRET not configured');
      return errorResponse('Authentication system not configured', 500);
    }

    if (!env.DB) {
      console.error('[API/USER/ME] Database not configured');
      return errorResponse('Database not available', 500);
    }

    // Obtener token del header Authorization
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('[API/USER/ME] Missing or invalid Authorization header');
      return errorResponse('No autorizado', 401);
    }

    const token = authHeader.substring(7);

    // Verificar token JWT
    let payload;
    try {
      payload = await verifyToken(token, env.JWT_SECRET);
      console.log('[API/USER/ME] Token verified for user:', payload.userId);
    } catch (error) {
      console.log('[API/USER/ME] Invalid token:', error);
      return errorResponse('Token inválido o expirado', 401);
    }

    // Parsear body
    const body = await request.json() as Partial<{
      firstName: string;
      lastName: string;
      phone: string | null;
      rut: string | null;
      ciudad: string | null;
      direccion: string | null;
      comuna: string | null;
      region: string | null;
      fechaNacimiento: string | null;
      redSocial: string | null;
      avatar: string;
    }>;

    console.log('[API/USER/ME] Update payload:', JSON.stringify(body, null, 2));

    // Preparar updates dinámicamente
    const updates: string[] = [];
    const values: any[] = [];

    if (body.firstName !== undefined) {
      updates.push('nombre = ?');
      values.push(body.firstName);
    }

    if (body.lastName !== undefined) {
      updates.push('apellido = ?');
      values.push(body.lastName);
    }

    if (body.phone !== undefined) {
      updates.push('telefono = ?');
      values.push(body.phone);
    }

    if (body.rut !== undefined) {
      updates.push('rut = ?');
      values.push(body.rut);
    }

    if (body.ciudad !== undefined) {
      updates.push('ciudad = ?');
      values.push(body.ciudad);
    }

    if (body.direccion !== undefined) {
      updates.push('direccion = ?');
      values.push(body.direccion);
    }

    if (body.comuna !== undefined) {
      updates.push('comuna = ?');
      values.push(body.comuna);
    }

    if (body.region !== undefined) {
      updates.push('region = ?');
      values.push(body.region);
    }

    if (body.fechaNacimiento !== undefined) {
      updates.push('fecha_nacimiento = ?');
      values.push(body.fechaNacimiento);
    }

    if (body.redSocial !== undefined) {
      updates.push('red_social = ?');
      values.push(body.redSocial);
    }

    if (body.avatar !== undefined) {
      updates.push('avatar = ?');
      values.push(body.avatar);
    }

    if (updates.length === 0) {
      return errorResponse('No hay campos para actualizar', 400);
    }

    // Agregar updated_at
    updates.push('updated_at = datetime("now")');

    // Ejecutar update
    values.push(payload.userId); // para WHERE id = ?
    const sql = `
      UPDATE usuarios 
      SET ${updates.join(', ')}
      WHERE id = ? AND activo = 1
    `;

    console.log('[API/USER/ME] SQL:', sql);
    console.log('[API/USER/ME] Values:', values);

    const result = await env.DB.prepare(sql).bind(...values).run();

    if (!result.success || result.meta.changes === 0) {
      console.error('[API/USER/ME] Update failed:', result);
      return errorResponse('Error actualizando perfil', 500);
    }

    // Obtener usuario actualizado
    const updatedUser = await env.DB.prepare(`
      SELECT id, email, nombre, apellido, telefono, rut, ciudad, direccion, comuna, region, 
             fecha_nacimiento, red_social, foto_url, role, activo, created_at, last_login
      FROM usuarios WHERE id = ?
    `).bind(payload.userId).first();

    if (!updatedUser) {
      return errorResponse('Error obteniendo usuario actualizado', 500);
    }

    const userData: User = {
      id: updatedUser.id as number,
      email: updatedUser.email as string,
      nombre: updatedUser.nombre as string,
      apellido: updatedUser.apellido as string,
      telefono: updatedUser.telefono as string || undefined,
      rut: updatedUser.rut as string || undefined,
      ciudad: updatedUser.ciudad as string || undefined,
      direccion: updatedUser.direccion as string || undefined,
      comuna: updatedUser.comuna as string || undefined,
      region: updatedUser.region as string || undefined,
      fecha_nacimiento: updatedUser.fecha_nacimiento as string || undefined,
      red_social: updatedUser.red_social as string || undefined,
      foto_url: updatedUser.foto_url as string || undefined,
      role: updatedUser.role as 'admin' | 'editor' | 'user',
      activo: Boolean(updatedUser.activo),
      created_at: updatedUser.created_at as string,
      last_login: updatedUser.last_login as string || undefined
    };

    console.log('[API/USER/ME] Profile updated successfully for user:', payload.userId);

    return jsonResponse({
      success: true,
      message: 'Perfil actualizado exitosamente',
      data: userData
    });

  } catch (error) {
    console.error('[API/USER/ME] Error:', error);

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
