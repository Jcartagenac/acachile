import { requireAdmin, authErrorResponse, errorResponse, jsonResponse } from '../../../_middleware';
import { validateRut, normalizeRut, normalizePhone, normalizeAddress } from '../../../../../shared/utils/validators';

// Endpoint de gestión individual de usuarios
// GET /api/admin/users/[id] - Obtener usuario específico
// PUT /api/admin/users/[id] - Actualizar usuario
// DELETE /api/admin/users/[id] - Eliminar usuario (soft delete)

export async function onRequestGet(context) {
  const { request, env, params } = context;

  try {
    const userId = params.id;
    console.log(`[ADMIN USER] Obteniendo usuario: ${userId}`);

    try {
      await requireAdmin(request, env);
    } catch (error) {
      return authErrorResponse(error, env);
    }

    if (!userId) {
      return errorResponse('ID de usuario requerido', 400);
    }

        // Obtener datos del usuario con estadísticas
    const user = await env.DB.prepare(`
      SELECT 
        u.id, u.email, u.nombre, u.apellido, u.role, u.activo as status,
        u.last_login, u.created_at, u.updated_at,
        COUNT(DISTINCT e.id) as events_created,
        COUNT(DISTINCT i.id) as inscriptions,
        COUNT(DISTINCT c.id) as comments_made
      FROM usuarios u
      LEFT JOIN eventos e ON u.id = e.created_by
      LEFT JOIN inscripciones i ON u.id = i.user_id
      LEFT JOIN comentarios c ON u.id = c.user_id
      WHERE u.id = ? AND u.activo = 1
      GROUP BY u.id
    `).bind(userId).first();

    if (!user) {
      return errorResponse('Usuario no encontrado', 404);
    }

    // Obtener eventos creados por el usuario
    const { results: eventos } = await env.DB.prepare(`
      SELECT id, title, date, status, 
        (SELECT COUNT(*) FROM inscripciones WHERE event_id = eventos.id) as inscripciones
      FROM eventos 
      WHERE created_by = ? 
      ORDER BY created_at DESC 
      LIMIT 10
    `).bind(userId).all();

    // Obtener inscripciones del usuario
    const { results: inscripciones } = await env.DB.prepare(`
      SELECT i.id, i.event_id, e.title as event_title, e.date as event_date, i.created_at
      FROM inscripciones i
      JOIN eventos e ON i.event_id = e.id
      WHERE i.user_id = ? 
      ORDER BY i.created_at DESC 
      LIMIT 10
    `).bind(userId).all();

    // Formatear respuesta
    const userDetails = {
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      apellido: user.apellido,
      name: `${user.nombre} ${user.apellido}`.trim(),
      role: user.role,
      status: user.activo ? 'active' : 'inactive',
      email_verified: !!user.email_verified_at,
      last_login: user.last_login,
      created_at: user.created_at,
      updated_at: user.updated_at,
      stats: {
        eventos_creados: user.events_created || 0,
        inscripciones_count: user.inscriptions || 0
      },
      eventos_recientes: eventos || [],
      inscripciones_recientes: inscripciones || []
    };

    console.log(`[ADMIN USER] Usuario ${userId} obtenido exitosamente`);

    return jsonResponse({
      success: true,
      data: userDetails
    });

  } catch (error) {
    console.error('[ADMIN USER] Error:', error);
    return errorResponse(
      'Error interno del servidor',
      500,
      env.ENVIRONMENT === 'development' ? { details: error instanceof Error ? error.message : error } : undefined
    );
  }
}

// Helper: Validar rol de usuario
const VALID_ROLES = ['usuario', 'director', 'director_editor', 'admin'];

function validateRole(role) {
  return VALID_ROLES.includes(role);
}

// Helper: Validar estado de usuario
function validateStatus(status) {
  const validStatuses = ['active', 'inactive'];
  return validStatuses.includes(status);
}

// Helper: Construir actualizaciones dinámicas
async function buildUpdateFields(body, env) {
  const { name, role, status, rut, telefono, ciudad, direccion } = body;
  const updates = [];
  const params = [];
  const errors = [];

  if (name !== undefined) {
    // Dividir name en nombre y apellido
    const nameParts = (name || '').trim().split(' ');
    const nombre = nameParts[0] || '';
    const apellido = nameParts.slice(1).join(' ') || '';

    updates.push('nombre = ?');
    params.push(nombre);
    updates.push('apellido = ?');
    params.push(apellido);
  }

  if (role !== undefined) {
    if (!validateRole(role)) {
      errors.push('Rol inválido. Debe ser: usuario, director, director_editor o admin');
    } else {
      updates.push('role = ?');
      params.push(role);
    }
  }

  if (status !== undefined) {
    if (!validateStatus(status)) {
      errors.push('Estado inválido. Debe ser: active o inactive');
    } else {
      updates.push('activo = ?');
      params.push(status === 'active' ? 1 : 0);
    }
  }

  // Normalizar RUT
  if (rut !== undefined) {
    if (rut) {
      try {
        const normalizedRut = normalizeRut(rut);
        updates.push('rut = ?');
        params.push(normalizedRut);
      } catch (error) {
        errors.push(error.message);
      }
    } else {
      updates.push('rut = ?');
      params.push(null);
    }
  }

  // Normalizar teléfono
  if (telefono !== undefined) {
    if (telefono) {
      try {
        const normalizedTelefono = normalizePhone(telefono);
        updates.push('telefono = ?');
        params.push(normalizedTelefono);
      } catch (error) {
        errors.push(error.message);
      }
    } else {
      updates.push('telefono = ?');
      params.push(null);
    }
  }

  // Normalizar ciudad
  if (ciudad !== undefined) {
    updates.push('ciudad = ?');
    params.push(ciudad ? ciudad.trim() : null);
  }

  // Normalizar dirección
  if (direccion !== undefined) {
    if (direccion) {
      try {
        const normalizedDireccion = await normalizeAddress(direccion, env.GOOGLE_MAPS_API_KEY);
        updates.push('direccion = ?');
        params.push(normalizedDireccion);
      } catch (error) {
        console.warn('[buildUpdateFields] Error normalizando dirección:', error);
        // Usar dirección original si falla la normalización
        updates.push('direccion = ?');
        params.push(direccion.trim());
      }
    } else {
      updates.push('direccion = ?');
      params.push(null);
    }
  }

  return { updates, params, errors };
}

// Helper: Formatear usuario para respuesta
function formatUserResponse(user) {
  return {
    id: user.id,
    email: user.email,
    nombre: user.nombre,
    apellido: user.apellido,
    name: `${user.nombre} ${user.apellido}`.trim(),
    role: user.role,
    status: user.activo ? 'active' : 'inactive',
    email_verified: true,
    last_login: user.last_login,
    created_at: user.created_at,
    updated_at: user.updated_at
  };
}

export async function onRequestPut(context) {
  const { request, env, params } = context;

  try {
    const userId = params.id;
    console.log(`[ADMIN USER] Actualizando usuario: ${userId}`);

    let adminUser;
    try {
      adminUser = await requireAdmin(request, env);
    } catch (error) {
      return authErrorResponse(error, env);
    }

    if (!userId) {
      return errorResponse('ID de usuario requerido', 400);
    }

    const body = await request.json();

    // Verificar que el usuario existe
    const existingUser = await env.DB.prepare(
      'SELECT id FROM usuarios WHERE id = ? AND activo = 1'
    ).bind(userId).first();

    if (!existingUser) {
      return errorResponse('Usuario no encontrado', 404);
    }

    // Construir query de actualización dinámicamente
    const { updates, params: updateParams, errors } = await buildUpdateFields(body, env);

    if (errors.length > 0) {
      return errorResponse(errors.join(', '), 400);
    }

    if (updates.length === 0) {
      return errorResponse('No hay campos para actualizar', 400);
    }

    // Agregar updated_at y userId al final
    updates.push('updated_at = ?');
    updateParams.push(new Date().toISOString());
    updateParams.push(userId);

    const query = `UPDATE usuarios SET ${updates.join(', ')} WHERE id = ?`;
    
    const result = await env.DB.prepare(query).bind(...updateParams).run();

    if (!result.success) {
      throw new Error('Error actualizando usuario en la base de datos');
    }

    // Obtener usuario actualizado
    const updatedUser = await env.DB.prepare(`
      SELECT id, email, nombre, apellido, role, activo as status,
             last_login, created_at, updated_at
      FROM usuarios WHERE id = ?
    `).bind(userId).first();

    console.log(`[ADMIN USER] Usuario ${userId} actualizado exitosamente`);

    return jsonResponse({
      success: true,
      data: formatUserResponse(updatedUser),
      message: 'Usuario actualizado exitosamente'
    });

  } catch (error) {
    console.error('[ADMIN USER] Error actualizando:', error);
    return errorResponse(
      'Error interno del servidor',
      500,
      env.ENVIRONMENT === 'development' ? { details: error instanceof Error ? error.message : error } : undefined
    );
  }
}

export async function onRequestDelete(context) {
  const { request, env, params } = context;

  try {
    const userId = params.id;
    console.log(`[ADMIN USER] Eliminando usuario: ${userId}`);

    let adminUser;
    try {
      adminUser = await requireAdmin(request, env);
    } catch (error) {
      return authErrorResponse(error, env);
    }

    if (String(adminUser.userId) === String(userId)) {
      return errorResponse('No puedes eliminar tu propia cuenta.', 403);
    }

    if (!userId) {
      return errorResponse('ID de usuario requerido', 400);
    }

    // Verificar que el usuario existe y no está ya eliminado
    const existingUser = await env.DB.prepare(
      'SELECT id, nombre, apellido, email FROM usuarios WHERE id = ? AND activo = 1'
    ).bind(userId).first();

    if (!existingUser) {
      return errorResponse('Usuario no encontrado', 404);
    }

    // Soft delete del usuario (marcar como inactivo)
    const now = new Date().toISOString();
    const result = await env.DB.prepare(
      'UPDATE usuarios SET activo = 0, updated_at = ? WHERE id = ?'
    ).bind(now, userId).run();

    if (!result.success) {
      throw new Error('Error eliminando usuario de la base de datos');
    }

    console.log(`[ADMIN USER] Usuario ${userId} eliminado exitosamente`);

    return jsonResponse({
      success: true,
      data: {
        id: userId,
        nombre: existingUser.nombre,
        apellido: existingUser.apellido,
        email: existingUser.email,
        deleted_at: now
      },
      message: 'Usuario eliminado exitosamente'
    });

  } catch (error) {
    console.error('[ADMIN USER] Error eliminando:', error);
    return errorResponse(
      'Error interno del servidor',
      500,
      env.ENVIRONMENT === 'development' ? { details: error instanceof Error ? error.message : error } : undefined
    );
  }
}
