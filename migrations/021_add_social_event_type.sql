-- Migration: add_social_event_type
-- Created at: 2025-12-17
-- Description: Adds 'social' as a valid event type

-- Down script
-- SQLite doesn't support ALTER COLUMN, so we need to recreate the table
DROP TABLE IF EXISTS eventos_backup;

-- Up script
-- Create backup of current eventos table
CREATE TABLE eventos_backup AS SELECT * FROM eventos;

-- Drop original table
DROP TABLE eventos;

-- Recreate eventos table with updated type constraint (matching current structure)
CREATE TABLE eventos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    date TEXT NOT NULL,
    time TEXT,
    location TEXT NOT NULL,
    image TEXT,
    type TEXT DEFAULT 'encuentro' CHECK (type IN ('campeonato', 'taller', 'encuentro', 'competencia', 'masterclass', 'social')),
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'completed', 'cancelled', 'archived')),
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
    
    FOREIGN KEY (organizer_id) REFERENCES usuarios (id) ON DELETE CASCADE
);

-- Restore data from backup
INSERT INTO eventos SELECT * FROM eventos_backup;

-- Drop backup table
DROP TABLE eventos_backup;

-- Recreate indexes
CREATE INDEX idx_eventos_organizer ON eventos(organizer_id);
CREATE INDEX idx_eventos_date ON eventos(date);
CREATE INDEX idx_eventos_status ON eventos(status);
CREATE INDEX idx_eventos_type ON eventos(type);
