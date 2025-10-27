// Endpoint para aplicar migraciones de schema de socios
// POST /api/admin/migrate-socios-schema

/**
 * Agrega una columna a la tabla usuarios, manejando errores de duplicados
 */
async function addColumnToUsuarios(env, columnName, columnDef, results) {
  try {
    await env.DB.prepare(`
      ALTER TABLE usuarios ADD COLUMN ${columnName} ${columnDef}
    `).run();
    results.push(`✅ Campo ${columnName} agregado a usuarios`);
  } catch (e) {
    if (e.message.includes('duplicate column')) {
      results.push(`ℹ️ Campo ${columnName} ya existe en usuarios`);
    } else {
      throw e;
    }
  }
}

/**
 * Extiende la tabla usuarios con todos los campos de socios
 */
async function extenderTablaUsuarios(env, results) {
  await addColumnToUsuarios(env, 'direccion', 'TEXT', results);
  await addColumnToUsuarios(env, 'foto_url', 'TEXT', results);
  await addColumnToUsuarios(env, 'valor_cuota', 'INTEGER DEFAULT 6500', results);
  await addColumnToUsuarios(env, 'fecha_ingreso', 'DATETIME', results);
  await addColumnToUsuarios(env, 'estado_socio', "TEXT DEFAULT 'activo'", results);
}

/**
 * Crea la tabla configuracion_global
 */
async function crearTablaConfiguracion(env, results) {
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS configuracion_global (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        clave TEXT UNIQUE NOT NULL,
        valor TEXT NOT NULL,
        descripcion TEXT,
        tipo TEXT DEFAULT 'string',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
  results.push('✅ Tabla configuracion_global creada');
}

/**
 * Inserta configuraciones por defecto
 */
async function insertarConfiguraciones(env, results) {
  const configs = [
    ['cuota_default', '6500', 'Valor de cuota mensual por defecto (CLP)', 'number'],
    ['año_inicio_cuotas', '2025', 'Año de inicio del sistema de cuotas', 'number'],
    ['moneda', 'CLP', 'Moneda utilizada en el sistema', 'string'],
    ['metodos_pago', '["transferencia", "efectivo", "tarjeta"]', 'Métodos de pago aceptados', 'json']
  ];

  for (const [clave, valor, descripcion, tipo] of configs) {
    try {
      await env.DB.prepare(`
        INSERT OR IGNORE INTO configuracion_global (clave, valor, descripcion, tipo) 
        VALUES (?, ?, ?, ?)
      `).bind(clave, valor, descripcion, tipo).run();
      results.push(`✅ Configuración ${clave} insertada`);
    } catch (e) {
      results.push(`⚠️ Error insertando configuración ${clave}: ${e.message}`);
    }
  }
}

/**
 * Crea las tablas del sistema de cuotas
 */
async function crearTablasCuotas(env, results) {
  // Tabla cuotas
  await env.DB.prepare(`
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
    )
  `).run();
  results.push('✅ Tabla cuotas creada');

  // Tabla pagos
  await env.DB.prepare(`
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
    )
  `).run();
  results.push('✅ Tabla pagos creada');

  // Tabla generacion_cuotas
  await env.DB.prepare(`
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
    )
  `).run();
  results.push('✅ Tabla generacion_cuotas creada');
}

/**
 * Crea índices para optimizar consultas
 */
async function crearIndices(env, results) {
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_cuotas_usuario_año ON cuotas(usuario_id, año)',
    'CREATE INDEX IF NOT EXISTS idx_cuotas_año_mes ON cuotas(año, mes)',
    'CREATE INDEX IF NOT EXISTS idx_cuotas_pagado ON cuotas(pagado)',
    'CREATE INDEX IF NOT EXISTS idx_cuotas_fecha_pago ON cuotas(fecha_pago)'
  ];

  for (const indexSQL of indexes) {
    await env.DB.prepare(indexSQL).run();
  }
  results.push('✅ Índices creados');
}

import { requireAdmin, authErrorResponse, errorResponse, jsonResponse } from '../../_middleware';

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    console.log('[ADMIN MIGRATE] Iniciando migración de esquema de socios');

    try {
      await requireAdmin(request, env);
    } catch (error) {
      return authErrorResponse(error, env);
    }

    const results = [];

    // Ejecutar migraciones en orden
    await extenderTablaUsuarios(env, results);
    await crearTablaConfiguracion(env, results);
    await insertarConfiguraciones(env, results);
    await crearTablasCuotas(env, results);
    await crearIndices(env, results);

    console.log('[ADMIN MIGRATE] Migración completada exitosamente');

    return jsonResponse({
      success: true,
      message: 'Migración de esquema de socios completada exitosamente',
      results
    });

  } catch (error) {
    console.error('[ADMIN MIGRATE] Error en migración:', error);
    
    return errorResponse(
      `Error aplicando migración: ${error instanceof Error ? error.message : String(error)}`,
      500
    );
  }
}
