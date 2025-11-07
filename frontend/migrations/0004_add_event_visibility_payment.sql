-- Migration: Add is_public and payment_link to eventos table
-- Created: 2025-11-07

-- Add is_public column (default true - eventos son públicos por defecto)
ALTER TABLE eventos ADD COLUMN is_public INTEGER DEFAULT 1 NOT NULL;

-- Add payment_link column (nullable - no todos los eventos requieren pago)
ALTER TABLE eventos ADD COLUMN payment_link TEXT;

-- Create index for filtering public events
CREATE INDEX IF NOT EXISTS idx_eventos_is_public ON eventos(is_public);
