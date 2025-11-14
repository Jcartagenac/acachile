/**
 * Endpoint: /api/participantes
 * POST: Crear nuevo participante (público)
 * GET: Obtener todos los participantes (solo admin)
 */

import { requireAuth } from '../../_middleware';
import type { Participante } from '../_utils/participantes';

// Headers CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// OPTIONS - CORS preflight
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders
  });
}

// POST - Crear participante (público)
export async function onRequestPost(context: any) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const { nombre, apellido, rut, email, edad, telefono } = body;

    // Validación de campos obligatorios
    if (!nombre || !apellido || !rut || !email || !edad || !telefono) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Todos los campos son obligatorios'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Validación de edad
    const edadNum = parseInt(edad);
    if (isNaN(edadNum) || edadNum < 18 || edadNum > 120) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'La edad debe ser un número entre 18 y 120'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Validación de RUT formato básico (XX.XXX.XXX-X o XXXXXXXX-X)
    const rutLimpio = rut.replace(/\./g, '').replace(/-/g, '');
    if (rutLimpio.length < 8 || rutLimpio.length > 9) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Formato de RUT inválido'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Validación de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Email inválido'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Verificar si el RUT ya existe
    const existingStmt = env.DB.prepare(
      'SELECT id FROM participantes WHERE rut = ?'
    ).bind(rutLimpio);

    const existing = await existingStmt.first();

    if (existing) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Este RUT ya está registrado en el sorteo'
        }),
        {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Insertar participante
    const insertStmt = env.DB.prepare(`
      INSERT INTO participantes (nombre, apellido, rut, email, edad, telefono)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(nombre, apellido, rutLimpio, email, edadNum, telefono);

    const result = await insertStmt.run();

    return new Response(
      JSON.stringify({
        success: true,
        message: '¡Registro exitoso! Ya estás participando en el sorteo',
        participante: {
          id: result.meta.last_row_id,
          nombre,
          apellido,
          rut: rutLimpio,
          email,
          edad: edadNum,
          telefono
        }
      }),
      {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error: any) {
    console.error('[participantes] Error al crear participante:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Error al procesar el registro'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}

// GET - Obtener todos los participantes (solo admin)
export async function onRequestGet(context: any) {
  const { request, env } = context;

  try {
    // Verificar autenticación
    const authResult = await requireAuth(request, env);
    if (!authResult.success || !authResult.user) {
      return new Response(
        JSON.stringify({ success: false, error: 'No autorizado' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Verificar que sea admin
    if (authResult.user.role !== 'admin') {
      return new Response(
        JSON.stringify({ success: false, error: 'Acceso denegado' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Obtener todos los participantes ordenados por fecha de registro
    const stmt = env.DB.prepare(`
      SELECT id, nombre, apellido, rut, email, edad, telefono, created_at
      FROM participantes
      ORDER BY created_at DESC
    `);

    const result = await stmt.all();

    return new Response(
      JSON.stringify({
        success: true,
        participantes: result.results || []
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error: any) {
    console.error('[participantes] Error al obtener participantes:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Error al obtener participantes'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}
