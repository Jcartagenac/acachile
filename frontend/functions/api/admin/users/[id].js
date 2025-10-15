// Endpoint de gestión individual de usuarios
// GET /api/admin/users/[id] - Obtener usuario específico
// PUT /api/admin/users/[id] - Actualizar usuario
// DELETE /api/admin/users/[id] - Eliminar usuario (soft delete)

export async function onRequestGet(context) {
  const { request, env, params } = context;

  try {
    const userId = params.id;
    console.log(`[ADMIN USER] Obteniendo usuario: ${userId}`);

    // TODO: Validar que el usuario es administrador
    // const adminUser = requireAuth(request, env);
    // if (adminUser.role !== 'admin') {
    //   return new Response(JSON.stringify({
    //     success: false,
    //     error: 'Acceso denegado. Se requieren permisos de administrador.'
    //   }), { status: 403 });
    // }

    if (!userId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'ID de usuario requerido'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Obtener datos del usuario con estadísticas
    const user = await env.DB.prepare(`
      SELECT 
        id, email, name, role, status, email_verified_at, 
        last_login, created_at, updated_at,
        (SELECT COUNT(*) FROM eventos WHERE created_by = users.id) as eventos_creados,
        (SELECT COUNT(*) FROM inscripciones WHERE user_id = users.id) as inscripciones_count
      FROM users 
      WHERE id = ? AND deleted_at IS NULL
    `).bind(userId).first();

    if (!user) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Usuario no encontrado'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
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
      name: user.name,
      role: user.role,
      status: user.status,
      email_verified: !!user.email_verified_at,
      last_login: user.last_login,
      created_at: user.created_at,
      updated_at: user.updated_at,
      stats: {
        eventos_creados: user.eventos_creados || 0,
        inscripciones_count: user.inscripciones_count || 0
      },
      eventos_recientes: eventos || [],
      inscripciones_recientes: inscripciones || []
    };

    console.log(`[ADMIN USER] Usuario ${userId} obtenido exitosamente`);

    return new Response(JSON.stringify({
      success: true,
      data: userDetails
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[ADMIN USER] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error interno del servidor',
      details: env.ENVIRONMENT === 'development' ? error.message : undefined
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestPut(context) {
  const { request, env, params } = context;

  try {
    const userId = params.id;
    console.log(`[ADMIN USER] Actualizando usuario: ${userId}`);

    // TODO: Validar que el usuario es administrador
    // const adminUser = requireAuth(request, env);
    // if (adminUser.role !== 'admin') {
    //   return new Response(JSON.stringify({
    //     success: false,
    //     error: 'Acceso denegado. Se requieren permisos de administrador.'
    //   }), { status: 403 });
    // }

    if (!userId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'ID de usuario requerido'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const { name, role, status, email_verified } = body;

    // Verificar que el usuario existe
    const existingUser = await env.DB.prepare(
      'SELECT id FROM users WHERE id = ? AND deleted_at IS NULL'
    ).bind(userId).first();

    if (!existingUser) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Usuario no encontrado'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Construir query de actualización dinámicamente
    const updates = [];
    const params = [];

    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name);
    }

    if (role !== undefined) {
      if (!['user', 'admin', 'editor'].includes(role)) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Rol inválido. Debe ser: user, admin o editor'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      updates.push('role = ?');
      params.push(role);
    }

    if (status !== undefined) {
      if (!['active', 'inactive', 'suspended'].includes(status)) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Estado inválido. Debe ser: active, inactive o suspended'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      updates.push('status = ?');
      params.push(status);
    }

    if (email_verified !== undefined) {
      updates.push('email_verified_at = ?');
      params.push(email_verified ? new Date().toISOString() : null);
    }

    if (updates.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No hay campos para actualizar'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Agregar updated_at y userId al final
    updates.push('updated_at = ?');
    params.push(new Date().toISOString());
    params.push(userId);

    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
    
    const result = await env.DB.prepare(query).bind(...params).run();

    if (!result.success) {
      throw new Error('Error actualizando usuario en la base de datos');
    }

    // Obtener usuario actualizado
    const updatedUser = await env.DB.prepare(`
      SELECT id, email, name, role, status, email_verified_at, 
             last_login, created_at, updated_at
      FROM users WHERE id = ?
    `).bind(userId).first();

    console.log(`[ADMIN USER] Usuario ${userId} actualizado exitosamente`);

    return new Response(JSON.stringify({
      success: true,
      data: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        status: updatedUser.status,
        email_verified: !!updatedUser.email_verified_at,
        last_login: updatedUser.last_login,
        created_at: updatedUser.created_at,
        updated_at: updatedUser.updated_at
      },
      message: 'Usuario actualizado exitosamente'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[ADMIN USER] Error actualizando:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error interno del servidor',
      details: env.ENVIRONMENT === 'development' ? error.message : undefined
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestDelete(context) {
  const { request, env, params } = context;

  try {
    const userId = params.id;
    console.log(`[ADMIN USER] Eliminando usuario: ${userId}`);

    // TODO: Validar que el usuario es administrador
    // const adminUser = requireAuth(request, env);
    // if (adminUser.role !== 'admin' || adminUser.id === userId) {
    //   return new Response(JSON.stringify({
    //     success: false,
    //     error: 'No puedes eliminarte a ti mismo o no tienes permisos.'
    //   }), { status: 403 });
    // }

    if (!userId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'ID de usuario requerido'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verificar que el usuario existe y no está ya eliminado
    const existingUser = await env.DB.prepare(
      'SELECT id, name, email FROM users WHERE id = ? AND deleted_at IS NULL'
    ).bind(userId).first();

    if (!existingUser) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Usuario no encontrado'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Soft delete del usuario
    const now = new Date().toISOString();
    const result = await env.DB.prepare(
      'UPDATE users SET deleted_at = ?, updated_at = ? WHERE id = ?'
    ).bind(now, now, userId).run();

    if (!result.success) {
      throw new Error('Error eliminando usuario de la base de datos');
    }

    console.log(`[ADMIN USER] Usuario ${userId} eliminado exitosamente`);

    return new Response(JSON.stringify({
      success: true,
      data: {
        id: userId,
        name: existingUser.name,
        email: existingUser.email,
        deleted_at: now
      },
      message: 'Usuario eliminado exitosamente'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[ADMIN USER] Error eliminando:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error interno del servidor',
      details: env.ENVIRONMENT === 'development' ? error.message : undefined
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}