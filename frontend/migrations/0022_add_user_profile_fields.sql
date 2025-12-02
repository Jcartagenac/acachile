-- Migración 0022: Agregar campos de perfil a usuarios (fecha_nacimiento, comuna, region)
-- y asegurar que RUT sea único mientras que email puede repetirse
-- Fecha: 2025-12-02

-- Paso 1: Limpiar RUTs duplicados (mantener solo el registro más antiguo)
-- Primero marcamos temporalmente los duplicados
UPDATE usuarios 
SET rut = rut || '_dup_' || id 
WHERE id NOT IN (
  SELECT MIN(id) 
  FROM usuarios 
  WHERE rut IS NOT NULL AND rut != ''
  GROUP BY rut
) AND rut IS NOT NULL AND rut != '';

-- Paso 2: Crear índice único en RUT si no existe
CREATE UNIQUE INDEX IF NOT EXISTS idx_usuarios_rut_unique ON usuarios(rut) WHERE rut IS NOT NULL AND rut != '';

-- Paso 3: Agregar campo fecha_nacimiento
ALTER TABLE usuarios ADD COLUMN fecha_nacimiento DATE;

-- Paso 4: Agregar campo comuna
ALTER TABLE usuarios ADD COLUMN comuna TEXT;

-- Paso 5: Agregar campo region
ALTER TABLE usuarios ADD COLUMN region TEXT;

-- Paso 6: Crear índice para búsquedas por comuna
CREATE INDEX IF NOT EXISTS idx_usuarios_comuna ON usuarios(comuna);

-- Paso 7: Crear índice para búsquedas por region
CREATE INDEX IF NOT EXISTS idx_usuarios_region ON usuarios(region);

-- Nota: Los registros con RUTs duplicados ahora tienen sufijo _dup_{id}
-- El admin deberá revisar y corregir estos registros manualmente

-- Verificación
-- SELECT name, sql FROM sqlite_master WHERE type='table' AND name='usuarios';
