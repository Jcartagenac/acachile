export type PostulacionStatus = 'pendiente' | 'en_revision' | 'aprobada' | 'rechazada';

export const DEFAULT_APPROVALS_REQUIRED = 2;

export const AVAILABILITY_OPTIONS = [
  'eventos_publicos',
  'talleres_formativos',
  'competencias',
  'voluntariado_social',
  'mentoria_miembros',
] as const;

export type AvailabilityOption = (typeof AVAILABILITY_OPTIONS)[number];

export const isDirectorRole = (role: string | null | undefined): boolean =>
  role === 'admin' || role === 'organizer' || role === 'editor';

export const isAdminRole = (role: string | null | undefined): boolean => role === 'admin';

export interface PostulacionRecord {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  rut: string | null;
  birthdate: string | null;
  region: string | null;
  city: string | null;
  address: string | null;
  occupation: string | null;
  experience_level: string;
  specialties: string | null;
  motivation: string;
  contribution: string;
  availability: string | null;
  has_competition_experience: number;
  competition_details: string | null;
  sponsor_1: string | null;
  sponsor_2: string | null;
  instagram: string | null;
  other_networks: string | null;
  references_info: string | null;
  /** @deprecated columna legacy mantenida temporalmente para migración */
  references?: string | null;
  photo_url: string | null;
  previous_aca_member: number;
  previous_association: string | null;
  still_in_association: number;
  exit_reason: string | null;
  status: PostulacionStatus;
  approvals_required: number;
  approvals_count: number;
  rejection_reason: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  socio_id: number | null;
  created_at: string;
  updated_at: string;
}

export const ensurePostulacionesSchema = async (db: any) => {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS postulaciones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      rut TEXT,
      birthdate TEXT,
      region TEXT,
      city TEXT,
      address TEXT,
      occupation TEXT,
      experience_level TEXT NOT NULL,
      specialties TEXT,
      motivation TEXT NOT NULL,
      contribution TEXT NOT NULL,
      availability TEXT NOT NULL,
      has_competition_experience INTEGER DEFAULT 0,
      competition_details TEXT,
      sponsor_1 TEXT,
      sponsor_2 TEXT,
      instagram TEXT,
      other_networks TEXT,
      references_info TEXT,
      photo_url TEXT,
      previous_aca_member INTEGER DEFAULT 0,
      previous_association TEXT,
      still_in_association INTEGER DEFAULT 0,
      exit_reason TEXT,
      status TEXT NOT NULL DEFAULT 'pendiente' CHECK(status IN ('pendiente','en_revision','aprobada','rechazada')),
      approvals_required INTEGER NOT NULL DEFAULT ${DEFAULT_APPROVALS_REQUIRED},
      approvals_count INTEGER NOT NULL DEFAULT 0,
      rejection_reason TEXT,
      approved_at DATETIME,
      rejected_at DATETIME,
      socio_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (socio_id) REFERENCES usuarios(id)
    )
  `).run();

  try {
    await db.prepare(`ALTER TABLE postulaciones ADD COLUMN photo_url TEXT`).run();
  } catch (error) {
    // En caso de que la columna ya exista, ignorar error
  }

  // Agregar nuevos campos para CSV export
  try {
    await db.prepare(`ALTER TABLE postulaciones ADD COLUMN address TEXT`).run();
  } catch (error) {
    // Columna ya existe
  }

  try {
    await db.prepare(`ALTER TABLE postulaciones ADD COLUMN sponsor_1 TEXT`).run();
  } catch (error) {
    // Columna ya existe
  }

  try {
    await db.prepare(`ALTER TABLE postulaciones ADD COLUMN sponsor_2 TEXT`).run();
  } catch (error) {
    // Columna ya existe
  }

  try {
    await db.prepare(`ALTER TABLE postulaciones ADD COLUMN previous_aca_member INTEGER DEFAULT 0`).run();
  } catch (error) {
    // Columna ya existe
  }

  try {
    await db.prepare(`ALTER TABLE postulaciones ADD COLUMN previous_association TEXT`).run();
  } catch (error) {
    // Columna ya existe
  }

  try {
    await db.prepare(`ALTER TABLE postulaciones ADD COLUMN still_in_association INTEGER DEFAULT 0`).run();
  } catch (error) {
    // Columna ya existe
  }

  try {
    await db.prepare(`ALTER TABLE postulaciones ADD COLUMN exit_reason TEXT`).run();
  } catch (error) {
    // Columna ya existe
  }

  try {
    const columnsResult = await db.prepare(`PRAGMA table_info(postulaciones)`).all();
    const columns = columnsResult?.results ?? [];
    const hasLegacyReferences = columns.some((column: any) => column.name === 'references');
    const hasNewReferences = columns.some((column: any) => column.name === 'references_info');

    if (hasLegacyReferences && !hasNewReferences) {
      await db
        .prepare(`ALTER TABLE postulaciones RENAME COLUMN "references" TO references_info`)
        .run();
    }
  } catch (error) {
    console.warn('[postulaciones] Error migrating legacy references column', error);
  }

  await db.prepare(`
    CREATE TABLE IF NOT EXISTS postulacion_aprobaciones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      postulacion_id INTEGER NOT NULL,
      approver_id INTEGER NOT NULL,
      approver_role TEXT NOT NULL,
      comment TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (postulacion_id) REFERENCES postulaciones(id) ON DELETE CASCADE,
      FOREIGN KEY (approver_id) REFERENCES usuarios(id),
      UNIQUE(postulacion_id, approver_id)
    )
  `).run();

  await db.prepare(`
    CREATE TABLE IF NOT EXISTS postulacion_reviewers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      postulacion_id INTEGER NOT NULL,
      reviewer_id INTEGER NOT NULL,
      assigned_by INTEGER NOT NULL,
      feedback TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (postulacion_id) REFERENCES postulaciones(id) ON DELETE CASCADE,
      FOREIGN KEY (reviewer_id) REFERENCES usuarios(id),
      FOREIGN KEY (assigned_by) REFERENCES usuarios(id),
      UNIQUE(postulacion_id, reviewer_id)
    )
  `).run();

  // Agregar columna feedback si la tabla ya existe y no tiene la columna
  try {
    await db.prepare(`ALTER TABLE postulacion_reviewers ADD COLUMN feedback TEXT`).run();
  } catch (error) {
    // Ignorar si la columna ya existe
  }

  await db.prepare(`
    CREATE INDEX IF NOT EXISTS idx_postulaciones_status ON postulaciones(status)
  `).run();
  await db.prepare(`
    CREATE INDEX IF NOT EXISTS idx_postulaciones_email ON postulaciones(email)
  `).run();
  await db.prepare(`
    CREATE INDEX IF NOT EXISTS idx_postulaciones_updated_at ON postulaciones(updated_at)
  `).run();

  await db.prepare(`
    CREATE TRIGGER IF NOT EXISTS trg_postulaciones_updated_at
    AFTER UPDATE ON postulaciones
    FOR EACH ROW
    BEGIN
      UPDATE postulaciones SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;
  `).run();
};

export const mapPostulacionRow = (row: any) => {
  if (!row) return null;

  let availability: AvailabilityOption[] = [];
  if (row.availability) {
    try {
      const parsed = JSON.parse(row.availability);
      if (Array.isArray(parsed)) {
        availability = parsed.filter((item) => AVAILABILITY_OPTIONS.includes(item));
      }
    } catch (error) {
      console.error('[postulaciones] Error parsing availability JSON', error);
    }
  }

  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    rut: row.rut,
    birthdate: row.birthdate,
    region: row.region,
    city: row.city,
    address: row.address,
    occupation: row.occupation,
    experienceLevel: row.experience_level,
    specialties: row.specialties,
    motivation: row.motivation,
    contribution: row.contribution,
    availability,
    hasCompetitionExperience: Boolean(row.has_competition_experience),
    competitionDetails: row.competition_details,
    sponsor1: row.sponsor_1,
    sponsor2: row.sponsor_2,
    instagram: row.instagram,
    otherNetworks: row.other_networks,
    references: row.references_info ?? row.references ?? null,
    photoUrl: row.photo_url,
    previousAcaMember: Boolean(row.previous_aca_member),
    previousAssociation: row.previous_association,
    stillInAssociation: Boolean(row.still_in_association),
    exitReason: row.exit_reason,
    status: row.status as PostulacionStatus,
    approvalsRequired: row.approvals_required,
    approvalsCount: row.approvals_count,
    rejectionReason: row.rejection_reason,
    approvedAt: row.approved_at,
    rejectedAt: row.rejected_at,
    socioId: row.socio_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};
