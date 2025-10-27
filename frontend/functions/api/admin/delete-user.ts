/**
 * Admin endpoint para eliminar un usuario
 * Solo accesible por administradores
 */

import type { PagesFunction, Env } from '../../types';
import { jsonResponse, errorResponse, requireAdmin, authErrorResponse } from './_middleware';

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  
  try {
    console.log('[ADMIN/DELETE-USER] Processing user deletion request');

    try {
      await requireAdmin(request, env);
    } catch (error) {
      return authErrorResponse(error, env);
    }
    
    const url = new URL(request.url);
    const email = url.searchParams.get('email');

    if (!email) {
      return errorResponse('Email es requerido', 400);
    }

    console.log('[ADMIN/DELETE-USER] Attempting to delete user:', email);

    // Verificar que el usuario existe
    const user = await env.DB.prepare(`
      SELECT id, email, nombre, apellido, role FROM usuarios WHERE email = ?
    `).bind(email.toLowerCase()).first();

    if (!user) {
      console.log('[ADMIN/DELETE-USER] User not found:', email);
      return errorResponse('Usuario no encontrado', 404);
    }

    console.log('[ADMIN/DELETE-USER] User found:', user.id);

    // Eliminar el usuario
    const result = await env.DB.prepare(`
      DELETE FROM usuarios WHERE email = ?
    `).bind(email.toLowerCase()).run();

    if (result.success) {
      console.log('[ADMIN/DELETE-USER] User deleted successfully:', email);
      return jsonResponse({
        success: true,
        message: 'Usuario eliminado exitosamente',
        data: {
          userId: user.id,
          email: user.email,
          nombre: user.nombre,
          apellido: user.apellido,
          role: user.role
        }
      });
    } else {
      console.error('[ADMIN/DELETE-USER] Database error deleting user');
      return errorResponse('Error eliminando usuario', 500);
    }

  } catch (error) {
    console.error('[ADMIN/DELETE-USER] Error:', error);
    return errorResponse('Error procesando solicitud', 500);
  }
};

// OPTIONS handler for CORS
export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
};
