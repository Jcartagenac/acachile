import { requireAdmin, authErrorResponse, errorResponse, jsonResponse } from './_middleware';
import type { Env } from '../../types';
import { createPortalDocument, getPortalDocuments } from '../_utils/portalDocuments';

const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'application/zip',
  'application/x-zip-compressed',
];
const MAX_FILE_SIZE = 50 * 1024 * 1024;

const sanitizeFileName = (value: string) => value.replace(/[^a-zA-Z0-9._-]/g, '_');

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;
  try {
    try {
      await requireAdmin(request, env);
    } catch (error) {
      return authErrorResponse(error, env);
    }

    const documents = await getPortalDocuments(env);
    return jsonResponse({ success: true, documents });
  } catch (error) {
    console.error('[ADMIN/PORTAL-DOCUMENTS] GET Error:', error);
    return errorResponse('Internal server error', 500);
  }
}

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
    const visibleNameRaw = (formData.get('visibleName') || '').toString().trim();

    if (!file || !(file instanceof File)) {
      return errorResponse('Debes adjuntar un archivo', 400);
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return errorResponse('Formato de archivo no permitido', 400);
    }
    if (file.size > MAX_FILE_SIZE) {
      return errorResponse('Archivo demasiado grande', 400);
    }

    const safeOriginal = sanitizeFileName(file.name || `archivo-${Date.now()}`);
    const key = `portal/documentos/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeOriginal}`;

    const arrayBuffer = await file.arrayBuffer();
    await env.IMAGES.put(key, arrayBuffer, {
      httpMetadata: {
        contentType: file.type,
        contentDisposition: `inline; filename="${safeOriginal}"`,
        cacheControl: 'public, max-age=31536000',
      },
      customMetadata: {
        section: 'portal-documentos',
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
      },
    });

    const publicUrl = (env.R2_PUBLIC_URL || 'https://images.acachile.com').replace(/\/$/, '');
    const url = `${publicUrl}/${key}`;

    const existing = await getPortalDocuments(env);
    const document = await createPortalDocument(env, {
      file_name: file.name,
      visible_name: visibleNameRaw || file.name,
      file_url: url,
      file_key: key,
      file_type: file.type,
      file_size: file.size,
      sort_order: existing.length,
    });

    return jsonResponse({ success: true, document });
  } catch (error) {
    console.error('[ADMIN/PORTAL-DOCUMENTS] POST Error:', error);
    return errorResponse(
      'Internal server error',
      500,
      env.ENVIRONMENT === 'development'
        ? { message: error instanceof Error ? error.message : String(error) }
        : undefined,
    );
  }
}
