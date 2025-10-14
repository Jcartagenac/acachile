/**
 * Servicio de Noticias usando D1 Database
 * ACA Chile - Sistema completo de blog/noticias
 */

export interface Env {
  ACA_KV: KVNamespace;
  DB: D1Database;
  ENVIRONMENT: string;
}

export interface NewsCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface NewsTag {
  id: number;
  name: string;
  slug: string;
  color: string;
  created_at: string;
}

export interface NewsArticle {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image?: string;
  author_id: number;
  author_name?: string;
  author_email?: string;
  category_id?: number;
  category?: NewsCategory;
  tags?: NewsTag[];
  status: 'draft' | 'published' | 'archived';
  is_featured: boolean;
  view_count: number;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

export interface NewsComment {
  id: number;
  article_id: number;
  author_name: string;
  author_email: string;
  content: string;
  status: 'pending' | 'approved' | 'spam' | 'rejected';
  parent_id?: number;
  created_at: string;
  replies?: NewsComment[];
}

/**
 * Crear una nueva noticia
 */
export async function createNewsArticle(
  env: Env,
  articleData: {
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    featured_image?: string;
    author_id: number;
    category_id?: number;
    tags?: string[];
    status?: 'draft' | 'published';
    is_featured?: boolean;
  }
): Promise<{ success: boolean; data?: NewsArticle; error?: string }> {
  try {
    const {
      title,
      slug,
      excerpt,
      content,
      featured_image,
      author_id,
      category_id,
      tags = [],
      status = 'draft',
      is_featured = false
    } = articleData;

    // Verificar que el slug no existe
    const existingArticle = await env.DB.prepare(`
      SELECT id FROM news_articles WHERE slug = ?
    `).bind(slug).first();

    if (existingArticle) {
      return { success: false, error: 'Ya existe una noticia con este slug' };
    }

    // Insertar artículo
    const publishedAt = status === 'published' ? new Date().toISOString() : null;
    
    const insertResult = await env.DB.prepare(`
      INSERT INTO news_articles (
        title, slug, excerpt, content, featured_image, 
        author_id, category_id, status, is_featured, published_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      title, slug, excerpt, content, featured_image,
      author_id, category_id, status, is_featured ? 1 : 0, publishedAt
    ).run();

    if (!insertResult.success) {
      return { success: false, error: 'Error creando artículo' };
    }

    const articleId = insertResult.meta.last_row_id as number;

    // Asociar tags
    if (tags.length > 0) {
      for (const tagName of tags) {
        // Crear o obtener tag
        let tagId: number;
        const existingTag = await env.DB.prepare(`
          SELECT id FROM news_tags WHERE name = ?
        `).bind(tagName).first();

        if (existingTag) {
          tagId = existingTag.id as number;
        } else {
          const tagSlug = tagName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
          const tagResult = await env.DB.prepare(`
            INSERT INTO news_tags (name, slug) VALUES (?, ?)
          `).bind(tagName, tagSlug).run();
          tagId = tagResult.meta.last_row_id as number;
        }

        // Asociar tag al artículo
        await env.DB.prepare(`
          INSERT OR IGNORE INTO news_article_tags (article_id, tag_id) VALUES (?, ?)
        `).bind(articleId, tagId).run();
      }
    }

    // Obtener artículo completo
    const article = await getNewsArticleById(env, articleId);
    
    // Invalidar cache
    await env.ACA_KV.delete('news:articles:published');
    await env.ACA_KV.delete('news:articles:featured');

    return { success: true, data: article.data };

  } catch (error) {
    console.error('Error en createNewsArticle:', error);
    return { success: false, error: 'Error interno creando artículo' };
  }
}

/**
 * Obtener artículo por ID
 */
export async function getNewsArticleById(
  env: Env,
  articleId: number
): Promise<{ success: boolean; data?: NewsArticle; error?: string }> {
  try {
    const article = await env.DB.prepare(`
      SELECT 
        a.*,
        u.name as author_name,
        u.email as author_email,
        c.name as category_name,
        c.slug as category_slug,
        c.color as category_color
      FROM news_articles a
      LEFT JOIN users u ON a.author_id = u.id
      LEFT JOIN news_categories c ON a.category_id = c.id
      WHERE a.id = ?
    `).bind(articleId).first();

    if (!article) {
      return { success: false, error: 'Artículo no encontrado' };
    }

    // Obtener tags
    const tags = await env.DB.prepare(`
      SELECT t.* FROM news_tags t
      JOIN news_article_tags at ON t.id = at.tag_id
      WHERE at.article_id = ?
    `).bind(articleId).all();

    const articleData: NewsArticle = {
      id: article.id as number,
      title: article.title as string,
      slug: article.slug as string,
      excerpt: article.excerpt as string,
      content: article.content as string,
      featured_image: article.featured_image as string,
      author_id: article.author_id as number,
      author_name: article.author_name as string,
      author_email: article.author_email as string,
      category_id: article.category_id as number,
      category: article.category_name ? {
        id: article.category_id as number,
        name: article.category_name as string,
        slug: article.category_slug as string,
        color: article.category_color as string,
        created_at: '',
        updated_at: ''
      } : undefined,
      tags: tags.results.map(tag => ({
        id: tag.id as number,
        name: tag.name as string,
        slug: tag.slug as string,
        color: tag.color as string,
        created_at: tag.created_at as string
      })),
      status: article.status as 'draft' | 'published' | 'archived',
      is_featured: Boolean(article.is_featured),
      view_count: article.view_count as number,
      published_at: article.published_at as string,
      created_at: article.created_at as string,
      updated_at: article.updated_at as string
    };

    return { success: true, data: articleData };

  } catch (error) {
    console.error('Error en getNewsArticleById:', error);
    return { success: false, error: 'Error obteniendo artículo' };
  }
}

/**
 * Obtener artículo por slug
 */
export async function getNewsArticleBySlug(
  env: Env,
  slug: string,
  incrementViews: boolean = false
): Promise<{ success: boolean; data?: NewsArticle; error?: string }> {
  try {
    const article = await env.DB.prepare(`
      SELECT id FROM news_articles WHERE slug = ? AND status = 'published'
    `).bind(slug).first();

    if (!article) {
      return { success: false, error: 'Artículo no encontrado' };
    }

    // Incrementar contador de vistas
    if (incrementViews) {
      await env.DB.prepare(`
        UPDATE news_articles 
        SET view_count = view_count + 1 
        WHERE id = ?
      `).bind(article.id).run();
    }

    return await getNewsArticleById(env, article.id as number);

  } catch (error) {
    console.error('Error en getNewsArticleBySlug:', error);
    return { success: false, error: 'Error obteniendo artículo' };
  }
}

/**
 * Listar artículos con filtros y paginación
 */
export async function getNewsArticles(
  env: Env,
  filters: {
    status?: 'draft' | 'published' | 'archived';
    category?: string;
    tag?: string;
    featured?: boolean;
    author_id?: number;
    search?: string;
    page?: number;
    limit?: number;
  } = {}
): Promise<{ success: boolean; data?: NewsArticle[]; error?: string; pagination?: any }> {
  try {
    const {
      status = 'published',
      category,
      tag,
      featured,
      author_id,
      search,
      page = 1,
      limit = 12
    } = filters;

    // Construir query base
    let query = `
      SELECT 
        a.*,
        u.name as author_name,
        c.name as category_name,
        c.slug as category_slug,
        c.color as category_color
      FROM news_articles a
      LEFT JOIN users u ON a.author_id = u.id
      LEFT JOIN news_categories c ON a.category_id = c.id
    `;

    const conditions: string[] = [];
    const params: any[] = [];

    // Filtros
    if (status) {
      conditions.push('a.status = ?');
      params.push(status);
    }

    if (category) {
      conditions.push('c.slug = ?');
      params.push(category);
    }

    if (featured !== undefined) {
      conditions.push('a.is_featured = ?');
      params.push(featured ? 1 : 0);
    }

    if (author_id) {
      conditions.push('a.author_id = ?');
      params.push(author_id);
    }

    if (search) {
      conditions.push('(a.title LIKE ? OR a.excerpt LIKE ? OR a.content LIKE ?)');
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (tag) {
      query += `
        JOIN news_article_tags at ON a.id = at.article_id
        JOIN news_tags t ON at.tag_id = t.id
      `;
      conditions.push('t.slug = ?');
      params.push(tag);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    // Ordenamiento
    if (status === 'published') {
      query += ' ORDER BY a.published_at DESC, a.created_at DESC';
    } else {
      query += ' ORDER BY a.created_at DESC';
    }

    // Paginación
    const offset = (page - 1) * limit;
    query += ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const articlesResult = await env.DB.prepare(query).bind(...params).all();

    // Obtener total para paginación
    let countQuery = `
      SELECT COUNT(DISTINCT a.id) as total
      FROM news_articles a
      LEFT JOIN news_categories c ON a.category_id = c.id
    `;

    if (tag) {
      countQuery += `
        JOIN news_article_tags at ON a.id = at.article_id
        JOIN news_tags t ON at.tag_id = t.id
      `;
    }

    const countConditions = conditions.filter(c => !c.includes('LIMIT') && !c.includes('OFFSET'));
    const countParams = params.slice(0, -2); // Remover LIMIT y OFFSET

    if (countConditions.length > 0) {
      countQuery += ' WHERE ' + countConditions.join(' AND ');
    }

    const totalResult = await env.DB.prepare(countQuery).bind(...countParams).first();
    const total = totalResult?.total as number || 0;

    // Construir respuesta con tags para cada artículo
    const articles: NewsArticle[] = [];
    for (const article of articlesResult.results) {
      const tags = await env.DB.prepare(`
        SELECT t.* FROM news_tags t
        JOIN news_article_tags at ON t.id = at.tag_id
        WHERE at.article_id = ?
      `).bind(article.id).all();

      articles.push({
        id: article.id as number,
        title: article.title as string,
        slug: article.slug as string,
        excerpt: article.excerpt as string,
        content: article.content as string,
        featured_image: article.featured_image as string,
        author_id: article.author_id as number,
        author_name: article.author_name as string,
        category_id: article.category_id as number,
        category: article.category_name ? {
          id: article.category_id as number,
          name: article.category_name as string,
          slug: article.category_slug as string,
          color: article.category_color as string,
          created_at: '',
          updated_at: ''
        } : undefined,
        tags: tags.results.map(tag => ({
          id: tag.id as number,
          name: tag.name as string,
          slug: tag.slug as string,
          color: tag.color as string,
          created_at: tag.created_at as string
        })),
        status: article.status as 'draft' | 'published' | 'archived',
        is_featured: Boolean(article.is_featured),
        view_count: article.view_count as number,
        published_at: article.published_at as string,
        created_at: article.created_at as string,
        updated_at: article.updated_at as string
      });
    }

    const pagination = {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1
    };

    return { success: true, data: articles, pagination };

  } catch (error) {
    console.error('Error en getNewsArticles:', error);
    return { success: false, error: 'Error obteniendo artículos' };
  }
}

/**
 * Actualizar artículo
 */
export async function updateNewsArticle(
  env: Env,
  articleId: number,
  updates: Partial<{
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    featured_image: string;
    category_id: number;
    tags: string[];
    status: 'draft' | 'published' | 'archived';
    is_featured: boolean;
  }>
): Promise<{ success: boolean; data?: NewsArticle; error?: string }> {
  try {
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (key === 'tags') return; // Manejar tags por separado
      
      if (key === 'is_featured') {
        updateFields.push(`${key} = ?`);
        updateValues.push(value ? 1 : 0);
      } else if (key === 'status' && value === 'published') {
        updateFields.push(`${key} = ?`, 'published_at = ?');
        updateValues.push(value, new Date().toISOString());
      } else {
        updateFields.push(`${key} = ?`);
        updateValues.push(value);
      }
    });

    if (updateFields.length > 0) {
      updateValues.push(articleId);
      await env.DB.prepare(`
        UPDATE news_articles 
        SET ${updateFields.join(', ')} 
        WHERE id = ?
      `).bind(...updateValues).run();
    }

    // Actualizar tags si se proporcionaron
    if (updates.tags) {
      // Eliminar tags existentes
      await env.DB.prepare(`
        DELETE FROM news_article_tags WHERE article_id = ?
      `).bind(articleId).run();

      // Agregar nuevos tags
      for (const tagName of updates.tags) {
        let tagId: number;
        const existingTag = await env.DB.prepare(`
          SELECT id FROM news_tags WHERE name = ?
        `).bind(tagName).first();

        if (existingTag) {
          tagId = existingTag.id as number;
        } else {
          const tagSlug = tagName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
          const tagResult = await env.DB.prepare(`
            INSERT INTO news_tags (name, slug) VALUES (?, ?)
          `).bind(tagName, tagSlug).run();
          tagId = tagResult.meta.last_row_id as number;
        }

        await env.DB.prepare(`
          INSERT INTO news_article_tags (article_id, tag_id) VALUES (?, ?)
        `).bind(articleId, tagId).run();
      }
    }

    // Invalidar cache
    await env.ACA_KV.delete('news:articles:published');
    await env.ACA_KV.delete('news:articles:featured');

    // Obtener artículo actualizado
    const updatedArticle = await getNewsArticleById(env, articleId);
    return updatedArticle;

  } catch (error) {
    console.error('Error en updateNewsArticle:', error);
    return { success: false, error: 'Error actualizando artículo' };
  }
}

/**
 * Eliminar artículo
 */
export async function deleteNewsArticle(
  env: Env,
  articleId: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await env.DB.prepare(`
      DELETE FROM news_articles WHERE id = ?
    `).bind(articleId).run();

    if (!result.success) {
      return { success: false, error: 'Error eliminando artículo' };
    }

    // Invalidar cache
    await env.ACA_KV.delete('news:articles:published');
    await env.ACA_KV.delete('news:articles:featured');

    return { success: true };

  } catch (error) {
    console.error('Error en deleteNewsArticle:', error);
    return { success: false, error: 'Error eliminando artículo' };
  }
}

/**
 * Obtener categorías
 */
export async function getNewsCategories(env: Env): Promise<{ success: boolean; data?: NewsCategory[]; error?: string }> {
  try {
    // Intentar obtener de cache
    const cached = await env.ACA_KV.get('news:categories');
    if (cached) {
      return { success: true, data: JSON.parse(cached) };
    }

    const result = await env.DB.prepare(`
      SELECT * FROM news_categories ORDER BY name
    `).all();

    const categories = result.results.map(cat => ({
      id: cat.id as number,
      name: cat.name as string,
      slug: cat.slug as string,
      description: cat.description as string,
      color: cat.color as string,
      created_at: cat.created_at as string,
      updated_at: cat.updated_at as string
    }));

    // Cache por 1 hora
    await env.ACA_KV.put('news:categories', JSON.stringify(categories), { expirationTtl: 3600 });

    return { success: true, data: categories };

  } catch (error) {
    console.error('Error en getNewsCategories:', error);
    return { success: false, error: 'Error obteniendo categorías' };
  }
}

/**
 * Obtener tags populares
 */
export async function getPopularTags(env: Env, limit: number = 20): Promise<{ success: boolean; data?: NewsTag[]; error?: string }> {
  try {
    const result = await env.DB.prepare(`
      SELECT t.*, COUNT(at.article_id) as usage_count
      FROM news_tags t
      LEFT JOIN news_article_tags at ON t.id = at.tag_id
      GROUP BY t.id
      ORDER BY usage_count DESC, t.name
      LIMIT ?
    `).bind(limit).all();

    const tags = result.results.map(tag => ({
      id: tag.id as number,
      name: tag.name as string,
      slug: tag.slug as string,
      color: tag.color as string,
      created_at: tag.created_at as string
    }));

    return { success: true, data: tags };

  } catch (error) {
    console.error('Error en getPopularTags:', error);
    return { success: false, error: 'Error obteniendo tags' };
  }
}