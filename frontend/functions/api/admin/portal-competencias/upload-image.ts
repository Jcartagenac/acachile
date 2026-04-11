import { requireAdmin, authErrorResponse, errorResponse, jsonResponse } from '../_middleware';
import type { Env } from '../../types';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 15 * 1024 * 1024;
const ALLOWED_KINDS = new Set(['team-main', 'member', 'gallery']);

const sanitize = (value: string) => value.replace(/[^a-zA-Z0-9._-]/g, '_');

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;
  try {
    try {
      await requireAdmin(request, env);
    } catch (error) {
      return authErrorResponse(error, env);
    }

    if (!env.IMAGES) return errorResponse('R2 binding no configurado', 500);

    const formData = await request.formData();
    const file = formData.get('file');
    const kind = String(formData.get('kind') || 'gallery');

    if (!ALLOWED_KINDS.has(kind)) return errorResponse('Tipo de imagen inválido', 400);
    if (!file || !(file instanceof File)) return errorResponse('Debes adjuntar una imagen', 400);
    if (!ALLOWED_TYPES.includes(file.type)) return errorResponse('Formato no permitido', 400);
    if (file.size > MAX_FILE_SIZE) return errorResponse('Imagen demasiado grande', 400);

    const safeName = sanitize(file.name || `imagen-${Date.now()}.jpg`);
    const key = `portal/competencias/${kind}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;
    const arrayBuffer = await file.arrayBuffer();

    await env.IMAGES.put(key, arrayBuffer, {
      httpMetadata: {
        contentType: file.type,
        contentDisposition: `inline; filename="${safeName}"`,
        cacheControl: 'public, max-age=31536000',
      },
      customMetadata: {
        section: 'portal-competencias',
        kind,
        originalName: file.name,
      },
    });

    const publicUrl = (env.R2_PUBLIC_URL || 'https://images.acachile.com').replace(/\/$/, '');
    return jsonResponse({
      success: true,
      image: {
        url: `${publicUrl}/${key}`,
        key,
        type: file.type,
        name: file.name,
        size: file.size,
      },
    });
  } catch (error) {
    console.error('[ADMIN/PORTAL-COMPETENCIAS/UPLOAD] Error:', error);
    return errorResponse('Internal server error', 500);
  }
}
