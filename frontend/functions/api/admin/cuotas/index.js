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
        WHEN DATE('now') > DATE(c.año || '-' || printf('%02d', c.mes) || '-28') THEN 'VENCIDO'
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
    query += ` AND c.pagado = 0 AND DATE('now') <= DATE(c.año || '-' || printf('%02d', c.mes) || '-28')`;
  } else if (estado === 'vencido') {
    query += ` AND c.pagado = 0 AND DATE('now') > DATE(c.año || '-' || printf('%02d', c.mes) || '-28')`;
  }

  return query;
}

export async function onRequestGet(context) {
  const { request, env } = context;

  try {
    console.log('[ADMIN CUOTAS] Obteniendo cuotas');

    const url = new URL(request.url);
    const año = Number.parseInt(url.searchParams.get('año'), 10) || new Date().getFullYear();
    const mes = url.searchParams.get('mes') ? Number.parseInt(url.searchParams.get('mes'), 10) : null;
    const usuarioId = url.searchParams.get('usuarioId') ? Number.parseInt(url.searchParams.get('usuarioId'), 10) : null;
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
      countQuery += ` AND c.pagado = 0 AND DATE('now') <= DATE(c.año || '-' || printf('%02d', c.mes) || '-28')`;
    } else if (estado === 'vencido') {
      countQuery += ` AND c.pagado = 0 AND DATE('now') > DATE(c.año || '-' || printf('%02d', c.mes) || '-28')`;
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
    
    return new Response(JSON.stringify({
      success: false,
      error: `Error obteniendo cuotas: ${error.message}`
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}