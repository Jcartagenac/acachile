import { requireAdminOrDirector, authErrorResponse, jsonResponse, errorResponse } from '../../_middleware';

// Endpoint del dashboard de administración
// GET /api/admin/dashboard - Obtener estadísticas del dashboard

export async function onRequestGet(context) {
  const { request, env } = context;

  try {
    console.log('[ADMIN DASHBOARD] Obteniendo estadísticas del dashboard');

    try {
      await requireAdminOrDirector(request, env);
    } catch (error) {
      return authErrorResponse(error, env);
    }

    // Obtener estadísticas generales
    const stats = await getGeneralStats(env);

    console.log('[ADMIN DASHBOARD] Estadísticas obtenidas exitosamente');

    return jsonResponse({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('[ADMIN DASHBOARD] Error:', error);
    return errorResponse(
      'Error interno del servidor',
      500,
      env.ENVIRONMENT === 'development' ? { details: error instanceof Error ? error.message : error } : undefined
    );
  }
}

// Función para obtener estadísticas generales
async function getGeneralStats(env) {
  const stats = {
    usuarios: {
      total: 0,
      activos_mes: 0,
      nuevos_hoy: 0
    },
    eventos: {
      total: 0,
      activos: 0,
      finalizados: 0,
      inscripciones_total: 0
    },
    noticias: {
      total: 0,
      publicadas: 0,
      borradores: 0,
      vistas_total: 0
    },
    comentarios: {
      total: 0,
      pendientes: 0,
      aprobados: 0,
      rechazados: 0
    },
    actividad_reciente: []
  };

  try {
    // Estadísticas de usuarios desde D1
    const usersQuery = await env.DB.prepare(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN last_login > datetime('now', '-30 days') THEN 1 END) as activos_mes,
        COUNT(CASE WHEN created_at > datetime('now', '-1 day') THEN 1 END) as nuevos_hoy
      FROM users WHERE deleted_at IS NULL
    `).first();

    if (usersQuery) {
      stats.usuarios = {
        total: usersQuery.total || 0,
        activos_mes: usersQuery.activos_mes || 0,
        nuevos_hoy: usersQuery.nuevos_hoy || 0
      };
    }

    // Estadísticas de eventos desde KV
    const eventosData = await env.ACA_KV.get('eventos:all');
    if (eventosData) {
      const eventos = JSON.parse(eventosData);
      const now = new Date();
      
      stats.eventos.total = eventos.length;
      stats.eventos.activos = eventos.filter(e => new Date(e.date) > now).length;
      stats.eventos.finalizados = eventos.filter(e => new Date(e.date) <= now).length;
    }

    // Estadísticas de inscripciones
    const inscripcionesData = await env.ACA_KV.get('inscripciones:all');
    if (inscripcionesData) {
      const inscripciones = JSON.parse(inscripcionesData);
      stats.eventos.inscripciones_total = inscripciones.length;
    }

    // Estadísticas de noticias desde KV
    const noticiasData = await env.ACA_KV.get('noticias:all');
    if (noticiasData) {
      const noticias = JSON.parse(noticiasData);
      stats.noticias.total = noticias.length;
      stats.noticias.publicadas = noticias.filter(n => n.status === 'published').length;
      stats.noticias.borradores = noticias.filter(n => n.status === 'draft').length;
      stats.noticias.vistas_total = noticias.reduce((sum, n) => sum + (n.views || 0), 0);
    }

    // Estadísticas de comentarios
    const comentariosKeys = await env.ACA_KV.list({ prefix: 'comments:' });
    let totalComentarios = 0;
    let pendientes = 0;
    let aprobados = 0;
    let rechazados = 0;

    for (const key of comentariosKeys.keys) {
      if (key.name.startsWith('comments:stats:')) continue; // Skip stats keys
      
      const comentariosData = await env.ACA_KV.get(key.name);
      if (comentariosData) {
        const comentarios = JSON.parse(comentariosData);
        comentarios.forEach(c => {
          totalComentarios++;
          if (c.status === 'pending') pendientes++;
          else if (c.status === 'approved') aprobados++;
          else if (c.status === 'rejected') rechazados++;
          
          // Contar respuestas recursivamente
          if (c.replies && c.replies.length > 0) {
            c.replies.forEach(r => {
              totalComentarios++;
              if (r.status === 'pending') pendientes++;
              else if (r.status === 'approved') aprobados++;
              else if (r.status === 'rejected') rechazados++;
            });
          }
        });
      }
    }

    stats.comentarios = { total: totalComentarios, pendientes, aprobados, rechazados };

    // Actividad reciente (últimas 10 acciones)
    stats.actividad_reciente = await getRecentActivity(env);

  } catch (error) {
    console.error('[ADMIN STATS] Error obteniendo estadísticas:', error);
  }

  return stats;
}

// Función para obtener actividad reciente
async function getRecentActivity(env) {
  const actividad = [];

  try {
    // Últimas inscripciones
    const inscripcionesData = await env.ACA_KV.get('inscripciones:all');
    if (inscripcionesData) {
      const inscripciones = JSON.parse(inscripcionesData);
      inscripciones
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5)
        .forEach(i => {
          actividad.push({
            tipo: 'inscripcion',
            descripcion: `Nueva inscripción al evento ${i.event_title}`,
            usuario: i.user_name,
            fecha: i.created_at
          });
        });
    }

    // Últimos comentarios
    const comentariosKeys = await env.ACA_KV.list({ prefix: 'comments:' });
    const todosComentarios = [];

    for (const key of comentariosKeys.keys) {
      if (key.name.startsWith('comments:stats:')) continue;
      
      const comentariosData = await env.ACA_KV.get(key.name);
      if (comentariosData) {
        const comentarios = JSON.parse(comentariosData);
        comentarios.forEach(c => {
          todosComentarios.push({
            tipo: 'comentario',
            descripcion: `Nuevo comentario: ${c.content.substring(0, 50)}...`,
            usuario: c.author_name,
            fecha: c.created_at
          });
        });
      }
    }

    // Agregar comentarios más recientes
    todosComentarios
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
      .slice(0, 5)
      .forEach(c => actividad.push(c));

    // Ordenar toda la actividad por fecha
    return actividad
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
      .slice(0, 10);

  } catch (error) {
    console.error('[ADMIN ACTIVITY] Error obteniendo actividad reciente:', error);
    return [];
  }
}
