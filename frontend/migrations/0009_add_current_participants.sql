-- Migration: Add current_participants column to eventos table
-- Created: 2025-11-10

-- Add current_participants column (default 0)
ALTER TABLE eventos ADD COLUMN current_participants INTEGER DEFAULT 0 NOT NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_eventos_current_participants ON eventos(current_participants);

-- Update existing eventos to set current_participants based on inscripciones
-- This is a one-time update for existing data
-- Note: This assumes inscripciones are stored in KV and will need manual sync
