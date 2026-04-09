import type { Env } from '../../types';
import type { SitePopupConfig } from '../../../../shared/sitePopup';

export const SITE_POPUP_CACHE_KEY = 'site:popup:active';

type Database = Env['DB'];

type PopupRow = {
  id: number;
  image_url: string;
  link_url?: string | null;
  open_in_new_tab?: number | boolean | null;
  is_active?: number | boolean | null;
  created_at?: string;
  updated_at?: string;
};

const normalizePopup = (row: PopupRow | null | undefined): SitePopupConfig | null => {
  if (!row || !row.image_url) return null;

  return {
    id: Number(row.id || 1),
    image_url: String(row.image_url),
    link_url: row.link_url ? String(row.link_url) : null,
    open_in_new_tab: Boolean(row.open_in_new_tab),
    is_active: Boolean(row.is_active),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
};

export const ensurePopupTable = async (db: Database) => {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS site_popup (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      image_url TEXT,
      link_url TEXT,
      open_in_new_tab INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  const alterStatements = [
    'ALTER TABLE site_popup ADD COLUMN link_url TEXT',
    'ALTER TABLE site_popup ADD COLUMN open_in_new_tab INTEGER DEFAULT 0',
    'ALTER TABLE site_popup ADD COLUMN is_active INTEGER DEFAULT 0',
  ];

  for (const statement of alterStatements) {
    try {
      await db.prepare(statement).run();
    } catch {
      // ignore if exists
    }
  }
};

export const getPopupConfig = async (env: Env, options?: { activeOnly?: boolean }): Promise<SitePopupConfig | null> => {
  const activeOnly = options?.activeOnly !== false;

  if (activeOnly && env.ACA_KV) {
    const cached = await env.ACA_KV.get(SITE_POPUP_CACHE_KEY);
    if (cached) {
      try {
        return normalizePopup(JSON.parse(cached) as PopupRow);
      } catch (error) {
        console.warn('[popup] Failed to parse popup cache', error);
      }
    }
  }

  if (!env.DB) return null;

  await ensurePopupTable(env.DB);

  const query = activeOnly
    ? 'SELECT id, image_url, link_url, open_in_new_tab, is_active, created_at, updated_at FROM site_popup WHERE id = 1 AND is_active = 1 LIMIT 1'
    : 'SELECT id, image_url, link_url, open_in_new_tab, is_active, created_at, updated_at FROM site_popup WHERE id = 1 LIMIT 1';

  const popup = normalizePopup(await env.DB.prepare(query).first<PopupRow>());

  if (activeOnly && env.ACA_KV) {
    if (popup) {
      await env.ACA_KV.put(SITE_POPUP_CACHE_KEY, JSON.stringify(popup), { expirationTtl: 86400 });
    } else {
      await env.ACA_KV.delete(SITE_POPUP_CACHE_KEY);
    }
  }

  return popup;
};

export const savePopupConfig = async (env: Env, input: {
  image_url: string;
  link_url?: string | null;
  open_in_new_tab?: boolean;
  is_active?: boolean;
}): Promise<SitePopupConfig> => {
  if (!env.DB) {
    throw new Error('DB no configurada');
  }

  await ensurePopupTable(env.DB);

  await env.DB.prepare(`
    INSERT INTO site_popup (id, image_url, link_url, open_in_new_tab, is_active, created_at, updated_at)
    VALUES (1, ?, ?, ?, ?, datetime('now'), datetime('now'))
    ON CONFLICT(id) DO UPDATE SET
      image_url = excluded.image_url,
      link_url = excluded.link_url,
      open_in_new_tab = excluded.open_in_new_tab,
      is_active = excluded.is_active,
      updated_at = datetime('now')
  `)
    .bind(
      input.image_url || '',
      input.link_url?.trim() || null,
      input.open_in_new_tab ? 1 : 0,
      input.is_active ? 1 : 0,
    )
    .run();

  const popup = await getPopupConfig(env, { activeOnly: false });
  if (!popup) {
    throw new Error('No se pudo recuperar el popup guardado');
  }

  if (env.ACA_KV) {
    if (popup.is_active) {
      await env.ACA_KV.put(SITE_POPUP_CACHE_KEY, JSON.stringify(popup), { expirationTtl: 86400 });
    } else {
      await env.ACA_KV.delete(SITE_POPUP_CACHE_KEY);
    }
  }

  return popup;
};
