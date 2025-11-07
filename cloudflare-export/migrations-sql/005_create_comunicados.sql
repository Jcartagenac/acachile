-- Crear tabla de comunicados
CREATE TABLE IF NOT EXISTS comunicados (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  titulo TEXT NOT NULL,
  contenido TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK(tipo IN ('importante', 'corriente', 'urgente')),
  destinatarios TEXT NOT NULL, -- JSON array: ["todos"] o ["morosos"] o ["activos"]
  fecha_envio DATETIME,
  estado TEXT NOT NULL DEFAULT 'borrador' CHECK(estado IN ('borrador', 'enviado')),
  created_by INTEGER, -- ID del admin que creó el comunicado
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES usuarios(id)
);

-- Índices para mejorar búsquedas
CREATE INDEX IF NOT EXISTS idx_comunicados_estado ON comunicados(estado);
CREATE INDEX IF NOT EXISTS idx_comunicados_tipo ON comunicados(tipo);
CREATE INDEX IF NOT EXISTS idx_comunicados_fecha_envio ON comunicados(fecha_envio DESC);
