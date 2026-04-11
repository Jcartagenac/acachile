import type { Env } from '../../types';
import type {
  PortalCompetitionTeam,
  PortalCompetitionTeamGalleryImage,
  PortalCompetitionTeamMember,
} from '../../../../shared/portalCompetencias';

export const PORTAL_COMPETENCIAS_CACHE_KEY = 'site:portal:competencias';

type TeamRow = {
  id: number;
  slug: string;
  name: string;
  main_image_url?: string | null;
  main_image_key?: string | null;
  achievements?: string | null;
  is_active?: number | boolean | null;
  is_visible?: number | boolean | null;
  sort_order?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type MemberRow = {
  id: number;
  team_id: number;
  name: string;
  photo_url?: string | null;
  photo_key?: string | null;
  sort_order?: number | null;
};

type GalleryRow = {
  id: number;
  team_id: number;
  image_url: string;
  image_key?: string | null;
  sort_order?: number | null;
};

export async function ensureCompetenciasTables(db: Env['DB']) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS portal_competition_teams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      main_image_url TEXT,
      main_image_key TEXT,
      achievements TEXT,
      is_active INTEGER DEFAULT 1,
      is_visible INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  await db.prepare(`
    CREATE TABLE IF NOT EXISTS portal_competition_team_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      team_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      photo_url TEXT,
      photo_key TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  await db.prepare(`
    CREATE TABLE IF NOT EXISTS portal_competition_team_gallery (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      team_id INTEGER NOT NULL,
      image_url TEXT NOT NULL,
      image_key TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

async function uniqueSlug(db: Env['DB'], name: string, excludeId?: number) {
  const base = slugify(name) || `equipo-${Date.now()}`;
  let slug = base;
  let counter = 2;

  while (true) {
    const existing = await db
      .prepare<{ id: number }>('SELECT id FROM portal_competition_teams WHERE slug = ? LIMIT 1')
      .bind(slug)
      .first();

    if (!existing || existing.id === excludeId) return slug;
    slug = `${base}-${counter++}`;
  }
}

function mapMembers(rows: MemberRow[]): PortalCompetitionTeamMember[] {
  return rows
    .map((row, index) => ({
      id: Number(row.id),
      team_id: Number(row.team_id),
      name: row.name,
      photo_url: row.photo_url || null,
      photo_key: row.photo_key || null,
      sort_order: typeof row.sort_order === 'number' ? row.sort_order : index,
    }))
    .sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);
}

function mapGallery(rows: GalleryRow[]): PortalCompetitionTeamGalleryImage[] {
  return rows
    .map((row, index) => ({
      id: Number(row.id),
      team_id: Number(row.team_id),
      image_url: row.image_url,
      image_key: row.image_key || null,
      sort_order: typeof row.sort_order === 'number' ? row.sort_order : index,
    }))
    .sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);
}

async function getMembersByTeamIds(db: Env['DB'], teamIds: number[]) {
  if (teamIds.length === 0) return new Map<number, PortalCompetitionTeamMember[]>();
  const placeholders = teamIds.map(() => '?').join(',');
  const res = await db
    .prepare<MemberRow>(`SELECT id, team_id, name, photo_url, photo_key, sort_order FROM portal_competition_team_members WHERE team_id IN (${placeholders}) ORDER BY sort_order ASC, id ASC`)
    .bind(...teamIds)
    .all();
  const map = new Map<number, PortalCompetitionTeamMember[]>();
  for (const row of res.results || []) {
    const current = map.get(row.team_id) || [];
    current.push(...mapMembers([row]));
    map.set(row.team_id, current);
  }
  return map;
}

async function getGalleryByTeamIds(db: Env['DB'], teamIds: number[]) {
  if (teamIds.length === 0) return new Map<number, PortalCompetitionTeamGalleryImage[]>();
  const placeholders = teamIds.map(() => '?').join(',');
  const res = await db
    .prepare<GalleryRow>(`SELECT id, team_id, image_url, image_key, sort_order FROM portal_competition_team_gallery WHERE team_id IN (${placeholders}) ORDER BY sort_order ASC, id ASC`)
    .bind(...teamIds)
    .all();
  const map = new Map<number, PortalCompetitionTeamGalleryImage[]>();
  for (const row of res.results || []) {
    const current = map.get(row.team_id) || [];
    current.push(...mapGallery([row]));
    map.set(row.team_id, current);
  }
  return map;
}

function composeTeams(
  teams: TeamRow[],
  membersMap: Map<number, PortalCompetitionTeamMember[]>,
  galleryMap: Map<number, PortalCompetitionTeamGalleryImage[]>,
): PortalCompetitionTeam[] {
  return teams
    .map((team, index) => ({
      id: Number(team.id),
      slug: team.slug,
      name: team.name,
      main_image_url: team.main_image_url || null,
      main_image_key: team.main_image_key || null,
      achievements: team.achievements || null,
      is_active: Boolean(team.is_active),
      is_visible: Boolean(team.is_visible),
      sort_order: typeof team.sort_order === 'number' ? team.sort_order : index,
      members: membersMap.get(Number(team.id)) || [],
      gallery: galleryMap.get(Number(team.id)) || [],
      created_at: team.created_at || undefined,
      updated_at: team.updated_at || undefined,
    }))
    .sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);
}

export async function getCompetitionTeams(env: Env, options?: { publicOnly?: boolean }) {
  if (!options?.publicOnly && env.ACA_KV) {
    // admin should bypass cache
  }

  if (options?.publicOnly && env.ACA_KV) {
    const cached = await env.ACA_KV.get(PORTAL_COMPETENCIAS_CACHE_KEY);
    if (cached) {
      try {
        return JSON.parse(cached) as PortalCompetitionTeam[];
      } catch {}
    }
  }

  await ensureCompetenciasTables(env.DB);
  const where = options?.publicOnly ? 'WHERE is_active = 1 AND is_visible = 1' : '';
  const res = await env.DB
    .prepare<TeamRow>(`SELECT id, slug, name, main_image_url, main_image_key, achievements, is_active, is_visible, sort_order, created_at, updated_at FROM portal_competition_teams ${where} ORDER BY sort_order ASC, id ASC`)
    .all();
  const teamRows = res.results || [];
  const teamIds = teamRows.map((row) => Number(row.id));
  const [membersMap, galleryMap] = await Promise.all([
    getMembersByTeamIds(env.DB, teamIds),
    getGalleryByTeamIds(env.DB, teamIds),
  ]);
  const teams = composeTeams(teamRows, membersMap, galleryMap);

  if (options?.publicOnly && env.ACA_KV) {
    await env.ACA_KV.put(PORTAL_COMPETENCIAS_CACHE_KEY, JSON.stringify(teams), { expirationTtl: 86400 });
  }

  return teams;
}

export async function getCompetitionTeam(env: Env, identifier: string | number, options?: { publicOnly?: boolean }) {
  await ensureCompetenciasTables(env.DB);
  const isNumeric = typeof identifier === 'number' || /^\d+$/.test(String(identifier));
  const conditions = options?.publicOnly ? 'AND is_active = 1 AND is_visible = 1' : '';
  const query = isNumeric
    ? `SELECT id, slug, name, main_image_url, main_image_key, achievements, is_active, is_visible, sort_order, created_at, updated_at FROM portal_competition_teams WHERE id = ? ${conditions} LIMIT 1`
    : `SELECT id, slug, name, main_image_url, main_image_key, achievements, is_active, is_visible, sort_order, created_at, updated_at FROM portal_competition_teams WHERE slug = ? ${conditions} LIMIT 1`;
  const team = await env.DB.prepare<TeamRow>(query).bind(identifier).first();
  if (!team) return null;
  const [membersMap, galleryMap] = await Promise.all([
    getMembersByTeamIds(env.DB, [Number(team.id)]),
    getGalleryByTeamIds(env.DB, [Number(team.id)]),
  ]);
  return composeTeams([team], membersMap, galleryMap)[0] || null;
}

export async function saveCompetitionTeam(
  env: Env,
  input: {
    id?: number;
    name: string;
    main_image_url?: string | null;
    main_image_key?: string | null;
    achievements?: string | null;
    is_active?: boolean;
    is_visible?: boolean;
    sort_order?: number;
    members?: Array<{ id?: number; name: string; photo_url?: string | null; photo_key?: string | null; sort_order?: number }>;
    gallery?: Array<{ id?: number; image_url: string; image_key?: string | null; sort_order?: number }>;
  },
) {
  await ensureCompetenciasTables(env.DB);
  const name = input.name.trim();
  if (!name) throw new Error('El equipo debe tener nombre');
  if ((input.gallery || []).length > 5) throw new Error('La galería permite máximo 5 imágenes');

  const slug = await uniqueSlug(env.DB, name, input.id);
  let teamId = input.id;

  if (teamId) {
    await env.DB.prepare(`
      UPDATE portal_competition_teams
      SET slug = ?, name = ?, main_image_url = ?, main_image_key = ?, achievements = ?, is_active = ?, is_visible = ?, sort_order = ?, updated_at = datetime('now')
      WHERE id = ?
    `)
      .bind(slug, name, input.main_image_url || null, input.main_image_key || null, input.achievements || null, input.is_active ? 1 : 0, input.is_visible ? 1 : 0, input.sort_order || 0, teamId)
      .run();
  } else {
    const result = await env.DB.prepare(`
      INSERT INTO portal_competition_teams (slug, name, main_image_url, main_image_key, achievements, is_active, is_visible, sort_order, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `)
      .bind(slug, name, input.main_image_url || null, input.main_image_key || null, input.achievements || null, input.is_active ? 1 : 0, input.is_visible ? 1 : 0, input.sort_order || 0)
      .run();
    teamId = Number(result.meta.last_row_id);
  }

  await env.DB.prepare('DELETE FROM portal_competition_team_members WHERE team_id = ?').bind(teamId).run();
  await env.DB.prepare('DELETE FROM portal_competition_team_gallery WHERE team_id = ?').bind(teamId).run();

  for (const [index, member] of (input.members || []).entries()) {
    if (!member.name.trim()) continue;
    await env.DB.prepare(`
      INSERT INTO portal_competition_team_members (team_id, name, photo_url, photo_key, sort_order, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `)
      .bind(teamId, member.name.trim(), member.photo_url || null, member.photo_key || null, member.sort_order ?? index)
      .run();
  }

  for (const [index, image] of (input.gallery || []).entries()) {
    if (!image.image_url) continue;
    await env.DB.prepare(`
      INSERT INTO portal_competition_team_gallery (team_id, image_url, image_key, sort_order, created_at, updated_at)
      VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
    `)
      .bind(teamId, image.image_url, image.image_key || null, image.sort_order ?? index)
      .run();
  }

  if (env.ACA_KV) await env.ACA_KV.delete(PORTAL_COMPETENCIAS_CACHE_KEY);
  return getCompetitionTeam(env, teamId);
}

export async function deleteCompetitionTeam(env: Env, id: number) {
  const team = await getCompetitionTeam(env, id);
  if (!team) return null;

  await env.DB.prepare('DELETE FROM portal_competition_team_members WHERE team_id = ?').bind(id).run();
  await env.DB.prepare('DELETE FROM portal_competition_team_gallery WHERE team_id = ?').bind(id).run();
  await env.DB.prepare('DELETE FROM portal_competition_teams WHERE id = ?').bind(id).run();

  const keys = [team.main_image_key, ...team.members.map((m) => m.photo_key), ...team.gallery.map((g) => g.image_key)].filter(Boolean) as string[];
  for (const key of keys) {
    try {
      await env.IMAGES.delete(key);
    } catch {}
  }
  if (env.ACA_KV) await env.ACA_KV.delete(PORTAL_COMPETENCIAS_CACHE_KEY);
  return team;
}
