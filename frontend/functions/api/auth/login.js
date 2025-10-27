import { hashPassword, verifyPassword } from '../../utils/password.js';

// Login endpoint - JavaScript version
export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    console.log('[AUTH/LOGIN] Processing login request');
    
    if (!env.JWT_SECRET) {
      console.error('[AUTH/LOGIN] JWT_SECRET not configured');
      return new Response(JSON.stringify({
        success: false,
        error: 'Authentication system not configured'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parsear body
    const body = await request.json();
    const { email, password } = body;

    // Validaciones
    if (!email || !password) {
      console.log('[AUTH/LOGIN] Missing email or password');
      return new Response(JSON.stringify({
        success: false,
        error: 'Email y contraseña son requeridos'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('[AUTH/LOGIN] Attempting login for:', email);

    // Buscar usuario en la base de datos
    const user = await env.DB.prepare(`
      SELECT id, email, nombre, apellido, telefono, rut, ciudad, role, activo, password_hash, created_at, last_login
      FROM usuarios WHERE email = ? AND activo = 1
    `).bind(email.toLowerCase()).first();

    if (!user) {
      console.log('[AUTH/LOGIN] User not found or inactive:', email);
      return new Response(JSON.stringify({
        success: false,
        error: 'Credenciales inválidas'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const verification = await verifyPassword(password, user.password_hash);

    if (!verification.valid) {
      console.log('[AUTH/LOGIN] Invalid password for user:', email);
      return new Response(JSON.stringify({
        success: false,
        error: 'Credenciales inválidas'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (verification.needsUpgrade) {
      try {
        const upgradedHash = await hashPassword(password);
        await env.DB.prepare('UPDATE usuarios SET password_hash = ? WHERE id = ?')
          .bind(upgradedHash, user.id)
          .run();
        console.log('[AUTH/LOGIN] Upgraded password hash for user:', user.id);
      } catch (upgradeError) {
        console.warn('[AUTH/LOGIN] Failed to upgrade password hash:', upgradeError);
      }
    }

    console.log('[AUTH/LOGIN] Password valid, creating token for user:', user.id);

    // Actualizar last_login
    await env.DB.prepare(`
      UPDATE usuarios SET last_login = datetime('now') WHERE id = ?
    `).bind(user.id).run();

    // Crear token JWT simple
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      isAdmin: user.role === 'admin',
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 días
      iat: Math.floor(Date.now() / 1000)
    };

    // JWT simple sin librerías (para desarrollo local)
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify(tokenPayload));
    const token = `${header}.${payload}.signature`;

    // Preparar respuesta del usuario (sin password_hash)
    const userData = {
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      apellido: user.apellido,
      telefono: user.telefono,
      rut: user.rut,
      ciudad: user.ciudad,
      role: user.role,
      activo: Boolean(user.activo),
      created_at: user.created_at,
      last_login: user.last_login
    };

    console.log('[AUTH/LOGIN] Login successful for user:', user.id);

    return new Response(JSON.stringify({
      success: true,
      data: {
        user: userData,
        token: token
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[AUTH/LOGIN] Error:', error);
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
