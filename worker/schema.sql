-- Schema para ACA Chile D1 Database
-- Migración de KV a D1 para mejor consistencia y performance

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  region TEXT,
  password_hash TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de eventos
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT,
  location TEXT NOT NULL,
  image TEXT,
  type TEXT NOT NULL CHECK (type IN ('campeonato', 'taller', 'encuentro', 'torneo')),
  registration_open BOOLEAN DEFAULT TRUE,
  max_participants INTEGER,
  current_participants INTEGER DEFAULT 0,
  price INTEGER DEFAULT 0,
  requirements TEXT, -- JSON array
  tags TEXT, -- JSON array
  contact_info TEXT, -- JSON object
  organizer_id INTEGER NOT NULL,
  status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'cancelled', 'completed')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organizer_id) REFERENCES users(id)
);

-- Tabla de inscripciones
CREATE TABLE IF NOT EXISTS inscriptions (
  id TEXT PRIMARY KEY, -- formato: insc_{event_id}_{user_id}_{timestamp}
  user_id INTEGER NOT NULL,
  event_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'pending', 'cancelled', 'waitlist')),
  inscription_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_amount INTEGER,
  notes TEXT,
  waitlist_position INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (event_id) REFERENCES events(id),
  UNIQUE(user_id, event_id) -- Un usuario solo puede tener una inscripción activa por evento
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date);
CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_inscriptions_user ON inscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_inscriptions_event ON inscriptions(event_id);
CREATE INDEX IF NOT EXISTS idx_inscriptions_status ON inscriptions(status);

-- Triggers para mantener current_participants actualizado
CREATE TRIGGER IF NOT EXISTS update_event_participants_on_insert
AFTER INSERT ON inscriptions
WHEN NEW.status IN ('confirmed', 'pending')
BEGIN
  UPDATE events 
  SET current_participants = (
    SELECT COUNT(*) 
    FROM inscriptions 
    WHERE event_id = NEW.event_id 
    AND status IN ('confirmed', 'pending')
  ),
  updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.event_id;
END;

CREATE TRIGGER IF NOT EXISTS update_event_participants_on_update
AFTER UPDATE ON inscriptions
WHEN OLD.status != NEW.status
BEGIN
  UPDATE events 
  SET current_participants = (
    SELECT COUNT(*) 
    FROM inscriptions 
    WHERE event_id = NEW.event_id 
    AND status IN ('confirmed', 'pending')
  ),
  updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.event_id;
END;

CREATE TRIGGER IF NOT EXISTS update_event_participants_on_delete
AFTER DELETE ON inscriptions
WHEN OLD.status IN ('confirmed', 'pending')
BEGIN
  UPDATE events 
  SET current_participants = (
    SELECT COUNT(*) 
    FROM inscriptions 
    WHERE event_id = OLD.event_id 
    AND status IN ('confirmed', 'pending')
  ),
  updated_at = CURRENT_TIMESTAMP
  WHERE id = OLD.event_id;
END;