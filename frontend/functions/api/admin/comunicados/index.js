import { requireAdminOrDirector, authErrorResponse, jsonResponse, errorResponse } from '../../_middleware';

/**
 * API para gestión de comunicados (admin)
 * GET: Listar todos los comunicados
 * POST: Crear nuevo comunicado
 */

// GET: Listar comunicados
export async function onRequestGet(context) {
  try {
    const { env, request } = context;
    try {
      await requireAdminOrDirector(request, env);
    } catch (error) {
      return authErrorResponse(error, env);
    }

    // Obtener parámetros de consulta
    const url = new URL(request.url);
    const estado = url.searchParams.get('estado'); // 'borrador' o 'enviado'
    const tipo = url.searchParams.get('tipo'); // 'importante', 'corriente', 'urgente'
    const limit = Number.parseInt(url.searchParams.get('limit') || '50', 10);

    // Construir query dinámicamente
    let query = `
      SELECT 
        c.*,
        u.nombre || ' ' || u.apellido as created_by_name
      FROM comunicados c
      LEFT JOIN usuarios u ON c.created_by = u.id
      WHERE 1=1
    `;
    const params = [];

    if (estado) {
      query += ' AND c.estado = ?';
      params.push(estado);
    }

    if (tipo) {
      query += ' AND c.tipo = ?';
      params.push(tipo);
    }

    query += ' ORDER BY c.created_at DESC LIMIT ?';
    params.push(limit);

    const stmt = env.DB.prepare(query);
    const { results } = await stmt.bind(...params).all();

    // Parsear destinatarios de JSON string a array
    const comunicados = results.map(c => ({
      ...c,
      destinatarios: JSON.parse(c.destinatarios || '[]')
    }));

    return jsonResponse({
      success: true,
      comunicados,
      total: comunicados.length
    });

  } catch (error) {
    console.error('Error al obtener comunicados:', error);
    return errorResponse(
      'Error al obtener comunicados',
      500,
      env.ENVIRONMENT === 'development' ? { details: error instanceof Error ? error.message : error } : undefined
    );
  }
}

// POST: Crear nuevo comunicado
export async function onRequestPost(context) {
  try {
    const { env, request } = context;
    let adminUser;
    try {
      adminUser = await requireAdminOrDirector(request, env);
    } catch (error) {
      return authErrorResponse(error, env);
    }

    const actorId = Number(adminUser.userId);
    const actor = await env.DB.prepare(
      'SELECT id FROM usuarios WHERE id = ? AND activo = 1'
    ).bind(actorId).first();

    if (!actor) {
      return errorResponse('Usuario administrador no válido', 403);
    }

    const data = await request.json();
    const { titulo, contenido, tipo, destinatarios, enviar } = data;

    if (!titulo || titulo.trim().length === 0) {
      return errorResponse('El título es requerido', 400);
    }

    if (!contenido || contenido.trim().length === 0) {
      return errorResponse('El contenido es requerido', 400);
    }

    if (!tipo || !['importante', 'corriente', 'urgente'].includes(tipo)) {
      return errorResponse('Tipo inválido', 400);
    }

    if (!destinatarios || !Array.isArray(destinatarios) || destinatarios.length === 0) {
      return errorResponse('Destinatarios son requeridos', 400);
    }

    const destinatariosPermitidos = new Set(['todos', 'morosos', 'activos', 'administradores']);
    const destinatariosInvalidos = destinatarios.filter(d => !destinatariosPermitidos.has(d));
    if (destinatariosInvalidos.length > 0) {
      return errorResponse(
        `Destinatarios inválidos: ${destinatariosInvalidos.join(', ')}`,
        400
      );
    }

    const estado = enviar ? 'enviado' : 'borrador';
    const fechaEnvio = enviar ? new Date().toISOString() : null;

    const result = await env.DB.prepare(`
      INSERT INTO comunicados (
        titulo, 
        contenido, 
        tipo, 
        destinatarios, 
        fecha_envio,
        estado,
        created_by,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).bind(
      titulo.trim(),
      contenido.trim(),
      tipo,
      JSON.stringify(destinatarios),
      fechaEnvio,
      estado,
      actorId
    ).run();

    if (!result.success) {
      throw new Error('Error al insertar comunicado en la base de datos');
    }

    const comunicado = await env.DB.prepare(
      'SELECT * FROM comunicados WHERE id = ?'
    ).bind(result.meta.last_row_id).first();

    return jsonResponse({
      success: true,
      message: enviar ? 'Comunicado enviado exitosamente' : 'Comunicado guardado como borrador',
      comunicado: {
        ...comunicado,
        destinatarios: JSON.parse(comunicado.destinatarios || '[]')
      }
    }, 201);

  } catch (error) {
    console.error('Error al crear comunicado:', error);
    return errorResponse(
      'Error al crear comunicado',
      500,
      env.ENVIRONMENT === 'development' ? { details: error instanceof Error ? error.message : error } : undefined
    );
  }
}
