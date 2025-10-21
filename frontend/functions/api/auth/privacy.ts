import type { PagesFunction, Env } from '../../types';
import { requireAuth, jsonResponse, errorResponse } from '../../_middleware';

interface PrivacyRow {
  show_email: number | null;
  show_phone: number | null;
  show_rut: number | null;
  show_address: number | null;
  show_birthdate: number | null;
  show_public_profile: number | null;
}

const DEFAULT_PRIVACY: PrivacyRow = {
  show_email: 0,
  show_phone: 0,
  show_rut: 0,
  show_address: 0,
  show_birthdate: 0,
  show_public_profile: 1
};

const ensurePrivacyTable = async (db: Env['DB']): Promise<boolean> => {
  if (!db) return false;

  await db
    .prepare(
      `
        CREATE TABLE IF NOT EXISTS user_privacy_settings (
          user_id INTEGER PRIMARY KEY,
          show_email INTEGER DEFAULT 0,
          show_phone INTEGER DEFAULT 0,
          show_rut INTEGER DEFAULT 0,
          show_address INTEGER DEFAULT 0,
          show_birthdate INTEGER DEFAULT 0,
          show_public_profile INTEGER DEFAULT 1,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `
    )
    .run();

  let hasPublicProfileColumn = false;

  try {
    const info = await db.prepare(`PRAGMA table_info(user_privacy_settings)`).all();
    const columns = info?.results || [];
    hasPublicProfileColumn = columns.some((column: any) => column.name === 'show_public_profile');

    if (!hasPublicProfileColumn) {
      await db.prepare(`ALTER TABLE user_privacy_settings ADD COLUMN show_public_profile INTEGER DEFAULT 1`).run();
      hasPublicProfileColumn = true;
    }
  } catch (error) {
    console.warn('[PRIVACY] No se pudo garantizar la columna show_public_profile. Usaremos valor por defecto.', error);
  }

  return hasPublicProfileColumn;
};

const toBoolean = (value: number | null | undefined): boolean => value === 1;

const mapRowToResponse = (row: PrivacyRow | null | undefined) => {
  const source = row ?? DEFAULT_PRIVACY;
  return {
    showEmail: toBoolean(source.show_email),
    showPhone: toBoolean(source.show_phone),
    showRut: toBoolean(source.show_rut),
    showAddress: toBoolean(source.show_address),
    showBirthdate: toBoolean(source.show_birthdate),
    showPublicProfile: source.show_public_profile === null || source.show_public_profile === undefined ? true : toBoolean(source.show_public_profile)
  };
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env, request } = context;

  try {
    const auth = requireAuth(request, env);
    const resolvedUserId = auth?.userId ?? auth?.id ?? auth?.sub;

    const userId = typeof resolvedUserId === 'string' ? parseInt(resolvedUserId, 10) : resolvedUserId;

    if (!userId || Number.isNaN(userId)) {
      return errorResponse('Token inválido', 401, { message: 'No se pudo resolver el identificador de usuario' });
    }

    if (!env.DB) {
      return errorResponse('Base de datos no configurada', 500);
    }

    const hasPublicColumn = await ensurePrivacyTable(env.DB);

    const selectQuery = hasPublicColumn
      ? `
        SELECT show_email, show_phone, show_rut, show_address, show_birthdate, show_public_profile
        FROM user_privacy_settings
        WHERE user_id = ?
      `
      : `
        SELECT show_email, show_phone, show_rut, show_address, show_birthdate, 1 AS show_public_profile
        FROM user_privacy_settings
        WHERE user_id = ?
      `;

    const row = await env.DB.prepare<PrivacyRow>(selectQuery)
      .bind(auth.userId)
      .first();

    return jsonResponse({
      success: true,
      data: mapRowToResponse(row)
    });
  } catch (error) {
    console.error('[PRIVACY] GET error:', error);
    const message = error instanceof Error ? error.message : String(error);
    if (message.toLowerCase().includes('authorization')) {
      return errorResponse('No autorizado', 401, { message });
    }
    return errorResponse('Error obteniendo preferencias de privacidad', 500, { message });
  }
};

export const onRequestPut: PagesFunction<Env> = async (context) => {
  const { env, request } = context;

  try {
    const auth = requireAuth(request, env);

    if (!env.DB) {
      return errorResponse('Base de datos no configurada', 500);
    }

    const body = await request.json<{
      showEmail?: boolean;
      showPhone?: boolean;
      showRut?: boolean;
      showAddress?: boolean;
      showBirthdate?: boolean;
      showPublicProfile?: boolean;
    }>();

    const payload = {
      showEmail: Boolean(body.showEmail),
      showPhone: Boolean(body.showPhone),
      showRut: Boolean(body.showRut),
      showAddress: Boolean(body.showAddress),
      showBirthdate: Boolean(body.showBirthdate),
      showPublicProfile: body.showPublicProfile === undefined ? true : Boolean(body.showPublicProfile)
    };

    const resolvedUserId = auth?.userId ?? auth?.id ?? auth?.sub;
    const userId = typeof resolvedUserId === 'string' ? parseInt(resolvedUserId, 10) : resolvedUserId;

    if (!userId || Number.isNaN(userId)) {
      return errorResponse('Token inválido', 401, { message: 'No se pudo resolver el identificador de usuario' });
    }

    const hasPublicColumn = await ensurePrivacyTable(env.DB);

    const upsertQuery = hasPublicColumn
      ? `
        INSERT INTO user_privacy_settings (user_id, show_email, show_phone, show_rut, show_address, show_birthdate, show_public_profile, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id) DO UPDATE SET
          show_email = excluded.show_email,
          show_phone = excluded.show_phone,
          show_rut = excluded.show_rut,
          show_address = excluded.show_address,
          show_birthdate = excluded.show_birthdate,
          show_public_profile = excluded.show_public_profile,
          updated_at = CURRENT_TIMESTAMP
      `
      : `
        INSERT INTO user_privacy_settings (user_id, show_email, show_phone, show_rut, show_address, show_birthdate, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id) DO UPDATE SET
          show_email = excluded.show_email,
          show_phone = excluded.show_phone,
          show_rut = excluded.show_rut,
          show_address = excluded.show_address,
          show_birthdate = excluded.show_birthdate,
          updated_at = CURRENT_TIMESTAMP
      `;

    const params = hasPublicColumn
      ? [
          userId,
          payload.showEmail ? 1 : 0,
          payload.showPhone ? 1 : 0,
          payload.showRut ? 1 : 0,
          payload.showAddress ? 1 : 0,
          payload.showBirthdate ? 1 : 0,
          payload.showPublicProfile ? 1 : 0
        ]
      : [
          userId,
          payload.showEmail ? 1 : 0,
          payload.showPhone ? 1 : 0,
          payload.showRut ? 1 : 0,
          payload.showAddress ? 1 : 0,
          payload.showBirthdate ? 1 : 0
        ];

    console.log('[PRIVACY] Saving settings for user', userId, 'params:', params, 'hasPublicColumn:', hasPublicColumn);

    await env.DB.prepare(upsertQuery).bind(...params).run();

    return jsonResponse({
      success: true,
      data: payload,
      message: 'Preferencias de privacidad actualizadas'
    });
  } catch (error) {
    console.error('[PRIVACY] PUT error:', error);
    const message = error instanceof Error ? error.message : String(error);
    if (message.toLowerCase().includes('authorization')) {
      return errorResponse('No autorizado', 401, { message });
    }
    return errorResponse('Error guardando preferencias de privacidad', 500, { message });
  }
};
