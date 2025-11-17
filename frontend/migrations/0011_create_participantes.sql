-- Migration: Create participantes table for raffle system
-- Created: 2025-01-XX

-- Create participantes table
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

-- Create indices for better query performance
CREATE INDEX IF NOT EXISTS idx_participantes_rut ON participantes(rut);
CREATE INDEX IF NOT EXISTS idx_participantes_email ON participantes(email);
CREATE INDEX IF NOT EXISTS idx_participantes_created_at ON participantes(created_at);
