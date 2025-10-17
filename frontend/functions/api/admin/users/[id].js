import { requireAuth, errorResponse, jsonResponse } from '../../../_middleware';

// Endpoint de gestión individual de usuarios
// GET /api/admin/users/[id] - Obtener usuario específico
// PUT /api/admin/users/[id] - Actualizar usuario
// DELETE /api/admin/users/[id] - Eliminar usuario (soft delete)

export async function onRequestGet(context) {
  const { request, env, params } = context;

  try {
    const userId = params.id;
    console.log(`[ADMIN USER] Obteniendo usuario: ${userId}`);

    let adminUser;
    try {
      adminUser = await requireAuth(request, env);
    } catch (error) {
      return errorResponse(
        error instanceof Error ? error.message : 'Token inválido',
        401,
        env.ENVIRONMENT === 'development' ? { details: error } : undefined
      );
    }

    if (!['admin', 'super_admin'].includes(adminUser.role)) {
      return errorResponse('Acceso denegado. Se requieren permisos de administrador.', 403);
    }

    if (!userId) {
      return errorResponse('ID de usuario requerido', 400);
    }

    // Obtener datos del usuario con estadísticas
    const user = await env.DB.prepare(`
      SELECT 
        u.id,
        u.email,
        u.nombre,
        u.apellido,
        u.role,
        u.activo as status,
        u.email_verified_at,
        u.last_login,
        u.created_at,
        u.updated_at,
        COUNT(DISTINCT e.id) as eventos_creados,
        COUNT(DISTINCT i.id) as inscripciones_count,
        COUNT(DISTINCT c.id) as comentarios_count
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
      status: user.status ? 'active' : 'inactive',
      email_verified: Boolean(user.email_verified_at),
      last_login: user.last_login,
      created_at: user.created_at,
      updated_at: user.updated_at,
      stats: {
        eventos_creados: user.eventos_creados || 0,
        inscripciones_count: user.inscripciones_count || 0,
        comentarios_count: user.comentarios_count || 0
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
function validateRole(role) {
  const validRoles = ['user', 'admin', 'editor', 'super_admin'];
  return validRoles.includes(role);
}

// Helper: Validar estado de usuario
function validateStatus(status) {
  const validStatuses = ['active', 'inactive'];
  return validStatuses.includes(status);
}

// Helper: Construir actualizaciones dinámicas
function buildUpdateFields(body) {
  const { name, role, status, email_verified } = body;
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
      errors.push('Rol inválido. Debe ser: user, admin o editor');
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

  if (email_verified !== undefined) {
    updates.push('email_verified_at = ?');
    params.push(email_verified ? new Date().toISOString() : null);
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
    status: user.status ? 'active' : 'inactive',
    email_verified: Boolean(user.email_verified_at),
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
      adminUser = await requireAuth(request, env);
    } catch (error) {
      return errorResponse(
        error instanceof Error ? error.message : 'Token inválido',
        401,
        env.ENVIRONMENT === 'development' ? { details: error } : undefined
      );
    }

    if (!['admin', 'super_admin'].includes(adminUser.role)) {
      return errorResponse('Acceso denegado. Se requieren permisos de administrador.', 403);
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
    const { updates, params: updateParams, errors } = buildUpdateFields(body);

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
             email_verified_at, last_login, created_at, updated_at
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
      adminUser = await requireAuth(request, env);
    } catch (error) {
      return errorResponse(
        error instanceof Error ? error.message : 'Token inválido',
        401,
        env.ENVIRONMENT === 'development' ? { details: error } : undefined
      );
    }

    if (!['admin', 'super_admin'].includes(adminUser.role)) {
      return errorResponse('Acceso denegado. Se requieren permisos de administrador.', 403);
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
