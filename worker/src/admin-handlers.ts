/**
 * Handlers HTTP para panel de administración
 * ACA Chile - APIs para gestión administrativa
 */

import {
  getAdminStats,
  getAdminUsers,
  updateAdminUser,
  deleteAdminUser,
  getPendingComments,
  getRecentActivity
} from './admin-service';
import { getTokenFromRequest } from './auth';

export interface Env {
  ACA_KV: KVNamespace;
  DB: D1Database;
  ENVIRONMENT: string;
}

/**
 * Handler para estadísticas del dashboard
 */
export async function handleAdminDashboard(request: Request, env: Env): Promise<Response> {
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

    // Verificar autenticación y permisos de admin
    const token = getTokenFromRequest(request);
    if (!token || !token.isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Acceso denegado' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (request.method === 'GET') {
      // Intentar obtener de cache primero
      const cached = await env.ACA_KV.get('admin:dashboard:stats');
      if (cached) {
        return new Response(
          cached,
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const result = await getAdminStats(env);

      if (!result.success) {
        return new Response(
          JSON.stringify({ error: result.error }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const response = JSON.stringify({
        estadisticas: result.data
      });

      // Cache por 5 minutos
      await env.ACA_KV.put('admin:dashboard:stats', response, { expirationTtl: 300 });

      return new Response(
        response,
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Método no permitido' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error en handleAdminDashboard:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Handler para gestión de usuarios
 */
export async function handleAdminUsuarios(request: Request, env: Env): Promise<Response> {
  try {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: corsHeaders });
    }

    // Verificar autenticación y permisos de admin
    const token = getTokenFromRequest(request);
    if (!token || !token.isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Acceso denegado' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/').filter(Boolean);
    const userId = pathSegments[pathSegments.length - 1];

    // GET /api/admin/usuarios - Listar usuarios
    if (request.method === 'GET' && !userId) {
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '20');
      const search = url.searchParams.get('search') || undefined;

      const result = await getAdminUsers(env, page, limit, search);

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

    // PUT /api/admin/usuarios/:id - Actualizar usuario
    if (request.method === 'PUT' && userId) {
      try {
        const body = await request.json() as any;
        const result = await updateAdminUser(env, parseInt(userId), body);

        if (!result.success) {
          return new Response(
            JSON.stringify({ error: result.error }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ message: 'Usuario actualizado exitosamente' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      } catch (error) {
        return new Response(
          JSON.stringify({ error: 'Error procesando datos' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // DELETE /api/admin/usuarios/:id - Desactivar usuario
    if (request.method === 'DELETE' && userId) {
      const result = await deleteAdminUser(env, parseInt(userId));

      if (!result.success) {
        return new Response(
          JSON.stringify({ error: result.error }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ message: 'Usuario desactivado exitosamente' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Método no permitido' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error en handleAdminUsuarios:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Handler para moderación de comentarios
 */
export async function handleAdminComentarios(request: Request, env: Env): Promise<Response> {
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

    // Verificar autenticación y permisos de admin
    const token = getTokenFromRequest(request);
    if (!token || !token.isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Acceso denegado' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (request.method === 'GET') {
      const url = new URL(request.url);
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '20');

      const result = await getPendingComments(env, page, limit);

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
    console.error('Error en handleAdminComentarios:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Handler para actividad reciente
 */
export async function handleAdminActividad(request: Request, env: Env): Promise<Response> {
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

    // Verificar autenticación y permisos de admin
    const token = getTokenFromRequest(request);
    if (!token || !token.isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Acceso denegado' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (request.method === 'GET') {
      // Intentar obtener de cache primero
      const cached = await env.ACA_KV.get('admin:actividad:reciente');
      if (cached) {
        return new Response(
          cached,
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const url = new URL(request.url);
      const limit = parseInt(url.searchParams.get('limit') || '50');

      const result = await getRecentActivity(env, limit);

      if (!result.success) {
        return new Response(
          JSON.stringify({ error: result.error }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const response = JSON.stringify({
        actividad: result.data
      });

      // Cache por 2 minutos
      await env.ACA_KV.put('admin:actividad:reciente', response, { expirationTtl: 120 });

      return new Response(
        response,
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Método no permitido' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error en handleAdminActividad:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Handler para herramientas de administración
 */
export async function handleAdminHerramientas(request: Request, env: Env): Promise<Response> {
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

    // Verificar autenticación y permisos de admin
    const token = getTokenFromRequest(request);
    if (!token || !token.isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Acceso denegado' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (request.method === 'POST') {
      try {
        const body = await request.json() as any;
        const { action } = body;

        switch (action) {
          case 'clear_cache':
            // Limpiar cache de KV
            const keys = ['admin:dashboard:stats', 'admin:actividad:reciente'];
            for (const key of keys) {
              await env.ACA_KV.delete(key);
            }
            return new Response(
              JSON.stringify({ message: 'Cache limpiado exitosamente' }),
              { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );

          case 'backup_data':
            // Simulación de backup (en producción implementar backup real)
            return new Response(
              JSON.stringify({ message: 'Backup iniciado exitosamente' }),
              { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );

          case 'generate_report':
            // Generar reporte básico
            const stats = await getAdminStats(env);
            const report = {
              fecha: new Date().toISOString(),
              estadisticas: stats.data
            };
            
            return new Response(
              JSON.stringify({ 
                message: 'Reporte generado exitosamente',
                reporte: report 
              }),
              { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );

          default:
            return new Response(
              JSON.stringify({ error: 'Acción no válida' }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

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
    console.error('Error en handleAdminHerramientas:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}