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
        id, email, nombre, apellido, role, activo as status, 
        last_login, created_at, updated_at,
        (SELECT COUNT(*) FROM eventos WHERE created_by = usuarios.id) as eventos_creados,
        (SELECT COUNT(*) FROM inscripciones WHERE user_id = usuarios.id) as inscripciones_count
      FROM usuarios 
      WHERE activo = 1
    `;

    const params = [];
    
    // Filtros
    if (search) {
      query += ` AND (nombre LIKE ? OR apellido LIKE ? OR email LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
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
      nombre: user.nombre,
      apellido: user.apellido,
      name: `${user.nombre} ${user.apellido}`.trim(), // Para compatibilidad con frontend
      role: user.role,
      status: user.status ? 'active' : 'inactive',
      email_verified: true, // La tabla usuarios no tiene este campo
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
    const { email, name, password, role = 'user', send_welcome_email = false } = body;

    // Dividir name en nombre y apellido
    const nameParts = (name || '').trim().split(' ');
    const nombre = nameParts[0] || '';
    const apellido = nameParts.slice(1).join(' ') || '';

    // Validaciones
    if (!email || !nombre || !password) {
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

    // Verificar si el email ya existe
    const existingUser = await env.DB.prepare(
      'SELECT id FROM usuarios WHERE email = ? AND activo = 1'
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

    const now = new Date().toISOString();

    // Crear usuario
    const result = await env.DB.prepare(`
      INSERT INTO usuarios (email, nombre, apellido, password, role, activo, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 1, ?, ?)
    `).bind(email, nombre, apellido, hashedPassword, role, now, now).run();

    if (!result.success) {
      throw new Error('Error creando usuario en la base de datos');
    }

    // Obtener usuario creado (sin contraseña)
    const newUser = await env.DB.prepare(`
      SELECT id, email, nombre, apellido, role, activo as status, created_at, updated_at
      FROM usuarios WHERE email = ?
    `).bind(email).first();

    // TODO: Enviar email de bienvenida si se solicita
    if (send_welcome_email) {
      console.log('[ADMIN USERS] Enviando email de bienvenida a:', email);
      // await sendWelcomeEmail(email, name, password, env);
    }

    console.log('[ADMIN USERS] Usuario creado exitosamente:', newUser.id);

    return new Response(JSON.stringify({
      success: true,
      data: {
        ...newUser,
        name: `${newUser.nombre} ${newUser.apellido}`.trim()
      },
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