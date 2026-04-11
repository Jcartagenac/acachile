import type { Env } from '../../types';
import {
  getDefaultPortalSections,
  portalSectionDefinitions,
  type PortalSectionContent,
  type PortalSectionKey,
} from '../../../../shared/portalSections';

export const PORTAL_SECTIONS_CACHE_KEY = 'site:portal:sections';

type Database = Env['DB'];

type PortalSectionRow = {
  key: PortalSectionKey;
  title?: string | null;
  description?: string | null;
  sort_order?: number | null;
  updated_at?: string | null;
};

export const ensurePortalSectionsTable = async (db: Database) => {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS portal_sections (
      key TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
};

const normalizePortalSections = (rows: PortalSectionRow[] | undefined): PortalSectionContent[] => {
  const defaults = new Map(getDefaultPortalSections().map((section) => [section.key, section]));

  (rows || []).forEach((row, index) => {
    const existing = defaults.get(row.key);
    if (!existing) return;
    defaults.set(row.key, {
      ...existing,
      title: typeof row.title === 'string' && row.title.trim() ? row.title : existing.title,
      description:
        typeof row.description === 'string' && row.description.trim()
          ? row.description
          : existing.description,
      sort_order: typeof row.sort_order === 'number' ? row.sort_order : index,
      updated_at: row.updated_at || undefined,
    });
  });

  return Array.from(defaults.values()).sort((a, b) => a.sort_order - b.sort_order);
};

export const getPortalSections = async (env: Env): Promise<PortalSectionContent[]> => {
  if (env.ACA_KV) {
    const cached = await env.ACA_KV.get(PORTAL_SECTIONS_CACHE_KEY);
    if (cached) {
      try {
        return normalizePortalSections(JSON.parse(cached) as PortalSectionRow[]);
      } catch (error) {
        console.warn('[portal] Failed to parse cached portal sections', error);
      }
    }
  }

  if (!env.DB) {
    return getDefaultPortalSections();
  }

  await ensurePortalSectionsTable(env.DB);
  const res = await env.DB
    .prepare<PortalSectionRow>('SELECT key, title, description, sort_order, updated_at FROM portal_sections ORDER BY sort_order ASC, key ASC')
    .all();

  const sections = normalizePortalSections(res.results);

  if (env.ACA_KV) {
    await env.ACA_KV.put(PORTAL_SECTIONS_CACHE_KEY, JSON.stringify(sections), { expirationTtl: 86400 });
  }

  return sections;
};

export const savePortalSections = async (env: Env, sections: PortalSectionContent[]): Promise<PortalSectionContent[]> => {
  if (!env.DB) {
    throw new Error('DB no configurada');
  }

  await ensurePortalSectionsTable(env.DB);

  const validKeys = new Set(portalSectionDefinitions.map((section) => section.key));
  const normalized = sections
    .filter((section) => validKeys.has(section.key))
    .map((section, index) => ({
      ...section,
      title: section.title.trim(),
      description: section.description.trim(),
      sort_order: typeof section.sort_order === 'number' ? section.sort_order : index,
    }));

  for (const section of normalized) {
    await env.DB.prepare(`
      INSERT INTO portal_sections (key, title, description, sort_order, updated_at)
      VALUES (?, ?, ?, ?, datetime('now'))
      ON CONFLICT(key) DO UPDATE SET
        title = excluded.title,
        description = excluded.description,
        sort_order = excluded.sort_order,
        updated_at = datetime('now')
    `)
      .bind(section.key, section.title, section.description, section.sort_order)
      .run();
  }

  if (env.ACA_KV) {
    await env.ACA_KV.delete(PORTAL_SECTIONS_CACHE_KEY);
  }

  return getPortalSections(env);
};
