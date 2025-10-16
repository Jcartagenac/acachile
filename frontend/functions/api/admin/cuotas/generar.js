// Endpoint para generar cuotas masivamente
// POST /api/admin/cuotas/generar

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    console.log('[ADMIN CUOTAS] Generando cuotas');

    // TODO: Validar que el usuario es administrador
    // const user = requireAuth(request, env);
    // if (!user || user.role !== 'admin') {
    //   return errorResponse('Acceso denegado', 403);
    // }

    const body = await request.json();
    const { año, mes, valorDefault, sobreescribir = false } = body;

    // Validaciones
    if (!año || !mes) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Año y mes son obligatorios'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (mes < 1 || mes > 12) {
      return new Response(JSON.stringify({
        success: false,
        error: 'El mes debe estar entre 1 y 12'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Obtener valor por defecto de configuración si no se especifica
    let valorCuota = valorDefault;
    if (!valorCuota) {
      const config = await env.DB.prepare(`
        SELECT valor FROM configuracion_global WHERE clave = 'cuota_default'
      `).first();
      valorCuota = parseInt(config?.valor) || 6500;
    }

    // Verificar si ya se generaron cuotas para este período
    const existingGeneration = await env.DB.prepare(`
      SELECT id, generadas FROM generacion_cuotas WHERE año = ? AND mes = ?
    `).bind(año, mes).first();

    if (existingGeneration && !sobreescribir) {
      return new Response(JSON.stringify({
        success: false,
        error: `Ya se generaron cuotas para ${mes}/${año}. Use sobreescribir=true para regenerar.`,
        data: {
          existingGeneration: {
            id: existingGeneration.id,
            generadas: existingGeneration.generadas
          }
        }
      }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Obtener todos los socios activos
    const { results: socios } = await env.DB.prepare(`
      SELECT id, nombre, apellido, valor_cuota, estado_socio
      FROM usuarios 
      WHERE activo = 1 AND (estado_socio = 'activo' OR estado_socio IS NULL)
      ORDER BY apellido, nombre
    `).all();

    if (socios.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No hay socios activos para generar cuotas'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let generadas = 0;
    let actualizadas = 0;
    let errores = [];

    // Generar cuotas para cada socio
    for (const socio of socios) {
      try {
        const valorSocio = socio.valor_cuota || valorCuota;

        // Verificar si ya existe la cuota
        const existing = await env.DB.prepare(`
          SELECT id FROM cuotas WHERE usuario_id = ? AND año = ? AND mes = ?
        `).bind(socio.id, año, mes).first();

        if (existing) {
          if (sobreescribir) {
            // Actualizar cuota existente
            const updateResult = await env.DB.prepare(`
              UPDATE cuotas SET valor = ?, updated_at = CURRENT_TIMESTAMP 
              WHERE usuario_id = ? AND año = ? AND mes = ?
            `).bind(valorSocio, socio.id, año, mes).run();

            if (updateResult.success) {
              actualizadas++;
            }
          }
          // Si existe y no sobreescribir, no hacer nada
        } else {
          // Insertar nueva cuota
          const insertResult = await env.DB.prepare(`
            INSERT INTO cuotas (usuario_id, año, mes, valor, pagado)
            VALUES (?, ?, ?, ?, 0)
          `).bind(socio.id, año, mes, valorSocio).run();

          if (insertResult.success) {
            generadas++;
          }
        }

      } catch (error) {
        errores.push(`Error generando cuota para ${socio.nombre} ${socio.apellido}: ${error.message}`);
        console.error(`[ADMIN CUOTAS] Error generando cuota para socio ${socio.id}:`, error);
      }
    }

    // Registrar la generación
    if (sobreescribir && existingGeneration) {
      await env.DB.prepare(`
        UPDATE generacion_cuotas 
        SET valor_default = ?, generadas = ?, fecha_generacion = CURRENT_TIMESTAMP
        WHERE año = ? AND mes = ?
      `).bind(valorCuota, generadas + actualizadas, año, mes).run();
    } else {
      await env.DB.prepare(`
        INSERT INTO generacion_cuotas (año, mes, valor_default, generadas, generado_por)
        VALUES (?, ?, ?, ?, ?)
      `).bind(año, mes, valorCuota, generadas, 1).run(); // TODO: usar ID real del admin
    }

    const resultado = {
      año,
      mes,
      valorCuota,
      totalSocios: socios.length,
      generadas: sobreescribir ? actualizadas : generadas,
      errores: errores.length,
      detalleErrores: errores
    };

    console.log(`[ADMIN CUOTAS] Generación completada:`, resultado);

    return new Response(JSON.stringify({
      success: true,
      message: `Cuotas ${sobreescribir ? 'actualizadas' : 'generadas'} exitosamente para ${mes}/${año}`,
      data: resultado
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[ADMIN CUOTAS] Error generando cuotas:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: `Error generando cuotas: ${error.message}`
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}