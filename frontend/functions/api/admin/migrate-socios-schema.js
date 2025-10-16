// Endpoint para aplicar migraciones de schema de socios
// POST /api/admin/migrate-socios-schema

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    console.log('[ADMIN MIGRATE] Iniciando migración de esquema de socios');

    // TODO: Verificar permisos de administrador
    // const user = requireAuth(request, env);
    // if (!user || user.role !== 'admin') {
    //   return new Response(JSON.stringify({
    //     success: false,
    //     error: 'Acceso denegado. Se requieren permisos de administrador.'
    //   }), { status: 403, headers: { 'Content-Type': 'application/json' } });
    // }

    const results = [];

    // 1. Extender tabla usuarios con campos de socios
    try {
      await env.DB.prepare(`
        ALTER TABLE usuarios ADD COLUMN direccion TEXT
      `).run();
      results.push('✅ Campo direccion agregado a usuarios');
    } catch (e) {
      if (e.message.includes('duplicate column')) {
        results.push('ℹ️ Campo direccion ya existe en usuarios');
      } else {
        throw e;
      }
    }

    try {
      await env.DB.prepare(`
        ALTER TABLE usuarios ADD COLUMN foto_url TEXT
      `).run();
      results.push('✅ Campo foto_url agregado a usuarios');
    } catch (e) {
      if (e.message.includes('duplicate column')) {
        results.push('ℹ️ Campo foto_url ya existe en usuarios');
      } else {
        throw e;
      }
    }

    try {
      await env.DB.prepare(`
        ALTER TABLE usuarios ADD COLUMN valor_cuota INTEGER DEFAULT 6500
      `).run();
      results.push('✅ Campo valor_cuota agregado a usuarios');
    } catch (e) {
      if (e.message.includes('duplicate column')) {
        results.push('ℹ️ Campo valor_cuota ya existe en usuarios');
      } else {
        throw e;
      }
    }

    try {
      await env.DB.prepare(`
        ALTER TABLE usuarios ADD COLUMN fecha_ingreso DATETIME DEFAULT CURRENT_TIMESTAMP
      `).run();
      results.push('✅ Campo fecha_ingreso agregado a usuarios');
    } catch (e) {
      if (e.message.includes('duplicate column')) {
        results.push('ℹ️ Campo fecha_ingreso ya existe en usuarios');
      } else {
        throw e;
      }
    }

    try {
      await env.DB.prepare(`
        ALTER TABLE usuarios ADD COLUMN estado_socio TEXT DEFAULT 'activo'
      `).run();
      results.push('✅ Campo estado_socio agregado a usuarios');
    } catch (e) {
      if (e.message.includes('duplicate column')) {
        results.push('ℹ️ Campo estado_socio ya existe en usuarios');
      } else {
        throw e;
      }
    }

    // 2. Crear tabla configuracion_global
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

    // 3. Insertar configuraciones por defecto
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

    // 4. Crear tabla cuotas
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

    // 5. Crear tabla pagos
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

    // 6. Crear tabla generacion_cuotas
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

    // 7. Crear índices
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

    console.log('[ADMIN MIGRATE] Migración completada exitosamente');

    return new Response(JSON.stringify({
      success: true,
      message: 'Migración de esquema de socios completada exitosamente',
      results
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[ADMIN MIGRATE] Error en migración:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: `Error aplicando migración: ${error.message}`
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}