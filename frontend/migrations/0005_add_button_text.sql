-- Migration: Add button_text column to eventos table
-- Created: 2025-11-10

ALTER TABLE eventos ADD COLUMN button_text TEXT DEFAULT NULL;
