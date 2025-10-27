import { requireAdminOrDirector, authErrorResponse, jsonResponse, errorResponse } from '../../_middleware';

// Endpoint de estadísticas avanzadas para administración
// GET /api/admin/stats - Obtener estadísticas detalladas del sistema

export async function onRequestGet(context) {
  const { request, env } = context;

  try {
    console.log('[ADMIN STATS] Obteniendo estadísticas avanzadas');

    let period = '30days';
    let type = 'all';

    try {
      await requireAdminOrDirector(request, env);
    } catch (error) {
      return authErrorResponse(error, env);
    }

    const url = new URL(request.url);
    period = url.searchParams.get('period') || '30days'; // 7days, 30days, 90days, 1year
    type = url.searchParams.get('type') || 'all'; // users, events, news, comments, all

    const stats = await getAdvancedStats(env, period, type);

    console.log('[ADMIN STATS] Estadísticas avanzadas obtenidas exitosamente');

    return jsonResponse({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('[ADMIN STATS] Error:', error);
    return errorResponse(
      'Error interno del servidor',
      500,
      env.ENVIRONMENT === 'development' ? { details: error instanceof Error ? error.message : error } : undefined
    );
  }
}

// Función para obtener estadísticas avanzadas
async function getAdvancedStats(env, period, type) {
  const stats = {
    period,
    generated_at: new Date().toISOString(),
    summary: {},
    charts: {},
    top_lists: {}
  };

  // Calcular fecha de inicio según el período
  const now = new Date();
  let startDate;
  
  switch (period) {
    case '7days':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '90days':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case '1year':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    case '30days':
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
  }

  const startDateStr = startDate.toISOString();

  try {
    // Estadísticas de usuarios
    if (type === 'all' || type === 'users') {
      const userStats = await getUserStats(env, startDateStr);
      stats.summary.users = userStats.summary;
      stats.charts.users_growth = userStats.growth;
      stats.top_lists.active_users = userStats.top_active;
    }

    // Estadísticas de eventos
    if (type === 'all' || type === 'events') {
      const eventStats = await getEventStats(env, startDateStr);
      stats.summary.events = eventStats.summary;
      stats.charts.events_timeline = eventStats.timeline;
      stats.top_lists.popular_events = eventStats.popular;
    }

    // Estadísticas de noticias
    if (type === 'all' || type === 'news') {
      const newsStats = await getNewsStats(env, startDateStr);
      stats.summary.news = newsStats.summary;
      stats.charts.news_views = newsStats.views;
      stats.top_lists.popular_news = newsStats.popular;
    }

    // Estadísticas de comentarios
    if (type === 'all' || type === 'comments') {
      const commentStats = await getCommentStats(env, startDateStr);
      stats.summary.comments = commentStats.summary;
      stats.charts.comments_timeline = commentStats.timeline;
      stats.top_lists.active_commenters = commentStats.active;
    }

  } catch (error) {
    console.error('[ADMIN STATS] Error obteniendo estadísticas específicas:', error);
  }

  return stats;
}

// Estadísticas de usuarios
async function getUserStats(env, startDate) {
  const stats = {
    summary: { total: 0, new: 0, active: 0, by_role: {} },
    growth: [],
    top_active: []
  };

  try {
    // Resumen de usuarios
    const summary = await env.DB.prepare(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN created_at > ? THEN 1 END) as new_users,
        COUNT(CASE WHEN last_login > ? THEN 1 END) as active_users,
        role,
        COUNT(*) as count_by_role
      FROM users 
      WHERE deleted_at IS NULL
      GROUP BY role
    `).bind(startDate, startDate).all();

    if (summary.results) {
      stats.summary.total = summary.results.reduce((sum, r) => sum + r.count_by_role, 0);
      stats.summary.new = summary.results.reduce((sum, r) => sum + (r.new_users || 0), 0);
      stats.summary.active = summary.results.reduce((sum, r) => sum + (r.active_users || 0), 0);
      
      summary.results.forEach(r => {
        stats.summary.by_role[r.role] = r.count_by_role;
      });
    }

    // Crecimiento de usuarios (últimos 7 días)
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayCount = await env.DB.prepare(`
        SELECT COUNT(*) as count 
        FROM users 
        WHERE DATE(created_at) = ? AND deleted_at IS NULL
      `).bind(dateStr).first();
      
      stats.growth.push({
        date: dateStr,
        new_users: dayCount?.count || 0
      });
    }

    // Usuarios más activos (por inscripciones)
    const { results: activeUsers } = await env.DB.prepare(`
      SELECT u.id, u.name, u.email, COUNT(i.id) as inscripciones
      FROM users u
      LEFT JOIN inscripciones i ON u.id = i.user_id
      WHERE u.deleted_at IS NULL
      GROUP BY u.id, u.name, u.email
      ORDER BY inscripciones DESC
      LIMIT 10
    `).all();

    stats.top_active = activeUsers || [];

  } catch (error) {
    console.error('[USER STATS] Error:', error);
  }

  return stats;
}

// Estadísticas de eventos
async function getEventStats(env, startDate) {
  const stats = {
    summary: { total: 0, new: 0, active: 0, total_inscriptions: 0 },
    timeline: [],
    popular: []
  };

  try {
    // Obtener eventos desde KV
    const eventosData = await env.ACA_KV.get('eventos:all');
    const inscripcionesData = await env.ACA_KV.get('inscripciones:all');
    
    if (eventosData) {
      const eventos = JSON.parse(eventosData);
      const inscripciones = inscripcionesData ? JSON.parse(inscripcionesData) : [];
      const startDateObj = new Date(startDate);
      const now = new Date();
      
      stats.summary.total = eventos.length;
      stats.summary.new = eventos.filter(e => new Date(e.created_at) > startDateObj).length;
      stats.summary.active = eventos.filter(e => new Date(e.date) > now).length;
      stats.summary.total_inscriptions = inscripciones.length;
      
      // Eventos más populares (por inscripciones)
      const eventoConInscripciones = eventos.map(evento => ({
        ...evento,
        inscripciones_count: inscripciones.filter(i => i.event_id === evento.id).length
      }));
      
      stats.popular = eventoConInscripciones
        .sort((a, b) => b.inscripciones_count - a.inscripciones_count)
        .slice(0, 10)
        .map(e => ({
          id: e.id,
          title: e.title,
          date: e.date,
          inscripciones: e.inscripciones_count
        }));
      
      // Timeline de eventos (últimos 7 días)
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayEvents = eventos.filter(e => 
          e.created_at && e.created_at.split('T')[0] === dateStr
        );
        
        stats.timeline.push({
          date: dateStr,
          events_created: dayEvents.length,
          inscriptions: inscripciones.filter(i => 
            i.created_at && i.created_at.split('T')[0] === dateStr
          ).length
        });
      }
    }

  } catch (error) {
    console.error('[EVENT STATS] Error:', error);
  }

  return stats;
}

// Estadísticas de noticias
async function getNewsStats(env, startDate) {
  const stats = {
    summary: { total: 0, published: 0, drafts: 0, total_views: 0 },
    views: [],
    popular: []
  };

  try {
    const noticiasData = await env.ACA_KV.get('noticias:all');
    
    if (noticiasData) {
      const noticias = JSON.parse(noticiasData);
      
      stats.summary.total = noticias.length;
      stats.summary.published = noticias.filter(n => n.status === 'published').length;
      stats.summary.drafts = noticias.filter(n => n.status === 'draft').length;
      stats.summary.total_views = noticias.reduce((sum, n) => sum + (n.views || 0), 0);
      
      // Noticias más populares
      stats.popular = noticias
        .sort((a, b) => (b.views || 0) - (a.views || 0))
        .slice(0, 10)
        .map(n => ({
          id: n.id,
          title: n.title,
          views: n.views || 0,
          published_at: n.publishedAt
        }));
      
      // Timeline de vistas (simulado - en producción usar analytics reales)
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        stats.views.push({
          date: dateStr,
          views: Math.floor(Math.random() * 100) + 50 // Simulado
        });
      }
    }

  } catch (error) {
    console.error('[NEWS STATS] Error:', error);
  }

  return stats;
}

// Estadísticas de comentarios
async function getCommentStats(env, startDate) {
  const stats = {
    summary: { total: 0, pending: 0, approved: 0, rejected: 0 },
    timeline: [],
    active: []
  };

  try {
    const comentariosKeys = await env.ACA_KV.list({ prefix: 'comments:' });
    const todosComentarios = [];
    const startDateObj = new Date(startDate);
    
    for (const key of comentariosKeys.keys) {
      if (key.name.startsWith('comments:stats:')) continue;
      
      const comentariosData = await env.ACA_KV.get(key.name);
      if (comentariosData) {
        const comentarios = JSON.parse(comentariosData);
        comentarios.forEach(c => {
          todosComentarios.push(c);
          if (c.replies && c.replies.length > 0) {
            todosComentarios.push(...c.replies);
          }
        });
      }
    }
    
    stats.summary.total = todosComentarios.length;
    stats.summary.pending = todosComentarios.filter(c => c.status === 'pending').length;
    stats.summary.approved = todosComentarios.filter(c => c.status === 'approved').length;
    stats.summary.rejected = todosComentarios.filter(c => c.status === 'rejected').length;
    
    // Comentadores más activos
    const autorCounts = {};
    todosComentarios.forEach(c => {
      autorCounts[c.author_name] = (autorCounts[c.author_name] || 0) + 1;
    });
    
    stats.active = Object.entries(autorCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([name, count]) => ({ author_name: name, comments_count: count }));
    
    // Timeline de comentarios (últimos 7 días)
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayComments = todosComentarios.filter(c => 
        c.created_at && c.created_at.split('T')[0] === dateStr
      );
      
      stats.timeline.push({
        date: dateStr,
        comments: dayComments.length,
        approved: dayComments.filter(c => c.status === 'approved').length
      });
    }

  } catch (error) {
    console.error('[COMMENT STATS] Error:', error);
  }

  return stats;
}
