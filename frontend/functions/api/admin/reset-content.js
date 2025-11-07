/**
 * Endpoint para limpiar TODA la base de datos y cache
 * ADVERTENCIA: Esto eliminará TODOS los datos de contenido
 */

export async function onRequestPost(context) {
  const { env } = context;
  
  try {
    let dbDeleted = 0;
    let cacheCleared = false;

    // Limpiar TODA la tabla site_sections
    if (env.DB) {
      const result = await env.DB
        .prepare('DELETE FROM site_sections')
        .run();
      dbDeleted = result.meta?.changes || 0;
    }

    // Limpiar TODO el cache KV relacionado con secciones
    if (env.ACA_KV) {
      const pages = ['home', 'about', 'contact'];
      for (const page of pages) {
        const cacheKey = `site_sections:${page}`;
        await env.ACA_KV.delete(cacheKey);
      }
      cacheCleared = true;
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Todos los datos de contenido han sido eliminados',
      dbRecordsDeleted: dbDeleted,
      cacheCleared
    }, null, 2), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
