/**
 * Handlers HTTP para sistema de búsqueda
 * ACA Chile - APIs de búsqueda y filtros
 */

import {
  searchGlobal,
  getSearchSuggestions,
  searchAdvanced
} from './search-service';
import { getTokenFromRequest } from './auth';

export interface Env {
  ACA_KV: KVNamespace;
  DB: D1Database;
  ENVIRONMENT: string;
}

/**
 * Handler para búsqueda global
 */
export async function handleBusqueda(request: Request, env: Env): Promise<Response> {
  try {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: corsHeaders });
    }

    if (request.method !== 'GET') {
      return new Response(
        JSON.stringify({ error: 'Método no permitido' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(request.url);
    const query = url.searchParams.get('q') || url.searchParams.get('query') || '';
    const type = url.searchParams.get('type') as 'eventos' | 'noticias' | 'usuarios' | 'all' || 'all';
    const dateFrom = url.searchParams.get('dateFrom') || undefined;
    const dateTo = url.searchParams.get('dateTo') || undefined;
    const category = url.searchParams.get('category') || undefined;
    const location = url.searchParams.get('location') || undefined;
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    if (!query.trim()) {
      return new Response(
        JSON.stringify({ error: 'Parámetro de búsqueda requerido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verificar permisos para búsqueda de usuarios
    if (type === 'usuarios' || type === 'all') {
      const token = getTokenFromRequest(request);
      if (!token || !token.isAdmin) {
        return new Response(
          JSON.stringify({ error: 'Acceso denegado para búsqueda de usuarios' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const filters = {
      type,
      dateFrom,
      dateTo,
      category,
      location,
      limit,
      offset
    };

    // Intentar obtener de cache primero
    const cacheKey = `search:${btoa(JSON.stringify({ query, filters })).slice(0, 50)}`;
    const cached = await env.ACA_KV.get(cacheKey);
    if (cached) {
      return new Response(
        cached,
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await searchGlobal(env, query, filters);

    if (!result.success) {
      return new Response(
        JSON.stringify({ error: result.error }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const response = JSON.stringify({
      query,
      resultados: result.data,
      total: result.totalResults,
      filters: filters
    });

    // Cache por 15 minutos
    await env.ACA_KV.put(cacheKey, response, { expirationTtl: 900 });

    return new Response(
      response,
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error en handleBusqueda:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Handler para sugerencias de búsqueda (autocompletar)
 */
export async function handleSugerencias(request: Request, env: Env): Promise<Response> {
  try {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: corsHeaders });
    }

    if (request.method !== 'GET') {
      return new Response(
        JSON.stringify({ error: 'Método no permitido' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(request.url);
    const query = url.searchParams.get('q') || '';
    const type = url.searchParams.get('type') as 'eventos' | 'noticias' || undefined;

    if (query.length < 2) {
      return new Response(
        JSON.stringify({ sugerencias: [] }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await getSearchSuggestions(env, query, type);

    if (!result.success) {
      return new Response(
        JSON.stringify({ error: result.error }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ sugerencias: result.data }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error en handleSugerencias:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Handler para búsqueda avanzada
 */
export async function handleBusquedaAvanzada(request: Request, env: Env): Promise<Response> {
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

    if (request.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Método no permitido' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    try {
      const body = await request.json() as any;
      const {
        query,
        tipo,
        fechaDesde,
        fechaHasta,
        categoria,
        ubicacion,
        estado,
        ordenarPor,
        orden,
        page,
        limit
      } = body;

      // Cache key para búsqueda avanzada
      const cacheKey = `search:advanced:${btoa(JSON.stringify(body)).slice(0, 50)}`;
      const cached = await env.ACA_KV.get(cacheKey);
      if (cached) {
        return new Response(
          cached,
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const result = await searchAdvanced(env, {
        query,
        tipo,
        fechaDesde,
        fechaHasta,
        categoria,
        ubicacion,
        estado,
        ordenarPor,
        orden,
        page,
        limit
      });

      if (!result.success) {
        return new Response(
          JSON.stringify({ error: result.error }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const response = JSON.stringify(result.data);

      // Cache por 10 minutos
      await env.ACA_KV.put(cacheKey, response, { expirationTtl: 600 });

      return new Response(
        response,
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Error procesando datos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error en handleBusquedaAvanzada:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Handler para búsquedas populares y tendencias
 */
export async function handleBusquedasPopulares(request: Request, env: Env): Promise<Response> {
  try {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: corsHeaders });
    }

    if (request.method !== 'GET') {
      return new Response(
        JSON.stringify({ error: 'Método no permitido' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Intentar obtener de cache primero
    const cached = await env.ACA_KV.get('search:populares');
    if (cached) {
      return new Response(
        cached,
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Simular búsquedas populares basadas en datos reales
    const eventosPopulares = await env.DB.prepare(`
      SELECT titulo, COUNT(*) as inscripciones
      FROM eventos e
      LEFT JOIN inscripciones i ON e.id = i.evento_id
      WHERE e.fecha_evento > date('now')
      GROUP BY e.id, e.titulo
      ORDER BY inscripciones DESC, e.fecha_evento ASC
      LIMIT 5
    `).all();

    const noticiasPopulares = await env.DB.prepare(`
      SELECT title, views
      FROM news_articles 
      WHERE status = 'published'
      ORDER BY views DESC, published_at DESC
      LIMIT 5
    `).all();

    const busquedasPopulares = {
      eventos: eventosPopulares.results.map((evento: any) => ({
        titulo: evento.titulo,
        popularidad: evento.inscripciones || 0
      })),
      noticias: noticiasPopulares.results.map((noticia: any) => ({
        titulo: noticia.title,
        vistas: noticia.views || 0
      })),
      terminos: [
        'asado',
        'parrilla',
        'evento',
        'concurso',
        'técnicas',
        'recetas',
        'carbón',
        'leña'
      ]
    };

    const response = JSON.stringify(busquedasPopulares);

    // Cache por 6 horas
    await env.ACA_KV.put('search:populares', response, { expirationTtl: 21600 });

    return new Response(
      response,
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error en handleBusquedasPopulares:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}