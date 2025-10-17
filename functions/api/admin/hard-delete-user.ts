/**
 * Admin endpoint para HARD DELETE de usuarios inactivos
 * USAR SOLO PARA LIMPIAR USUARIOS CON activo=0
 */

type Env = {
  DB: any;
  JWT_SECRET: string;
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

  // Manejo de preflight
  if (context.request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
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

    console.log(`[ADMIN] Hard delete de usuario inactivo: ${email}`);

    // Verificar que el usuario existe y está inactivo (activo = 0)
    const user = await context.env.DB.prepare(
      'SELECT id, email, nombre, apellido, activo FROM usuarios WHERE email = ?'
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

    if (user.activo === 1) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No se puede eliminar permanentemente un usuario activo. Primero debe ser soft-deleted.'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // HARD DELETE - eliminar permanentemente de la base de datos
    const result = await context.env.DB.prepare(
      'DELETE FROM usuarios WHERE id = ? AND activo = 0'
    ).bind(user.id).run();

    if (!result.success) {
      throw new Error('Error eliminando usuario de la base de datos');
    }

    console.log(`[ADMIN] Usuario ${email} eliminado permanentemente (hard delete)`);

    return new Response(JSON.stringify({
      success: true,
      message: 'Usuario eliminado permanentemente',
      data: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        apellido: user.apellido
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('[ADMIN] Error en hard delete:', error);
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
