import { requireAuth, errorResponse, jsonResponse } from '../../../_middleware';
import type { Env } from '../../../types';
import {
  SECTION_CACHE_KEY,
  SiteSection,
  SiteSectionSourceType,
  SitePageKey,
  getDefaultSections
} from '../../../../../shared/siteSections';

type RawSection = Partial<SiteSection> & Record<string, unknown>;

const DEFAULT_PAGE: SitePageKey = 'home';

const parsePage = (value: string | null): SitePageKey => {
  if (value === 'about' || value === 'contact') {
    return value;
  }
  return DEFAULT_PAGE;
};

const cacheKeyFor = (page: SitePageKey) => `${SECTION_CACHE_KEY}:${page}`;

async function ensureTable(db: D1Database) {
  await db
    .prepare(`
      CREATE TABLE IF NOT EXISTS site_sections (
        page TEXT NOT NULL,
        key TEXT NOT NULL,
        title TEXT,
        image_url TEXT,
        content TEXT,
        sort_order INTEGER DEFAULT 0,
        source_type TEXT DEFAULT 'custom',
        source_id TEXT,
        cta_label TEXT,
        cta_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (page, key)
      )
    `)
    .run();

  const alterStatements = [
    "ALTER TABLE site_sections ADD COLUMN source_type TEXT DEFAULT 'custom'",
    'ALTER TABLE site_sections ADD COLUMN source_id TEXT',
    'ALTER TABLE site_sections ADD COLUMN cta_label TEXT',
    'ALTER TABLE site_sections ADD COLUMN cta_url TEXT',
    "ALTER TABLE site_sections ADD COLUMN page TEXT DEFAULT 'home'"
  ];

  for (const statement of alterStatements) {
    try {
      await db.prepare(statement).run();
    } catch (error) {
      // Column already exists or alteration not needed; ignore.
    }
  }

  try {
    await db.prepare("UPDATE site_sections SET page = 'home' WHERE page IS NULL").run();
  } catch (error) {
    // Ignored.
  }
}

const coerceNumber = (value: unknown, fallback: number): number => {
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
};

const coerceSourceType = (value: unknown): SiteSectionSourceType => {
  if (value === 'event' || value === 'news') {
    return value;
  }
  return 'custom';
};

const normalizeSections = (rawSections: RawSection[] | undefined, page: SitePageKey): SiteSection[] => {
  const defaults = new Map(getDefaultSections(page).map((section) => [section.key, section]));
  const collected = new Map<string, SiteSection>();

  (rawSections || []).forEach((raw, index) => {
    const tentativeKey =
      typeof raw?.key === 'string' && raw.key.trim().length > 0
        ? raw.key.trim()
        : getDefaultSections(page)[index]?.key ?? `section_${index}`;

    const fallback = defaults.get(tentativeKey);
    const sortOrder = coerceNumber(raw?.sort_order, fallback?.sort_order ?? index);
    const sourceType = coerceSourceType(raw?.source_type);
    const sourceId = typeof raw?.source_id === 'string' ? raw.source_id : fallback?.source_id;
    const ctaLabel = typeof raw?.cta_label === 'string' ? raw.cta_label : fallback?.cta_label;
    const ctaUrl = typeof raw?.cta_url === 'string' ? raw.cta_url : fallback?.cta_url;

    const normalized: SiteSection = {
      page,
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
      sort_order: sortOrder,
      source_type: sourceType,
      source_id: sourceId,
      cta_label: ctaLabel,
      cta_url: ctaUrl
    };

    collected.set(normalized.key, normalized);
    defaults.delete(normalized.key);
  });

  for (const remaining of defaults.values()) {
    collected.set(remaining.key, { ...remaining, page });
  }

  return Array.from(collected.values()).sort((a, b) => a.sort_order - b.sort_order);
};

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context;

  try {
    const page = parsePage(new URL(request.url).searchParams.get('page'));
    const cacheKey = cacheKeyFor(page);
    const defaults = getDefaultSections(page);
    let sections: SiteSection[] = [];

    if (env.DB) {
      await ensureTable(env.DB);
      const res = await env.DB
        .prepare<SiteSection>(
          'SELECT page, key, title, image_url, content, sort_order, source_type, source_id, cta_label, cta_url FROM site_sections WHERE page = ? ORDER BY sort_order ASC'
        )
        .bind(page)
        .all();

      if (res.results && res.results.length > 0) {
        sections = normalizeSections(res.results, page);
        if (env.ACA_KV) {
          await env.ACA_KV.put(cacheKey, JSON.stringify(sections));
        }
      }
    }

    if ((!sections || sections.length === 0) && env.ACA_KV) {
      const cached = await env.ACA_KV.get(cacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached) as RawSection[];
          sections = normalizeSections(parsed, page);
        } catch (error) {
          console.warn('[CONTENT GET] Failed to parse KV cache, using defaults', error);
        }
      }
    }

    if (!sections || sections.length === 0) {
      sections = defaults;
      if (env.ACA_KV) {
        await env.ACA_KV.put(cacheKey, JSON.stringify(sections));
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
    const page = parsePage(new URL(request.url).searchParams.get('page'));
    const cacheKey = cacheKeyFor(page);

    console.log('[CONTENT POST] Starting save operation for page:', page);

    let authUser;
    try {
      authUser = await requireAuth(request, env);
      console.log('[CONTENT POST] Auth successful, user role:', authUser.role);
    } catch (err) {
      console.error('[CONTENT POST] Auth failed:', err);
      return errorResponse(
        err instanceof Error ? err.message : 'Token inválido',
        401,
        env.ENVIRONMENT === 'development' ? { details: err } : undefined
      );
    }

    if (authUser.role !== 'admin' && authUser.role !== 'super_admin') {
      console.error('[CONTENT POST] Access denied for role:', authUser.role);
      return errorResponse('Acceso denegado. Se requieren permisos de administrador.', 403);
    }

    const body = await request.json().catch(() => ({}));
    console.log('[CONTENT POST] Raw request body:', JSON.stringify(body, null, 2));

    const incoming = Array.isArray(body?.sections) ? (body.sections as RawSection[]) : [];
    console.log('[CONTENT POST] Incoming sections count:', incoming.length);

    const normalized = normalizeSections(incoming, page).map((section, index) => ({
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
    return errorResponse(
      'Internal server error',
      500,
      env.ENVIRONMENT === 'development' ? { details: error instanceof Error ? error.message : error } : undefined
    );
  }
}

