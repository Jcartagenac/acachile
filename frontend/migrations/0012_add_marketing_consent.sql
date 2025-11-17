-- Migration: Add marketing consent field to participantes table
-- Created: 2025-11-17

-- Add marketing consent column
ALTER TABLE participantes ADD COLUMN accepts_marketing INTEGER DEFAULT 0 NOT NULL;

-- Create index for marketing consent queries
CREATE INDEX IF NOT EXISTS idx_participantes_marketing ON participantes(accepts_marketing);
