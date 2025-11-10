/**
 * Script de migración para sincronizar current_participants desde KV a D1
 * GET /api/admin/sync-participants
 * 
 * Este script:
 * 1. Lee todas las inscripciones desde KV
 * 2. Cuenta inscripciones por evento
 * 3. Actualiza current_participants en D1
 */

import { requireAdmin } from '../_middleware';

export async function onRequestGet(context) {
  const { request, env } = context;

  try {
    // Verificar que el usuario es admin
    try {
      await requireAdmin(request, env);
    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Requiere permisos de administrador'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Obtener todos los eventos de D1
    const eventosResult = await env.DB.prepare(
      'SELECT id FROM eventos'
    ).all();

    if (!eventosResult.success || !eventosResult.results) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Error obteniendo eventos de D1'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const eventos = eventosResult.results;
    const updates = [];

    // Para cada evento, contar inscripciones en KV y actualizar D1
    for (const evento of eventos) {
      const eventoId = evento.id;
      
      // Obtener inscripciones del evento desde KV
      const inscripcionesData = await env.ACA_KV.get(`inscripciones:evento:${eventoId}`);
      const inscripciones = inscripcionesData ? JSON.parse(inscripcionesData) : [];
      const count = inscripciones.length;

      // Actualizar contador en D1
      try {
        await env.DB.prepare(
          'UPDATE eventos SET current_participants = ? WHERE id = ?'
        ).bind(count, eventoId).run();

        updates.push({
          eventoId,
          inscripciones: count,
          status: 'updated'
        });

        console.log(`[sync-participants] Evento ${eventoId}: ${count} inscripciones`);
      } catch (error) {
        updates.push({
          eventoId,
          inscripciones: count,
          status: 'error',
          error: error.message
        });
        console.error(`[sync-participants] Error updating evento ${eventoId}:`, error);
      }
    }

    // Invalidar caché de eventos
    const cacheKeys = [
      'eventos:list:published:all:none:1:12',
      'eventos:list:draft:all:none:1:12',
      'eventos:list:all:all:none:1:12'
    ];
    for (const key of cacheKeys) {
      await env.ACA_KV.delete(key);
    }
    console.log('[sync-participants] Invalidated eventos cache');

    return new Response(JSON.stringify({
      success: true,
      message: `Sincronizados ${updates.length} eventos`,
      updates
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[sync-participants] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error sincronizando participantes',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
