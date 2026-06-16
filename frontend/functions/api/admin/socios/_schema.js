const SOCIO_STATUS_VALUES = [
  {
    codigo: 'activo',
    nombre: 'Activo',
    descripcion: 'Socio con membresía activa'
  },
  {
    codigo: 'suspendido',
    nombre: 'Suspendido',
    descripcion: 'Socio suspendido temporalmente'
  },
  {
    codigo: 'expulsado',
    nombre: 'Expulsado',
    descripcion: 'Socio expulsado'
  },
  {
    codigo: 'postumo',
    nombre: 'Póstumo',
    descripcion: 'Socio fallecido reconocido como póstumo'
  }
];

async function ensureUsuariosColumn(db, columnName, columnDef) {
  const info = await db.prepare('PRAGMA table_info(usuarios)').all();
  const columns = info?.results || [];
  const exists = columns.some((column) => column.name === columnName);

  if (!exists) {
    await db.prepare(`ALTER TABLE usuarios ADD COLUMN ${columnName} ${columnDef}`).run();
  }
}

export async function ensureSociosSchema(db) {
  await ensureUsuariosColumn(db, 'numero_socio', 'TEXT');

  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS ref_estados_socio (
        codigo TEXT PRIMARY KEY,
        nombre TEXT NOT NULL,
        descripcion TEXT
      )
    `).run();

    for (const status of SOCIO_STATUS_VALUES) {
      await db.prepare(`
        INSERT INTO ref_estados_socio (codigo, nombre, descripcion)
        VALUES (?, ?, ?)
        ON CONFLICT(codigo) DO UPDATE SET
          nombre = excluded.nombre,
          descripcion = excluded.descripcion
      `).bind(status.codigo, status.nombre, status.descripcion).run();
    }
  } catch (error) {
    console.warn('[ADMIN SOCIOS] No se pudo sincronizar catálogo de estados:', error);
  }
}
