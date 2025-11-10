-- Migration: Modify inscriptions table to support public inscriptions
-- Created: 2025-11-10

-- Make user_id nullable for public inscriptions
-- Note: SQLite doesn't support ALTER COLUMN, so we need to recreate the table

PRAGMA foreign_keys = OFF;

-- Create new table with updated schema
CREATE TABLE inscriptions_new (
  id TEXT PRIMARY KEY,
  user_id INTEGER, -- Now nullable for public inscriptions
  event_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed',
  inscription_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  payment_status TEXT DEFAULT 'pending',
  payment_amount INTEGER,
  notes TEXT,
  waitlist_position INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  -- Fields for public inscriptions
  nombre TEXT,
  apellido TEXT,
  email TEXT,
  telefono TEXT,
  tipo TEXT DEFAULT 'usuario' -- 'usuario' o 'publica'
);

-- Copy data from old table
INSERT INTO inscriptions_new 
SELECT id, user_id, event_id, status, inscription_date, payment_status, 
       payment_amount, notes, waitlist_position, created_at, updated_at,
       NULL, NULL, NULL, NULL, 'usuario'
FROM inscriptions;

-- Drop old table
DROP TABLE inscriptions;

-- Rename new table
ALTER TABLE inscriptions_new RENAME TO inscriptions;

-- Create indices
CREATE INDEX IF NOT EXISTS idx_inscriptions_user_id ON inscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_inscriptions_event_id ON inscriptions(event_id);
CREATE INDEX IF NOT EXISTS idx_inscriptions_status ON inscriptions(status);
CREATE INDEX IF NOT EXISTS idx_inscriptions_email ON inscriptions(email);

PRAGMA foreign_keys = ON;
