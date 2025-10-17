// Endpoint para obtener configuraciones globales
// GET /api/admin/configuracion

export async function onRequestGet(context) {
  const { env } = context;

  try {
    console.log('[ADMIN CONFIG] Obteniendo configuraciones globales');

    // TODO: Validar que el usuario es administrador
    // const user = requireAuth(request, env);
    // if (!user || user.role !== 'admin') {
    //   return errorResponse('Acceso denegado', 403);
    // }

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

    return new Response(JSON.stringify({
      success: true,
      data: configuraciones
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[ADMIN CONFIG] Error obteniendo configuraciones:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Error obteniendo configuraciones: ' + error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Endpoint para actualizar una configuración
// PUT /api/admin/configuracion

export async function onRequestPut(context) {
  const { request, env } = context;

  try {
    console.log('[ADMIN CONFIG] Actualizando configuración');

    // TODO: Validar que el usuario es administrador
    // const user = requireAuth(request, env);
    // if (!user || user.role !== 'admin') {
    //   return errorResponse('Acceso denegado', 403);
    // }

    const body = await request.json();
    const { clave, valor } = body;

    if (!clave || valor === undefined) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Clave y valor son obligatorios'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Obtener la configuración actual para verificar el tipo
    const currentConfig = await env.DB.prepare(`
      SELECT tipo FROM configuracion_global WHERE clave = ?
    `).bind(clave).first();

    if (!currentConfig) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Configuración no encontrada'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
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

    return new Response(JSON.stringify({
      success: true,
      message: 'Configuración actualizada exitosamente',
      data: updatedConfig
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[ADMIN CONFIG] Error actualizando configuración:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: 'Error actualizando configuración: ' + error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
