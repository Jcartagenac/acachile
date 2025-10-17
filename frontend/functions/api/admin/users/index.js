import { requireAuth, errorResponse, jsonResponse } from '../../../_middleware';

// Endpoint de gestión de usuarios para administradores
// GET /api/admin/users - Listar usuarios
// POST /api/admin/users - Crear usuario (admin)

// Función para hashear contraseñas (SHA-256 + salt)
async function hashPassword(password) {
  const salt = 'salt_aca_chile_2024';
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

export async function onRequestGet(context) {
  const { request, env } = context;

  try {
    console.log('[ADMIN USERS] Obteniendo lista de usuarios');

    let authUser;
    try {
      authUser = await requireAuth(request, env);
    } catch (error) {
      return errorResponse(
        error instanceof Error ? error.message : 'Token inválido',
        401,
        env.ENVIRONMENT === 'development' ? { details: error } : undefined
      );
    }

    if (authUser.role !== 'admin' && authUser.role !== 'super_admin') {
      return errorResponse('Acceso denegado. Se requieren permisos de administrador.', 403);
    }

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

    return jsonResponse({
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
    });

  } catch (error) {
    console.error('[ADMIN USERS] Error:', error);
    return errorResponse(
      'Error interno del servidor',
      500,
      env.ENVIRONMENT === 'development' ? { details: error instanceof Error ? error.message : error } : undefined
    );
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    console.log('[ADMIN USERS] Creando nuevo usuario');

    let adminUser;
    try {
      adminUser = await requireAuth(request, env);
    } catch (error) {
      return errorResponse(
        error instanceof Error ? error.message : 'Token inválido',
        401,
        env.ENVIRONMENT === 'development' ? { details: error } : undefined
      );
    }

    if (adminUser.role !== 'admin' && adminUser.role !== 'super_admin') {
      return errorResponse('Acceso denegado. Se requieren permisos de administrador.', 403);
    }

    const body = await request.json();
    const { email, name, password, role = 'user', send_welcome_email = false } = body;

    // Dividir name en nombre y apellido
    const nameParts = (name || '').trim().split(' ');
    const nombre = nameParts[0] || '';
    const apellido = nameParts.slice(1).join(' ') || '';

    // Validaciones
    if (!email || !nombre || !password) {
      return errorResponse('Email, nombre y contraseña son requeridos', 400);
    }

    if (!['user', 'admin', 'editor'].includes(role)) {
      return errorResponse('Rol inválido. Debe ser: user, admin o editor', 400);
    }

    // Verificar si el email ya existe (activo o inactivo)
    const existingUser = await env.DB.prepare(
      'SELECT id, activo FROM usuarios WHERE email = ?'
    ).bind(email).first();

    // Hash de la contraseña con SHA-256 + salt
    const hashedPassword = await hashPassword(password);
    const now = new Date().toISOString();

    let newUser;

    if (existingUser) {
      if (existingUser.activo === 1) {
        // Usuario activo ya existe
        return errorResponse('Ya existe un usuario activo con este email', 409);
      } else {
        // Usuario existe pero está inactivo - REACTIVAR
        console.log('[ADMIN USERS] Reactivando usuario eliminado:', email);
        
        const updateResult = await env.DB.prepare(`
          UPDATE usuarios 
          SET nombre = ?, apellido = ?, password_hash = ?, role = ?, activo = 1, updated_at = ?
          WHERE id = ?
        `).bind(nombre, apellido, hashedPassword, role, now, existingUser.id).run();

        if (!updateResult.success) {
          throw new Error('Error reactivando usuario en la base de datos');
        }

        // Obtener usuario reactivado
        newUser = await env.DB.prepare(`
          SELECT id, email, nombre, apellido, role, activo as status, created_at, updated_at
          FROM usuarios WHERE id = ?
        `).bind(existingUser.id).first();
      }
    } else {
      // Usuario no existe - CREAR NUEVO
      const result = await env.DB.prepare(`
        INSERT INTO usuarios (email, nombre, apellido, password_hash, role, activo, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 1, ?, ?)
      `).bind(email, nombre, apellido, hashedPassword, role, now, now).run();

      if (!result.success) {
        throw new Error('Error creando usuario en la base de datos');
      }

      // Obtener usuario creado
      newUser = await env.DB.prepare(`
        SELECT id, email, nombre, apellido, role, activo as status, created_at, updated_at
        FROM usuarios WHERE email = ?
      `).bind(email).first();
    }

    // TODO: Enviar email de bienvenida si se solicita
    if (send_welcome_email) {
      console.log('[ADMIN USERS] Enviando email de bienvenida a:', email);
      // await sendWelcomeEmail(email, name, password, env);
    }

    console.log('[ADMIN USERS] Usuario creado exitosamente:', newUser.id);

    return jsonResponse({
      success: true,
      data: {
        ...newUser,
        name: `${newUser.nombre} ${newUser.apellido}`.trim()
      },
      message: 'Usuario creado exitosamente'
    }, 201);

  } catch (error) {
    console.error('[ADMIN USERS] Error creando usuario:', error);
    return errorResponse(
      'Error interno del servidor',
      500,
      env.ENVIRONMENT === 'development' ? { details: error instanceof Error ? error.message : error } : undefined
    );
  }
}
