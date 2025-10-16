// Endpoint para gestión individual de socios
// GET /api/admin/socios/[id] - Obtener un socio
// PUT /api/admin/socios/[id] - Actualizar un socio
// DELETE /api/admin/socios/[id] - Eliminar un socio

/**
 * GET - Obtener información de un socio específico
 */
export async function onRequestGet(context) {
  const { params, env } = context;
  const socioId = params.id;

  try {
    console.log(`[ADMIN SOCIOS] Obteniendo socio ID: ${socioId}`);

    // TODO: Validar que el usuario es administrador
    // const user = requireAuth(request, env);
    // if (!user || !['admin', 'director'].includes(user.role)) {
    //   return new Response(JSON.stringify({
    //     success: false,
    //     error: 'Acceso denegado'
    //   }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    // }

    const query = `
      SELECT 
        id,
        email,
        nombre,
        apellido,
        telefono,
        rut,
        ciudad,
        direccion,
        foto_url,
        valor_cuota,
        fecha_ingreso,
        estado_socio,
        created_at,
        last_login
      FROM usuarios
      WHERE id = ? AND activo = 1
    `;

    const socio = await env.DB.prepare(query).bind(socioId).first();

    if (!socio) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Socio no encontrado'
      }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({
      success: true,
      data: {
        socio: {
          id: socio.id,
          email: socio.email,
          nombre: socio.nombre,
          apellido: socio.apellido,
          nombreCompleto: `${socio.nombre} ${socio.apellido}`,
          telefono: socio.telefono,
          rut: socio.rut,
          ciudad: socio.ciudad,
          direccion: socio.direccion,
          fotoUrl: socio.foto_url,
          valorCuota: socio.valor_cuota,
          fechaIngreso: socio.fecha_ingreso,
          estadoSocio: socio.estado_socio,
          createdAt: socio.created_at,
          lastLogin: socio.last_login,
        }
      }
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('[ADMIN SOCIOS] Error obteniendo socio:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error obteniendo información del socio'
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

/**
 * PUT - Actualizar información de un socio
 */
export async function onRequestPut(context) {
  const { request, params, env } = context;
  const socioId = params.id;

  try {
    console.log(`[ADMIN SOCIOS] Actualizando socio ID: ${socioId}`);

    // TODO: Validar que el usuario es administrador
    // const user = requireAuth(request, env);
    // if (!user || !['admin', 'director'].includes(user.role)) {
    //   return new Response(JSON.stringify({
    //     success: false,
    //     error: 'Acceso denegado'
    //   }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    // }

    // Verificar que el socio existe
    const existingSocio = await env.DB.prepare(
      'SELECT id FROM usuarios WHERE id = ? AND activo = 1'
    ).bind(socioId).first();

    if (!existingSocio) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Socio no encontrado'
      }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    // Parsear datos del body
    const data = await request.json();

    // Campos permitidos para actualizar
    const allowedFields = [
      'nombre',
      'apellido',
      'email',
      'telefono',
      'rut',
      'ciudad',
      'direccion',
      'valor_cuota',
      'estado_socio'
    ];

    // Construir query de actualización
    const updates = [];
    const queryParams = [];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updates.push(`${field} = ?`);
        queryParams.push(data[field]);
      }
    }

    if (updates.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No hay campos para actualizar'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Agregar fecha de actualización
    updates.push('updated_at = CURRENT_TIMESTAMP');

    // Agregar ID al final de los parámetros
    queryParams.push(socioId);

    const query = `
      UPDATE usuarios
      SET ${updates.join(', ')}
      WHERE id = ? AND activo = 1
    `;

    await env.DB.prepare(query).bind(...queryParams).run();

    // Obtener el socio actualizado
    const updatedSocio = await env.DB.prepare(`
      SELECT 
        id,
        email,
        nombre,
        apellido,
        telefono,
        rut,
        ciudad,
        direccion,
        foto_url,
        valor_cuota,
        fecha_ingreso,
        estado_socio,
        updated_at
      FROM usuarios
      WHERE id = ?
    `).bind(socioId).first();

    console.log(`[ADMIN SOCIOS] Socio ${socioId} actualizado exitosamente`);

    return new Response(JSON.stringify({
      success: true,
      data: {
        message: 'Socio actualizado exitosamente',
        socio: {
          id: updatedSocio.id,
          email: updatedSocio.email,
          nombre: updatedSocio.nombre,
          apellido: updatedSocio.apellido,
          nombreCompleto: `${updatedSocio.nombre} ${updatedSocio.apellido}`,
          telefono: updatedSocio.telefono,
          rut: updatedSocio.rut,
          ciudad: updatedSocio.ciudad,
          direccion: updatedSocio.direccion,
          fotoUrl: updatedSocio.foto_url,
          valorCuota: updatedSocio.valor_cuota,
          fechaIngreso: updatedSocio.fecha_ingreso,
          estadoSocio: updatedSocio.estado_socio,
          updatedAt: updatedSocio.updated_at,
        }
      }
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('[ADMIN SOCIOS] Error actualizando socio:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error actualizando el socio'
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

/**
 * DELETE - Eliminar (desactivar) un socio
 */
export async function onRequestDelete(context) {
  const { params, env } = context;
  const socioId = params.id;

  try {
    console.log(`[ADMIN SOCIOS] Eliminando socio ID: ${socioId}`);

    // TODO: Validar que el usuario es administrador
    // const user = requireAuth(request, env);
    // if (!user || !['admin', 'director'].includes(user.role)) {
    //   return new Response(JSON.stringify({
    //     success: false,
    //     error: 'Acceso denegado'
    //   }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    // }

    // Verificar que el socio existe
    const existingSocio = await env.DB.prepare(
      'SELECT id, nombre, apellido FROM usuarios WHERE id = ? AND activo = 1'
    ).bind(socioId).first();

    if (!existingSocio) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Socio no encontrado'
      }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    // Realizar "soft delete" marcando como inactivo
    await env.DB.prepare(`
      UPDATE usuarios
      SET activo = 0, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(socioId).run();

    console.log(`[ADMIN SOCIOS] Socio ${socioId} eliminado exitosamente (soft delete)`);

    return new Response(JSON.stringify({
      success: true,
      data: {
        message: `Socio ${existingSocio.nombre} ${existingSocio.apellido} eliminado exitosamente`,
        socioId: Number.parseInt(socioId, 10)
      }
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('[ADMIN SOCIOS] Error eliminando socio:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error eliminando el socio'
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
