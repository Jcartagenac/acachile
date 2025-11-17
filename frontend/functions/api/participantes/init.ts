/**
 * Endpoint: /api/participantes/init
 * POST: Inicializar tabla de participantes (solo admin)
 */

import { requireAuth } from '../../_middleware';

// Headers CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// OPTIONS - CORS preflight
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders
  });
}

// POST - Inicializar tabla
export async function onRequestPost(context: any) {
  const { request, env } = context;

  try {
    // Verificar autenticación de admin
    let authUser;
    try {
      authUser = await requireAuth(request, env);
    } catch (error) {
      return new Response(
        JSON.stringify({ success: false, error: 'No autorizado' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Verificar que el usuario sea admin
    const isAdmin = authUser.role === 'admin' || 
                    (Array.isArray(authUser.roles) && authUser.roles.includes('admin'));
    
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Requiere permisos de administrador' 
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('[participantes/init] Creando tabla participantes...');

    // Crear tabla de participantes
    await env.DB.exec(`
      CREATE TABLE IF NOT EXISTS participantes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        apellido TEXT NOT NULL,
        rut TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL,
        edad INTEGER NOT NULL,
        telefono TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('[participantes/init] Tabla creada exitosamente');

    // Verificar que la tabla existe
    const checkStmt = env.DB.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='participantes'
    `);
    
    const tableExists = await checkStmt.first();

    if (!tableExists) {
      throw new Error('La tabla no se creó correctamente');
    }

    // Contar participantes existentes
    const countStmt = env.DB.prepare('SELECT COUNT(*) as count FROM participantes');
    const countResult = await countStmt.first();
    const count = countResult?.count || 0;

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Tabla de participantes inicializada correctamente',
        tableExists: true,
        participantCount: count
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('[participantes/init] Error:', error);
    console.error('[participantes/init] Error stack:', error?.stack);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Error al inicializar la tabla',
        details: error?.message || 'Error desconocido',
        stack: env.ENVIRONMENT === 'development' ? error?.stack : undefined
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}
