-- Migration: Create guestbook (libro de visitas) table
-- Created: 2024-11-24
-- Purpose: Allow users to leave comments/messages with optional image

CREATE TABLE IF NOT EXISTS guestbook (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  social_network TEXT, -- 'facebook', 'instagram', 'twitter', 'linkedin', 'none', etc.
  social_handle TEXT, -- Username/handle en la red social
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  image_url TEXT, -- Optional image URL
  status TEXT DEFAULT 'published' CHECK(status IN ('pending', 'published', 'archived')),
  deleted_at DATETIME, -- Soft delete for papelera (trash bin)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  ip_address TEXT, -- Para tracking
  user_agent TEXT -- Para tracking
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_guestbook_status ON guestbook(status);
CREATE INDEX IF NOT EXISTS idx_guestbook_created_at ON guestbook(created_at);
CREATE INDEX IF NOT EXISTS idx_guestbook_deleted_at ON guestbook(deleted_at);
CREATE INDEX IF NOT EXISTS idx_guestbook_email ON guestbook(email);

-- Comments for documentation
-- status: 'pending' = awaiting approval, 'published' = visible, 'archived' = hidden but not deleted
-- deleted_at: NULL = active, timestamp = in trash (soft delete, recoverable for 30 days)
