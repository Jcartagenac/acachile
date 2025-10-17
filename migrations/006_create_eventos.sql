-- Migration: create_eventos
-- Created at: 2025-10-16 18:00:00
-- Description: Creates the main table for storing events.

-- Down script
DROP TABLE IF EXISTS eventos;
DROP TABLE IF EXISTS evento_inscripciones;

-- Up script
CREATE TABLE eventos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    date DATETIME NOT NULL,
    time TEXT,
    location TEXT NOT NULL,
    image TEXT,
    type TEXT DEFAULT 'encuentro' CHECK (type IN ('campeonato', 'taller', 'encuentro', 'competencia', 'masterclass')),
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'completed', 'cancelled')),
    registration_open BOOLEAN DEFAULT TRUE,
    max_participants INTEGER,
    current_participants INTEGER DEFAULT 0,
    price REAL,
    organizer_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (organizer_id) REFERENCES usuarios (id) ON DELETE CASCADE
);

CREATE TABLE evento_inscripciones (
    id TEXT PRIMARY KEY,
    evento_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'waitlist', 'cancelled')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (evento_id) REFERENCES eventos (id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES usuarios (id) ON DELETE CASCADE,
    UNIQUE (evento_id, user_id)
);

-- Indexes for performance
CREATE INDEX idx_eventos_date ON eventos(date);
CREATE INDEX idx_eventos_type ON eventos(type);
CREATE INDEX idx_eventos_status ON eventos(status);
CREATE INDEX idx_eventos_organizer ON eventos(organizer_id);
CREATE INDEX idx_inscripciones_evento ON evento_inscripciones(evento_id);
CREATE INDEX idx_inscripciones_user ON evento_inscripciones(user_id);
