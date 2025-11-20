import { requireAdmin, authErrorResponse, errorResponse, jsonResponse } from '../_middleware';
import { validateRut, normalizeRut, normalizePhone, normalizeAddress } from '../../../../../shared/utils/validators';
import { hashPassword } from '../../../utils/password.js';

// Endpoint de gestión de usuarios para administradores
// GET /api/admin/users - Listar usuarios
// POST /api/admin/users - Crear usuario (admin)

const DEFAULT_ROLES = [
  {
    key: 'usuario',
    label: 'Usuario / Socio',
    description: 'Acceso básico al portal de socios.',
    priority: 100
  },
  {
    key: 'director_editor',
    label: 'Director Editor',
    description: 'Puede administrar contenido y revisar postulaciones.',
    priority: 80
  },
  {
    key: 'director',
    label: 'Director',
    description: 'Gestión avanzada de socios y cuotas.',
    priority: 60
  },
  {
    key: 'admin',
    label: 'Administrador',
    description: 'Acceso total al sistema.',
    priority: 40
  }
];

async function ensureRolesCatalog(db) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS roles_catalog (
      key TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      description TEXT,
      priority INTEGER DEFAULT 100,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  for (const role of DEFAULT_ROLES) {
    await db.prepare(`
      INSERT INTO roles_catalog (key, label, description, priority)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET
        label = excluded.label,
        description = excluded.description,
        priority = excluded.priority
    `).bind(role.key, role.label, role.description, role.priority).run();
  }

  const rolesResult = await db.prepare('SELECT key FROM roles_catalog').all();
  return new Set((rolesResult?.results || []).map((row) => row.key));
}

export async function onRequestGet(context) {
  const { request, env } = context;

  try {
    console.log('[ADMIN USERS] Obteniendo lista de usuarios');

    try {
      await requireAdmin(request, env);
    } catch (error) {
      return authErrorResponse(error, env);
    }

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = parseInt(url.searchParams.get('limit')) || 20;
    const search = url.searchParams.get('search') || '';
    const role = url.searchParams.get('role') || '';
    const status = url.searchParams.get('status') || '';

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
      status: user.activo ? 'active' : 'inactive',
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

    try {
      await requireAdmin(request, env);
    } catch (error) {
      return authErrorResponse(error, env);
    }

    const body = await request.json();
    const { email, name, password, role = 'usuario', send_welcome_email = false, rut, telefono, ciudad, direccion } = body;

    // Aplicar normalizadores
    const normalizedRut = rut ? normalizeRut(rut) : null;
    const normalizedTelefono = telefono ? normalizePhone(telefono) : null;
    const normalizedCiudad = ciudad || null;
    const normalizedDireccion = direccion ? await normalizeAddress(direccion) : null;

    // Dividir name en nombre y apellido
    const nameParts = (name || '').trim().split(' ');
    const nombre = nameParts[0] || '';
    const apellido = nameParts.slice(1).join(' ') || '';

    // Validaciones
    if (!email || !nombre || !password) {
      return errorResponse('Email, nombre y contraseña son requeridos', 400);
    }

    const rolesValidos = await ensureRolesCatalog(env.DB);
    if (!rolesValidos.has(role)) {
      return errorResponse('Rol inválido. Debe ser: usuario, director, director_editor o admin', 400);
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
          SET nombre = ?, apellido = ?, password_hash = ?, role = ?, rut = ?, telefono = ?, ciudad = ?, direccion = ?, activo = 1, updated_at = ?
          WHERE id = ?
        `).bind(nombre, apellido, hashedPassword, role, normalizedRut, normalizedTelefono, normalizedCiudad, normalizedDireccion, now, existingUser.id).run();

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
        INSERT INTO usuarios (email, nombre, apellido, password_hash, role, rut, telefono, ciudad, direccion, activo, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
      `).bind(email, nombre, apellido, hashedPassword, role, normalizedRut, normalizedTelefono, normalizedCiudad, normalizedDireccion, now, now).run();

      if (!result.success) {
        throw new Error('Error creando usuario en la base de datos');
      }

      // Obtener usuario creado
      newUser = await env.DB.prepare(`
        SELECT id, email, nombre, apellido, role, activo as status, created_at, updated_at
        FROM usuarios WHERE email = ?
      `).bind(email).first();
    }

    // Enviar email de bienvenida si se solicita
    if (send_welcome_email) {
      console.log('[ADMIN USERS] Enviando email de bienvenida a:', email);
      const emailResult = await sendWelcomeEmail(email, name, password, env);

      if (!emailResult.success) {
        console.warn('[ADMIN USERS] No se pudo enviar email de bienvenida:', emailResult.error);
        // No fallar la creación del usuario por un email fallido, pero loguearlo
      }
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

async function sendWelcomeEmail(email, name, temporaryPassword, env) {
  if (!env.RESEND_API_KEY) {
    console.warn('[ADMIN USERS] RESEND_API_KEY no configurado, saltando email');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.FROM_EMAIL || 'noreply@acachile.cl',
        to: [email],
        subject: 'Bienvenido a ACA Chile - Cuenta Creada',
        html: `
          <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
              <h2 style="color: #dc2626;">¡Bienvenido a ACA Chile!</h2>
              <p>Hola ${name},</p>
              <p>Tu cuenta ha sido creada exitosamente por un administrador.</p>
              
              <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Datos de Acceso</h3>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Contraseña temporal:</strong> <code style="background-color: #e5e7eb; padding: 2px 6px; border-radius: 4px;">${temporaryPassword}</code></p>
              </div>
              
              <p><strong style="color: #dc2626;">⚠️ Importante:</strong> Por seguridad, te recomendamos cambiar tu contraseña inmediatamente después de iniciar sesión.</p>
              
              <p>
                <a href="${env.FRONTEND_URL || 'https://acachile.cl'}/login" 
                   style="display: inline-block; background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">
                  Iniciar Sesión
                </a>
              </p>
              
              <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              <p style="color: #6b7280; font-size: 12px;">
                Este es un correo automático, por favor no respondas a este mensaje.
              </p>
            </body>
          </html>
        `,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('[ADMIN USERS] Error enviando email:', errorData);
      return { success: false, error: errorData };
    }

    const data = await response.json();
    console.log('[ADMIN USERS] Email enviado:', data.id);

    return { success: true, emailId: data.id };
  } catch (error) {
    console.error('[ADMIN USERS] Excepción enviando email:', error);
    return { success: false, error: error.message };
  }
}
