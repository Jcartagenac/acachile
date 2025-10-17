import { requireAuth, errorResponse, jsonResponse } from '../../_middleware';

// Endpoint para obtener configuraciones globales
// GET /api/admin/configuracion

export async function onRequestGet(context) {
  const { request, env } = context;

  try {
    console.log('[ADMIN CONFIG] Obteniendo configuraciones globales');

    let authUser;
    try {
      authUser = requireAuth(request, env);
    } catch (error) {
      return errorResponse(
        error instanceof Error ? error.message : 'Token inválido',
        401,
        env.ENVIRONMENT === 'development' ? { details: error } : undefined
      );
    }

    if (!['admin', 'super_admin'].includes(authUser.role)) {
      return errorResponse('Acceso denegado. Se requieren permisos de administrador.', 403);
    }

    // Obtener todas las configuraciones
    const { results: configs } = await env.DB.prepare(`
      SELECT clave, valor, descripcion, tipo
      FROM configuracion_global
      ORDER BY clave
    `).all();

    // Convertir a objeto para facilitar el acceso
    const configuraciones = {};
    configs.forEach(config => {
      let valor = config.valor;
      
      // Convertir según el tipo
      if (config.tipo === 'number') {
        valor = parseInt(valor);
      } else if (config.tipo === 'boolean') {
        valor = valor === 'true' || valor === '1';
      } else if (config.tipo === 'json') {
        try {
          valor = JSON.parse(valor);
        } catch (e) {
          console.error(`Error parsing JSON for ${config.clave}:`, e);
        }
      }

      configuraciones[config.clave] = {
        valor,
        descripcion: config.descripcion,
        tipo: config.tipo
      };
    });

    return jsonResponse({
      success: true,
      data: configuraciones
    });

  } catch (error) {
    console.error('[ADMIN CONFIG] Error obteniendo configuraciones:', error);
    
    return errorResponse(
      'Error obteniendo configuraciones: ' + (error instanceof Error ? error.message : String(error)),
      500
    );
  }
}

// Endpoint para actualizar una configuración
// PUT /api/admin/configuracion

export async function onRequestPut(context) {
  const { request, env } = context;

  try {
    console.log('[ADMIN CONFIG] Actualizando configuración');

    let authUser;
    try {
      authUser = requireAuth(request, env);
    } catch (error) {
      return errorResponse(
        error instanceof Error ? error.message : 'Token inválido',
        401,
        env.ENVIRONMENT === 'development' ? { details: error } : undefined
      );
    }

    if (!['admin', 'super_admin'].includes(authUser.role)) {
      return errorResponse('Acceso denegado. Se requieren permisos de administrador.', 403);
    }

    const body = await request.json();
    const { clave, valor } = body;

    if (!clave || valor === undefined) {
      return errorResponse('Clave y valor son obligatorios', 400);
    }

    // Obtener la configuración actual para verificar el tipo
    const currentConfig = await env.DB.prepare(`
      SELECT tipo FROM configuracion_global WHERE clave = ?
    `).bind(clave).first();

    if (!currentConfig) {
      return errorResponse('Configuración no encontrada', 404);
    }

    // Convertir el valor al formato de string para almacenar
    let valorString = String(valor);
    if (currentConfig.tipo === 'json') {
      valorString = JSON.stringify(valor);
    }

    // Actualizar la configuración
    const updateResult = await env.DB.prepare(`
      UPDATE configuracion_global 
      SET valor = ?, updated_at = CURRENT_TIMESTAMP
      WHERE clave = ?
    `).bind(valorString, clave).run();

    if (!updateResult.success) {
      throw new Error('Error al actualizar configuración');
    }

    // Obtener la configuración actualizada
    const updatedConfig = await env.DB.prepare(`
      SELECT clave, valor, descripcion, tipo
      FROM configuracion_global
      WHERE clave = ?
    `).bind(clave).first();

    return jsonResponse({
      success: true,
      message: 'Configuración actualizada exitosamente',
      data: updatedConfig
    });

  } catch (error) {
    console.error('[ADMIN CONFIG] Error actualizando configuración:', error);
    
    return errorResponse(
      'Error actualizando configuración: ' + (error instanceof Error ? error.message : String(error)),
      500
    );
  }
}
