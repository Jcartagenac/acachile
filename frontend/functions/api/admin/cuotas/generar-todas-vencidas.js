import { requireAdminOrDirector, authErrorResponse } from '../_middleware';

// Endpoint para generar TODAS las cuotas vencidas de TODOS los socios
// POST /api/admin/cuotas/generar-todas-vencidas

// Obtener valor de cuota por defecto
async function getValorCuotaDefault(env) {
  const config = await env.DB.prepare(
    `SELECT valor FROM configuracion_global WHERE clave = 'cuota_default'`
  ).first();

  return Number.parseInt(config?.valor, 10) || 6500;
}

// Obtener todos los socios activos (incluyendo suspendidos)
async function getSociosActivos(env) {
  const { results } = await env.DB.prepare(`
    SELECT id, nombre, apellido, valor_cuota, estado_socio, created_at
    FROM usuarios 
    WHERE activo = 1
    ORDER BY apellido, nombre
  `).all();

  return results;
}

// Generar cuotas vencidas para un socio específico
async function generarCuotasVencidasSocio(env, socio, valorCuotaDefault, fechaActual) {
  const valorCuota = socio.valor_cuota || valorCuotaDefault;
  
  // Obtener la fecha del primer pago del socio para determinar desde cuándo generar
  const primerPago = await env.DB.prepare(`
    SELECT MIN(año) as min_año, MIN(mes) as min_mes
    FROM cuotas 
    WHERE usuario_id = ? AND pagado = 1
    ORDER BY año ASC, mes ASC
    LIMIT 1
  `).bind(socio.id).first();
  
  let añoInicio, mesInicio;
  
  if (primerPago && primerPago.min_año) {
    // Si tiene pagos, iniciar desde el mes del primer pago
    añoInicio = primerPago.min_año;
    mesInicio = primerPago.min_mes || 1;
    console.log(`[Socio ${socio.id}] Primer pago encontrado: ${mesInicio}/${añoInicio}`);
  } else {
    // Si no tiene pagos, usar fecha de ingreso
    const fechaIngreso = new Date(socio.created_at || '2024-01-01');
    añoInicio = fechaIngreso.getFullYear();
    mesInicio = fechaIngreso.getMonth() + 1; // JavaScript months are 0-indexed
    console.log(`[Socio ${socio.id}] Sin pagos, usando fecha ingreso: ${mesInicio}/${añoInicio}`);
  }
  
  // Generar hasta diciembre 2025
  const añoFin = 2025;
  const mesFin = 12;
  
  let cuotasGeneradas = 0;
  let cuotasActualizadas = 0;
  
  // Iterar desde la fecha inicial hasta diciembre 2025
  for (let año = añoInicio; año <= añoFin; año++) {
    const mesInicioPeriodo = (año === añoInicio) ? mesInicio : 1;
    const mesFinPeriodo = (año === añoFin) ? mesFin : 12;
    
    for (let mes = mesInicioPeriodo; mes <= mesFinPeriodo; mes++) {
      try {
        // Verificar si la cuota ya existe
        const existing = await env.DB.prepare(
          `SELECT id, valor FROM cuotas WHERE usuario_id = ? AND año = ? AND mes = ?`
        ).bind(socio.id, año, mes).first();
        
        if (existing) {
          // Actualizar valor si es diferente
          if (existing.valor !== valorCuota) {
            await env.DB.prepare(
              `UPDATE cuotas SET valor = ?, updated_at = CURRENT_TIMESTAMP 
               WHERE usuario_id = ? AND año = ? AND mes = ?`
            ).bind(valorCuota, socio.id, año, mes).run();
            cuotasActualizadas++;
          }
        } else {
          // Crear nueva cuota
          await env.DB.prepare(
            `INSERT INTO cuotas (usuario_id, año, mes, valor, pagado) 
             VALUES (?, ?, ?, ?, 0)`
          ).bind(socio.id, año, mes, valorCuota).run();
          cuotasGeneradas++;
        }
      } catch (error) {
        console.error(`Error procesando cuota ${mes}/${año} para socio ${socio.id}:`, error);
        // Continuar con la siguiente cuota
      }
    }
  }
  
  return { generadas: cuotasGeneradas, actualizadas: cuotasActualizadas };
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    console.log('[ADMIN CUOTAS] Generando TODAS las cuotas vencidas');

    // Verificar permisos de admin o director
    try {
      await requireAdminOrDirector(request, env);
    } catch (error) {
      return authErrorResponse(error, env);
    }

    // Obtener fecha actual
    const fechaActual = new Date();
    
    // Obtener valor de cuota por defecto
    const valorCuotaDefault = await getValorCuotaDefault(env);
    console.log('[ADMIN CUOTAS] Valor cuota default:', valorCuotaDefault);

    // Obtener todos los socios activos
    const socios = await getSociosActivos(env);
    console.log('[ADMIN CUOTAS] Total socios activos:', socios.length);

    if (socios.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No hay socios activos para generar cuotas'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Procesar cada socio
    let totalGeneradas = 0;
    let totalActualizadas = 0;
    let sociosProcesados = 0;
    const errores = [];

    for (const socio of socios) {
      try {
        const resultado = await generarCuotasVencidasSocio(
          env, 
          socio, 
          valorCuotaDefault, 
          fechaActual
        );
        
        totalGeneradas += resultado.generadas;
        totalActualizadas += resultado.actualizadas;
        sociosProcesados++;
        
        if (sociosProcesados % 10 === 0) {
          console.log(`[ADMIN CUOTAS] Procesados ${sociosProcesados}/${socios.length} socios...`);
        }
      } catch (error) {
        console.error(`Error procesando socio ${socio.id} (${socio.nombre} ${socio.apellido}):`, error);
        errores.push({
          socioId: socio.id,
          nombre: `${socio.nombre} ${socio.apellido}`,
          error: error.message
        });
      }
    }

    console.log('[ADMIN CUOTAS] Proceso completado:', {
      sociosProcesados,
      totalGeneradas,
      totalActualizadas,
      errores: errores.length
    });

    return new Response(JSON.stringify({
      success: true,
      data: {
        sociosProcesados,
        cuotasGeneradas: totalGeneradas,
        cuotasActualizadas: totalActualizadas,
        totalCuotas: totalGeneradas + totalActualizadas,
        errores: errores.length > 0 ? errores : undefined
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[ADMIN CUOTAS] Error generando todas las cuotas vencidas:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Error al generar cuotas vencidas'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
