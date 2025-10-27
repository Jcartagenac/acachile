// Endpoint de monitoreo y health check avanzado
// GET /api/system/health - Health check completo del sistema

/**
 * Verifica la salud de la base de datos D1
 */
async function checkDatabaseHealth(env) {
  try {
    const dbCheck = await env.DB.prepare('SELECT 1 as test').first();
    return {
      status: dbCheck ? 'healthy' : 'unhealthy',
      message: dbCheck ? 'Conexión a D1 exitosa' : 'Error conectando a D1',
      connection: !!dbCheck
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: 'Error de conexión a D1',
      error: error.message
    };
  }
}

/**
 * Verifica la salud del KV Storage
 */
async function checkKVHealth(env) {
  try {
    const kvTestKey = 'health:check:' + Date.now();
    await env.ACA_KV.put(kvTestKey, 'test', { expirationTtl: 60 });
    const kvTest = await env.ACA_KV.get(kvTestKey);
    await env.ACA_KV.delete(kvTestKey);
    
    const isHealthy = kvTest === 'test';
    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      message: isHealthy ? 'KV Storage funcionando' : 'Error en KV Storage',
      read_write: isHealthy
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: 'Error de conexión a KV',
      error: error.message
    };
  }
}

/**
 * Verifica la salud de un endpoint específico
 */
async function checkEndpointHealth(request, endpoint) {
  try {
    const testUrl = new URL(request.url);
    testUrl.pathname = endpoint.path;
    
    const response = await fetch(testUrl.toString(), {
      method: 'GET',
      headers: { 'User-Agent': 'Health-Check/1.0' }
    });
    
    return {
      status: response.status < 500 ? 'healthy' : 'unhealthy',
      message: `Endpoint ${endpoint.path}: ${response.status}`,
      response_time: Date.now(),
      status_code: response.status
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: `Error testing ${endpoint.path}`,
      error: error.message
    };
  }
}

/**
 * Realiza todos los checks detallados del sistema
 */
async function performDetailedChecks(env, request) {
  const checks = {};
  
  // Check de base de datos D1
  checks.database = await checkDatabaseHealth(env);
  
  // Check de KV Storage
  checks.kv_storage = await checkKVHealth(env);
  
  // Check de endpoints críticos
  const criticalEndpoints = [
    { path: '/api/auth/me', name: 'auth_endpoint' },
    { path: '/api/eventos', name: 'events_endpoint' },
    { path: '/api/noticias', name: 'news_endpoint' }
  ];

  for (const endpoint of criticalEndpoints) {
    checks[endpoint.name] = await checkEndpointHealth(request, endpoint);
  }
  
  return checks;
}

/**
 * Determina el estado general del sistema
 */
function determineOverallStatus(checks) {
  const unhealthyChecks = Object.values(checks).filter(c => c.status === 'unhealthy');
  
  if (unhealthyChecks.length === 0) {
    return 'healthy';
  }
  
  return unhealthyChecks.length > 2 ? 'unhealthy' : 'degraded';
}

/**
 * Obtiene el código HTTP apropiado según el estado
 */
function getStatusCode(status) {
  if (status === 'healthy' || status === 'degraded') {
    return 200;
  }
  return 503;
}

export async function onRequestGet(context) {
  const { request, env } = context;

  try {
    console.log('[SYSTEM HEALTH] Ejecutando health check completo');

    const url = new URL(request.url);
    const detailed = url.searchParams.get('detailed') === 'true';

    const healthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: env.ENVIRONMENT || 'production',
      checks: {}
    };

    // Check básicos siempre presentes
    healthCheck.checks.api = { status: 'healthy', message: 'API funcionando correctamente' };

    if (detailed) {
      // Realizar checks detallados
      const detailedChecks = await performDetailedChecks(env, request);
      healthCheck.checks = { ...healthCheck.checks, ...detailedChecks };
      
      // Agregar estadísticas del sistema
      try {
        healthCheck.stats = await getSystemStats(env);
      } catch (error) {
        console.error('[HEALTH CHECK] Error obteniendo stats:', error);
      }
    }

    // Determinar estado general
    healthCheck.status = determineOverallStatus(healthCheck.checks);
    const statusCode = getStatusCode(healthCheck.status);

    console.log(`[SYSTEM HEALTH] Health check completado: ${healthCheck.status}`);

    return new Response(JSON.stringify(healthCheck, null, 2), {
      status: statusCode,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });

  } catch (error) {
    console.error('[SYSTEM HEALTH] Error en health check:', error);
    
    return new Response(JSON.stringify({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Error interno en health check',
      message: error.message
    }, null, 2), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  }
}

// Función para obtener estadísticas del sistema
async function getSystemStats(env) {
  const stats = {
    uptime: Date.now(), // Simplificado
    memory: {
      used: 0, // No disponible en Workers
      total: 128 // Límite de Workers
    },
    requests: {
      total: 0,
      errors: 0,
      avg_response_time: 0
    },
    data: {
      users_count: 0,
      events_count: 0,
      news_count: 0,
      comments_count: 0
    }
  };

  try {
    // Contar usuarios en D1
    const usersCount = await env.DB.prepare(
      'SELECT COUNT(*) as count FROM users WHERE deleted_at IS NULL'
    ).first();
    stats.data.users_count = usersCount?.count || 0;

    // Contar datos en KV
    const eventosData = await env.ACA_KV.get('eventos:all');
    if (eventosData) {
      stats.data.events_count = JSON.parse(eventosData).length;
    }

    const noticiasData = await env.ACA_KV.get('noticias:all');
    if (noticiasData) {
      stats.data.news_count = JSON.parse(noticiasData).length;
    }

    // Contar comentarios
    const comentariosKeys = await env.ACA_KV.list({ prefix: 'comments:' });
    let totalComentarios = 0;
    for (const key of comentariosKeys.keys) {
      if (key.name.startsWith('comments:stats:')) continue;
      
      const comentariosData = await env.ACA_KV.get(key.name);
      if (comentariosData) {
        const comentarios = JSON.parse(comentariosData);
        totalComentarios += comentarios.length;
        // Contar respuestas
        comentarios.forEach(c => {
          if (c.replies && c.replies.length > 0) {
            totalComentarios += c.replies.length;
          }
        });
      }
    }
    stats.data.comments_count = totalComentarios;

  } catch (error) {
    console.error('[SYSTEM STATS] Error:', error);
  }

  return stats;
}

export { determineOverallStatus, getStatusCode };
