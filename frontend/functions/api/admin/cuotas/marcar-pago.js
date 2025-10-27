import { requireAdminOrDirector, authErrorResponse, errorResponse } from '../../../_middleware';

// Endpoint para marcar cuota como pagada
// POST /api/admin/cuotas/marcar-pago

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    console.log('[ADMIN CUOTAS] Marcando pago de cuota');

    let adminUser;
    try {
      adminUser = await requireAdminOrDirector(request, env);
    } catch (error) {
      return authErrorResponse(error, env);
    }

    const body = await request.json();
    const { 
      cuotaId, 
      metodoPago = 'transferencia', 
      fechaPago, 
      comprobanteUrl, 
      notas
    } = body;

    // Convertir undefined a null para D1
    const comprobanteUrlFinal = comprobanteUrl || null;
    const notasFinal = notas || null;
    const fechaPagoFinal = fechaPago || new Date().toISOString();

    // Validaciones
    if (!cuotaId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'ID de cuota es obligatorio'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const metodosValidos = ['transferencia', 'efectivo', 'tarjeta'];
    if (!metodosValidos.includes(metodoPago)) {
      return new Response(JSON.stringify({
        success: false,
        error: `Método de pago debe ser uno de: ${metodosValidos.join(', ')}`
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verificar que la cuota existe
    const cuota = await env.DB.prepare(`
      SELECT 
        c.id, c.usuario_id, c.año, c.mes, c.valor, c.pagado,
        u.nombre, u.apellido, u.email
      FROM cuotas c
      INNER JOIN usuarios u ON c.usuario_id = u.id
      WHERE c.id = ? AND u.activo = 1
    `).bind(cuotaId).first();

    if (!cuota) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Cuota no encontrada'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (cuota.pagado) {
      return new Response(JSON.stringify({
        success: false,
        error: 'La cuota ya está marcada como pagada',
        data: { cuota }
      }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Marcar cuota como pagada
    const updateResult = await env.DB.prepare(`
      UPDATE cuotas 
      SET 
        pagado = 1,
        fecha_pago = ?,
        metodo_pago = ?,
        comprobante_url = ?,
        notas = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(fechaPagoFinal, metodoPago, comprobanteUrlFinal, notasFinal, cuotaId).run();

    if (!updateResult.success) {
      throw new Error('Error actualizando cuota en la base de datos');
    }

    // Registrar el pago en la tabla de pagos para historial
    const pagoResult = await env.DB.prepare(`
      INSERT INTO pagos (
        cuota_id, usuario_id, monto, metodo_pago, comprobante_url,
        estado, fecha_pago, procesado_por, notas_admin
      ) VALUES (?, ?, ?, ?, ?, 'confirmado', ?, ?, ?)
    `).bind(
      cuotaId,
      cuota.usuario_id,
      cuota.valor,
      metodoPago,
      comprobanteUrlFinal,
      fechaPagoFinal,
      Number(adminUser.userId) || cuota.usuario_id,
      notasFinal
    ).run();

    // Obtener cuota actualizada
    const cuotaActualizada = await env.DB.prepare(`
      SELECT 
        c.id, c.usuario_id, c.año, c.mes, c.valor, c.pagado,
        c.fecha_pago, c.metodo_pago, c.comprobante_url, c.notas,
        u.nombre, u.apellido, u.email
      FROM cuotas c
      INNER JOIN usuarios u ON c.usuario_id = u.id
      WHERE c.id = ?
    `).bind(cuotaId).first();

    const resultado = {
      cuota: {
        id: cuotaActualizada.id,
        usuarioId: cuotaActualizada.usuario_id,
        año: cuotaActualizada.año,
        mes: cuotaActualizada.mes,
        valor: cuotaActualizada.valor,
        pagado: Boolean(cuotaActualizada.pagado),
        fechaPago: cuotaActualizada.fecha_pago,
        metodoPago: cuotaActualizada.metodo_pago,
        comprobanteUrl: cuotaActualizada.comprobante_url,
        notas: cuotaActualizada.notas,
        socio: {
          id: cuotaActualizada.usuario_id,
          nombre: cuotaActualizada.nombre,
          apellido: cuotaActualizada.apellido,
          nombreCompleto: `${cuotaActualizada.nombre} ${cuotaActualizada.apellido}`,
          email: cuotaActualizada.email
        }
      },
      pagoRegistrado: pagoResult.success
    };

    console.log(`[ADMIN CUOTAS] Cuota ${cuotaId} marcada como pagada exitosamente`);

    return new Response(JSON.stringify({
      success: true,
      message: `Cuota de ${cuotaActualizada.nombre} ${cuotaActualizada.apellido} marcada como pagada`,
      data: resultado
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[ADMIN CUOTAS] Error marcando pago:', error);

    return errorResponse(
      error instanceof Error ? `Error marcando pago: ${error.message}` : 'Error marcando pago',
      500,
      env.ENVIRONMENT === 'development'
        ? { details: error instanceof Error ? error.stack || error.message : error }
        : undefined
    );
  }
}
