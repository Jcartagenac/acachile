import { requireAuth, errorResponse, jsonResponse } from '../../../_middleware';
import type { Env } from '../../../types';
import { DEFAULT_SITE_SECTIONS, SECTION_CACHE_KEY, SiteSection } from '../../../../../shared/siteSections';

type RawSection = Partial<SiteSection> & Record<string, unknown>;

async function ensureTable(db: D1Database) {
  await db
    .prepare(`
      CREATE TABLE IF NOT EXISTS site_sections (
        key TEXT PRIMARY KEY,
        title TEXT,
        image_url TEXT,
        content TEXT,
        sort_order INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `)
    .run();
}

function coerceNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = parseInt(value, 10);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  return fallback;
}

function normalizeSections(rawSections: RawSection[] | undefined): SiteSection[] {
  const defaults = new Map(DEFAULT_SITE_SECTIONS.map((section) => [section.key, section]));
  const collected = new Map<string, SiteSection>();

  (rawSections || []).forEach((raw, index) => {
    const tentativeKey =
      typeof raw?.key === 'string' && raw.key.trim().length > 0
        ? raw.key.trim()
        : DEFAULT_SITE_SECTIONS[index]?.key ?? `section_${index}`;

    const fallback = defaults.get(tentativeKey);
    const sortOrder = coerceNumber(raw?.sort_order, fallback?.sort_order ?? index);

    const normalized: SiteSection = {
      key: tentativeKey,
      title:
        typeof raw?.title === 'string' && raw.title.trim().length > 0
          ? raw.title.trim()
          : fallback?.title ?? '',
      content: typeof raw?.content === 'string' ? raw.content : fallback?.content ?? '',
      image_url:
        typeof raw?.image_url === 'string' && raw.image_url.trim().length > 0
          ? raw.image_url.trim()
          : fallback?.image_url ?? '',
      sort_order: sortOrder
    };

    collected.set(normalized.key, normalized);
    defaults.delete(normalized.key);
  });

  for (const remaining of defaults.values()) {
    collected.set(remaining.key, remaining);
  }

  return Array.from(collected.values()).sort((a, b) => a.sort_order - b.sort_order);
}

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { env } = context;

  try {
    let sections: SiteSection[] = [];

    if (env.DB) {
      await ensureTable(env.DB);
      const res = await env.DB.prepare<SiteSection>('SELECT key, title, image_url, content, sort_order FROM site_sections ORDER BY sort_order ASC').all();
      if (res.results && res.results.length > 0) {
        sections = normalizeSections(res.results);
        if (env.ACA_KV) {
          await env.ACA_KV.put(SECTION_CACHE_KEY, JSON.stringify(sections));
        }
      }
    }

    if ((!sections || sections.length === 0) && env.ACA_KV) {
      const cached = await env.ACA_KV.get(SECTION_CACHE_KEY);
      if (cached) {
        try {
          const parsed = JSON.parse(cached) as RawSection[];
          sections = normalizeSections(parsed);
        } catch (error) {
          console.warn('[CONTENT GET] Failed to parse KV cache, using defaults', error);
        }
      }
    }

    if (!sections || sections.length === 0) {
      sections = DEFAULT_SITE_SECTIONS;
      if (env.ACA_KV) {
        await env.ACA_KV.put(SECTION_CACHE_KEY, JSON.stringify(sections));
      }
    }

    return jsonResponse({ success: true, sections });
  } catch (error) {
    console.error('[CONTENT GET] Error:', error);
    return jsonResponse({ success: false, error: 'Internal server error' }, 500);
  }
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;

  try {
    let authUser;
    try {
      authUser = await requireAuth(request, env);
    } catch (err) {
      return errorResponse(
        err instanceof Error ? err.message : 'Token inválido',
        401,
        env.ENVIRONMENT === 'development' ? { details: err } : undefined
      );
    }

    if (authUser.role !== 'admin' && authUser.role !== 'super_admin') {
      return errorResponse('Acceso denegado. Se requieren permisos de administrador.', 403);
    }

    const body = await request.json().catch(() => ({}));
    const incoming = Array.isArray(body?.sections) ? (body.sections as RawSection[]) : [];
    const normalized = normalizeSections(incoming);

    if (env.DB) {
      await ensureTable(env.DB);

      const keys = normalized.map((section) => section.key);

      for (const section of normalized) {
        await env.DB.prepare(
          `
            INSERT INTO site_sections (key, title, image_url, content, sort_order, updated_at)
            VALUES (?, ?, ?, ?, ?, datetime('now'))
            ON CONFLICT(key) DO UPDATE SET
              title=excluded.title,
              image_url=excluded.image_url,
              content=excluded.content,
              sort_order=excluded.sort_order,
              updated_at=datetime('now')
          `
        )
          .bind(section.key, section.title, section.image_url, section.content, section.sort_order)
          .run();
      }

      if (keys.length > 0) {
        const placeholders = keys.map(() => '?').join(', ');
        await env.DB.prepare(`DELETE FROM site_sections WHERE key NOT IN (${placeholders})`).bind(...keys).run();
      } else {
        await env.DB.prepare('DELETE FROM site_sections').run();
      }
    }

    if (env.ACA_KV) {
      await env.ACA_KV.put(SECTION_CACHE_KEY, JSON.stringify(normalized));
    }

    return jsonResponse({ success: true, sections: normalized });
  } catch (error) {
    console.error('[CONTENT POST] Error:', error);
    return errorResponse(
      'Internal server error',
      500,
      env.ENVIRONMENT === 'development' ? { details: error instanceof Error ? error.message : error } : undefined
    );
  }
}
