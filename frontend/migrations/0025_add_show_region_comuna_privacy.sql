-- Migration 0025: Add show_region_comuna to user_privacy_settings
-- Allows users to control visibility of region and comuna separately from address
-- Created: 2025-12-02

ALTER TABLE user_privacy_settings ADD COLUMN show_region_comuna INTEGER DEFAULT 0;

-- Migration complete
-- Users can now control visibility of region/comuna independently from full address
