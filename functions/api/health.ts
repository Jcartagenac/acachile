import type { PagesFunction, Env } from '../types';
import { jsonResponse } from '../_middleware';

/**
 * Health check endpoint
 * Valida que la API de Pages Functions está funcionando
 */

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env } = context;
  
  try {
    console.log('[HEALTH] Health check requested');
    
    // Verificar conexiones básicas
    const checks = {
      timestamp: new Date().toISOString(),
      environment: env.ENVIRONMENT || 'unknown',
      database: false,
      kv: false
    };

    // Test básico de base de datos
    try {
      const dbTest = await env.DB.prepare('SELECT 1 as test').first();
      checks.database = dbTest?.test === 1;
    } catch (error) {
      console.error('[HEALTH] Database check failed:', error);
      checks.database = false;
    }

    // Test básico de KV
    try {
      await env.ACA_KV.put('health-check', Date.now().toString(), { expirationTtl: 60 });
      const kvTest = await env.ACA_KV.get('health-check');
      checks.kv = !!kvTest;
    } catch (error) {
      console.error('[HEALTH] KV check failed:', error);
      checks.kv = false;
    }

    const allHealthy = checks.database && checks.kv;
    const status = allHealthy ? 200 : 503;

    console.log('[HEALTH] Health check completed:', checks);

    return jsonResponse({
      success: allHealthy,
      message: allHealthy ? 'API is healthy' : 'API has issues',
      data: checks
    }, status);

  } catch (error) {
    console.error('[HEALTH] Health check error:', error);
    
    return jsonResponse({
      success: false,
      message: 'Health check failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
};