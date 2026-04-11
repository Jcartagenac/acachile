CREATE TABLE IF NOT EXISTS portal_documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  section_key TEXT NOT NULL DEFAULT 'documentos',
  file_name TEXT NOT NULL,
  visible_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_key TEXT,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
