import { requireAdmin, authErrorResponse, errorResponse, jsonResponse } from '../_middleware';

// Admin-only upload to R2 for homepage images
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 6 * 1024 * 1024; // 6MB
const ALLOWED_FOLDERS = ['home', 'eventos', 'noticias', 'avatars', 'gallery', 'content'];

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    // Auth
    let adminUser;
    try {
      adminUser = await requireAdmin(request, env);
    } catch (err) {
      return authErrorResponse(err, env);
    }

    if (!env.IMAGES) {
      return errorResponse('R2 binding no configurado', 500);
    }

    const formData = await request.formData();
    const file = formData.get('file');
    const folder = (formData.get('folder') || 'home').toString();
    const filenameRaw = formData.get('filename') || '';

    if (!file || !(file instanceof File)) {
      return errorResponse('Campo file es requerido (FormData:file)', 400);
    }

    if (!ALLOWED_FOLDERS.includes(folder)) {
      return errorResponse('Carpeta no permitida', 400);
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return errorResponse('Tipo de archivo no permitido', 400);
    }

    if (file.size > MAX_FILE_SIZE) {
      return errorResponse('Archivo demasiado grande', 400);
    }

    // Build filename
    const safeName = (filenameRaw && filenameRaw.toString().replace(/[^a-zA-Z0-9-_.]/g, '_')) || `img-${Date.now()}-${Math.random().toString(36).slice(2,8)}.jpg`;
    const key = `${folder}/${safeName}`;

    // Upload to R2 binding
    const arrayBuffer = await file.arrayBuffer();
    await env.IMAGES.put(key, arrayBuffer, {
      httpMetadata: { contentType: file.type, cacheControl: 'public, max-age=31536000' },
      customMetadata: { uploadedBy: adminUser.userId?.toString?.() || String(adminUser.userId || adminUser.email), uploadedAt: new Date().toISOString() }
    });

    // Get R2 public URL from environment variable or use default
    // In production, R2_PUBLIC_URL should be configured in Cloudflare Pages Dashboard
    const publicUrl = (env.R2_PUBLIC_URL || 'https://images.beta.acachile.com').replace(/\/$/, '');
    const url = publicUrl ? `${publicUrl}/${key}` : key;

    return jsonResponse({ success: true, url, key });
  } catch (error) {
    console.error('[ADMIN/CONTENT/UPLOAD] Error:', error);
    return errorResponse('Internal server error', 500, env.ENVIRONMENT === 'development' ? { details: error instanceof Error ? error.message : String(error) } : undefined);
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' } });

}
