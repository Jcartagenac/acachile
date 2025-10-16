/**
 * API para gestión de comunicados (admin)
 * GET: Listar todos los comunicados
 * POST: Crear nuevo comunicado
 */

// Verificar si el usuario es administrador
function isAdmin(user) {
  return user && (user.rol === 'administrador' || user.rol === 'admin');
}

// GET: Listar comunicados
export async function onRequestGet(context) {
  try {
    const { env, request } = context;
    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.split(' ')[1];
    const user = await env.DB.prepare(
      'SELECT id, email, rol FROM usuarios WHERE id = ?'
    ).bind(token).first();

    if (!user || !isAdmin(user)) {
      return new Response(JSON.stringify({ error: 'No tienes permisos de administrador' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Obtener parámetros de consulta
    const url = new URL(request.url);
    const estado = url.searchParams.get('estado'); // 'borrador' o 'enviado'
    const tipo = url.searchParams.get('tipo'); // 'importante', 'corriente', 'urgente'
    const limit = parseInt(url.searchParams.get('limit') || '50');

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

    return new Response(JSON.stringify({
      success: true,
      comunicados,
      total: comunicados.length
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error al obtener comunicados:', error);
    return new Response(JSON.stringify({ 
      error: 'Error al obtener comunicados',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// POST: Crear nuevo comunicado
export async function onRequestPost(context) {
  try {
    const { env, request } = context;
    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.split(' ')[1];
    const user = await env.DB.prepare(
      'SELECT id, email, rol FROM usuarios WHERE id = ?'
    ).bind(token).first();

    if (!user || !isAdmin(user)) {
      return new Response(JSON.stringify({ error: 'No tienes permisos de administrador' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const data = await request.json();
    const { titulo, contenido, tipo, destinatarios, enviar } = data;

    // Validaciones
    if (!titulo || titulo.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'El título es requerido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!contenido || contenido.trim().length === 0) {
      return new Response(JSON.stringify({ error: 'El contenido es requerido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!tipo || !['importante', 'corriente', 'urgente'].includes(tipo)) {
      return new Response(JSON.stringify({ error: 'Tipo inválido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!destinatarios || !Array.isArray(destinatarios) || destinatarios.length === 0) {
      return new Response(JSON.stringify({ error: 'Destinatarios son requeridos' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validar destinatarios permitidos
    const destinatariosPermitidos = ['todos', 'morosos', 'activos', 'administradores'];
    const destinatariosInvalidos = destinatarios.filter(d => !destinatariosPermitidos.includes(d));
    if (destinatariosInvalidos.length > 0) {
      return new Response(JSON.stringify({ 
        error: `Destinatarios inválidos: ${destinatariosInvalidos.join(', ')}` 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Determinar estado y fecha de envío
    const estado = enviar ? 'enviado' : 'borrador';
    const fechaEnvio = enviar ? new Date().toISOString() : null;

    // Insertar comunicado
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
      user.id
    ).run();

    if (!result.success) {
      throw new Error('Error al insertar comunicado en la base de datos');
    }

    // Obtener el comunicado creado
    const comunicado = await env.DB.prepare(
      'SELECT * FROM comunicados WHERE id = ?'
    ).bind(result.meta.last_row_id).first();

    return new Response(JSON.stringify({
      success: true,
      message: `Comunicado ${estado === 'enviado' ? 'enviado' : 'guardado como borrador'} exitosamente`,
      comunicado: {
        ...comunicado,
        destinatarios: JSON.parse(comunicado.destinatarios)
      }
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error al crear comunicado:', error);
    return new Response(JSON.stringify({ 
      error: 'Error al crear comunicado',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
