import { requireAdmin, authErrorResponse } from './_middleware';

/**
 * Endpoint temporal para debugging - ver datos exactos del usuario
 */

type Env = {
  DB: any;
  ENVIRONMENT?: string;
};

export async function onRequestPost(context: {
  request: Request;
  env: Env;
}): Promise<Response> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (context.request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    let adminUser;
    try {
      adminUser = await requireAdmin(context.request, context.env);
    } catch (error) {
      return authErrorResponse(
        error,
        context.env,
        'Autenticación requerida',
        { ...corsHeaders, 'Content-Type': 'application/json' }
      );
    }

    const { email } = await context.request.json();

    if (!email) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Email requerido'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`[DEBUG] Consultando usuario: ${email}`);

    // Consultar TODOS los datos del usuario incluido el hash
    const user = await context.env.DB.prepare(
      `SELECT 
        id, 
        nombre, 
        apellido, 
        email, 
        rut,
        password_hash,
        role,
        activo,
        created_at,
        updated_at
      FROM usuarios 
      WHERE email = ?`
    ).bind(email).first();

    if (!user) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Usuario no encontrado'
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Retornar toda la info (solo para debug)
    return new Response(JSON.stringify({
      success: true,
      data: {
        id: user.id,
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email,
        rut: user.rut,
        password_hash: user.password_hash,
        role: user.role,
        activo: user.activo,
        created_at: user.created_at,
        updated_at: user.updated_at
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('[DEBUG] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error interno del servidor',
      details: context.env.ENVIRONMENT === 'development' ? error.message : undefined
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
