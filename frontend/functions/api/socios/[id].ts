import type { PagesFunction } from '../../types';

interface PrivacyFlags {
  showEmail: boolean;
  showPhone: boolean;
  showRut: boolean;
  showAddress: boolean;
  showBirthdate: boolean;
  showPublicProfile: boolean;
}

const ensurePrivacyTable = async (db: any): Promise<boolean> => {
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
    console.warn('[PUBLIC SOCIO] No se pudo garantizar show_public_profile, usando valor por defecto.', error);
  }

  return hasPublicProfileColumn;
};

const mapPrivacyFlags = (row: any): PrivacyFlags => ({
  showEmail: row?.show_email === 1,
  showPhone: row?.show_phone === 1,
  showRut: row?.show_rut === 1,
  showAddress: row?.show_address === 1,
  showBirthdate: row?.show_birthdate === 1,
  showPublicProfile:
    row?.show_public_profile === null || row?.show_public_profile === undefined
      ? true
      : row.show_public_profile === 1
});

const sanitizeString = (value: any): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const calculateYearsActive = (joinedAt?: string | null): number | null => {
  if (!joinedAt) return null;
  const joinedDate = new Date(joinedAt);
  if (Number.isNaN(joinedDate.getTime())) return null;

  const now = new Date();
  let years = now.getFullYear() - joinedDate.getFullYear();
  const monthDiff = now.getMonth() - joinedDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < joinedDate.getDate())) {
    years -= 1;
  }

  return years >= 0 ? years : 0;
};

export const onRequestGet: PagesFunction = async ({ params, env }) => {
  const rawId = params.id;
  const socioId = Number(rawId);

  if (!rawId || Number.isNaN(socioId) || socioId <= 0) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Identificador de socio inválido'
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const hasPublicColumn = await ensurePrivacyTable(env.DB);

    const selectQuery = hasPublicColumn
      ? `
        SELECT 
          u.id,
          u.nombre,
          u.apellido,
          u.email,
          u.telefono,
          u.rut,
          u.ciudad,
          u.region,
          u.direccion,
          u.fecha_nacimiento,
          u.fecha_ingreso,
          u.foto_url,
          u.role,
          u.estado_socio,
          u.activo,
          privacy.show_email,
          privacy.show_phone,
          privacy.show_rut,
          privacy.show_address,
          privacy.show_birthdate,
          privacy.show_public_profile
        FROM usuarios u
        LEFT JOIN user_privacy_settings privacy ON privacy.user_id = u.id
        WHERE u.id = ? AND (u.activo = 1 OR u.activo IS NULL)
      `
      : `
        SELECT 
          u.id,
          u.nombre,
          u.apellido,
          u.email,
          u.telefono,
          u.rut,
          u.ciudad,
          u.region,
          u.direccion,
          u.fecha_nacimiento,
          u.fecha_ingreso,
          u.foto_url,
          u.role,
          u.estado_socio,
          u.activo,
          privacy.show_email,
          privacy.show_phone,
          privacy.show_rut,
          privacy.show_address,
          privacy.show_birthdate,
          1 AS show_public_profile
        FROM usuarios u
        LEFT JOIN user_privacy_settings privacy ON privacy.user_id = u.id
        WHERE u.id = ? AND (u.activo = 1 OR u.activo IS NULL)
      `;

    const socioRow = await env.DB.prepare(selectQuery)
      .bind(socioId)
      .first();

    if (!socioRow) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No encontramos este socio.'
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const privacy = mapPrivacyFlags(socioRow);

    if (!privacy.showPublicProfile) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Este socio mantiene su perfil en privado.'
        }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    const firstName = sanitizeString(socioRow.nombre);
    const lastName = sanitizeString(socioRow.apellido);
    const fullName = [firstName, lastName].filter(Boolean).join(' ').trim() || sanitizeString(socioRow.email) || 'Socio ACA';

    const location = privacy.showAddress
      ? {
          city: sanitizeString(socioRow.ciudad),
          region: sanitizeString(socioRow.region),
          address: sanitizeString(socioRow.direccion)
        }
      : {
          city: null,
          region: null,
          address: null
        };

    const contact = {
      email: privacy.showEmail ? sanitizeString(socioRow.email) : null,
      phone: privacy.showPhone ? sanitizeString(socioRow.telefono) : null
    };

    const payload = {
      id: socioRow.id,
      fullName,
      firstName,
      lastName,
      avatar: sanitizeString(socioRow.foto_url),
      role: sanitizeString(socioRow.role) || 'usuario',
      status: sanitizeString(socioRow.estado_socio) || 'activo',
      joinedAt: sanitizeString(socioRow.fecha_ingreso),
      yearsActive: calculateYearsActive(sanitizeString(socioRow.fecha_ingreso)),
      contact,
      location,
      rut: privacy.showRut ? sanitizeString(socioRow.rut) : null,
      birthdate: privacy.showBirthdate ? sanitizeString(socioRow.fecha_nacimiento) : null,
      privacy
    };

    return new Response(
      JSON.stringify({
        success: true,
        data: payload
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[PUBLIC SOCIO] Error obteniendo perfil:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'No pudimos obtener el perfil público de este socio.'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
