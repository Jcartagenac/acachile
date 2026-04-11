import type { Env } from '../../types';
import type { PortalDocument } from '../../../../shared/portalDocuments';

export const PORTAL_DOCUMENTS_CACHE_KEY = 'site:portal:documents';

type Database = Env['DB'];

type PortalDocumentRow = {
  id: number;
  section_key: 'documentos';
  file_name: string;
  visible_name: string;
  file_url: string;
  file_key?: string | null;
  file_type: string;
  file_size?: number | null;
  sort_order?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
};

const normalizeDocuments = (rows: PortalDocumentRow[] | undefined): PortalDocument[] =>
  (rows || [])
    .map((row, index) => ({
      id: Number(row.id),
      section_key: 'documentos',
      file_name: row.file_name,
      visible_name: row.visible_name || row.file_name,
      file_url: row.file_url,
      file_key: row.file_key || null,
      file_type: row.file_type,
      file_size: row.file_size ?? null,
      sort_order: typeof row.sort_order === 'number' ? row.sort_order : index,
      created_at: row.created_at || undefined,
      updated_at: row.updated_at || undefined,
    }))
    .sort((a, b) => a.sort_order - b.sort_order || b.id - a.id);

export const ensurePortalDocumentsTable = async (db: Database) => {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS portal_documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      section_key TEXT NOT NULL DEFAULT 'documentos',
      file_name TEXT NOT NULL,
      visible_name TEXT NOT NULL,
      file_url TEXT NOT NULL,
      file_key TEXT,
      file_type TEXT NOT NULL,
      file_size INTEGER,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
};

export const getPortalDocuments = async (env: Env): Promise<PortalDocument[]> => {
  if (env.ACA_KV) {
    const cached = await env.ACA_KV.get(PORTAL_DOCUMENTS_CACHE_KEY);
    if (cached) {
      try {
        return normalizeDocuments(JSON.parse(cached) as PortalDocumentRow[]);
      } catch (error) {
        console.warn('[portal-documents] Failed to parse cache', error);
      }
    }
  }

  if (!env.DB) return [];
  await ensurePortalDocumentsTable(env.DB);

  const res = await env.DB
    .prepare<PortalDocumentRow>(`SELECT id, section_key, file_name, visible_name, file_url, file_key, file_type, file_size, sort_order, created_at, updated_at FROM portal_documents WHERE section_key = 'documentos' ORDER BY sort_order ASC, id DESC`)
    .all();

  const documents = normalizeDocuments(res.results);
  if (env.ACA_KV) {
    await env.ACA_KV.put(PORTAL_DOCUMENTS_CACHE_KEY, JSON.stringify(documents), { expirationTtl: 86400 });
  }
  return documents;
};

export const createPortalDocument = async (
  env: Env,
  input: Omit<PortalDocument, 'id' | 'section_key' | 'created_at' | 'updated_at'>,
): Promise<PortalDocument> => {
  if (!env.DB) throw new Error('DB no configurada');
  await ensurePortalDocumentsTable(env.DB);

  const result = await env.DB.prepare(`
    INSERT INTO portal_documents (section_key, file_name, visible_name, file_url, file_key, file_type, file_size, sort_order, created_at, updated_at)
    VALUES ('documentos', ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `)
    .bind(
      input.file_name,
      input.visible_name,
      input.file_url,
      input.file_key || null,
      input.file_type,
      input.file_size ?? null,
      input.sort_order,
    )
    .run();

  if (env.ACA_KV) await env.ACA_KV.delete(PORTAL_DOCUMENTS_CACHE_KEY);

  const inserted = await env.DB
    .prepare<PortalDocumentRow>('SELECT id, section_key, file_name, visible_name, file_url, file_key, file_type, file_size, sort_order, created_at, updated_at FROM portal_documents WHERE id = ?')
    .bind(result.meta.last_row_id)
    .first();

  return normalizeDocuments(inserted ? [inserted] : [])[0];
};

export const updatePortalDocument = async (
  env: Env,
  id: number,
  input: { visible_name: string },
): Promise<PortalDocument | null> => {
  if (!env.DB) throw new Error('DB no configurada');
  await ensurePortalDocumentsTable(env.DB);

  await env.DB
    .prepare(`UPDATE portal_documents SET visible_name = ?, updated_at = datetime('now') WHERE id = ?`)
    .bind(input.visible_name.trim(), id)
    .run();

  if (env.ACA_KV) await env.ACA_KV.delete(PORTAL_DOCUMENTS_CACHE_KEY);

  const updated = await env.DB
    .prepare<PortalDocumentRow>('SELECT id, section_key, file_name, visible_name, file_url, file_key, file_type, file_size, sort_order, created_at, updated_at FROM portal_documents WHERE id = ?')
    .bind(id)
    .first();

  return updated ? normalizeDocuments([updated])[0] : null;
};

export const deletePortalDocument = async (env: Env, id: number): Promise<PortalDocument | null> => {
  if (!env.DB) throw new Error('DB no configurada');
  await ensurePortalDocumentsTable(env.DB);

  const existing = await env.DB
    .prepare<PortalDocumentRow>('SELECT id, section_key, file_name, visible_name, file_url, file_key, file_type, file_size, sort_order, created_at, updated_at FROM portal_documents WHERE id = ?')
    .bind(id)
    .first();

  if (!existing) return null;

  await env.DB.prepare('DELETE FROM portal_documents WHERE id = ?').bind(id).run();

  if (existing.file_key && env.IMAGES) {
    try {
      await env.IMAGES.delete(existing.file_key);
    } catch (error) {
      console.warn('[portal-documents] Failed to delete file from R2', error);
    }
  }

  if (env.ACA_KV) await env.ACA_KV.delete(PORTAL_DOCUMENTS_CACHE_KEY);
  return normalizeDocuments([existing])[0];
};
