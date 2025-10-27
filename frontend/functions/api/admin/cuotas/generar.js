import { requireAdminOrDirector, authErrorResponse, errorResponse } from '../../../_middleware';

// Endpoint para generar cuotas masivamente
// POST /api/admin/cuotas/generar

// Validar parámetros de entrada
function validateParams(año, mes) {
  if (!año || !mes) {
    return { valid: false, error: 'Año y mes son obligatorios', status: 400 };
  }

  if (mes < 1 || mes > 12) {
    return { valid: false, error: 'El mes debe estar entre 1 y 12', status: 400 };
  }

  return { valid: true };
}

// Obtener valor de cuota por defecto
async function getValorCuotaDefault(env, valorDefault) {
  if (valorDefault) {
    return valorDefault;
  }

  const config = await env.DB.prepare(
    `SELECT valor FROM configuracion_global WHERE clave = 'cuota_default'`
  ).first();

  return Number.parseInt(config?.valor, 10) || 6500;
}

// Verificar generación existente
async function checkExistingGeneration(env, año, mes, sobreescribir) {
  const existing = await env.DB.prepare(
    `SELECT id, generadas FROM generacion_cuotas WHERE año = ? AND mes = ?`
  ).bind(año, mes).first();

  if (existing && !sobreescribir) {
    return {
      exists: true,
      error: `Ya se generaron cuotas para ${mes}/${año}. Use sobreescribir=true para regenerar.`,
      data: { existingGeneration: { id: existing.id, generadas: existing.generadas } }
    };
  }

  return { exists: false, generation: existing };
}

// Obtener socios activos
async function getSociosActivos(env) {
  const { results } = await env.DB.prepare(`
    SELECT id, nombre, apellido, valor_cuota, estado_socio
    FROM usuarios 
    WHERE activo = 1 AND (estado_socio = 'activo' OR estado_socio IS NULL)
    ORDER BY apellido, nombre
  `).all();

  return results;
}

// Procesar cuota individual
async function procesarCuotaSocio(env, socio, año, mes, valorCuota, sobreescribir) {
  const valorSocio = socio.valor_cuota || valorCuota;

  const existing = await env.DB.prepare(
    `SELECT id FROM cuotas WHERE usuario_id = ? AND año = ? AND mes = ?`
  ).bind(socio.id, año, mes).first();

  if (existing) {
    if (sobreescribir) {
      const result = await env.DB.prepare(
        `UPDATE cuotas SET valor = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE usuario_id = ? AND año = ? AND mes = ?`
      ).bind(valorSocio, socio.id, año, mes).run();
      return { updated: result.success, generated: false };
    }
    return { updated: false, generated: false };
  }

  const result = await env.DB.prepare(
    `INSERT INTO cuotas (usuario_id, año, mes, valor, pagado) VALUES (?, ?, ?, ?, 0)`
  ).bind(socio.id, año, mes, valorSocio).run();

  return { updated: false, generated: result.success };
}

// Registrar generación de cuotas
async function registrarGeneracion(env, año, mes, valorCuota, totalGeneradas, existingGeneration) {
  if (existingGeneration) {
    await env.DB.prepare(
      `UPDATE generacion_cuotas 
       SET valor_default = ?, generadas = ?, fecha_generacion = CURRENT_TIMESTAMP
       WHERE año = ? AND mes = ?`
    ).bind(valorCuota, totalGeneradas, año, mes).run();
  } else {
    await env.DB.prepare(
      `INSERT INTO generacion_cuotas (año, mes, valor_default, generadas, generado_por)
       VALUES (?, ?, ?, ?, ?)`
    ).bind(año, mes, valorCuota, totalGeneradas, 1).run();
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    console.log('[ADMIN CUOTAS] Generando cuotas');

    try {
      await requireAdminOrDirector(request, env);
    } catch (error) {
      return authErrorResponse(error, env);
    }

    const body = await request.json();
    const { año, mes, valorDefault, sobreescribir = false } = body;

    // Validar parámetros
    const validation = validateParams(año, mes);
    if (!validation.valid) {
      return new Response(JSON.stringify({ success: false, error: validation.error }), {
        status: validation.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Obtener valor de cuota
    const valorCuota = await getValorCuotaDefault(env, valorDefault);

    // Verificar si ya existen cuotas para este período
    const existingCheck = await checkExistingGeneration(env, año, mes, sobreescribir);
    if (existingCheck.exists) {
      return new Response(JSON.stringify({
        success: false,
        error: existingCheck.error,
        data: existingCheck.data
      }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Obtener socios activos
    const socios = await getSociosActivos(env);
    if (socios.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No hay socios activos para generar cuotas'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Procesar cuotas para cada socio
    let generadas = 0;
    let actualizadas = 0;
    const errores = [];

    for (const socio of socios) {
      try {
        const result = await procesarCuotaSocio(env, socio, año, mes, valorCuota, sobreescribir);
        if (result.generated) generadas++;
        if (result.updated) actualizadas++;
      } catch (error) {
        errores.push(`Error generando cuota para ${socio.nombre} ${socio.apellido}: ${error.message}`);
        console.error(`[ADMIN CUOTAS] Error generando cuota para socio ${socio.id}:`, error);
      }
    }

    // Registrar la generación
    await registrarGeneracion(env, año, mes, valorCuota, generadas + actualizadas, existingCheck.generation);

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

    return errorResponse(
      error instanceof Error ? `Error generando cuotas: ${error.message}` : 'Error generando cuotas',
      500,
      env.ENVIRONMENT === 'development'
        ? { details: error instanceof Error ? error.stack || error.message : error }
        : undefined
    );
  }
}
