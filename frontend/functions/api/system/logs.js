// Endpoint para logs del sistema y auditoría
// GET /api/system/logs - Obtener logs del sistema

export async function onRequestGet(context) {
  const { request, env } = context;

  try {
    console.log('[SYSTEM LOGS] Obteniendo logs del sistema');

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

    const url = new URL(request.url);
    const type = url.searchParams.get('type') || 'all';
    const limit = parseInt(url.searchParams.get('limit')) || 50;
    const page = parseInt(url.searchParams.get('page')) || 1;
    const level = url.searchParams.get('level'); // error, warn, info
    const startDate = url.searchParams.get('start_date');
    const endDate = url.searchParams.get('end_date');

    const logs = await getSystemLogs(env, {
      type,
      limit,
      page,
      level,
      startDate,
      endDate
    });

    return new Response(JSON.stringify({ success: true, logs }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[SYSTEM LOGS] Error obteniendo logs:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// POST /api/system/logs - Crear nuevo log (para sistema interno)
export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    console.log('[SYSTEM LOGS] Creando nuevo log');

    // Este endpoint puede ser usado internamente por el sistema
    const userAgent = request.headers.get('User-Agent');
    if (!userAgent || !userAgent.includes('ACA-Internal')) {
      // Si no es una llamada interna, verificar auth
      const authResult = await verifyAuth(request, env);
      if (!authResult.success) {
        return new Response(JSON.stringify({ error: 'No autorizado' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    await createSystemLog(env, body);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Log creado exitosamente' 
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[SYSTEM LOGS] Error creando log:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Función para obtener logs del sistema
async function getSystemLogs(env, options = {}) {
  const {
    type = 'all',
    limit = 50,
    page = 1,
    level,
    startDate,
    endDate
  } = options;

  try {
    const logs = {
      system: [],
      audit: [],
      security: [],
      errors: [],
      pagination: {
        page,
        limit,
        total: 0,
        totalPages: 0
      }
    };

    // Obtener logs según el tipo
    if (type === 'all' || type === 'system') {
      logs.system = await getLogsByType(env, 'system', { limit, page, level, startDate, endDate });
    }

    if (type === 'all' || type === 'audit') {
      logs.audit = await getAuditLogs(env, { limit, page, startDate, endDate });
    }

    if (type === 'all' || type === 'security') {
      logs.security = await getSecurityLogs(env, { limit, page, startDate, endDate });
    }

    if (type === 'all' || type === 'errors') {
      logs.errors = await getErrorLogs(env, { limit, page, startDate, endDate });
    }

    // Calcular totales para paginación
    if (type !== 'all') {
      const totalCount = await getLogCount(env, type, { level, startDate, endDate });
      logs.pagination.total = totalCount;
      logs.pagination.totalPages = Math.ceil(totalCount / limit);
    }

    return logs;

  } catch (error) {
    console.error('[GET LOGS] Error:', error);
    throw error;
  }
}

/**
 * Verifica si un log cumple con los filtros de nivel y fecha
 */
function matchesFilters(log, level, startDate, endDate) {
  // Filtrar por nivel
  if (level && log.level !== level) {
    return false;
  }
  
  // Filtrar por fecha
  const logDate = new Date(log.timestamp);
  if (startDate && logDate < new Date(startDate)) {
    return false;
  }
  if (endDate && logDate > new Date(endDate)) {
    return false;
  }
  
  return true;
}

/**
 * Obtiene un log específico desde KV
 */
async function fetchLogById(env, type, logId) {
  try {
    const logData = await env.ACA_KV.get(`logs:${type}:${logId}`);
    if (logData) {
      return JSON.parse(logData);
    }
  } catch (error) {
    console.error(`[LOGS] Error procesando log ${logId}:`, error);
  }
  return null;
}

/**
 * Obtiene logs con filtros aplicados
 */
async function getFilteredLogs(env, type, logIds, options) {
  const { level, startDate, endDate, limit, page } = options;
  const detailedLogs = [];
  
  for (const logId of logIds) {
    const log = await fetchLogById(env, type, logId);
    if (log && matchesFilters(log, level, startDate, endDate)) {
      detailedLogs.push(log);
    }
  }
  
  return detailedLogs
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice((page - 1) * limit, page * limit);
}

/**
 * Obtiene logs sin filtros, solo paginados
 */
async function getPaginatedLogs(env, type, logIds, limit, page) {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedIds = logIds.slice(startIndex, endIndex);
  
  const logs = [];
  for (const logId of paginatedIds) {
    const log = await fetchLogById(env, type, logId);
    if (log) {
      logs.push(log);
    }
  }
  
  return logs;
}

// Obtener logs por tipo específico
async function getLogsByType(env, type, options = {}) {
  try {
    const logsList = await env.ACA_KV.get(`logs:${type}:list`);
    if (!logsList) return [];

    const logIds = JSON.parse(logsList);
    const { limit, page, level, startDate, endDate } = options;
    
    // Si hay filtros, obtener logs filtrados
    if (startDate || endDate || level) {
      return await getFilteredLogs(env, type, logIds, options);
    }
    
    // Sin filtros, usar paginación simple
    return await getPaginatedLogs(env, type, logIds, limit, page);
    
  } catch (error) {
    console.error(`[LOGS BY TYPE] Error obteniendo logs ${type}:`, error);
    return [];
  }
}

// Obtener logs de auditoría
async function getAuditLogs(env, options = {}) {
  try {
    const auditList = await env.ACA_KV.get('audit:config:list');
    if (!auditList) return [];

    const auditIds = JSON.parse(auditList);
    const { limit, page } = options;
    
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedIds = auditIds.slice(startIndex, endIndex);
    
    const logs = [];
    for (const auditId of paginatedIds) {
      try {
        const auditData = await env.ACA_KV.get(`audit:config:${auditId}`);
        if (auditData) {
          logs.push(JSON.parse(auditData));
        }
      } catch (error) {
        console.error(`[AUDIT LOGS] Error obteniendo audit ${auditId}:`, error);
      }
    }
    
    return logs;
    
  } catch (error) {
    console.error('[AUDIT LOGS] Error:', error);
    return [];
  }
}

// Obtener logs de seguridad
async function getSecurityLogs(env, options = {}) {
  try {
    // Los logs de seguridad podrían incluir intentos de login, cambios de password, etc.
    const securityList = await env.ACA_KV.get('security:logs:list');
    if (!securityList) return [];

    const logIds = JSON.parse(securityList);
    const { limit, page } = options;
    
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedIds = logIds.slice(startIndex, endIndex);
    
    const logs = [];
    for (const logId of paginatedIds) {
      try {
        const logData = await env.ACA_KV.get(`security:logs:${logId}`);
        if (logData) {
          logs.push(JSON.parse(logData));
        }
      } catch (error) {
        console.error(`[SECURITY LOGS] Error obteniendo log ${logId}:`, error);
      }
    }
    
    return logs;
    
  } catch (error) {
    console.error('[SECURITY LOGS] Error:', error);
    return [];
  }
}

// Obtener logs de errores
async function getErrorLogs(env, options = {}) {
  try {
    return await getLogsByType(env, 'errors', options);
  } catch (error) {
    console.error('[ERROR LOGS] Error:', error);
    return [];
  }
}

// Contar logs para paginación
async function getLogCount(env, type, options = {}) {
  try {
    const logsList = await env.ACA_KV.get(`logs:${type}:list`);
    if (!logsList) return 0;
    
    return JSON.parse(logsList).length;
  } catch (error) {
    console.error('[LOG COUNT] Error:', error);
    return 0;
  }
}

// Crear nuevo log en el sistema
async function createSystemLog(env, logData) {
  try {
    const log = {
      id: generateId(),
      level: logData.level || 'info',
      message: logData.message,
      category: logData.category || 'general',
      user_id: logData.user_id || null,
      ip_address: logData.ip_address || null,
      user_agent: logData.user_agent || null,
      request_id: logData.request_id || null,
      details: logData.details || {},
      timestamp: new Date().toISOString()
    };

    // Determinar tipo de log
    const logType = log.level === 'error' ? 'errors' : 'system';
    
    // Guardar log
    await env.ACA_KV.put(`logs:${logType}:${log.id}`, JSON.stringify(log));
    
    // Actualizar lista
    const listKey = `logs:${logType}:list`;
    let logsList = [];
    
    try {
      const existingList = await env.ACA_KV.get(listKey);
      if (existingList) {
        logsList = JSON.parse(existingList);
      }
    } catch (error) {
      console.error('[CREATE LOG] Error obteniendo lista:', error);
    }
    
    logsList.unshift(log.id);
    
    // Mantener solo los últimos 1000 logs
    if (logsList.length > 1000) {
      // Eliminar logs antiguos
      const toDelete = logsList.slice(1000);
      for (const oldLogId of toDelete) {
        try {
          await env.ACA_KV.delete(`logs:${logType}:${oldLogId}`);
        } catch (error) {
          console.error(`[CREATE LOG] Error eliminando log antiguo ${oldLogId}:`, error);
        }
      }
      logsList = logsList.slice(0, 1000);
    }
    
    await env.ACA_KV.put(listKey, JSON.stringify(logsList));
    
    console.log(`[CREATE LOG] Log ${log.id} creado exitosamente`);
    
  } catch (error) {
    console.error('[CREATE LOG] Error:', error);
    throw error;
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
    // Aquí deberías implementar la verificación del JWT
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