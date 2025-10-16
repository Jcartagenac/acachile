// Endpoint para operaciones sobre cuota individual
// PUT /api/admin/cuotas/:id - Actualizar cuota (desmarcar pago)
// DELETE /api/admin/cuotas/:id - Eliminar cuota

// OPTIONS - CORS preflight
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

// PUT - Desmarcar pago
export async function onRequestPut(context) {
  const { request, env, params } = context;
  
  // Headers CORS comunes
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  try {
    const cuotaId = params.id;
    console.log('[ADMIN CUOTAS] Actualizando cuota:', cuotaId);

    const body = await request.json();
    const { pagado, fechaPago, metodoPago } = body;

    // Validar que la cuota existe
    const cuota = await env.DB.prepare(`
      SELECT id, usuario_id, pagado FROM cuotas WHERE id = ?
    `).bind(cuotaId).first();

    if (!cuota) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Cuota no encontrada'
      }), {
        status: 404,
        headers: corsHeaders
      });
    }

    // Actualizar cuota
    const updateResult = await env.DB.prepare(`
      UPDATE cuotas 
      SET 
        pagado = ?,
        fecha_pago = ?,
        metodo_pago = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      pagado ? 1 : 0,
      fechaPago || null,
      metodoPago || null,
      cuotaId
    ).run();

    if (!updateResult.success) {
      throw new Error('Error actualizando cuota en la base de datos');
    }

    console.log(`[ADMIN CUOTAS] Cuota ${cuotaId} actualizada exitosamente`);

    return new Response(JSON.stringify({
      success: true,
      message: 'Cuota actualizada exitosamente',
      data: { cuotaId, pagado }
    }), {
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    console.error('[ADMIN CUOTAS] Error actualizando cuota:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: `Error actualizando cuota: ${error.message}`
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

// DELETE - Eliminar cuota
export async function onRequestDelete(context) {
  const { env, params } = context;
  
  // Headers CORS comunes
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  try {
    const cuotaId = params.id;
    console.log('[ADMIN CUOTAS] Eliminando cuota:', cuotaId);

    // Verificar que la cuota existe
    const cuota = await env.DB.prepare(`
      SELECT id, usuario_id, año, mes, pagado FROM cuotas WHERE id = ?
    `).bind(cuotaId).first();

    if (!cuota) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Cuota no encontrada'
      }), {
        status: 404,
        headers: corsHeaders
      });
    }

    // No permitir eliminar cuotas pagadas (por seguridad)
    if (cuota.pagado) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No se puede eliminar una cuota pagada. Primero desmárquela como pagada.'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Eliminar cuota
    const deleteResult = await env.DB.prepare(`
      DELETE FROM cuotas WHERE id = ?
    `).bind(cuotaId).run();

    if (!deleteResult.success) {
      throw new Error('Error eliminando cuota de la base de datos');
    }

    console.log(`[ADMIN CUOTAS] Cuota ${cuotaId} eliminada exitosamente`);

    return new Response(JSON.stringify({
      success: true,
      message: 'Cuota eliminada exitosamente',
      data: { cuotaId }
    }), {
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    console.error('[ADMIN CUOTAS] Error eliminando cuota:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: `Error eliminando cuota: ${error.message}`
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}
