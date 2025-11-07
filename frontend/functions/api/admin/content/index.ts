import { requireAdmin, authErrorResponse, errorResponse, jsonResponse } from '../_middleware';
import type { Env } from '../../../types';
import { 
  parsePageParam, 
  getSectionsForPage, 
  normalizeSections, 
  cacheKeyFor, 
  ensureTable,
  type RawSection 
} from '../../_utils/content';

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;

  try {
    try {
      await requireAdmin(request, env);
    } catch (error) {
      return authErrorResponse(error, env);
    }

    const page = parsePageParam(new URL(request.url).searchParams.get('page'));
    console.log('[CONTENT GET] Fetching sections for page:', page);
    const sections = await getSectionsForPage(env, page);
    console.log('[CONTENT GET] Sections returned:', JSON.stringify(sections, null, 2));

    return jsonResponse({ success: true, sections });
  } catch (error) {
    console.error('[CONTENT GET] Error:', error);
    return jsonResponse({ success: false, error: 'Internal server error' }, 500);
  }
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;

  try {
    const page = parsePageParam(new URL(request.url).searchParams.get('page'));
    const cacheKey = cacheKeyFor(page);

    console.log('[CONTENT POST] Starting save operation for page:', page);

    let adminUser;
    try {
      adminUser = await requireAdmin(request, env);
      console.log('[CONTENT POST] Auth successful, user role:', adminUser.role);
    } catch (err) {
      console.error('[CONTENT POST] Auth failed:', err);
      return authErrorResponse(err, env);
    }

    const body = await request.json().catch(() => ({}));
    console.log('[CONTENT POST] Raw request body:', JSON.stringify(body, null, 2));

    const incoming = Array.isArray(body?.sections) ? (body.sections as RawSection[]) : [];
    console.log('[CONTENT POST] Incoming sections count:', incoming.length);

    // NO usar defaults al guardar - solo normalizar y guardar lo que viene
    const normalized = normalizeSections(incoming, page, false).map((section, index) => ({
      ...section,
      sort_order: typeof section.sort_order === 'number' ? section.sort_order : index
    }));

    console.log('[CONTENT POST] Normalized sections:', JSON.stringify(normalized, null, 2));

    if (env.DB) {
      console.log('[CONTENT POST] DB available, ensuring table exists');
      await ensureTable(env.DB);

      const keys = normalized.map((section) => section.key);
      console.log('[CONTENT POST] Section keys to save:', keys);

      for (const section of normalized) {
        console.log('[CONTENT POST] Saving section:', section.key, 'with data:', JSON.stringify(section, null, 2));
        const result = await env.DB
          .prepare(
            `
              INSERT INTO site_sections (page, key, title, image_url, content, sort_order, source_type, source_id, cta_label, cta_url, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
              ON CONFLICT(page, key) DO UPDATE SET
                title=excluded.title,
                image_url=excluded.image_url,
                content=excluded.content,
                sort_order=excluded.sort_order,
                source_type=excluded.source_type,
                source_id=excluded.source_id,
                cta_label=excluded.cta_label,
                cta_url=excluded.cta_url,
                updated_at=datetime('now')
            `
          )
          .bind(
            section.page,
            section.key,
            section.title,
            section.image_url,
            section.content,
            section.sort_order,
            section.source_type ?? 'custom',
            section.source_id ?? null,
            section.cta_label ?? null,
            section.cta_url ?? null
          )
          .run();

        console.log('[CONTENT POST] DB insert/update result for', section.key, ':', result);
      }

      if (keys.length > 0) {
        const placeholders = keys.map(() => '?').join(', ');
        console.log('[CONTENT POST] Deleting old sections not in keys:', keys);
        const deleteResult = await env.DB
          .prepare(`DELETE FROM site_sections WHERE page = ? AND key NOT IN (${placeholders})`)
          .bind(page, ...keys)
          .run();
        console.log('[CONTENT POST] Delete result:', deleteResult);
      } else {
        console.log('[CONTENT POST] No keys, deleting all sections for page');
        const deleteResult = await env.DB.prepare('DELETE FROM site_sections WHERE page = ?').bind(page).run();
        console.log('[CONTENT POST] Delete all result:', deleteResult);
      }

      // Verify what was saved
      const verifyResult = await env.DB
        .prepare('SELECT page, key, title, content FROM site_sections WHERE page = ? ORDER BY sort_order ASC')
        .bind(page)
        .all();
      console.log('[CONTENT POST] Verification - sections in DB after save:', JSON.stringify(verifyResult.results, null, 2));
    } else {
      console.warn('[CONTENT POST] No DB configured, skipping database operations');
    }

    if (env.ACA_KV) {
      console.log('[CONTENT POST] Saving to KV cache with key:', cacheKey);
      await env.ACA_KV.put(cacheKey, JSON.stringify(normalized));
      console.log('[CONTENT POST] KV cache saved successfully');
    } else {
      console.warn('[CONTENT POST] No ACA_KV configured, skipping cache');
    }

    console.log('[CONTENT POST] Save operation completed successfully');
    return jsonResponse({ success: true, sections: normalized });
  } catch (error) {
    console.error('[CONTENT POST] Error:', error);
    console.error('[CONTENT POST] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return errorResponse(
      'Internal server error',
      500,
      { 
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      }
    );
  }
}
