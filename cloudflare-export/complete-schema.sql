-- ============================================================
-- SCHEMA COMPLETO PARA NUEVA CUENTA
-- ============================================================

-- Crear tabla usuarios primero (base)
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
  last_login DATETIME,
  direccion TEXT,
  foto_url TEXT,
  valor_cuota INTEGER DEFAULT 6500,
  fecha_ingreso DATETIME,
  estado_socio TEXT DEFAULT 'activo',
  lista_negra INTEGER DEFAULT 0,
  motivo_lista_negra TEXT
);

-- Tabla de configuración global
CREATE TABLE IF NOT EXISTS configuracion_global (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clave TEXT UNIQUE NOT NULL,
    valor TEXT NOT NULL,
    descripcion TEXT,
    tipo TEXT DEFAULT 'string',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de roles
CREATE TABLE IF NOT EXISTS roles_catalog (
    key TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    description TEXT,
    priority INTEGER DEFAULT 100,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de privacidad de usuarios
CREATE TABLE IF NOT EXISTS user_privacy_settings (
    user_id INTEGER PRIMARY KEY,
    show_email INTEGER DEFAULT 0,
    show_phone INTEGER DEFAULT 0,
    show_rut INTEGER DEFAULT 0,
    show_address INTEGER DEFAULT 0,
    show_birthdate INTEGER DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    show_public_profile INTEGER DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES usuarios(id)
);

-- Tabla de cuotas
CREATE TABLE IF NOT EXISTS cuotas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    año INTEGER NOT NULL,
    mes INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
    valor INTEGER NOT NULL,
    pagado BOOLEAN DEFAULT FALSE,
    fecha_pago DATETIME NULL,
    metodo_pago TEXT,
    comprobante_url TEXT NULL,
    notas TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id),
    UNIQUE(usuario_id, año, mes)
);

-- Tabla de generación de cuotas
CREATE TABLE IF NOT EXISTS generacion_cuotas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    año INTEGER NOT NULL,
    mes INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
    valor_default INTEGER NOT NULL,
    generadas INTEGER DEFAULT 0,
    generado_por INTEGER NOT NULL,
    fecha_generacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (generado_por) REFERENCES usuarios (id),
    UNIQUE(año, mes)
);

-- Tabla de pagos
CREATE TABLE IF NOT EXISTS pagos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cuota_id INTEGER NOT NULL,
    usuario_id INTEGER NOT NULL,
    monto INTEGER NOT NULL,
    metodo_pago TEXT NOT NULL,
    comprobante_url TEXT,
    estado TEXT DEFAULT 'pendiente',
    fecha_pago DATETIME NOT NULL,
    procesado_por INTEGER NULL,
    notas_admin TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cuota_id) REFERENCES cuotas (id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id),
    FOREIGN KEY (procesado_por) REFERENCES usuarios (id)
);

-- Tabla de comunicados
CREATE TABLE IF NOT EXISTS comunicados (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  titulo TEXT NOT NULL,
  contenido TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK(tipo IN ('importante', 'corriente', 'urgente')),
  destinatarios TEXT NOT NULL,
  fecha_envio DATETIME,
  estado TEXT NOT NULL DEFAULT 'borrador' CHECK(estado IN ('borrador', 'enviado')),
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES usuarios(id)
);

-- Tabla de eventos
CREATE TABLE IF NOT EXISTS eventos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  date TEXT NOT NULL,
  time TEXT,
  location TEXT NOT NULL,
  image TEXT,
  type TEXT DEFAULT 'encuentro',
  status TEXT DEFAULT 'draft',
  registration_open BOOLEAN DEFAULT 1,
  max_participants INTEGER,
  price REAL DEFAULT 0,
  organizer_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  end_date TEXT,
  FOREIGN KEY (organizer_id) REFERENCES usuarios(id)
);

-- Tabla de postulaciones
CREATE TABLE IF NOT EXISTS postulaciones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  rut TEXT,
  birthdate TEXT,
  region TEXT,
  city TEXT,
  occupation TEXT,
  experience_level TEXT NOT NULL,
  specialties TEXT,
  motivation TEXT NOT NULL,
  contribution TEXT NOT NULL,
  availability TEXT NOT NULL,
  has_competition_experience INTEGER DEFAULT 0,
  competition_details TEXT,
  instagram TEXT,
  other_networks TEXT,
  references_info TEXT,
  photo_url TEXT,
  status TEXT NOT NULL DEFAULT 'pendiente' CHECK(status IN ('pendiente','en_revision','aprobada','rechazada')),
  approvals_required INTEGER NOT NULL DEFAULT 2,
  approvals_count INTEGER NOT NULL DEFAULT 0,
  rejection_reason TEXT,
  approved_at DATETIME,
  rejected_at DATETIME,
  socio_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (socio_id) REFERENCES usuarios(id)
);

-- Tabla de aprobaciones de postulaciones
CREATE TABLE IF NOT EXISTS postulacion_aprobaciones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  postulacion_id INTEGER NOT NULL,
  approver_id INTEGER NOT NULL,
  approver_role TEXT NOT NULL,
  comment TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (postulacion_id) REFERENCES postulaciones(id) ON DELETE CASCADE,
  FOREIGN KEY (approver_id) REFERENCES usuarios(id),
  UNIQUE(postulacion_id, approver_id)
);

-- Tablas de noticias
CREATE TABLE IF NOT EXISTS news_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#6B7280',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS news_tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  color TEXT DEFAULT '#6B7280',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

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
  FOREIGN KEY (author_id) REFERENCES usuarios(id),
  FOREIGN KEY (category_id) REFERENCES news_categories(id)
);

CREATE TABLE IF NOT EXISTS news_article_tags (
  article_id INTEGER NOT NULL,
  tag_id INTEGER NOT NULL,
  PRIMARY KEY (article_id, tag_id),
  FOREIGN KEY (article_id) REFERENCES news_articles(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES news_tags(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS news_comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  article_id INTEGER NOT NULL,
  author_name TEXT NOT NULL,
  author_email TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'spam', 'rejected')),
  parent_id INTEGER,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (article_id) REFERENCES news_articles(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES news_comments(id) ON DELETE CASCADE
);

-- Tabla de secciones del sitio
CREATE TABLE IF NOT EXISTS site_sections (
  page TEXT NOT NULL,
  key TEXT NOT NULL,
  title TEXT,
  image_url TEXT,
  content TEXT,
  sort_order INTEGER DEFAULT 0,
  source_type TEXT DEFAULT 'custom',
  source_id TEXT,
  cta_label TEXT,
  cta_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (page, key)
);

-- Tablas adicionales para compatibilidad
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  region TEXT,
  password_hash TEXT,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  date TEXT NOT NULL,
  time TEXT,
  location TEXT NOT NULL,
  image TEXT,
  type TEXT NOT NULL CHECK (type IN ('campeonato', 'taller', 'encuentro', 'torneo')),
  registration_open BOOLEAN DEFAULT TRUE,
  max_participants INTEGER,
  current_participants INTEGER DEFAULT 0,
  price INTEGER DEFAULT 0,
  requirements TEXT,
  tags TEXT,
  contact_info TEXT,
  organizer_id INTEGER NOT NULL,
  status TEXT DEFAULT 'published' CHECK (status IN ('draft', 'published', 'cancelled', 'completed')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organizer_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS inscriptions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  event_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'pending', 'cancelled', 'waitlist')),
  inscription_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_amount INTEGER,
  notes TEXT,
  waitlist_position INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (event_id) REFERENCES events(id),
  UNIQUE(user_id, event_id)
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_cuotas_usuario_año ON cuotas(usuario_id, año);
CREATE INDEX IF NOT EXISTS idx_cuotas_pagado ON cuotas(pagado);
CREATE INDEX IF NOT EXISTS idx_comunicados_estado ON comunicados(estado);
CREATE INDEX IF NOT EXISTS idx_eventos_date ON eventos(date);
CREATE INDEX IF NOT EXISTS idx_postulaciones_status ON postulaciones(status);
