-- Esquema para sistema de socios y cuotas
-- ACA Chile - Sistema de gestión de socios

-- =============================================================================
-- TABLAS DE REFERENCIA PARA VALORES PERMITIDOS (evita duplicación de strings)
-- =============================================================================

-- Tabla de referencia para métodos de pago
CREATE TABLE IF NOT EXISTS ref_metodos_pago (
    codigo TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    activo BOOLEAN DEFAULT TRUE
);

INSERT OR IGNORE INTO ref_metodos_pago (codigo, nombre) VALUES 
('transferencia', 'Transferencia Bancaria'),
('efectivo', 'Efectivo'),
('tarjeta', 'Tarjeta de Crédito/Débito');

-- Tabla de referencia para estados de socio
CREATE TABLE IF NOT EXISTS ref_estados_socio (
    codigo TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    descripcion TEXT
);

INSERT OR IGNORE INTO ref_estados_socio (codigo, nombre, descripcion) VALUES 
('activo', 'Activo', 'Socio con membresía activa'),
('inactivo', 'Inactivo', 'Socio temporalmente inactivo'),
('suspendido', 'Suspendido', 'Socio suspendido por incumplimiento');

-- Tabla de referencia para estados de pago
CREATE TABLE IF NOT EXISTS ref_estados_pago (
    codigo TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    descripcion TEXT
);

INSERT OR IGNORE INTO ref_estados_pago (codigo, nombre, descripcion) VALUES 
('pendiente', 'Pendiente', 'Pago pendiente de procesamiento'),
('confirmado', 'Confirmado', 'Pago confirmado y procesado'),
('rechazado', 'Rechazado', 'Pago rechazado o inválido');

-- =============================================================================
-- ESQUEMA PRINCIPAL
-- =============================================================================

-- Extender tabla usuarios para incluir campos de socios
-- (La tabla usuarios ya existe, solo agregamos campos)
ALTER TABLE usuarios ADD COLUMN direccion TEXT;
ALTER TABLE usuarios ADD COLUMN foto_url TEXT;
ALTER TABLE usuarios ADD COLUMN valor_cuota INTEGER DEFAULT 6500; -- Valor individual por socio
ALTER TABLE usuarios ADD COLUMN fecha_ingreso DATETIME DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE usuarios ADD COLUMN estado_socio TEXT DEFAULT 'activo' 
    REFERENCES ref_estados_socio(codigo);

-- Tabla de configuración global del sistema
CREATE TABLE IF NOT EXISTS configuracion_global (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clave TEXT UNIQUE NOT NULL,
    valor TEXT NOT NULL,
    descripcion TEXT,
    tipo TEXT DEFAULT 'string',  -- Tipos: string, number, boolean, json
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insertar configuraciones por defecto
INSERT OR IGNORE INTO configuracion_global (clave, valor, descripcion, tipo) VALUES 
('cuota_default', '6500', 'Valor de cuota mensual por defecto (CLP)', 'number'),
('año_inicio_cuotas', '2025', 'Año de inicio del sistema de cuotas', 'number'),
('moneda', 'CLP', 'Moneda utilizada en el sistema', 'string'),
('metodos_pago', '["transferencia", "efectivo", "tarjeta"]', 'Métodos de pago aceptados', 'json');

-- Tabla principal de cuotas anuales por socio
CREATE TABLE IF NOT EXISTS cuotas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    año INTEGER NOT NULL,
    mes INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
    valor INTEGER NOT NULL, -- Valor de la cuota en ese momento
    pagado BOOLEAN DEFAULT FALSE,
    fecha_pago DATETIME NULL,
    metodo_pago TEXT REFERENCES ref_metodos_pago(codigo),
    comprobante_url TEXT NULL, -- URL del comprobante en R2
    notas TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- Restricciones
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id),
    UNIQUE(usuario_id, año, mes) -- Un solo registro por socio/año/mes
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_cuotas_usuario_año ON cuotas(usuario_id, año);
CREATE INDEX IF NOT EXISTS idx_cuotas_año_mes ON cuotas(año, mes);
CREATE INDEX IF NOT EXISTS idx_cuotas_pagado ON cuotas(pagado);
CREATE INDEX IF NOT EXISTS idx_cuotas_fecha_pago ON cuotas(fecha_pago);

-- Tabla de pagos (para historial detallado y conciliación)
CREATE TABLE IF NOT EXISTS pagos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cuota_id INTEGER NOT NULL,
    usuario_id INTEGER NOT NULL,
    monto INTEGER NOT NULL,
    metodo_pago TEXT NOT NULL REFERENCES ref_metodos_pago(codigo),
    comprobante_url TEXT,
    estado TEXT DEFAULT 'pendiente' REFERENCES ref_estados_pago(codigo),
    fecha_pago DATETIME NOT NULL,
    procesado_por INTEGER NULL, -- ID del admin que procesó
    notas_admin TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (cuota_id) REFERENCES cuotas (id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id),
    FOREIGN KEY (procesado_por) REFERENCES usuarios (id)
);

-- Tabla para generar cuotas automáticamente
CREATE TABLE IF NOT EXISTS generacion_cuotas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    año INTEGER NOT NULL,
    mes INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
    valor_default INTEGER NOT NULL,
    generadas INTEGER DEFAULT 0, -- Cantidad de cuotas generadas
    generado_por INTEGER NOT NULL,
    fecha_generacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (generado_por) REFERENCES usuarios (id),
    UNIQUE(año, mes)
);

-- Función para generar cuotas mensuales para todos los socios activos
-- (Se implementará en el backend como stored procedure o función)

-- Trigger para actualizar updated_at en cuotas
CREATE TRIGGER IF NOT EXISTS update_cuotas_timestamp 
AFTER UPDATE ON cuotas
BEGIN
    UPDATE cuotas SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Trigger para actualizar updated_at en pagos
CREATE TRIGGER IF NOT EXISTS update_pagos_timestamp 
AFTER UPDATE ON pagos
BEGIN
    UPDATE pagos SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Trigger para actualizar configuracion_global
CREATE TRIGGER IF NOT EXISTS update_config_timestamp 
AFTER UPDATE ON configuracion_global
BEGIN
    UPDATE configuracion_global SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Vista para obtener estado de cuotas por socio y año
CREATE VIEW IF NOT EXISTS vista_estado_cuotas AS
SELECT 
    u.id as usuario_id,
    u.nombre,
    u.apellido,
    u.email,
    c.año,
    c.mes,
    c.valor,
    c.pagado,
    c.fecha_pago,
    c.metodo_pago,
    c.comprobante_url,
    CASE 
        WHEN c.pagado = 1 THEN 'PAGADO'
        WHEN DATE('now') > DATE(c.año || '-' || printf('%02d', c.mes) || '-28') THEN 'VENCIDO'
        ELSE 'PENDIENTE'
    END as estado
FROM usuarios u
LEFT JOIN cuotas c ON u.id = c.usuario_id
WHERE u.activo = 1 AND u.estado_socio = 'activo'
ORDER BY u.apellido, u.nombre, c.año DESC, c.mes DESC;

-- Vista resumen anual por socio
CREATE VIEW IF NOT EXISTS vista_resumen_anual_socio AS
SELECT 
    u.id as usuario_id,
    u.nombre,
    u.apellido,
    u.email,
    c.año,
    COUNT(*) as total_cuotas,
    SUM(CASE WHEN c.pagado = 1 THEN 1 ELSE 0 END) as cuotas_pagadas,
    COUNT(*) - SUM(CASE WHEN c.pagado = 1 THEN 1 ELSE 0 END) as cuotas_pendientes,
    SUM(c.valor) as monto_total,
    SUM(CASE WHEN c.pagado = 1 THEN c.valor ELSE 0 END) as monto_pagado,
    SUM(CASE WHEN c.pagado = 0 THEN c.valor ELSE 0 END) as monto_pendiente
FROM usuarios u
LEFT JOIN cuotas c ON u.id = c.usuario_id
WHERE u.activo = 1 AND u.estado_socio = 'activo'
GROUP BY u.id, c.año
ORDER BY u.apellido, u.nombre, c.año DESC;

-- Datos de ejemplo para testing (opcional)
-- INSERT OR IGNORE INTO cuotas (usuario_id, año, mes, valor, pagado, fecha_pago, metodo_pago) 
-- SELECT id, 2025, 1, 6500, 1, '2025-01-15 10:30:00', 'transferencia' FROM usuarios WHERE activo = 1 LIMIT 5;