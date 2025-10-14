/**
 * Sistema de administración y panel de control
 * ACA Chile - Gestión de usuarios, contenido y estadísticas
 */

import { getTokenFromRequest } from './auth';

export interface Env {
  ACA_KV: KVNamespace;
  DB: D1Database;
  ENVIRONMENT: string;
}

export interface AdminStats {
  usuarios: {
    total: number;
    activos: number;
    nuevos_mes: number;
  };
  eventos: {
    total: number;
    activos: number;
    inscripciones_mes: number;
  };
  noticias: {
    total: number;
    publicadas: number;
    vistas_mes: number;
  };
  comentarios: {
    total: number;
    pendientes: number;
    aprobados_mes: number;
  };
}

/**
 * Obtener estadísticas del panel de administración
 */
export async function getAdminStats(env: Env): Promise<{ success: boolean; data?: AdminStats; error?: string }> {
  try {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthStart = firstDayOfMonth.toISOString().split('T')[0];

    // Estadísticas de usuarios
    const [
      totalUsers,
      activeUsers,
      newUsersMonth
    ] = await Promise.all([
      env.DB.prepare(`SELECT COUNT(*) as count FROM usuarios`).first(),
      env.DB.prepare(`SELECT COUNT(*) as count FROM usuarios WHERE activo = 1`).first(),
      env.DB.prepare(`SELECT COUNT(*) as count FROM usuarios WHERE created_at >= ?`).bind(monthStart).first()
    ]);

    // Estadísticas de eventos
    const [
      totalEvents,
      activeEvents,
      inscriptionsMonth
    ] = await Promise.all([
      env.DB.prepare(`SELECT COUNT(*) as count FROM eventos`).first(),
      env.DB.prepare(`SELECT COUNT(*) as count FROM eventos WHERE fecha_evento > datetime('now')`).first(),
      env.DB.prepare(`SELECT COUNT(*) as count FROM inscripciones WHERE created_at >= ?`).bind(monthStart).first()
    ]);

    // Estadísticas de noticias
    const [
      totalNews,
      publishedNews
    ] = await Promise.all([
      env.DB.prepare(`SELECT COUNT(*) as count FROM news_articles`).first(),
      env.DB.prepare(`SELECT COUNT(*) as count FROM news_articles WHERE status = 'published'`).first()
    ]);

    // Estadísticas de comentarios
    const [
      totalComments,
      pendingComments,
      approvedCommentsMonth
    ] = await Promise.all([
      env.DB.prepare(`SELECT COUNT(*) as count FROM news_comments`).first(),
      env.DB.prepare(`SELECT COUNT(*) as count FROM news_comments WHERE status = 'pending'`).first(),
      env.DB.prepare(`SELECT COUNT(*) as count FROM news_comments WHERE status = 'approved' AND created_at >= ?`).bind(monthStart).first()
    ]);

    // Obtener vistas de noticias del mes desde KV
    let newsViewsMonth = 0;
    try {
      const viewsData = await env.ACA_KV.get('stats:news_views:month');
      newsViewsMonth = viewsData ? parseInt(viewsData) : 0;
    } catch (e) {
      console.log('No se pudieron obtener las vistas del mes');
    }

    const stats: AdminStats = {
      usuarios: {
        total: (totalUsers?.count as number) || 0,
        activos: (activeUsers?.count as number) || 0,
        nuevos_mes: (newUsersMonth?.count as number) || 0
      },
      eventos: {
        total: (totalEvents?.count as number) || 0,
        activos: (activeEvents?.count as number) || 0,
        inscripciones_mes: (inscriptionsMonth?.count as number) || 0
      },
      noticias: {
        total: (totalNews?.count as number) || 0,
        publicadas: (publishedNews?.count as number) || 0,
        vistas_mes: newsViewsMonth
      },
      comentarios: {
        total: (totalComments?.count as number) || 0,
        pendientes: (pendingComments?.count as number) || 0,
        aprobados_mes: (approvedCommentsMonth?.count as number) || 0
      }
    };

    return { success: true, data: stats };

  } catch (error) {
    console.error('Error en getAdminStats:', error);
    return { success: false, error: 'Error obteniendo estadísticas' };
  }
}

/**
 * Obtener lista de usuarios para administración
 */
export async function getAdminUsers(
  env: Env,
  page: number = 1,
  limit: number = 20,
  search?: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT id, email, nombre, apellido, telefono, rut, ciudad, role, activo, created_at, last_login
      FROM usuarios
    `;
    
    let countQuery = `SELECT COUNT(*) as total FROM usuarios`;
    const params: any[] = [];

    if (search) {
      const searchCondition = ` WHERE (nombre LIKE ? OR apellido LIKE ? OR email LIKE ?)`;
      query += searchCondition;
      countQuery += searchCondition;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const [users, total] = await Promise.all([
      env.DB.prepare(query).bind(...params).all(),
      env.DB.prepare(countQuery).bind(...(search ? [`%${search}%`, `%${search}%`, `%${search}%`] : [])).first()
    ]);

    return {
      success: true,
      data: {
        usuarios: users.results,
        pagination: {
          page,
          limit,
          total: (total?.total as number) || 0,
          pages: Math.ceil(((total?.total as number) || 0) / limit)
        }
      }
    };

  } catch (error) {
    console.error('Error en getAdminUsers:', error);
    return { success: false, error: 'Error obteniendo usuarios' };
  }
}

/**
 * Actualizar usuario (admin)
 */
export async function updateAdminUser(
  env: Env,
  userId: number,
  updates: {
    nombre?: string;
    apellido?: string;
    email?: string;
    telefono?: string;
    ciudad?: string;
    role?: 'admin' | 'editor' | 'user';
    activo?: boolean;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const allowedFields = ['nombre', 'apellido', 'email', 'telefono', 'ciudad', 'role', 'activo'];
    const updateFields: string[] = [];
    const values: any[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (allowedFields.includes(key) && value !== undefined) {
        updateFields.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (updateFields.length === 0) {
      return { success: false, error: 'No hay campos para actualizar' };
    }

    values.push(userId);

    const result = await env.DB.prepare(`
      UPDATE usuarios 
      SET ${updateFields.join(', ')} 
      WHERE id = ?
    `).bind(...values).run();

    if (!result.success) {
      return { success: false, error: 'Error actualizando usuario' };
    }

    return { success: true };

  } catch (error) {
    console.error('Error en updateAdminUser:', error);
    return { success: false, error: 'Error interno actualizando usuario' };
  }
}

/**
 * Eliminar usuario (admin)
 */
export async function deleteAdminUser(
  env: Env,
  userId: number
): Promise<{ success: boolean; error?: string }> {
  try {
    // En lugar de eliminar, desactivamos el usuario
    const result = await env.DB.prepare(`
      UPDATE usuarios SET activo = 0 WHERE id = ?
    `).bind(userId).run();

    if (!result.success) {
      return { success: false, error: 'Error eliminando usuario' };
    }

    return { success: true };

  } catch (error) {
    console.error('Error en deleteAdminUser:', error);
    return { success: false, error: 'Error interno eliminando usuario' };
  }
}

/**
 * Obtener comentarios pendientes de moderación
 */
export async function getPendingComments(
  env: Env,
  page: number = 1,
  limit: number = 20
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const offset = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      env.DB.prepare(`
        SELECT 
          c.id, c.article_id, c.author_name, c.author_email, 
          c.content, c.status, c.created_at,
          a.title as article_title
        FROM news_comments c
        LEFT JOIN news_articles a ON c.article_id = a.id
        WHERE c.status = 'pending'
        ORDER BY c.created_at ASC
        LIMIT ? OFFSET ?
      `).bind(limit, offset).all(),
      
      env.DB.prepare(`
        SELECT COUNT(*) as total FROM news_comments WHERE status = 'pending'
      `).first()
    ]);

    return {
      success: true,
      data: {
        comentarios: comments.results,
        pagination: {
          page,
          limit,
          total: (total?.total as number) || 0,
          pages: Math.ceil(((total?.total as number) || 0) / limit)
        }
      }
    };

  } catch (error) {
    console.error('Error en getPendingComments:', error);
    return { success: false, error: 'Error obteniendo comentarios pendientes' };
  }
}

/**
 * Obtener actividad reciente del sistema
 */
export async function getRecentActivity(
  env: Env,
  limit: number = 50
): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    // Obtener inscripciones recientes
    const inscripciones = await env.DB.prepare(`
      SELECT 
        'inscripcion' as tipo,
        i.id,
        u.nombre || ' ' || u.apellido as usuario,
        e.titulo as descripcion,
        i.created_at as fecha
      FROM inscripciones i
      JOIN usuarios u ON i.user_id = u.id
      JOIN eventos e ON i.evento_id = e.id
      ORDER BY i.created_at DESC
      LIMIT ?
    `).bind(Math.floor(limit / 3)).all();

    // Obtener usuarios nuevos
    const usuarios = await env.DB.prepare(`
      SELECT 
        'usuario' as tipo,
        id,
        nombre || ' ' || apellido as usuario,
        'Nuevo usuario registrado' as descripcion,
        created_at as fecha
      FROM usuarios
      ORDER BY created_at DESC
      LIMIT ?
    `).bind(Math.floor(limit / 3)).all();

    // Obtener comentarios recientes
    const comentarios = await env.DB.prepare(`
      SELECT 
        'comentario' as tipo,
        c.id,
        c.author_name as usuario,
        'Comentario en: ' || a.title as descripcion,
        c.created_at as fecha
      FROM news_comments c
      JOIN news_articles a ON c.article_id = a.id
      ORDER BY c.created_at DESC
      LIMIT ?
    `).bind(Math.floor(limit / 3)).all();

    // Combinar y ordenar todas las actividades
    const allActivity = [
      ...inscripciones.results,
      ...usuarios.results,
      ...comentarios.results
    ].sort((a, b) => {
      const dateA = new Date(a.fecha as string);
      const dateB = new Date(b.fecha as string);
      return dateB.getTime() - dateA.getTime();
    }).slice(0, limit);

    return { success: true, data: allActivity };

  } catch (error) {
    console.error('Error en getRecentActivity:', error);
    return { success: false, error: 'Error obteniendo actividad reciente' };
  }
}