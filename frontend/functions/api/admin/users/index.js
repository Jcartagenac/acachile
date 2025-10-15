// Endpoint de gestión de usuarios para administradores
// GET /api/admin/users - Listar usuarios
// POST /api/admin/users - Crear usuario (admin)

export async function onRequestGet(context) {
  const { request, env } = context;

  try {
    console.log('[ADMIN USERS] Obteniendo lista de usuarios');

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = parseInt(url.searchParams.get('limit')) || 20;
    const search = url.searchParams.get('search') || '';
    const role = url.searchParams.get('role') || '';
    const status = url.searchParams.get('status') || '';

    // TODO: Validar que el usuario es administrador
    // const user = requireAuth(request, env);
    // if (user.role !== 'admin') {
    //   return new Response(JSON.stringify({
    //     success: false,
    //     error: 'Acceso denegado. Se requieren permisos de administrador.'
    //   }), { status: 403 });
    // }

    let query = `
      SELECT 
        id, email, name, role, status, email_verified_at, 
        last_login, created_at, updated_at,
        (SELECT COUNT(*) FROM eventos WHERE created_by = users.id) as eventos_creados,
        (SELECT COUNT(*) FROM inscripciones WHERE user_id = users.id) as inscripciones_count
      FROM users 
      WHERE deleted_at IS NULL
    `;

    const params = [];
    
    // Filtros
    if (search) {
      query += ` AND (name LIKE ? OR email LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }
    
    if (role) {
      query += ` AND role = ?`;
      params.push(role);
    }
    
    if (status) {
      query += ` AND status = ?`;
      params.push(status);
    }

    // Contar total para paginación
    const countQuery = query.replace(/SELECT.*FROM/, 'SELECT COUNT(*) as total FROM');
    const totalResult = await env.DB.prepare(countQuery).bind(...params).first();
    const total = totalResult?.total || 0;

    // Agregar paginación
    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, (page - 1) * limit);

    const { results } = await env.DB.prepare(query).bind(...params).all();

    // Limpiar datos sensibles
    const users = results.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      email_verified: !!user.email_verified_at,
      last_login: user.last_login,
      created_at: user.created_at,
      updated_at: user.updated_at,
      stats: {
        eventos_creados: user.eventos_creados || 0,
        inscripciones_count: user.inscripciones_count || 0
      }
    }));

    const totalPages = Math.ceil(total / limit);

    console.log(`[ADMIN USERS] ${users.length} usuarios obtenidos (página ${page})`);

    return new Response(JSON.stringify({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[ADMIN USERS] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error interno del servidor',
      details: env.ENVIRONMENT === 'development' ? error.message : undefined
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    console.log('[ADMIN USERS] Creando nuevo usuario');

    // TODO: Validar que el usuario es administrador
    // const adminUser = requireAuth(request, env);
    // if (adminUser.role !== 'admin') {
    //   return new Response(JSON.stringify({
    //     success: false,
    //     error: 'Acceso denegado. Se requieren permisos de administrador.'
    //   }), { status: 403 });
    // }

    const body = await request.json();
    const { email, name, password, role = 'user', status = 'active', send_welcome_email = false } = body;

    // Validaciones
    if (!email || !name || !password) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Email, nombre y contraseña son requeridos'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!['user', 'admin', 'editor'].includes(role)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Rol inválido. Debe ser: user, admin o editor'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!['active', 'inactive', 'suspended'].includes(status)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Estado inválido. Debe ser: active, inactive o suspended'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verificar si el email ya existe
    const existingUser = await env.DB.prepare(
      'SELECT id FROM users WHERE email = ? AND deleted_at IS NULL'
    ).bind(email).first();

    if (existingUser) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Ya existe un usuario con este email'
      }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Hash de la contraseña (simulado, en producción usar bcrypt)
    const hashedPassword = btoa(password); // TEMPORAL - usar bcrypt en producción

    const userId = crypto.randomUUID();
    const now = new Date().toISOString();

    // Crear usuario
    const result = await env.DB.prepare(`
      INSERT INTO users (id, email, name, password, role, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(userId, email, name, hashedPassword, role, status, now, now).run();

    if (!result.success) {
      throw new Error('Error creando usuario en la base de datos');
    }

    // Obtener usuario creado (sin contraseña)
    const newUser = await env.DB.prepare(`
      SELECT id, email, name, role, status, created_at, updated_at
      FROM users WHERE id = ?
    `).bind(userId).first();

    // TODO: Enviar email de bienvenida si se solicita
    if (send_welcome_email) {
      console.log('[ADMIN USERS] Enviando email de bienvenida a:', email);
      // await sendWelcomeEmail(email, name, password, env);
    }

    console.log('[ADMIN USERS] Usuario creado exitosamente:', userId);

    return new Response(JSON.stringify({
      success: true,
      data: newUser,
      message: 'Usuario creado exitosamente'
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[ADMIN USERS] Error creando usuario:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error interno del servidor',
      details: env.ENVIRONMENT === 'development' ? error.message : undefined
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}