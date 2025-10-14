/**
 * Sistema de búsqueda y filtros
 * ACA Chile - Búsqueda de eventos, noticias y usuarios
 */

export interface Env {
  ACA_KV: KVNamespace;
  DB: D1Database;
  ENVIRONMENT: string;
}

export interface SearchResult {
  type: 'evento' | 'noticia' | 'usuario';
  id: number;
  title: string;
  description: string;
  url: string;
  date: string;
  relevance: number;
}

export interface SearchFilters {
  type?: 'eventos' | 'noticias' | 'usuarios' | 'all';
  dateFrom?: string;
  dateTo?: string;
  category?: string;
  location?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

/**
 * Búsqueda general en toda la plataforma
 */
export async function searchGlobal(
  env: Env,
  query: string,
  filters: SearchFilters = {}
): Promise<{ success: boolean; data?: SearchResult[]; totalResults?: number; error?: string }> {
  try {
    if (!query || query.trim().length < 2) {
      return { success: false, error: 'La búsqueda debe tener al menos 2 caracteres' };
    }

    const searchTerm = `%${query.trim()}%`;
    const results: SearchResult[] = [];
    let totalResults = 0;

    const { type = 'all', dateFrom, dateTo, category, location, status, limit = 20, offset = 0 } = filters;

    // Búsqueda en eventos
    if (type === 'all' || type === 'eventos') {
      let eventQuery = `
        SELECT 
          id, titulo, descripcion, fecha_evento, ubicacion,
          'evento' as type
        FROM eventos 
        WHERE (titulo LIKE ? OR descripcion LIKE ? OR ubicacion LIKE ?)
      `;
      
      const eventParams = [searchTerm, searchTerm, searchTerm];

      if (dateFrom) {
        eventQuery += ' AND fecha_evento >= ?';
        eventParams.push(dateFrom);
      }
      if (dateTo) {
        eventQuery += ' AND fecha_evento <= ?';
        eventParams.push(dateTo);
      }
      if (location) {
        eventQuery += ' AND ubicacion LIKE ?';
        eventParams.push(`%${location}%`);
      }

      eventQuery += ' ORDER BY fecha_evento DESC';
      
      if (type === 'eventos') {
        eventQuery += ' LIMIT ? OFFSET ?';
        eventParams.push(limit as any, offset as any);
      } else {
        eventQuery += ' LIMIT 5'; // Limitar para búsqueda global
      }

      const eventResults = await env.DB.prepare(eventQuery).bind(...eventParams).all();

      eventResults.results.forEach((row: any) => {
        results.push({
          type: 'evento',
          id: row.id,
          title: row.titulo,
          description: row.descripcion,
          url: `/eventos/${row.id}`,
          date: row.fecha_evento,
          relevance: calculateRelevance(query, `${row.titulo} ${row.descripcion}`)
        });
      });

      if (type === 'eventos') {
        const countResult = await env.DB.prepare(`
          SELECT COUNT(*) as total FROM eventos 
          WHERE (titulo LIKE ? OR descripcion LIKE ? OR ubicacion LIKE ?)
          ${dateFrom ? ' AND fecha_evento >= ?' : ''}
          ${dateTo ? ' AND fecha_evento <= ?' : ''}
          ${location ? ' AND ubicacion LIKE ?' : ''}
        `).bind(...eventParams.slice(0, -2)).first(); // Excluir LIMIT y OFFSET
        
        totalResults = (countResult?.total as number) || 0;
      }
    }

    // Búsqueda en noticias
    if (type === 'all' || type === 'noticias') {
      let newsQuery = `
        SELECT 
          a.id, a.title, a.excerpt, a.slug, a.published_at,
          'noticia' as type,
          c.name as category_name
        FROM news_articles a
        LEFT JOIN news_categories c ON a.category_id = c.id
        WHERE a.status = 'published' AND (a.title LIKE ? OR a.excerpt LIKE ? OR a.content LIKE ?)
      `;
      
      const newsParams = [searchTerm, searchTerm, searchTerm];

      if (dateFrom) {
        newsQuery += ' AND a.published_at >= ?';
        newsParams.push(dateFrom);
      }
      if (dateTo) {
        newsQuery += ' AND a.published_at <= ?';
        newsParams.push(dateTo);
      }
      if (category) {
        newsQuery += ' AND c.slug = ?';
        newsParams.push(category);
      }

      newsQuery += ' ORDER BY a.published_at DESC';
      
      if (type === 'noticias') {
        newsQuery += ' LIMIT ? OFFSET ?';
        newsParams.push(limit as any, offset as any);
      } else {
        newsQuery += ' LIMIT 5';
      }

      const newsResults = await env.DB.prepare(newsQuery).bind(...newsParams).all();

      newsResults.results.forEach((row: any) => {
        results.push({
          type: 'noticia',
          id: row.id,
          title: row.title,
          description: row.excerpt,
          url: `/noticias/${row.slug}`,
          date: row.published_at,
          relevance: calculateRelevance(query, `${row.title} ${row.excerpt}`)
        });
      });

      if (type === 'noticias') {
        const countResult = await env.DB.prepare(`
          SELECT COUNT(*) as total FROM news_articles a
          LEFT JOIN news_categories c ON a.category_id = c.id
          WHERE a.status = 'published' AND (a.title LIKE ? OR a.excerpt LIKE ? OR a.content LIKE ?)
          ${dateFrom ? ' AND a.published_at >= ?' : ''}
          ${dateTo ? ' AND a.published_at <= ?' : ''}
          ${category ? ' AND c.slug = ?' : ''}
        `).bind(...newsParams.slice(0, -2)).first();
        
        totalResults = (countResult?.total as number) || 0;
      }
    }

    // Búsqueda en usuarios (solo para admins)
    if (type === 'all' || type === 'usuarios') {
      let userQuery = `
        SELECT 
          id, nombre, apellido, email, ciudad,
          'usuario' as type, created_at
        FROM usuarios 
        WHERE activo = 1 AND (nombre LIKE ? OR apellido LIKE ? OR email LIKE ? OR ciudad LIKE ?)
      `;
      
      const userParams = [searchTerm, searchTerm, searchTerm, searchTerm];

      if (dateFrom) {
        userQuery += ' AND created_at >= ?';
        userParams.push(dateFrom);
      }
      if (dateTo) {
        userQuery += ' AND created_at <= ?';
        userParams.push(dateTo);
      }
      if (location) {
        userQuery += ' AND ciudad LIKE ?';
        userParams.push(`%${location}%`);
      }

      userQuery += ' ORDER BY created_at DESC';
      
      if (type === 'usuarios') {
        userQuery += ' LIMIT ? OFFSET ?';
        userParams.push(limit as any, offset as any);
      } else {
        userQuery += ' LIMIT 3';
      }

      const userResults = await env.DB.prepare(userQuery).bind(...userParams).all();

      userResults.results.forEach((row: any) => {
        results.push({
          type: 'usuario',
          id: row.id,
          title: `${row.nombre} ${row.apellido}`,
          description: `${row.email}${row.ciudad ? ` - ${row.ciudad}` : ''}`,
          url: `/admin/usuarios/${row.id}`,
          date: row.created_at,
          relevance: calculateRelevance(query, `${row.nombre} ${row.apellido} ${row.email}`)
        });
      });

      if (type === 'usuarios') {
        const countResult = await env.DB.prepare(`
          SELECT COUNT(*) as total FROM usuarios 
          WHERE activo = 1 AND (nombre LIKE ? OR apellido LIKE ? OR email LIKE ? OR ciudad LIKE ?)
          ${dateFrom ? ' AND created_at >= ?' : ''}
          ${dateTo ? ' AND created_at <= ?' : ''}
          ${location ? ' AND ciudad LIKE ?' : ''}
        `).bind(...userParams.slice(0, -2)).first();
        
        totalResults = (countResult?.total as number) || 0;
      }
    }

    // Ordenar por relevancia si es búsqueda global
    if (type === 'all') {
      results.sort((a, b) => b.relevance - a.relevance);
      totalResults = results.length;
    }

    return { 
      success: true, 
      data: results,
      totalResults 
    };

  } catch (error) {
    console.error('Error en searchGlobal:', error);
    return { success: false, error: 'Error realizando búsqueda' };
  }
}

/**
 * Calcular relevancia de un resultado
 */
function calculateRelevance(query: string, text: string): number {
  if (!text) return 0;
  
  const queryLower = query.toLowerCase();
  const textLower = text.toLowerCase();
  
  let score = 0;
  
  // Coincidencia exacta en el título vale más
  if (textLower.includes(queryLower)) {
    score += 100;
  }
  
  // Coincidencias de palabras individuales
  const queryWords = queryLower.split(' ').filter(word => word.length > 2);
  queryWords.forEach(word => {
    if (textLower.includes(word)) {
      score += 50;
    }
  });
  
  // Bonus si la coincidencia está al inicio
  if (textLower.startsWith(queryLower)) {
    score += 50;
  }
  
  return score;
}

/**
 * Obtener sugerencias de búsqueda (autocompletar)
 */
export async function getSearchSuggestions(
  env: Env,
  query: string,
  type?: 'eventos' | 'noticias'
): Promise<{ success: boolean; data?: string[]; error?: string }> {
  try {
    if (!query || query.trim().length < 2) {
      return { success: true, data: [] };
    }

    const searchTerm = `${query.trim()}%`;
    const suggestions: Set<string> = new Set();
    
    // Cache key para sugerencias
    const cacheKey = `search:suggestions:${type || 'all'}:${query.slice(0, 10)}`;
    const cached = await env.ACA_KV.get(cacheKey);
    if (cached) {
      return { success: true, data: JSON.parse(cached) };
    }

    // Sugerencias de eventos
    if (!type || type === 'eventos') {
      const eventSuggestions = await env.DB.prepare(`
        SELECT DISTINCT titulo FROM eventos 
        WHERE titulo LIKE ? 
        ORDER BY fecha_evento DESC 
        LIMIT 5
      `).bind(searchTerm).all();

      eventSuggestions.results.forEach((row: any) => {
        suggestions.add(row.titulo);
      });
    }

    // Sugerencias de noticias
    if (!type || type === 'noticias') {
      const newsSuggestions = await env.DB.prepare(`
        SELECT DISTINCT title FROM news_articles 
        WHERE status = 'published' AND title LIKE ? 
        ORDER BY published_at DESC 
        LIMIT 5
      `).bind(searchTerm).all();

      newsSuggestions.results.forEach((row: any) => {
        suggestions.add(row.title);
      });
    }

    const result = Array.from(suggestions).slice(0, 10);

    // Cache por 1 hora
    await env.ACA_KV.put(cacheKey, JSON.stringify(result), { expirationTtl: 3600 });

    return { success: true, data: result };

  } catch (error) {
    console.error('Error en getSearchSuggestions:', error);
    return { success: false, error: 'Error obteniendo sugerencias' };
  }
}

/**
 * Búsqueda avanzada con filtros múltiples
 */
export async function searchAdvanced(
  env: Env,
  filters: {
    query?: string;
    tipo?: 'eventos' | 'noticias';
    fechaDesde?: string;
    fechaHasta?: string;
    categoria?: string;
    ubicacion?: string;
    estado?: string;
    ordenarPor?: 'fecha' | 'relevancia' | 'titulo';
    orden?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const {
      query = '',
      tipo = 'eventos',
      fechaDesde,
      fechaHasta,
      categoria,
      ubicacion,
      estado,
      ordenarPor = 'fecha',
      orden = 'desc',
      page = 1,
      limit = 20
    } = filters;

    const offset = (page - 1) * limit;
    const results: any[] = [];

    if (tipo === 'eventos') {
      let eventQuery = `
        SELECT 
          id, titulo, descripcion, fecha_evento, ubicacion, 
          precio, capacidad_maxima, created_at
        FROM eventos 
        WHERE 1=1
      `;
      
      const params: any[] = [];

      if (query.trim()) {
        eventQuery += ' AND (titulo LIKE ? OR descripcion LIKE ? OR ubicacion LIKE ?)';
        const searchTerm = `%${query.trim()}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      if (fechaDesde) {
        eventQuery += ' AND fecha_evento >= ?';
        params.push(fechaDesde);
      }

      if (fechaHasta) {
        eventQuery += ' AND fecha_evento <= ?';
        params.push(fechaHasta);
      }

      if (ubicacion) {
        eventQuery += ' AND ubicacion LIKE ?';
        params.push(`%${ubicacion}%`);
      }

      // Ordenamiento
      let orderByClause = '';
      switch (ordenarPor) {
        case 'titulo':
          orderByClause = `ORDER BY titulo ${orden.toUpperCase()}`;
          break;
        case 'fecha':
          orderByClause = `ORDER BY fecha_evento ${orden.toUpperCase()}`;
          break;
        default:
          orderByClause = `ORDER BY created_at ${orden.toUpperCase()}`;
      }

      eventQuery += ` ${orderByClause} LIMIT ? OFFSET ?`;
      params.push(limit as any, offset as any);

      const eventResults = await env.DB.prepare(eventQuery).bind(...params).all();
      
      // Obtener total para paginación
      const countParams = params.slice(0, -2); // Excluir LIMIT y OFFSET
      let countQuery = eventQuery.split('LIMIT')[0].replace(/SELECT.*FROM/, 'SELECT COUNT(*) as total FROM');
      
      const totalResult = await env.DB.prepare(countQuery).bind(...countParams).first();
      const total = (totalResult?.total as number) || 0;

      return {
        success: true,
        data: {
          results: eventResults.results,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          },
          filters: filters
        }
      };

    } else if (tipo === 'noticias') {
      let newsQuery = `
        SELECT 
          a.id, a.title, a.slug, a.excerpt, a.published_at,
          a.featured_image, a.views,
          c.name as category_name, c.slug as category_slug
        FROM news_articles a
        LEFT JOIN news_categories c ON a.category_id = c.id
        WHERE a.status = 'published'
      `;
      
      const params: any[] = [];

      if (query.trim()) {
        newsQuery += ' AND (a.title LIKE ? OR a.excerpt LIKE ? OR a.content LIKE ?)';
        const searchTerm = `%${query.trim()}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      if (fechaDesde) {
        newsQuery += ' AND a.published_at >= ?';
        params.push(fechaDesde);
      }

      if (fechaHasta) {
        newsQuery += ' AND a.published_at <= ?';
        params.push(fechaHasta);
      }

      if (categoria) {
        newsQuery += ' AND c.slug = ?';
        params.push(categoria);
      }

      // Ordenamiento
      let orderByClause = '';
      switch (ordenarPor) {
        case 'titulo':
          orderByClause = `ORDER BY a.title ${orden.toUpperCase()}`;
          break;
        case 'fecha':
          orderByClause = `ORDER BY a.published_at ${orden.toUpperCase()}`;
          break;
        default:
          orderByClause = `ORDER BY a.published_at ${orden.toUpperCase()}`;
      }

      newsQuery += ` ${orderByClause} LIMIT ? OFFSET ?`;
      params.push(limit as any, offset as any);

      const newsResults = await env.DB.prepare(newsQuery).bind(...params).all();
      
      // Obtener total para paginación
      const countParams = params.slice(0, -2);
      let countQuery = newsQuery.split('LIMIT')[0].replace(/SELECT.*?FROM/, 'SELECT COUNT(*) as total FROM');
      
      const totalResult = await env.DB.prepare(countQuery).bind(...countParams).first();
      const total = (totalResult?.total as number) || 0;

      return {
        success: true,
        data: {
          results: newsResults.results,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          },
          filters: filters
        }
      };
    }

    return { success: false, error: 'Tipo de búsqueda no válido' };

  } catch (error) {
    console.error('Error en searchAdvanced:', error);
    return { success: false, error: 'Error realizando búsqueda avanzada' };
  }
}