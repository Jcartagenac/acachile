/**
 * Handlers para endpoints de noticias
 * ACA Chile - Sistema de blog/noticias
 */

import {
  createNewsArticle,
  getNewsArticleById,
  getNewsArticleBySlug,
  getNewsArticles,
  updateNewsArticle,
  deleteNewsArticle,
  getNewsCategories,
  getPopularTags,
  NewsArticle
} from './news-service';

export interface Env {
  ACA_KV: KVNamespace;
  DB: D1Database;
  ENVIRONMENT: string;
  JWT_SECRET?: string;
  ADMIN_EMAIL?: string;
  CORS_ORIGIN?: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * Handler principal para /api/noticias
 */
export async function handleNoticias(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const method = request.method;

  try {
    // GET /api/noticias - Listar artículos
    if (method === 'GET') {
      const category = url.searchParams.get('category');
      const tag = url.searchParams.get('tag');
      const search = url.searchParams.get('search');
      const featured = url.searchParams.get('featured');
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '12');

      const result = await getNewsArticles(env, {
        category: category || undefined,
        tag: tag || undefined,
        search: search || undefined,
        featured: featured === 'true' ? true : undefined,
        page,
        limit
      });

      if (!result.success) {
        return new Response(JSON.stringify({
          success: false,
          error: result.error
        }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        });
      }

      return new Response(JSON.stringify({
        success: true,
        data: result.data,
        pagination: result.pagination
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    // POST /api/noticias - Crear artículo (requiere autenticación)
    if (method === 'POST') {
      // Verificar autenticación
      const authHeader = request.headers.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Token de autorización requerido'
        }), {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        });
      }

      // TODO: Verificar permisos para crear noticias
      const token = authHeader.substring(7);
      let userId = 1; // Usuario por defecto para desarrollo

      if (token === 'test-token' || token.match(/^\d+$/)) {
        userId = token === 'test-token' ? 1 : parseInt(token);
      }

      const body = await request.json() as any;
      const {
        title,
        slug,
        excerpt,
        content,
        featured_image,
        category_id,
        tags,
        status,
        is_featured
      } = body;

      if (!title || !excerpt || !content) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Título, extracto y contenido son requeridos'
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        });
      }

      // Generar slug si no se proporciona
      const articleSlug = slug || title.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      const result = await createNewsArticle(env, {
        title,
        slug: articleSlug,
        excerpt,
        content,
        featured_image,
        author_id: userId,
        category_id,
        tags,
        status,
        is_featured
      });

      if (!result.success) {
        return new Response(JSON.stringify({
          success: false,
          error: result.error
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        });
      }

      return new Response(JSON.stringify({
        success: true,
        data: result.data,
        message: 'Artículo creado exitosamente'
      }), {
        status: 201,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    return new Response('Method not allowed', {
      status: 405,
      headers: corsHeaders,
    });

  } catch (error) {
    console.error('Error en handleNoticias:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error interno del servidor'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
}

/**
 * Handler para /api/noticias/:slug
 */
export async function handleNoticiaBySlug(request: Request, env: Env): Promise<Response> {
  const method = request.method;
  
  try {
    // Extraer slug de la URL
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const slug = pathParts[3]; // /api/noticias/:slug

    if (!slug) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Slug requerido'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    // GET /api/noticias/:slug - Obtener artículo por slug
    if (method === 'GET') {
      const result = await getNewsArticleBySlug(env, slug, true); // Incrementar vistas

      if (!result.success) {
        return new Response(JSON.stringify({
          success: false,
          error: result.error
        }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        });
      }

      return new Response(JSON.stringify({
        success: true,
        data: result.data
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    // PUT /api/noticias/:slug - Actualizar artículo
    if (method === 'PUT') {
      // Verificar autenticación
      const authHeader = request.headers.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Token de autorización requerido'
        }), {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        });
      }

      // Obtener artículo actual
      const currentArticle = await getNewsArticleBySlug(env, slug);
      if (!currentArticle.success || !currentArticle.data) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Artículo no encontrado'
        }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        });
      }

      // TODO: Verificar permisos (autor o admin)

      const updates = await request.json() as any;
      const result = await updateNewsArticle(env, currentArticle.data.id, updates);

      if (!result.success) {
        return new Response(JSON.stringify({
          success: false,
          error: result.error
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        });
      }

      return new Response(JSON.stringify({
        success: true,
        data: result.data,
        message: 'Artículo actualizado exitosamente'
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    // DELETE /api/noticias/:slug - Eliminar artículo
    if (method === 'DELETE') {
      // Verificar autenticación y permisos de admin
      const authHeader = request.headers.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Token de autorización requerido'
        }), {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        });
      }

      // Obtener artículo
      const currentArticle = await getNewsArticleBySlug(env, slug);
      if (!currentArticle.success || !currentArticle.data) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Artículo no encontrado'
        }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        });
      }

      const result = await deleteNewsArticle(env, currentArticle.data.id);

      if (!result.success) {
        return new Response(JSON.stringify({
          success: false,
          error: result.error
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        });
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'Artículo eliminado exitosamente'
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    return new Response('Method not allowed', {
      status: 405,
      headers: corsHeaders,
    });

  } catch (error) {
    console.error('Error en handleNoticiaBySlug:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error interno del servidor'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
}

/**
 * Handler para /api/noticias/categorias
 */
export async function handleNoticiaCategorias(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'GET') {
    return new Response('Method not allowed', {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    const result = await getNewsCategories(env);

    if (!result.success) {
      return new Response(JSON.stringify({
        success: false,
        error: result.error
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      data: result.data
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error) {
    console.error('Error en handleNoticiaCategorias:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error interno del servidor'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
}

/**
 * Handler para /api/noticias/tags
 */
export async function handleNoticiaTags(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'GET') {
    return new Response('Method not allowed', {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '20');

    const result = await getPopularTags(env, limit);

    if (!result.success) {
      return new Response(JSON.stringify({
        success: false,
        error: result.error
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      data: result.data
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error) {
    console.error('Error en handleNoticiaTags:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error interno del servidor'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
}