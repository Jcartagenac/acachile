/**
 * Tabla: participantes
 * Almacena los datos de participantes del sorteo
 */

// @ts-ignore - D1Database es proporcionado por Cloudflare Workers
export interface Participante {
  id?: number;
  nombre: string;
  apellido: string;
  rut: string;
  email: string;
  edad: number;
  telefono: string;
  created_at?: string;
}

export const participantesTableSchema = `
CREATE TABLE IF NOT EXISTS participantes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  rut TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  edad INTEGER NOT NULL,
  telefono TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_participantes_rut ON participantes(rut);
CREATE INDEX IF NOT EXISTS idx_participantes_created_at ON participantes(created_at);
`;

// @ts-ignore - D1Database es proporcionado por Cloudflare Workers
export async function initParticipantesTable(db: any): Promise<void> {
  await db.exec(participantesTableSchema);
}
