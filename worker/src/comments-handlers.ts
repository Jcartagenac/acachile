/**
 * Handlers HTTP para comentarios y interacciones
 * ACA Chile - API endpoints para comentarios y likes
 */

import { 
  createComment,
  getArticleComments,
  moderateComment,
  deleteComment,
  toggleArticleLike,
  getArticleLikes
} from './comments-service';
import { getTokenFromRequest } from './auth';

export interface Env {
  ACA_KV: KVNamespace;
  DB: D1Database;
  ENVIRONMENT: string;
}

/**
 * Handler principal para comentarios
 */
export async function handleComentarios(request: Request, env: Env): Promise<Response> {
  try {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: corsHeaders });
    }

    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/').filter(Boolean);

    // GET /api/comentarios?article_id=123
    if (request.method === 'GET') {
      const articleId = url.searchParams.get('article_id');
      
      if (!articleId) {
        return new Response(
          JSON.stringify({ error: 'article_id es requerido' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const result = await getArticleComments(env, parseInt(articleId));

      if (!result.success) {
        return new Response(
          JSON.stringify({ error: result.error }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ comentarios: result.data }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST /api/comentarios - Crear comentario
    if (request.method === 'POST') {
      try {
        const body = await request.json() as any;
        const { article_id, author_name, author_email, content, parent_id } = body;

        if (!article_id || !author_name || !author_email || !content) {
          return new Response(
            JSON.stringify({ error: 'Todos los campos son requeridos' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const result = await createComment(env, {
          article_id: parseInt(article_id),
          author_name,
          author_email,
          content,
          parent_id: parent_id ? parseInt(parent_id) : undefined
        });

        if (!result.success) {
          return new Response(
            JSON.stringify({ error: result.error }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ comentario: result.data }),
          { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      } catch (error) {
        return new Response(
          JSON.stringify({ error: 'Error procesando datos' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({ error: 'Método no permitido' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error en handleComentarios:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Handler para moderación de comentarios (admin)
 */
export async function handleModerarComentarios(request: Request, env: Env): Promise<Response> {
  try {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: corsHeaders });
    }

    // Verificar autenticación y permisos
    const token = getTokenFromRequest(request);
    if (!token || !token.isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Acceso denegado' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/').filter(Boolean);
    const commentId = pathSegments[pathSegments.length - 1];

    if (!commentId) {
      return new Response(
        JSON.stringify({ error: 'ID de comentario requerido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // PUT /api/admin/comentarios/:id - Moderar
    if (request.method === 'PUT') {
      try {
        const body = await request.json() as any;
        const { status } = body;

        if (!status || !['approved', 'rejected', 'spam'].includes(status)) {
          return new Response(
            JSON.stringify({ error: 'Status inválido' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const result = await moderateComment(env, parseInt(commentId), status);

        if (!result.success) {
          return new Response(
            JSON.stringify({ error: result.error }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ message: 'Comentario moderado exitosamente' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      } catch (error) {
        return new Response(
          JSON.stringify({ error: 'Error procesando datos' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // DELETE /api/admin/comentarios/:id - Eliminar
    if (request.method === 'DELETE') {
      const result = await deleteComment(env, parseInt(commentId));

      if (!result.success) {
        return new Response(
          JSON.stringify({ error: result.error }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ message: 'Comentario eliminado exitosamente' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Método no permitido' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error en handleModerarComentarios:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Handler para likes/reacciones
 */
export async function handleLikes(request: Request, env: Env): Promise<Response> {
  try {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: corsHeaders });
    }

    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/').filter(Boolean);
    
    // Extraer article_id del path: /api/likes/123
    const articleId = pathSegments[pathSegments.length - 1];

    if (!articleId) {
      return new Response(
        JSON.stringify({ error: 'article_id es requerido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Obtener identificador del usuario (IP por defecto)
    const userIdentifier = request.headers.get('CF-Connecting-IP') || 
                          request.headers.get('X-Forwarded-For') || 
                          'anonymous';

    // GET /api/likes/123 - Obtener estado de likes
    if (request.method === 'GET') {
      const result = await getArticleLikes(env, parseInt(articleId), userIdentifier);

      if (!result.success) {
        return new Response(
          JSON.stringify({ error: result.error }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify(result.data),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST /api/likes/123 - Toggle like
    if (request.method === 'POST') {
      const result = await toggleArticleLike(env, parseInt(articleId), userIdentifier);

      if (!result.success) {
        return new Response(
          JSON.stringify({ error: result.error }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify(result.data),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Método no permitido' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error en handleLikes:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Handler para compartir artículos (estadísticas)
 */
export async function handleCompartir(request: Request, env: Env): Promise<Response> {
  try {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: corsHeaders });
    }

    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/').filter(Boolean);
    
    // POST /api/compartir/123
    const articleId = pathSegments[pathSegments.length - 1];

    if (!articleId || request.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Método no permitido o article_id faltante' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    try {
      const body = await request.json() as any;
      const { platform } = body; // 'facebook', 'twitter', 'whatsapp', 'email', etc.

      // Incrementar contador de compartidos en KV
      const shareKey = `article:${articleId}:shares`;
      const platformKey = `article:${articleId}:shares:${platform || 'unknown'}`;
      
      // Total general
      const currentShares = await env.ACA_KV.get(shareKey);
      const totalShares = currentShares ? parseInt(currentShares) + 1 : 1;
      await env.ACA_KV.put(shareKey, totalShares.toString(), { expirationTtl: 86400 * 30 });

      // Por plataforma
      const currentPlatformShares = await env.ACA_KV.get(platformKey);
      const platformShares = currentPlatformShares ? parseInt(currentPlatformShares) + 1 : 1;
      await env.ACA_KV.put(platformKey, platformShares.toString(), { expirationTtl: 86400 * 30 });

      return new Response(
        JSON.stringify({ 
          message: 'Compartido registrado',
          totalShares,
          platform: platform || 'unknown'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Error procesando datos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error en handleCompartir:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}