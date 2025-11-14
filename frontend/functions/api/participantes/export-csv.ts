/**
 * Endpoint: /api/participantes/export-csv
 * GET: Exportar participantes como CSV (solo admin)
 */

import { requireAuth } from '../../_middleware';

// Headers CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// OPTIONS - CORS preflight
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders
  });
}

// GET - Exportar CSV (solo admin)
export async function onRequestGet(context: any) {
  const { request, env } = context;

  try {
    // Verificar autenticación
    const authResult = await requireAuth(request, env);
    if (!authResult.success || !authResult.user) {
      return new Response(
        JSON.stringify({ success: false, error: 'No autorizado' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Verificar que sea admin
    if (authResult.user.role !== 'admin') {
      return new Response(
        JSON.stringify({ success: false, error: 'Acceso denegado' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Obtener todos los participantes
    const stmt = env.DB.prepare(`
      SELECT id, nombre, apellido, rut, email, edad, telefono, created_at
      FROM participantes
      ORDER BY created_at DESC
    `);

    const result = await stmt.all();
    const participantes = result.results || [];

    // Crear CSV
    const headers = ['ID', 'Nombre', 'Apellido', 'RUT', 'Email', 'Edad', 'Teléfono', 'Fecha Registro'];
    const csvRows = [headers.join(',')];

    for (const p of participantes) {
      const row = [
        p.id,
        `"${p.nombre}"`,
        `"${p.apellido}"`,
        p.rut,
        p.email,
        p.edad,
        p.telefono,
        p.created_at
      ];
      csvRows.push(row.join(','));
    }

    const csv = csvRows.join('\n');

    // Generar nombre de archivo con fecha
    const fecha = new Date().toISOString().split('T')[0];
    const filename = `participantes_sorteo_${fecha}.csv`;

    return new Response(csv, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      }
    });
  } catch (error: any) {
    console.error('[participantes] Error al exportar CSV:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Error al exportar CSV'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}
