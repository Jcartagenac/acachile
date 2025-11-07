import type { Env } from '../../types';
import {
  SECTION_CACHE_KEY,
  SiteSection,
  SiteSectionSourceType,
  SitePageKey,
  getDefaultSections,
} from '../../../../shared/siteSections';

export type RawSection = Partial<SiteSection> & Record<string, unknown>;

const DEFAULT_PAGE: SitePageKey = 'home';

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

export const normalizeSections = (rawSections: RawSection[] | undefined, page: SitePageKey): SiteSection[] => {
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
      cta_url: ctaUrl,
    };

    collected.set(normalized.key, normalized);
    defaults.delete(normalized.key);
  });

  for (const remaining of defaults.values()) {
    collected.set(remaining.key, { ...remaining, page });
  }

  return Array.from(collected.values()).sort((a, b) => a.sort_order - b.sort_order);
};

export const parsePageParam = (value: string | null): SitePageKey => {
  if (value === 'about' || value === 'contact') {
    return value;
  }
  return DEFAULT_PAGE;
};

export const cacheKeyFor = (page: SitePageKey) => `${SECTION_CACHE_KEY}:${page}`;

type Database = Env['DB'];

export const ensureTable = async (db: Database) => {
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
    "ALTER TABLE site_sections ADD COLUMN page TEXT DEFAULT 'home'",
  ];

  for (const statement of alterStatements) {
    try {
      await db.prepare(statement).run();
    } catch {
      // Column may already exist; ignore errors.
    }
  }

  try {
    await db.prepare("UPDATE site_sections SET page = 'home' WHERE page IS NULL").run();
  } catch {
    // Ignore failures here as well.
  }
};

export const getSectionsForPage = async (env: Env, page: SitePageKey): Promise<SiteSection[]> => {
  const cacheKey = cacheKeyFor(page);
  const defaults = getDefaultSections(page);
  let sections: SiteSection[] = [];

  if (env.DB) {
    await ensureTable(env.DB);
    const res = await env.DB
      .prepare<SiteSection>(
        'SELECT page, key, title, image_url, content, sort_order, source_type, source_id, cta_label, cta_url FROM site_sections WHERE page = ? ORDER BY sort_order ASC',
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
        console.warn('[content] Failed to parse cached sections, using defaults', error);
      }
    }
  }

  if (!sections || sections.length === 0) {
    sections = defaults;
    if (env.ACA_KV) {
      await env.ACA_KV.put(cacheKey, JSON.stringify(sections));
    }
  }

  return sections;
};
