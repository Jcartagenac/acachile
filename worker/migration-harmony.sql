-- Script de migración para armonizar estructuras de tablas
-- ACA Chile - Actualización de schema para compatibilidad

-- Crear tabla usuarios con la estructura esperada por los nuevos servicios
CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  telefono TEXT,
  rut TEXT,
  ciudad TEXT,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  activo BOOLEAN NOT NULL DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME
);

-- Migrar datos existentes de users a usuarios
INSERT OR IGNORE INTO usuarios (email, nombre, apellido, telefono, ciudad, password_hash, role, activo)
SELECT 
  email,
  CASE 
    WHEN name LIKE '% %' THEN SUBSTR(name, 1, INSTR(name, ' ') - 1)
    ELSE name
  END as nombre,
  CASE 
    WHEN name LIKE '% %' THEN SUBSTR(name, INSTR(name, ' ') + 1)
    ELSE 'Usuario'
  END as apellido,
  phone as telefono,
  region as ciudad,
  COALESCE(password_hash, 'temp_hash') as password_hash,
  CASE 
    WHEN is_admin = 1 THEN 'admin'
    ELSE 'user'
  END as role,
  1 as activo
FROM users;

-- Crear índices para optimización
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_role ON usuarios(role);
CREATE INDEX IF NOT EXISTS idx_usuarios_activo ON usuarios(activo);

-- Crear índices para las tablas de noticias
CREATE INDEX IF NOT EXISTS idx_news_articles_status ON news_articles(status);
CREATE INDEX IF NOT EXISTS idx_news_articles_category ON news_articles(category_id);
CREATE INDEX IF NOT EXISTS idx_news_articles_published ON news_articles(published_at);
CREATE INDEX IF NOT EXISTS idx_news_comments_article ON news_comments(article_id);
CREATE INDEX IF NOT EXISTS idx_news_comments_status ON news_comments(status);