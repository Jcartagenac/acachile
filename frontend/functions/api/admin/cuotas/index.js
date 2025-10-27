import { requireAdminOrDirector, authErrorResponse, errorResponse } from '../../../_middleware';

// Endpoint para gestión de cuotas
// GET /api/admin/cuotas - Obtener cuotas con filtros
// POST /api/admin/cuotas/generar - Generar cuotas para un mes/año
// POST /api/admin/cuotas/marcar-pago - Marcar cuota como pagada

// Construir query base de cuotas
function buildBaseQuery() {
  return `
    SELECT 
      c.id as cuota_id,
      c.usuario_id,
      c.año,
      c.mes,
      c.valor,
      c.pagado,
      c.fecha_pago,
      c.metodo_pago,
      c.comprobante_url,
      c.notas,
      c.created_at as cuota_created_at,
      u.nombre,
      u.apellido,
      u.email,
      u.telefono,
      u.rut,
      u.estado_socio,
      CASE 
        WHEN c.pagado = 1 THEN 'PAGADO'
        WHEN DATE('now') > DATE(c.año || '-' || printf('%02d', c.mes) || '-05') THEN 'VENCIDO'
        ELSE 'PENDIENTE'
      END as estado_cuota
    FROM cuotas c
    INNER JOIN usuarios u ON c.usuario_id = u.id
    WHERE u.activo = 1
  `;
}

// Aplicar filtros a la query
function applyFilters(query, params, filters) {
  const { año, mes, usuarioId, estado } = filters;

  if (año) {
    query += ` AND c.año = ?`;
    params.push(año);
  }

  if (mes) {
    query += ` AND c.mes = ?`;
    params.push(mes);
  }

  if (usuarioId) {
    query += ` AND c.usuario_id = ?`;
    params.push(usuarioId);
  }

  if (estado === 'pagado') {
    query += ` AND c.pagado = 1`;
  } else if (estado === 'pendiente') {
    query += ` AND c.pagado = 0 AND DATE('now') <= DATE(c.año || '-' || printf('%02d', c.mes) || '-05')`;
  } else if (estado === 'vencido') {
    query += ` AND c.pagado = 0 AND DATE('now') > DATE(c.año || '-' || printf('%02d', c.mes) || '-05')`;
  }

  return query;
}

export async function onRequestGet(context) {
  const { request, env } = context;

  try {
    console.log('[ADMIN CUOTAS] Obteniendo cuotas');

    try {
      await requireAdminOrDirector(request, env);
    } catch (error) {
      return authErrorResponse(error, env);
    }

    const url = new URL(request.url);
    const año = Number.parseInt(url.searchParams.get('año'), 10) || new Date().getFullYear();
    const mes = url.searchParams.get('mes') ? Number.parseInt(url.searchParams.get('mes'), 10) : null;
    // Aceptar tanto usuarioId como socioId para compatibilidad
    const usuarioId = url.searchParams.get('usuarioId') 
      ? Number.parseInt(url.searchParams.get('usuarioId'), 10) 
      : url.searchParams.get('socioId') 
        ? Number.parseInt(url.searchParams.get('socioId'), 10) 
        : null;
    const estado = url.searchParams.get('estado');
    const page = Number.parseInt(url.searchParams.get('page'), 10) || 1;
    const limit = Number.parseInt(url.searchParams.get('limit'), 10) || 50;

    // Construir query con filtros
    const params = [];
    let query = buildBaseQuery();
    query = applyFilters(query, params, { año, mes, usuarioId, estado });
    query += ` ORDER BY c.año DESC, c.mes DESC, u.apellido ASC LIMIT ? OFFSET ?`;
    params.push(limit, (page - 1) * limit);

    const { results } = await env.DB.prepare(query).bind(...params).all();

    // Contar total para paginación
    let countQuery = `
      SELECT COUNT(*) as total
      FROM cuotas c
      INNER JOIN usuarios u ON c.usuario_id = u.id
      WHERE u.activo = 1
    `;
    const countParams = [];

    if (año) {
      countQuery += ` AND c.año = ?`;
      countParams.push(año);
    }

    if (mes) {
      countQuery += ` AND c.mes = ?`;
      countParams.push(mes);
    }

    if (usuarioId) {
      countQuery += ` AND c.usuario_id = ?`;
      countParams.push(usuarioId);
    }

    if (estado === 'pagado') {
      countQuery += ` AND c.pagado = 1`;
    } else if (estado === 'pendiente') {
      countQuery += ` AND c.pagado = 0 AND DATE('now') <= DATE(c.año || '-' || printf('%02d', c.mes) || '-05')`;
    } else if (estado === 'vencido') {
      countQuery += ` AND c.pagado = 0 AND DATE('now') > DATE(c.año || '-' || printf('%02d', c.mes) || '-05')`;
    }

    const totalResult = await env.DB.prepare(countQuery).bind(...countParams).first();
    const total = totalResult?.total || 0;

    // Formatear resultados
    const cuotas = results.map(cuota => ({
      id: cuota.cuota_id,
      usuarioId: cuota.usuario_id,
      año: cuota.año,
      mes: cuota.mes,
      valor: cuota.valor,
      pagado: Boolean(cuota.pagado),
      fechaPago: cuota.fecha_pago,
      metodoPago: cuota.metodo_pago,
      comprobanteUrl: cuota.comprobante_url,
      notas: cuota.notas,
      estado: cuota.estado_cuota,
      createdAt: cuota.cuota_created_at,
      // Datos del socio
      socio: {
        id: cuota.usuario_id,
        nombre: cuota.nombre,
        apellido: cuota.apellido,
        nombreCompleto: `${cuota.nombre} ${cuota.apellido}`,
        email: cuota.email,
        telefono: cuota.telefono,
        rut: cuota.rut,
        estadoSocio: cuota.estado_socio
      }
    }));

    // Estadísticas del período consultado
    const estadisticas = {
      total: total,
      pagadas: results.filter(c => c.pagado === 1).length,
      pendientes: results.filter(c => c.estado_cuota === 'PENDIENTE').length,
      vencidas: results.filter(c => c.estado_cuota === 'VENCIDO').length,
      montoTotal: results.reduce((sum, c) => sum + c.valor, 0),
      montoPagado: results.filter(c => c.pagado === 1).reduce((sum, c) => sum + c.valor, 0),
      montoPendiente: results.filter(c => c.pagado === 0).reduce((sum, c) => sum + c.valor, 0)
    };

    const totalPages = Math.ceil(total / limit);

    console.log(`[ADMIN CUOTAS] Devolviendo ${cuotas.length} cuotas para ${año}${mes ? `/${mes}` : ''}`);

    return new Response(JSON.stringify({
      success: true,
      data: {
        cuotas,
        estadisticas,
        filtros: { año, mes, usuarioId, estado },
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[ADMIN CUOTAS] Error obteniendo cuotas:', error);

    return errorResponse(
      error instanceof Error ? `Error obteniendo cuotas: ${error.message}` : 'Error obteniendo cuotas',
      500,
      env.ENVIRONMENT === 'development'
        ? { details: error instanceof Error ? error.stack || error.message : error }
        : undefined
    );
  }
}

// POST - Crear cuota individual para un socio específico
export async function onRequestPost(context) {
  const { request, env } = context;
  
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  try {
    console.log('[ADMIN CUOTAS] Creando cuota individual');

    try {
      await requireAdminOrDirector(request, env);
    } catch (error) {
      return authErrorResponse(error, env);
    }

    const body = await request.json();
    const { usuarioId, año, mes, valor } = body;

    // Validar parámetros requeridos
    if (!usuarioId || !año || !mes) {
      return new Response(JSON.stringify({
        success: false,
        error: 'usuarioId, año y mes son obligatorios'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    if (mes < 1 || mes > 12) {
      return new Response(JSON.stringify({
        success: false,
        error: 'El mes debe estar entre 1 y 12'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Verificar que el usuario existe y está activo
    const usuario = await env.DB.prepare(`
      SELECT id, nombre, apellido, valor_cuota, activo 
      FROM usuarios 
      WHERE id = ?
    `).bind(usuarioId).first();

    if (!usuario) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Usuario no encontrado'
      }), {
        status: 404,
        headers: corsHeaders
      });
    }

    if (!usuario.activo) {
      return new Response(JSON.stringify({
        success: false,
        error: 'El usuario no está activo'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Verificar si ya existe una cuota para este usuario/año/mes
    const existingCuota = await env.DB.prepare(`
      SELECT id FROM cuotas 
      WHERE usuario_id = ? AND año = ? AND mes = ?
    `).bind(usuarioId, año, mes).first();

    if (existingCuota) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Ya existe una cuota para este usuario en este período',
        data: { cuotaId: existingCuota.id }
      }), {
        status: 409,
        headers: corsHeaders
      });
    }

    // Usar el valor proporcionado o el valor de cuota del usuario
    const valorCuota = valor || usuario.valor_cuota || 6500;

    // Crear la cuota
    const result = await env.DB.prepare(`
      INSERT INTO cuotas (usuario_id, año, mes, valor, pagado, created_at)
      VALUES (?, ?, ?, ?, 0, CURRENT_TIMESTAMP)
    `).bind(usuarioId, año, mes, valorCuota).run();

    if (!result.success) {
      throw new Error('Error creando cuota en la base de datos');
    }

    // Obtener el ID de la cuota recién creada
    const nuevaCuota = await env.DB.prepare(`
      SELECT id, usuario_id, año, mes, valor, pagado
      FROM cuotas
      WHERE usuario_id = ? AND año = ? AND mes = ?
    `).bind(usuarioId, año, mes).first();

    console.log(`[ADMIN CUOTAS] Cuota individual creada:`, nuevaCuota);

    return new Response(JSON.stringify({
      success: true,
      message: 'Cuota creada exitosamente',
      data: {
        cuota: {
          id: nuevaCuota.id,
          usuarioId: nuevaCuota.usuario_id,
          año: nuevaCuota.año,
          mes: nuevaCuota.mes,
          valor: nuevaCuota.valor,
          pagado: Boolean(nuevaCuota.pagado)
        }
      }
    }), {
      status: 201,
      headers: corsHeaders
    });

  } catch (error) {
    console.error('[ADMIN CUOTAS] Error creando cuota individual:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: `Error creando cuota: ${error.message}`
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

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
