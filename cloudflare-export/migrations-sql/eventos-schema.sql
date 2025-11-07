-- Esquema de base de datos para eventos
-- Ejecutar este script para inicializar la tabla de eventos en D1

CREATE TABLE IF NOT EXISTS eventos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  date TEXT NOT NULL,
  time TEXT,
  location TEXT NOT NULL,
  image TEXT,
  type TEXT DEFAULT 'encuentro',
  status TEXT DEFAULT 'draft',
  registration_open BOOLEAN DEFAULT 1,
  max_participants INTEGER,
  price REAL DEFAULT 0,
  organizer_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Crear índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_eventos_status ON eventos(status);
CREATE INDEX IF NOT EXISTS idx_eventos_date ON eventos(date);
CREATE INDEX IF NOT EXISTS idx_eventos_type ON eventos(type);
CREATE INDEX IF NOT EXISTS idx_eventos_organizer ON eventos(organizer_id);