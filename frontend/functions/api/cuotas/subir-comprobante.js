import { requireAuth } from '../../_middleware';

// Endpoint para que usuarios suban comprobantes de pago de sus cuotas
// POST /api/cuotas/subir-comprobante

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    console.log('[CUOTAS] Usuario subiendo comprobante de pago');

    const authUser = await requireAuth(request, env);
    const usuarioId = authUser.userId;

    const formData = await request.formData();
    const file = formData.get('comprobante');
    const cuotaId = formData.get('cuotaId');
    const metodoPago = formData.get('metodoPago') || 'transferencia';
    const fechaPago = formData.get('fechaPago') || new Date().toISOString();
    const notas = formData.get('notas') || '';

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

    if (!file) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Archivo comprobante es obligatorio'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verificar que la cuota pertenece al usuario
    const cuota = await env.DB.prepare(`
      SELECT 
        c.id, c.usuario_id, c.año, c.mes, c.valor, c.pagado,
        u.nombre, u.apellido, u.email
      FROM cuotas c
      INNER JOIN usuarios u ON c.usuario_id = u.id
      WHERE c.id = ? AND c.usuario_id = ? AND u.activo = 1
    `).bind(cuotaId, usuarioId).first();

    if (!cuota) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Cuota no encontrada o no pertenece al usuario'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (cuota.pagado) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Esta cuota ya está marcada como pagada'
      }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validar tipo de archivo (solo imágenes)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Solo se permiten archivos de imagen (JPG, PNG, WebP) o PDF'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validar tamaño (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return new Response(JSON.stringify({
        success: false,
        error: 'El archivo no puede superar los 5MB'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generar nombre único para el archivo
    const extension = file.type === 'application/pdf' ? 'pdf' : file.type.split('/')[1];
    const fileName = `comprobante-${cuotaId}-${Date.now()}.${extension}`;
    const filePath = `cuotas/${cuota.año}/${cuota.mes}/${fileName}`;

    try {
      // Subir archivo a R2
      const arrayBuffer = await file.arrayBuffer();
      await env.IMAGES.put(filePath, arrayBuffer, {
        httpMetadata: {
          contentType: file.type,
        },
        customMetadata: {
          originalName: file.name,
          cuotaId: cuotaId.toString(),
          usuarioId: usuarioId.toString(),
          año: cuota.año.toString(),
          mes: cuota.mes.toString()
        }
      });

      console.log(`[CUOTAS] Comprobante subido a R2: ${filePath}`);

      // Construir URL del comprobante
      const comprobanteUrl = `https://pub-8e06b783ed7c4c049b7dc5d61c51c27e.r2.dev/${filePath}`;

      // Actualizar cuota con el comprobante (pendiente de aprobación)
      const updateResult = await env.DB.prepare(`
        UPDATE cuotas 
        SET 
          comprobante_url = ?,
          metodo_pago = ?,
          notas = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(comprobanteUrl, metodoPago, notas, cuotaId).run();

      if (!updateResult.success) {
        throw new Error('Error actualizando cuota en la base de datos');
      }

      // Registrar el pago como pendiente de aprobación
      await env.DB.prepare(`
        INSERT INTO pagos (
          cuota_id, usuario_id, monto, metodo_pago, comprobante_url,
          estado, fecha_pago, notas_admin
        ) VALUES (?, ?, ?, ?, ?, 'pendiente', ?, ?)
      `).bind(
        cuotaId,
        usuarioId,
        cuota.valor,
        metodoPago,
        comprobanteUrl,
        fechaPago,
        `Comprobante subido por usuario. Notas: ${notas}`
      ).run();

      console.log(`[CUOTAS] Comprobante registrado para cuota ${cuotaId}`);

      return new Response(JSON.stringify({
        success: true,
        message: 'Comprobante subido exitosamente. Pendiente de aprobación por administrador.',
        data: {
          cuotaId: parseInt(cuotaId),
          comprobanteUrl,
          metodoPago,
          fechaPago,
          estado: 'pendiente_aprobacion',
          cuota: {
            año: cuota.año,
            mes: cuota.mes,
            valor: cuota.valor,
            socio: `${cuota.nombre} ${cuota.apellido}`
          }
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (uploadError) {
      console.error('[CUOTAS] Error subiendo archivo:', uploadError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Error subiendo comprobante. Intenta nuevamente.'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('[CUOTAS] Error general:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: `Error procesando comprobante: ${error.message}`
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
