import type { PagesFunction } from '../../types';

interface RoleRecord {
  key: string;
  label: string;
  description: string | null;
  priority: number | null;
}

const DEFAULT_ROLES: Array<{ key: 'usuario' | 'director_editor' | 'director' | 'admin'; label: string; description: string; priority: number }> = [
  {
    key: 'usuario',
    label: 'Usuario / Socio',
    description: 'Acceso básico al portal de socios: puede revisar eventos, noticias y su propio perfil.',
    priority: 100
  },
  {
    key: 'director_editor',
    label: 'Director Editor',
    description: 'Puede administrar contenidos públicos (eventos, noticias) y revisar postulaciones.',
    priority: 80
  },
  {
    key: 'director',
    label: 'Director',
    description: 'Gestión avanzada de socios, cuotas y comunicaciones internas.',
    priority: 60
  },
  {
    key: 'admin',
    label: 'Administrador',
    description: 'Acceso total al sistema, incluida la configuración general y seguridad.',
    priority: 40
  }
];

const ensureRolesTable = async (db: D1Database) => {
  await db
    .prepare(
      `
        CREATE TABLE IF NOT EXISTS roles_catalog (
          key TEXT PRIMARY KEY,
          label TEXT NOT NULL,
          description TEXT,
          priority INTEGER DEFAULT 100,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `
    )
    .run();

  for (const role of DEFAULT_ROLES) {
    await db
      .prepare(
        `
          INSERT INTO roles_catalog (key, label, description, priority)
          VALUES (?, ?, ?, ?)
          ON CONFLICT(key) DO UPDATE SET
            label = excluded.label,
            description = excluded.description,
            priority = excluded.priority
        `
      )
      .bind(role.key, role.label, role.description, role.priority)
      .run();
  }
};

const mapRoleRecord = (record: RoleRecord) => ({
  key: record.key,
  label: record.label || record.key,
  description: record.description || '',
  priority: record.priority ?? 100
});

export const onRequestGet: PagesFunction = async ({ env }) => {
  if (!env.DB) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Base de datos no configurada'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    await ensureRolesTable(env.DB);

    const result = await env.DB.prepare<RoleRecord>(
      `
        SELECT key, label, description, priority
        FROM roles_catalog
        ORDER BY priority ASC, label ASC
      `
    ).all();

    const roles = (result?.results || []).map(mapRoleRecord);

    return new Response(
      JSON.stringify({
        success: true,
        data: roles
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[ADMIN ROLES] Error obteniendo roles:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Error obteniendo roles',
        details: env.ENVIRONMENT === 'development' ? String(error) : undefined
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
