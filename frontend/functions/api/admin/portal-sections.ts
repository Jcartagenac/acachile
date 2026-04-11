import { requireAdmin, authErrorResponse, errorResponse, jsonResponse } from './_middleware';
import type { Env } from '../../types';
import { getPortalSections, savePortalSections } from '../_utils/portal';
import type { PortalSectionContent } from '../../../../shared/portalSections';

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;

  try {
    try {
      await requireAdmin(request, env);
    } catch (error) {
      return authErrorResponse(error, env);
    }

    const sections = await getPortalSections(env);
    return jsonResponse({ success: true, sections });
  } catch (error) {
    console.error('[ADMIN/PORTAL] GET Error:', error);
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

    const body = await request.json().catch(() => ({}));
    const incoming = Array.isArray(body?.sections) ? (body.sections as PortalSectionContent[]) : [];

    if (incoming.some((section) => !section?.title?.trim() || !section?.description?.trim())) {
      return errorResponse('Cada sección debe tener título y descripción', 400);
    }

    const sections = await savePortalSections(env, incoming);
    return jsonResponse({ success: true, sections });
  } catch (error) {
    console.error('[ADMIN/PORTAL] POST Error:', error);
    return errorResponse(
      'Internal server error',
      500,
      env.ENVIRONMENT === 'development'
        ? { message: error instanceof Error ? error.message : String(error) }
        : undefined,
    );
  }
}
