-- Migration: Add index on inscriptions.created_at for ORDER BY performance
-- Created: 2024-11-21
-- Purpose: Optimize ORDER BY created_at DESC in inscriptions queries
-- The /api/eventos/[id]/inscripciones endpoint sorts by created_at without an index

-- Add index on created_at column in inscriptions table
CREATE INDEX IF NOT EXISTS idx_inscriptions_created_at ON inscriptions(created_at);

-- Expected performance improvement:
-- - ORDER BY created_at DESC will use index scan instead of full table sort
-- - Particularly helpful for events with many inscriptions (>100)
-- - Minimal storage overhead (timestamp index is small)
