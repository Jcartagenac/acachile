import { requireAdmin, authErrorResponse } from './_middleware';
import type { Env } from '../../types';

/**
 * Endpoint temporal para debugging - ver datos exactos del usuario
 */

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
    // Validar binding de DB
    if (!context.env.DB) {
      console.error('[DEBUG] Database not configured');
      return new Response(JSON.stringify({
        success: false,
        error: 'Database not available'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

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

    // SEGURIDAD: Nunca exponer password_hash, ni siquiera en debug
    // Si necesitas verificar el hash, usa un endpoint separado con logging adicional
    const user = await context.env.DB.prepare(
      `SELECT 
        id, 
        nombre, 
        apellido, 
        email, 
        rut,
        telefono,
        ciudad,
        region,
        direccion,
        role,
        activo,
        created_at,
        updated_at,
        last_login
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

    // Retornar info completa (excepto password_hash por seguridad)
    return new Response(JSON.stringify({
      success: true,
      data: {
        id: user.id,
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email,
        rut: user.rut,
        telefono: user.telefono,
        ciudad: user.ciudad,
        region: user.region,
        direccion: user.direccion,
        role: user.role,
        activo: user.activo,
        created_at: user.created_at,
        updated_at: user.updated_at,
        last_login: user.last_login,
        // password_hash: NUNCA exponer - riesgo de seguridad
        hasPasswordHash: !!user.password_hash // Solo indicar si existe
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('[DEBUG] Error:', error);

    // Solo exponer detalles en desarrollo
    const details = context.env.ENVIRONMENT === 'development' && error instanceof Error
      ? { error: error.message, stack: error.stack?.split('\n').slice(0, 3).join('\n') }
      : undefined;

    return new Response(JSON.stringify({
      success: false,
      error: 'Error interno del servidor',
      details
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
