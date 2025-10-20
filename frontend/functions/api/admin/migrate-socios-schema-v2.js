// Endpoint para aplicar migraciones de schema v2 (estados de socio y lista negra)
// POST /api/admin/migrate-socios-schema-v2

/**
 * Agrega una columna a la tabla usuarios, manejando errores de duplicados
 */
async function addColumnToUsuarios(env, columnName, columnDef, results) {
  try {
    await env.DB.prepare(`
      ALTER TABLE usuarios ADD COLUMN ${columnName} ${columnDef}
    `).run();
    results.push(`✅ Campo ${columnName} agregado a usuarios`);
  } catch (e) {
    if (e.message.includes('duplicate column')) {
      results.push(`ℹ️ Campo ${columnName} ya existe en usuarios`);
    } else {
      throw e;
    }
  }
}

/**
 * Actualiza el esquema de usuarios para la nueva versión
 */
async function actualizarEsquemaSociosV2(env, results) {
  // Agregar campo lista_negra
  await addColumnToUsuarios(env, 'lista_negra', 'INTEGER DEFAULT 0', results);

  // Agregar campo motivo_lista_negra
  await addColumnToUsuarios(env, 'motivo_lista_negra', 'TEXT', results);

  // Actualizar valores por defecto del estado_socio
  try {
    await env.DB.prepare(`
      UPDATE usuarios
      SET estado_socio = CASE
        WHEN estado_socio = 'inactivo' THEN 'renunciado'
        WHEN estado_socio = 'suspendido' THEN 'expulsado'
        ELSE estado_socio
      END
      WHERE estado_socio IN ('inactivo', 'suspendido')
    `).run();
    results.push('✅ Estados de socio migrados a nueva nomenclatura');
  } catch (e) {
    results.push(`⚠️ Error migrando estados de socio: ${e.message}`);
  }
}

/**
 * Agrega columna end_date a la tabla eventos
 */
async function actualizarEsquemaEventos(env, results) {
  try {
    await env.DB.prepare(`
      ALTER TABLE eventos ADD COLUMN end_date TEXT
    `).run();
    results.push('✅ Campo end_date agregado a eventos');
  } catch (e) {
    if (e.message.includes('duplicate column')) {
      results.push('ℹ️ Campo end_date ya existe en eventos');
    } else {
      results.push(`⚠️ Error agregando end_date: ${e.message}`);
    }
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;

  const corsHeaders = {
    'Access-Control-Allow-Origin': env.CORS_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ success: false, error: 'Token de autorización requerido' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const results = [];

    // Ejecutar migraciones
    await actualizarEsquemaSociosV2(env, results);
    await actualizarEsquemaEventos(env, results);

    return new Response(JSON.stringify({
      success: true,
      message: 'Migración v2 completada',
      results: results
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error) {
    console.error('Error in migrate-socios-schema-v2:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error interno del servidor',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}

export async function onRequestOptions(context) {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
}