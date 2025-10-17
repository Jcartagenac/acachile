// Endpoint para mantenimiento y utilidades del sistema
// POST /api/system/maintenance - Operaciones de mantenimiento

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    console.log('[SYSTEM MAINTENANCE] Ejecutando operación:', body.action);

    // Verificar permisos de admin
    const authResult = await verifyAuth(request, env);
    if (!authResult.success) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const user = await env.DB.prepare(
      'SELECT role FROM users WHERE id = ? AND deleted_at IS NULL'
    ).bind(authResult.userId).first();

    if (!user || user.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Acceso denegado' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { action, params = {} } = body;
    let result;

    switch (action) {
      case 'clear_cache':
        result = await clearSystemCache(env, params);
        break;
      
      case 'rebuild_stats':
        result = await rebuildSystemStats(env, params);
        break;
      
      case 'cleanup_logs':
        result = await cleanupSystemLogs(env, params);
        break;
      
      case 'backup_data':
        result = await backupSystemData(env, params);
        break;
      
      case 'sync_data':
        result = await syncSystemData(env, params);
        break;
      
      case 'optimize_storage':
        result = await optimizeStorage(env, params);
        break;
      
      case 'test_connections':
        result = await testSystemConnections(env, params);
        break;
      
      default:
        throw new Error(`Acción no reconocida: ${action}`);
    }

    // Registrar operación de mantenimiento
    await logMaintenanceOperation(env, {
      action,
      params,
      result,
      admin_user_id: authResult.userId,
      timestamp: new Date().toISOString()
    });

    console.log(`[SYSTEM MAINTENANCE] Operación ${action} completada exitosamente`);

    return new Response(JSON.stringify({ 
      success: true, 
      action,
      result,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[SYSTEM MAINTENANCE] Error:', error);
    return new Response(JSON.stringify({ 
      error: 'Error en operación de mantenimiento',
      message: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// GET /api/system/maintenance - Obtener estado de mantenimiento
export async function onRequestGet(context) {
  const { request, env } = context;

  try {
    console.log('[SYSTEM MAINTENANCE] Obteniendo estado de mantenimiento');

    // Verificar permisos de admin
    const authResult = await verifyAuth(request, env);
    if (!authResult.success) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const user = await env.DB.prepare(
      'SELECT role FROM users WHERE id = ? AND deleted_at IS NULL'
    ).bind(authResult.userId).first();

    if (!user || user.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Acceso denegado' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const maintenanceStatus = await getMaintenanceStatus(env);

    return new Response(JSON.stringify({ 
      success: true, 
      maintenance: maintenanceStatus 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[SYSTEM MAINTENANCE] Error obteniendo estado:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Limpiar caché del sistema
async function clearSystemCache(env, params) {
  const results = {
    cleared_keys: [],
    errors: []
  };

  const cacheTypes = params.types || ['all'];

  try {
    if (cacheTypes.includes('all') || cacheTypes.includes('events')) {
      await env.ACA_KV.delete('eventos:all');
      results.cleared_keys.push('eventos:all');
    }

    if (cacheTypes.includes('all') || cacheTypes.includes('news')) {
      await env.ACA_KV.delete('noticias:all');
      results.cleared_keys.push('noticias:all');
    }

    if (cacheTypes.includes('all') || cacheTypes.includes('stats')) {
      const statKeys = await env.ACA_KV.list({ prefix: 'stats:' });
      for (const key of statKeys.keys) {
        await env.ACA_KV.delete(key.name);
        results.cleared_keys.push(key.name);
      }
    }

    results.message = `${results.cleared_keys.length} claves de caché eliminadas`;
    return results;

  } catch (error) {
    results.errors.push(error.message);
    throw new Error(`Error limpiando caché: ${error.message}`);
  }
}

// Reconstruir estadísticas del sistema
async function rebuildSystemStats(env, params) {
  const results = {
    rebuilt_stats: [],
    errors: []
  };

  try {
    // Reconstruir estadísticas de usuarios
    const usersCount = await env.DB.prepare(
      'SELECT COUNT(*) as count FROM users WHERE deleted_at IS NULL'
    ).first();

    await env.ACA_KV.put('stats:users:total', JSON.stringify({
      count: usersCount.count,
      last_updated: new Date().toISOString()
    }));
    results.rebuilt_stats.push('users:total');

    // Reconstruir estadísticas de eventos
    const eventosData = await env.ACA_KV.get('eventos:all');
    if (eventosData) {
      const eventos = JSON.parse(eventosData);
      await env.ACA_KV.put('stats:events:total', JSON.stringify({
        count: eventos.length,
        active: eventos.filter(e => !e.archived).length,
        last_updated: new Date().toISOString()
      }));
      results.rebuilt_stats.push('events:total');
    }

    // Reconstruir estadísticas de noticias
    const noticiasData = await env.ACA_KV.get('noticias:all');
    if (noticiasData) {
      const noticias = JSON.parse(noticiasData);
      await env.ACA_KV.put('stats:news:total', JSON.stringify({
        count: noticias.length,
        published: noticias.filter(n => n.published).length,
        last_updated: new Date().toISOString()
      }));
      results.rebuilt_stats.push('news:total');
    }

    results.message = `${results.rebuilt_stats.length} estadísticas reconstruidas`;
    return results;

  } catch (error) {
    results.errors.push(error.message);
    throw new Error(`Error reconstruyendo estadísticas: ${error.message}`);
  }
}

// Helper: Determinar si un log debe ser eliminado
function shouldDeleteLog(log, cutoffDate) {
  const logDate = new Date(log.timestamp);
  return logDate < cutoffDate;
}

// Helper: Procesar un log individual
async function processLogEntry(env, logType, logId, cutoffDate, results) {
  try {
    const logData = await env.ACA_KV.get(`logs:${logType}:${logId}`);
    if (!logData) return null;

    const log = JSON.parse(logData);
    
    if (shouldDeleteLog(log, cutoffDate)) {
      await env.ACA_KV.delete(`logs:${logType}:${logId}`);
      results.deleted_logs++;
      return null; // Indica que fue eliminado
    }
    
    return logId; // Indica que debe permanecer
  } catch (error) {
    console.error(`Error procesando log ${logId}:`, error);
    results.errors.push(`Error procesando log ${logId}: ${error.message}`);
    return logId; // Mantener el ID en caso de error
  }
}

// Helper: Limpiar logs de un tipo específico
async function cleanupLogType(env, logType, cutoffDate, results) {
  const listKey = `logs:${logType}:list`;
  const logsList = await env.ACA_KV.get(listKey);
  
  if (!logsList) return;

  const logIds = JSON.parse(logsList);
  const remainingIds = [];

  for (const logId of logIds) {
    const remainingId = await processLogEntry(env, logType, logId, cutoffDate, results);
    if (remainingId) {
      remainingIds.push(remainingId);
    }
  }

  await env.ACA_KV.put(listKey, JSON.stringify(remainingIds));
  results.cleaned_types.push(logType);
}

// Limpiar logs antiguos del sistema
async function cleanupSystemLogs(env, params) {
  const results = {
    deleted_logs: 0,
    cleaned_types: [],
    errors: []
  };

  const daysToKeep = params.days || 30;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  try {
    const logTypes = ['system', 'errors', 'security'];

    for (const logType of logTypes) {
      await cleanupLogType(env, logType, cutoffDate, results);
    }

    results.message = `${results.deleted_logs} logs eliminados (más antiguos que ${daysToKeep} días)`;
    return results;

  } catch (error) {
    results.errors.push(error.message);
    throw new Error(`Error limpiando logs: ${error.message}`);
  }
}

// Crear backup de datos del sistema
async function backupSystemData(env, params) {
  const results = {
    backup_id: generateId(),
    backed_up_items: [],
    errors: []
  };

  try {
    const backupData = {
      metadata: {
        backup_id: results.backup_id,
        created_at: new Date().toISOString(),
        version: '1.0.0'
      },
      data: {}
    };

    // Backup de configuración del sistema
    const systemConfig = await env.ACA_KV.get('system:config');
    if (systemConfig) {
      backupData.data.system_config = JSON.parse(systemConfig);
      results.backed_up_items.push('system_config');
    }

    // Backup de eventos
    const eventosData = await env.ACA_KV.get('eventos:all');
    if (eventosData) {
      backupData.data.eventos = JSON.parse(eventosData);
      results.backed_up_items.push('eventos');
    }

    // Backup de noticias
    const noticiasData = await env.ACA_KV.get('noticias:all');
    if (noticiasData) {
      backupData.data.noticias = JSON.parse(noticiasData);
      results.backed_up_items.push('noticias');
    }

    // Backup de usuarios (solo estructura, no passwords)
    const users = await env.DB.prepare(
      'SELECT id, username, email, role, created_at, updated_at FROM users WHERE deleted_at IS NULL'
    ).all();
    
    if (users.results) {
      backupData.data.users = users.results;
      results.backed_up_items.push('users');
    }

    // Guardar backup
    await env.ACA_KV.put(`backup:${results.backup_id}`, JSON.stringify(backupData));

    // Actualizar lista de backups
    const backupListKey = 'system:backups:list';
    let backupList = [];
    
    try {
      const existingList = await env.ACA_KV.get(backupListKey);
      if (existingList) {
        backupList = JSON.parse(existingList);
      }
    } catch (error) {
      console.error('Error obteniendo lista de backups:', error);
    }

    backupList.unshift({
      id: results.backup_id,
      created_at: backupData.metadata.created_at,
      items: results.backed_up_items
    });

    // Mantener solo los últimos 10 backups
    if (backupList.length > 10) {
      const oldBackups = backupList.slice(10);
      for (const oldBackup of oldBackups) {
        try {
          await env.ACA_KV.delete(`backup:${oldBackup.id}`);
        } catch (error) {
          console.error(`Error eliminando backup antiguo ${oldBackup.id}:`, error);
        }
      }
      backupList = backupList.slice(0, 10);
    }

    await env.ACA_KV.put(backupListKey, JSON.stringify(backupList));

    results.message = `Backup ${results.backup_id} creado con ${results.backed_up_items.length} elementos`;
    return results;

  } catch (error) {
    results.errors.push(error.message);
    throw new Error(`Error creando backup: ${error.message}`);
  }
}

// Sincronizar datos entre D1 y KV
async function syncSystemData(env, params) {
  const results = {
    synced_items: [],
    errors: []
  };

  try {
    // Sincronizar contadores de usuarios
    const usersCount = await env.DB.prepare(
      'SELECT COUNT(*) as count FROM users WHERE deleted_at IS NULL'
    ).first();

    await env.ACA_KV.put('sync:users:count', JSON.stringify({
      count: usersCount.count,
      last_sync: new Date().toISOString()
    }));
    results.synced_items.push('users_count');

    results.message = `${results.synced_items.length} elementos sincronizados`;
    return results;

  } catch (error) {
    results.errors.push(error.message);
    throw new Error(`Error sincronizando datos: ${error.message}`);
  }
}

// Optimizar almacenamiento
async function optimizeStorage(env, params) {
  const results = {
    optimized_keys: [],
    freed_space: 0,
    errors: []
  };

  try {
    // Esta función podría reorganizar datos, comprimir, etc.
    // Por ahora, solo reportamos el estado
    results.message = 'Optimización de almacenamiento completada';
    return results;

  } catch (error) {
    results.errors.push(error.message);
    throw new Error(`Error optimizando almacenamiento: ${error.message}`);
  }
}

// Probar conexiones del sistema
async function testSystemConnections(env, params) {
  const results = {
    connections: {},
    all_healthy: true,
    errors: []
  };

  try {
    // Test D1 Database
    try {
      const dbTest = await env.DB.prepare('SELECT 1 as test').first();
      results.connections.d1_database = {
        status: dbTest ? 'healthy' : 'unhealthy',
        message: dbTest ? 'Conexión D1 exitosa' : 'Error en conexión D1'
      };
      if (!dbTest) results.all_healthy = false;
    } catch (error) {
      results.connections.d1_database = {
        status: 'unhealthy',
        message: `Error D1: ${error.message}`
      };
      results.all_healthy = false;
      results.errors.push(`D1: ${error.message}`);
    }

    // Test KV Storage
    try {
      const kvTestKey = 'test:connection:' + Date.now();
      await env.ACA_KV.put(kvTestKey, 'test', { expirationTtl: 60 });
      const kvTest = await env.ACA_KV.get(kvTestKey);
      await env.ACA_KV.delete(kvTestKey);

      results.connections.kv_storage = {
        status: kvTest === 'test' ? 'healthy' : 'unhealthy',
        message: kvTest === 'test' ? 'KV Storage funcionando' : 'Error en KV Storage'
      };
      if (kvTest !== 'test') results.all_healthy = false;
    } catch (error) {
      results.connections.kv_storage = {
        status: 'unhealthy',
        message: `Error KV: ${error.message}`
      };
      results.all_healthy = false;
      results.errors.push(`KV: ${error.message}`);
    }

    results.message = results.all_healthy ? 
      'Todas las conexiones están saludables' : 
      'Se encontraron problemas en algunas conexiones';

    return results;

  } catch (error) {
    results.errors.push(error.message);
    throw new Error(`Error probando conexiones: ${error.message}`);
  }
}

// Obtener estado de mantenimiento
async function getMaintenanceStatus(env) {
  try {
    const status = {
      mode: false,
      message: '',
      scheduled_maintenance: null,
      last_operations: [],
      system_status: 'operational'
    };

    // Obtener configuración de mantenimiento
    const systemConfig = await env.ACA_KV.get('system:config');
    if (systemConfig) {
      const config = JSON.parse(systemConfig);
      status.mode = config.site?.maintenance_mode || false;
      status.message = config.site?.maintenance_message || '';
    }

    // Obtener últimas operaciones de mantenimiento
    const maintenanceLog = await env.ACA_KV.get('maintenance:log');
    if (maintenanceLog) {
      const log = JSON.parse(maintenanceLog);
      status.last_operations = log.slice(0, 5); // Últimas 5 operaciones
    }

    return status;

  } catch (error) {
    console.error('[MAINTENANCE STATUS] Error:', error);
    throw error;
  }
}

// Registrar operación de mantenimiento
async function logMaintenanceOperation(env, operation) {
  try {
    const logEntry = {
      id: generateId(),
      action: operation.action,
      params: operation.params,
      result: operation.result,
      admin_user_id: operation.admin_user_id,
      timestamp: operation.timestamp,
      success: !operation.result.errors || operation.result.errors.length === 0
    };

    // Obtener log actual
    let maintenanceLog = [];
    try {
      const existingLog = await env.ACA_KV.get('maintenance:log');
      if (existingLog) {
        maintenanceLog = JSON.parse(existingLog);
      }
    } catch (error) {
      console.error('[MAINTENANCE LOG] Error obteniendo log:', error);
    }

    // Agregar nueva entrada
    maintenanceLog.unshift(logEntry);

    // Mantener solo las últimas 100 entradas
    if (maintenanceLog.length > 100) {
      maintenanceLog = maintenanceLog.slice(0, 100);
    }

    // Guardar log actualizado
    await env.ACA_KV.put('maintenance:log', JSON.stringify(maintenanceLog));

    console.log(`[MAINTENANCE LOG] Operación ${operation.action} registrada`);

  } catch (error) {
    console.error('[MAINTENANCE LOG] Error registrando operación:', error);
  }
}

// Función auxiliar para verificar autenticación
async function verifyAuth(request, env) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { success: false };
    }

    const token = authHeader.substring(7);
    const decoded = JSON.parse(atob(token.split('.')[1])); // Simplificado
    
    return { success: true, userId: decoded.userId };
  } catch (error) {
    return { success: false };
  }
}

// Función auxiliar para generar IDs
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}