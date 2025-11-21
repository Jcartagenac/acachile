-- Migración: Agregar 'archived' al CHECK constraint de eventos.status
-- Fecha: 2024-11-20
-- Descripción: Permite archivar eventos sin eliminarlos

-- Nota: SQLite no permite ALTER TABLE para modificar CHECK constraints
-- Se debe recrear la tabla con la nueva constraint incluyendo TODAS las columnas actuales

-- 1. Crear tabla temporal con la nueva constraint (19 columnas)
CREATE TABLE eventos_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  date TEXT NOT NULL,
  time TEXT,
  location TEXT NOT NULL,
  image TEXT,
  type TEXT DEFAULT 'encuentro',
  status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'published', 'completed', 'cancelled', 'archived')),
  registration_open BOOLEAN DEFAULT 1,
  max_participants INTEGER,
  price REAL DEFAULT 0,
  organizer_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  end_date TEXT,
  is_public INTEGER NOT NULL DEFAULT 1,
  payment_link TEXT,
  current_participants INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (organizer_id) REFERENCES users(id)
);

-- 2. Copiar todos los datos de la tabla original
INSERT INTO eventos_new SELECT * FROM eventos;

-- 3. Eliminar tabla original
DROP TABLE eventos;

-- 4. Renombrar tabla nueva
ALTER TABLE eventos_new RENAME TO eventos;

-- 5. Recrear índices
CREATE INDEX idx_eventos_status ON eventos(status);
CREATE INDEX idx_eventos_date ON eventos(date);
CREATE INDEX idx_eventos_type ON eventos(type);
CREATE INDEX idx_eventos_organizer ON eventos(organizer_id);
CREATE INDEX idx_eventos_is_public ON eventos(is_public);
CREATE INDEX idx_eventos_current_participants ON eventos(current_participants);
