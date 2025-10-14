/**
 * Esquema D1 para Sistema de Noticias
 * ACA Chile - Blog y Noticias
 */

-- Tabla de categorías de noticias
CREATE TABLE IF NOT EXISTS news_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#6B7280',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de etiquetas/tags
CREATE TABLE IF NOT EXISTS news_tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#6B7280',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Tabla principal de noticias
CREATE TABLE IF NOT EXISTS news_articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  featured_image TEXT,
  author_id INTEGER NOT NULL,
  category_id INTEGER,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  is_featured BOOLEAN DEFAULT FALSE,
  view_count INTEGER DEFAULT 0,
  published_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES users(id),
  FOREIGN KEY (category_id) REFERENCES news_categories(id)
);

-- Tabla de relación many-to-many entre noticias y tags
CREATE TABLE IF NOT EXISTS news_article_tags (
  article_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  PRIMARY KEY (article_id, tag_id),
  FOREIGN KEY (article_id) REFERENCES news_articles(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES news_tags(id) ON DELETE CASCADE
);

-- Tabla de comentarios (opcional)
CREATE TABLE IF NOT EXISTS news_comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  article_id INTEGER NOT NULL,
  author_name TEXT NOT NULL,
  author_email TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'spam', 'rejected')),
  parent_id INTEGER, -- Para respuestas a comentarios
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (article_id) REFERENCES news_articles(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES news_comments(id) ON DELETE CASCADE
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_news_articles_status ON news_articles(status);
CREATE INDEX IF NOT EXISTS idx_news_articles_published_at ON news_articles(published_at);
CREATE INDEX IF NOT EXISTS idx_news_articles_category ON news_articles(category_id);
CREATE INDEX IF NOT EXISTS idx_news_articles_author ON news_articles(author_id);
CREATE INDEX IF NOT EXISTS idx_news_articles_featured ON news_articles(is_featured);
CREATE INDEX IF NOT EXISTS idx_news_comments_article ON news_comments(article_id);
CREATE INDEX IF NOT EXISTS idx_news_comments_status ON news_comments(status);

-- Trigger para actualizar updated_at
CREATE TRIGGER IF NOT EXISTS update_news_articles_updated_at
  AFTER UPDATE ON news_articles
  FOR EACH ROW
  BEGIN
    UPDATE news_articles 
    SET updated_at = CURRENT_TIMESTAMP 
    WHERE id = NEW.id;
  END;

-- Insertar categorías iniciales
INSERT OR IGNORE INTO news_categories (name, slug, description, color) VALUES
  ('Eventos', 'eventos', 'Noticias sobre eventos y competencias', '#EF4444'),
  ('Torneos', 'torneos', 'Cobertura de torneos y campeonatos', '#F59E0B'),
  ('Talleres', 'talleres', 'Información sobre talleres y capacitaciones', '#3B82F6'),
  ('Técnicas', 'tecnicas', 'Tips y técnicas de asado', '#10B981'),
  ('Miembros', 'miembros', 'Destacados y entrevistas a miembros', '#8B5CF6'),
  ('General', 'general', 'Noticias generales de ACA Chile', '#6B7280');

-- Insertar tags iniciales
INSERT OR IGNORE INTO news_tags (name, slug, color) VALUES
  ('Asado', 'asado', '#EF4444'),
  ('Parrilla', 'parrilla', '#DC2626'),
  ('Competencia', 'competencia', '#F59E0B'),
  ('Técnicas', 'tecnicas', '#10B981'),
  ('Carbón', 'carbon', '#374151'),
  ('Leña', 'lena', '#92400E'),
  ('Costillar', 'costillar', '#7C2D12'),
  ('Chorizo', 'chorizo', '#B91C1C'),
  ('Entrevista', 'entrevista', '#8B5CF6'),
  ('Regional', 'regional', '#3B82F6'),
  ('Nacional', 'nacional', '#1D4ED8'),
  ('Internacional', 'internacional', '#1E40AF');