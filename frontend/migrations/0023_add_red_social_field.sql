-- Migration 0023: Add red_social field to usuarios table
-- This field stores social media profile URL (Instagram, Facebook, etc.)
-- Created: 2025-12-02

-- Step 1: Add red_social column to usuarios table
ALTER TABLE usuarios ADD COLUMN red_social TEXT;

-- Step 2: Create index for red_social searches (optional, for performance)
CREATE INDEX IF NOT EXISTS idx_usuarios_red_social ON usuarios(red_social);

-- Migration complete
-- Next steps:
-- 1. Update TypeScript interfaces (Socio, UserProfile, CreateSocioData)
-- 2. Update CSV import logic to include red_social column
-- 3. Update ProfileModule to display social media link
-- 4. Update AdminSocios forms to include red_social field
