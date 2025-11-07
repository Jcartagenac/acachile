#!/bin/bash

# ============================================================
# EXPORTADOR COMPLETO DE D1 DATABASE
# ============================================================
# Este script exporta toda la estructura y datos de D1
# en formato compatible para importación
# ============================================================

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_info() { echo -e "${BLUE}ℹ $1${NC}"; }
print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠ $1${NC}"; }

DB_NAME="acachile-db"
EXPORT_DIR="./cloudflare-export/database"

print_info "Exportando base de datos: $DB_NAME"

# Crear directorio si no existe
mkdir -p "$EXPORT_DIR/sql-dumps"

# ============================================================
# Exportar esquema completo
# ============================================================
print_info "Exportando esquema de tablas..."

wrangler d1 execute "$DB_NAME" --remote \
  --command="SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' ORDER BY name" \
  --json > "$EXPORT_DIR/full-schema.json"

print_success "Esquema exportado"

# ============================================================
# Exportar datos tabla por tabla
# ============================================================

# Obtener lista de tablas
TABLES=$(wrangler d1 execute "$DB_NAME" --remote \
  --command="SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' ORDER BY name" \
  --json | jq -r '.[0].results[].name')

print_info "Tablas encontradas:"
echo "$TABLES"

for table in $TABLES; do
    print_info "Exportando tabla: $table"
    
    # Exportar en formato JSON
    wrangler d1 execute "$DB_NAME" --remote \
      --command="SELECT * FROM $table" \
      --json > "$EXPORT_DIR/${table}_full.json" 2>/dev/null || print_warning "No se pudo exportar $table"
    
    # Contar registros
    count=$(wrangler d1 execute "$DB_NAME" --remote \
      --command="SELECT COUNT(*) as count FROM $table" \
      --json | jq -r '.[0].results[0].count' 2>/dev/null || echo "0")
    
    print_success "Tabla $table: $count registros exportados"
done

# ============================================================
# Generar SQL de INSERT statements
# ============================================================
print_info "Generando SQL dumps para importación..."

cat > "$EXPORT_DIR/generate-inserts.js" << 'JS_EOF'
const fs = require('fs');
const path = require('path');

const exportDir = './cloudflare-export/database';
const tables = fs.readdirSync(exportDir)
    .filter(f => f.endsWith('_full.json') && f !== 'full-schema.json');

tables.forEach(tableFile => {
    const tableName = tableFile.replace('_full.json', '');
    console.log(`Procesando: ${tableName}`);
    
    const data = JSON.parse(fs.readFileSync(path.join(exportDir, tableFile), 'utf8'));
    
    if (!data[0] || !data[0].results || data[0].results.length === 0) {
        console.log(`  ⚠ Tabla ${tableName} vacía`);
        return;
    }
    
    const results = data[0].results;
    const columns = Object.keys(results[0]);
    
    let sqlStatements = [`-- Data for table: ${tableName}\n`];
    
    results.forEach(row => {
        const values = columns.map(col => {
            const val = row[col];
            if (val === null) return 'NULL';
            if (typeof val === 'number') return val;
            if (typeof val === 'boolean') return val ? 1 : 0;
            // Escapar comillas simples
            return `'${String(val).replace(/'/g, "''")}'`;
        });
        
        const insertSQL = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')});`;
        sqlStatements.push(insertSQL);
    });
    
    const outputFile = path.join(exportDir, 'sql-dumps', `${tableName}_data.sql`);
    fs.writeFileSync(outputFile, sqlStatements.join('\n'), 'utf8');
    console.log(`  ✓ Generado: ${tableName}_data.sql (${results.length} registros)`);
});

console.log('\n✓ SQL dumps generados en: ./cloudflare-export/database/sql-dumps/');
JS_EOF

node "$EXPORT_DIR/generate-inserts.js"

print_success "Exportación completa finalizada"
print_info "Archivos generados en: $EXPORT_DIR"
