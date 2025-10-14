/**
 * Handlers HTTP para autenticación
 * ACA Chile - Login, registro, perfil de usuario
 */

import { 
  createUser,
  authenticateUser,
  verifyToken,
  getUserById,
  getTokenFromRequest
} from './auth';

export interface Env {
  ACA_KV: KVNamespace;
  DB: D1Database;
  JWT_SECRET?: string;
  ENVIRONMENT: string;
}

/**
 * Handler para login
 */
export async function handleLogin(request: Request, env: Env): Promise<Response> {
  try {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Método no permitido' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    try {
      const body = await request.json() as any;
      const { email, password } = body;

      if (!email || !password) {
        return new Response(
          JSON.stringify({ error: 'Email y contraseña son requeridos' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const result = await authenticateUser(env, email, password);

      if (!result.success) {
        return new Response(
          JSON.stringify({ error: result.error }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          message: 'Login exitoso',
          user: result.data!.user,
          token: result.data!.token
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Error procesando datos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error en handleLogin:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Handler para registro
 */
export async function handleRegistro(request: Request, env: Env): Promise<Response> {
  try {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Método no permitido' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    try {
      const body = await request.json() as any;
      const { email, nombre, apellido, password, telefono, rut, ciudad } = body;

      if (!email || !nombre || !apellido || !password) {
        return new Response(
          JSON.stringify({ error: 'Email, nombre, apellido y contraseña son requeridos' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const result = await createUser(env, {
        email,
        nombre,
        apellido,
        password,
        telefono,
        rut,
        ciudad
      });

      if (!result.success) {
        return new Response(
          JSON.stringify({ error: result.error }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          message: 'Usuario creado exitosamente',
          user: result.data
        }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Error procesando datos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error en handleRegistro:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Handler para obtener perfil del usuario autenticado
 */
export async function handlePerfil(request: Request, env: Env): Promise<Response> {
  try {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: corsHeaders });
    }

    // Verificar autenticación
    const token = getTokenFromRequest(request);
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Token requerido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GET /api/perfil - Obtener datos del perfil
    if (request.method === 'GET') {
      const result = await getUserById(env, token.userId);

      if (!result.success) {
        return new Response(
          JSON.stringify({ error: result.error }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ user: result.data }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // PUT /api/perfil - Actualizar perfil
    if (request.method === 'PUT') {
      try {
        const body = await request.json() as any;
        const { nombre, apellido, telefono, ciudad } = body;

        const result = await env.DB.prepare(`
          UPDATE usuarios 
          SET nombre = ?, apellido = ?, telefono = ?, ciudad = ?
          WHERE id = ?
        `).bind(nombre, apellido, telefono, ciudad, token.userId).run();

        if (!result.success) {
          return new Response(
            JSON.stringify({ error: 'Error actualizando perfil' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Obtener datos actualizados
        const userResult = await getUserById(env, token.userId);

        return new Response(
          JSON.stringify({
            message: 'Perfil actualizado exitosamente',
            user: userResult.data
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      } catch (error) {
        return new Response(
          JSON.stringify({ error: 'Error procesando datos' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({ error: 'Método no permitido' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error en handlePerfil:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Handler para verificar token
 */
export async function handleVerificarToken(request: Request, env: Env): Promise<Response> {
  try {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Método no permitido' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    try {
      const body = await request.json() as any;
      const { token } = body;

      if (!token) {
        return new Response(
          JSON.stringify({ error: 'Token requerido' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const result = await verifyToken(env, token);

      if (!result.success) {
        return new Response(
          JSON.stringify({ error: result.error }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Obtener datos del usuario
      const userResult = await getUserById(env, result.data!.userId);

      return new Response(
        JSON.stringify({
          valid: true,
          user: userResult.data,
          tokenData: result.data
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Error procesando datos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error en handleVerificarToken:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Handler para logout (invalidar token del lado del cliente)
 */
export async function handleLogout(request: Request, env: Env): Promise<Response> {
  try {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: corsHeaders });
    }

    // Por ahora simplemente retornamos éxito
    // En una implementación más completa podríamos mantener una blacklist de tokens
    return new Response(
      JSON.stringify({ message: 'Logout exitoso' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error en handleLogout:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}