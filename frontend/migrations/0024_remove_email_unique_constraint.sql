-- Migration 0024: Remove UNIQUE constraint from email column
-- This allows multiple users to share the same email address
-- RUT is now the unique identifier instead of email
-- Created: 2025-12-02

-- SQLite doesn't support DROP CONSTRAINT directly, so we need to recreate the table

-- Disable foreign key checks during migration
PRAGMA foreign_keys=OFF;

-- Step 1: Create new table without UNIQUE constraint on email
-- Column order matches PRAGMA table_info output
CREATE TABLE usuarios_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,  -- NO UNIQUE constraint here
    nombre TEXT NOT NULL,
    apellido TEXT NOT NULL,
    telefono TEXT,
    rut TEXT,  -- RUT has UNIQUE constraint from migration 0022
    ciudad TEXT,
    password_hash TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    activo BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME,
    direccion TEXT,
    foto_url TEXT,
    valor_cuota INTEGER DEFAULT 6500,
    fecha_ingreso DATETIME,
    estado_socio TEXT DEFAULT 'activo',
    lista_negra INTEGER DEFAULT 0,
    motivo_lista_negra TEXT,
    fecha_nacimiento DATE,
    comuna TEXT,
    region TEXT,
    red_social TEXT
);

-- Step 2: Copy all data from old table to new table
INSERT INTO usuarios_new 
SELECT * FROM usuarios;

-- Step 3: Drop old table
DROP TABLE usuarios;

-- Step 4: Rename new table to original name
ALTER TABLE usuarios_new RENAME TO usuarios;

-- Step 5: Recreate indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_usuarios_rut_unique ON usuarios(rut) WHERE rut IS NOT NULL AND rut != '';
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_activo ON usuarios(activo);
CREATE INDEX IF NOT EXISTS idx_usuarios_role ON usuarios(role);
CREATE INDEX IF NOT EXISTS idx_usuarios_estado_socio ON usuarios(estado_socio);
CREATE INDEX IF NOT EXISTS idx_usuarios_comuna ON usuarios(comuna);
CREATE INDEX IF NOT EXISTS idx_usuarios_region ON usuarios(region);
CREATE INDEX IF NOT EXISTS idx_usuarios_red_social ON usuarios(red_social);

-- Re-enable foreign key checks
PRAGMA foreign_keys=ON;

-- Migration complete
-- Email is no longer UNIQUE
-- RUT remains as the unique identifier
-- Multiple users can now share the same email address
