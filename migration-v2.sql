-- Migration v2: Add lista_negra and end_date columns
-- Execute these statements in order

-- Add lista_negra column to usuarios table
ALTER TABLE usuarios ADD COLUMN lista_negra INTEGER DEFAULT 0;

-- Add motivo_lista_negra column to usuarios table
ALTER TABLE usuarios ADD COLUMN motivo_lista_negra TEXT;

-- Migrate existing estado_socio values
UPDATE usuarios
SET estado_socio = CASE
  WHEN estado_socio = 'inactivo' THEN 'renunciado'
  WHEN estado_socio = 'suspendido' THEN 'expulsado'
  ELSE estado_socio
END
WHERE estado_socio IN ('inactivo', 'suspendido');

-- Add end_date column to events table
ALTER TABLE events ADD COLUMN end_date DATETIME;