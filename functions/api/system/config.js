// Endpoint para configuraciones del sistema y mantenimiento
// GET/PUT /api/system/config - Gestión de configuraciones

export async function onRequestGet(context) {
  const { request, env } = context;

  try {
    console.log('[SYSTEM CONFIG] Obteniendo configuraciones');

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

    // Obtener configuraciones del sistema
    const config = await getSystemConfig(env);

    return new Response(JSON.stringify({ success: true, config }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[SYSTEM CONFIG] Error obteniendo configuraciones:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestPut(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    console.log('[SYSTEM CONFIG] Actualizando configuraciones');

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

    // Actualizar configuraciones
    await updateSystemConfig(env, body.config, authResult.userId);

    console.log('[SYSTEM CONFIG] Configuraciones actualizadas exitosamente');

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Configuraciones actualizadas exitosamente',
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[SYSTEM CONFIG] Error actualizando configuraciones:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Función para obtener configuraciones del sistema
async function getSystemConfig(env) {
  // Configuraciones por defecto
  const defaultConfig = {
    site: {
      name: 'ACA Plataforma',
      description: 'Plataforma de gestión de eventos y noticias',
      logo: '',
      theme: 'light',
      maintenance_mode: false,
      maintenance_message: 'El sitio está en mantenimiento. Vuelve pronto.'
    },
    features: {
      user_registration: true,
      event_registration: true,
      comments_enabled: true,
      news_public: true,
      search_enabled: true,
      notifications_enabled: true
    },
    limits: {
      max_events_per_page: 20,
      max_news_per_page: 15,
      max_comments_per_item: 100,
      max_file_size_mb: 5,
      max_image_size_mb: 2
    },
    email: {
      enabled: false,
      smtp_host: '',
      smtp_port: 587,
      smtp_user: '',
      smtp_from: 'noreply@acaplataforma.com'
    },
    security: {
      max_login_attempts: 5,
      session_timeout_hours: 24,
      require_email_verification: false,
      allow_password_reset: true,
      min_password_length: 6
    },
    content: {
      auto_approve_comments: false,
      moderate_events: false,
      moderate_news: false,
      allow_anonymous_comments: false
    }
  };

  try {
    // Intentar obtener configuraciones guardadas
    const savedConfig = await env.ACA_KV.get('system:config');
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig);
      // Merge con configuraciones por defecto para asegurar completitud
      return mergeDeep(defaultConfig, parsed);
    }
  } catch (error) {
    console.error('[CONFIG] Error obteniendo configuraciones guardadas:', error);
  }

  return defaultConfig;
}

// Función para actualizar configuraciones
async function updateSystemConfig(env, newConfig, adminUserId) {
  try {
    // Obtener configuración actual
    const currentConfig = await getSystemConfig(env);
    
    // Merge configuraciones
    const updatedConfig = mergeDeep(currentConfig, newConfig);
    
    // Validar configuraciones críticas
    if (typeof updatedConfig.features.user_registration !== 'boolean') {
      throw new Error('Configuración inválida: user_registration debe ser boolean');
    }
    
    if (updatedConfig.limits.max_events_per_page < 1 || updatedConfig.limits.max_events_per_page > 100) {
      throw new Error('Configuración inválida: max_events_per_page debe estar entre 1 y 100');
    }

    // Guardar nueva configuración
    await env.ACA_KV.put('system:config', JSON.stringify(updatedConfig));
    
    // Registrar cambio en audit log
    const auditLog = {
      id: generateId(),
      admin_user_id: adminUserId,
      action: 'config_update',
      details: {
        updated_keys: Object.keys(flattenObject(newConfig)),
        timestamp: new Date().toISOString()
      },
      created_at: new Date().toISOString()
    };

    await env.ACA_KV.put(`audit:config:${auditLog.id}`, JSON.stringify(auditLog));
    
    // Actualizar lista de logs de auditoría
    const auditListKey = 'audit:config:list';
    let auditList = [];
    try {
      const existingList = await env.ACA_KV.get(auditListKey);
      if (existingList) {
        auditList = JSON.parse(existingList);
      }
    } catch (error) {
      console.error('[AUDIT] Error obteniendo lista de auditoría:', error);
    }
    
    auditList.unshift(auditLog.id);
    // Mantener solo los últimos 100 cambios
    if (auditList.length > 100) {
      auditList = auditList.slice(0, 100);
    }
    
    await env.ACA_KV.put(auditListKey, JSON.stringify(auditList));

    console.log('[CONFIG] Configuración actualizada y auditada');
    
  } catch (error) {
    console.error('[CONFIG] Error actualizando configuración:', error);
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
    // Por simplicidad, asumimos que el token contiene el userId
    const decoded = JSON.parse(atob(token.split('.')[1])); // Simplificado
    
    return { success: true, userId: decoded.userId };
  } catch (error) {
    return { success: false };
  }
}

// Función auxiliar para merge profundo de objetos
function mergeDeep(target, source) {
  const output = { ...target };
  
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      output[key] = mergeDeep(output[key] || {}, source[key]);
    } else {
      output[key] = source[key];
    }
  }
  
  return output;
}

// Función auxiliar para aplanar objetos
function flattenObject(obj, prefix = '') {
  const flattened = {};
  
  for (const key in obj) {
    const newKey = prefix ? `${prefix}.${key}` : key;
    
    if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
      Object.assign(flattened, flattenObject(obj[key], newKey));
    } else {
      flattened[newKey] = obj[key];
    }
  }
  
  return flattened;
}

// Función auxiliar para generar IDs
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}