// Endpoint para gestión individual de socios
// GET /api/admin/socios/[id] - Obtener un socio
// PUT /api/admin/socios/[id] - Actualizar un socio
// DELETE /api/admin/socios/[id] - Eliminar un socio

import { errorResponse, successResponse } from '../../../../../shared/apiUtils';

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
    //   return errorResponse('Acceso denegado', 403);
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
      return errorResponse('Socio no encontrado', 404);
    }

    return successResponse({
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
    });
  } catch (error) {
    console.error('[ADMIN SOCIOS] Error obteniendo socio:', error);
    return errorResponse('Error obteniendo información del socio', 500);
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
    //   return errorResponse('Acceso denegado', 403);
    // }

    // Verificar que el socio existe
    const existingSocio = await env.DB.prepare(
      'SELECT id FROM usuarios WHERE id = ? AND activo = 1'
    ).bind(socioId).first();

    if (!existingSocio) {
      return errorResponse('Socio no encontrado', 404);
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
    const params = [];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updates.push(`${field} = ?`);
        params.push(data[field]);
      }
    }

    if (updates.length === 0) {
      return errorResponse('No hay campos para actualizar', 400);
    }

    // Agregar fecha de actualización
    updates.push('updated_at = CURRENT_TIMESTAMP');

    // Agregar ID al final de los parámetros
    params.push(socioId);

    const query = `
      UPDATE usuarios
      SET ${updates.join(', ')}
      WHERE id = ? AND activo = 1
    `;

    await env.DB.prepare(query).bind(...params).run();

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

    return successResponse({
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
    });
  } catch (error) {
    console.error('[ADMIN SOCIOS] Error actualizando socio:', error);
    return errorResponse('Error actualizando el socio', 500);
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
    //   return errorResponse('Acceso denegado', 403);
    // }

    // Verificar que el socio existe
    const existingSocio = await env.DB.prepare(
      'SELECT id, nombre, apellido FROM usuarios WHERE id = ? AND activo = 1'
    ).bind(socioId).first();

    if (!existingSocio) {
      return errorResponse('Socio no encontrado', 404);
    }

    // Realizar "soft delete" marcando como inactivo
    await env.DB.prepare(`
      UPDATE usuarios
      SET activo = 0, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(socioId).run();

    console.log(`[ADMIN SOCIOS] Socio ${socioId} eliminado exitosamente (soft delete)`);

    return successResponse({
      message: `Socio ${existingSocio.nombre} ${existingSocio.apellido} eliminado exitosamente`,
      socioId: parseInt(socioId)
    });
  } catch (error) {
    console.error('[ADMIN SOCIOS] Error eliminando socio:', error);
    return errorResponse('Error eliminando el socio', 500);
  }
}
