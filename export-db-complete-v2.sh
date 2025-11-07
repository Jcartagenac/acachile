#!/bin/bash

# ============================================================
# EXPORTADOR COMPLETO Y MEJORADO - VERSIÓN 2.0
# ============================================================
# Exporta toda la base de datos con todos los datos reales
# ============================================================

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_info() { echo -e "${BLUE}ℹ $1${NC}"; }
print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; }

DB_NAME="acachile-db"
EXPORT_DIR="./cloudflare-export/database"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

print_info "Exportando base de datos completa: $DB_NAME"

# Crear directorio si no existe
mkdir -p "$EXPORT_DIR/sql-dumps"
mkdir -p "$EXPORT_DIR/json-data"

# Lista de todas las tablas en la base de datos
TABLES=(
    "usuarios"
    "comunicados"
    "configuracion_global"
    "cuotas"
    "eventos"
    "events"
    "generacion_cuotas"
    "inscriptions"
    "news_article_tags"
    "news_articles"
    "news_categories"
    "news_comments"
    "news_tags"
    "pagos"
    "postulacion_aprobaciones"
    "postulaciones"
    "roles_catalog"
    "site_sections"
    "user_privacy_settings"
    "users"
)

# ============================================================
# Exportar esquema completo
# ============================================================
print_info "Exportando esquema de todas las tablas..."

wrangler d1 execute "$DB_NAME" --remote \
  --command="SELECT name, sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' ORDER BY name" \
  --json > "$EXPORT_DIR/full-schema-$TIMESTAMP.json"

print_success "Esquema exportado"

# ============================================================
# Exportar datos tabla por tabla
# ============================================================

print_info "Exportando datos de todas las tablas..."

for table in "${TABLES[@]}"; do
    print_info "Procesando tabla: $table"
    
    # Exportar en formato JSON
    wrangler d1 execute "$DB_NAME" --remote \
      --command="SELECT * FROM $table" \
      --json > "$EXPORT_DIR/json-data/${table}.json" 2>/dev/null || {
        print_warning "Tabla $table no existe o está vacía"
        continue
    }
    
    # Contar registros
    count=$(jq -r '.[0].results | length' "$EXPORT_DIR/json-data/${table}.json" 2>/dev/null || echo "0")
    
    if [ "$count" -gt 0 ]; then
        print_success "Tabla $table: $count registros exportados"
    else
        print_warning "Tabla $table: vacía"
    fi
done

# ============================================================
# Generar SQL INSERT statements
# ============================================================
print_info "Generando SQL dumps para importación..."

node << 'NODEJS_EOF'
const fs = require('fs');
const path = require('path');

const exportDir = './cloudflare-export/database/json-data';
const outputDir = './cloudflare-export/database/sql-dumps';

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

const jsonFiles = fs.readdirSync(exportDir).filter(f => f.endsWith('.json'));

jsonFiles.forEach(jsonFile => {
    const tableName = jsonFile.replace('.json', '');
    console.log(`Generando SQL para: ${tableName}`);
    
    try {
        const data = JSON.parse(fs.readFileSync(path.join(exportDir, jsonFile), 'utf8'));
        
        if (!data[0] || !data[0].results || data[0].results.length === 0) {
            console.log(`  ⚠ Tabla ${tableName} vacía, omitiendo...`);
            return;
        }
        
        const results = data[0].results;
        const columns = Object.keys(results[0]);
        
        let sqlStatements = [
            `-- ============================================================`,
            `-- Datos para tabla: ${tableName}`,
            `-- Registros: ${results.length}`,
            `-- Generado: ${new Date().toISOString()}`,
            `-- ============================================================`,
            ``
        ];
        
        results.forEach((row, index) => {
            const values = columns.map(col => {
                const val = row[col];
                if (val === null || val === undefined) return 'NULL';
                if (typeof val === 'number') return val;
                if (typeof val === 'boolean') return val ? 1 : 0;
                // Escapar comillas simples y backslashes
                const escaped = String(val)
                    .replace(/\\/g, '\\\\')
                    .replace(/'/g, "''")
                    .replace(/\n/g, '\\n')
                    .replace(/\r/g, '\\r');
                return `'${escaped}'`;
            });
            
            const insertSQL = `INSERT INTO ${tableName} (${columns.map(c => `"${c}"`).join(', ')}) VALUES (${values.join(', ')});`;
            sqlStatements.push(insertSQL);
            
            // Agregar commit cada 100 registros
            if ((index + 1) % 100 === 0) {
                sqlStatements.push('-- Commit cada 100 registros');
            }
        });
        
        sqlStatements.push('');
        sqlStatements.push(`-- ✓ ${results.length} registros insertados en ${tableName}`);
        
        const outputFile = path.join(outputDir, `${tableName}.sql`);
        fs.writeFileSync(outputFile, sqlStatements.join('\n'), 'utf8');
        console.log(`  ✓ Generado: ${tableName}.sql (${results.length} registros)`);
        
    } catch (error) {
        console.error(`  ✗ Error procesando ${tableName}:`, error.message);
    }
});

console.log('\n✓ SQL dumps generados en: ./cloudflare-export/database/sql-dumps/');
NODEJS_EOF

print_success "SQL dumps generados exitosamente"

# ============================================================
# Generar script de importación
# ============================================================
print_info "Generando script de importación automatizado..."

cat > "$EXPORT_DIR/import-all-data.sh" << 'IMPORT_EOF'
#!/bin/bash

# Script de importación automatizada
# Generado automáticamente por el exportador

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

print_info() { echo -e "${BLUE}ℹ $1${NC}"; }
print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; }

DB_NAME="acachile-db"
SQL_DIR="./sql-dumps"

print_info "Importando datos a: $DB_NAME"

# Orden recomendado de importación (respetar foreign keys)
IMPORT_ORDER=(
    "usuarios"
    "roles_catalog"
    "configuracion_global"
    "user_privacy_settings"
    "users"
    "cuotas"
    "generacion_cuotas"
    "pagos"
    "comunicados"
    "eventos"
    "events"
    "inscriptions"
    "news_categories"
    "news_tags"
    "news_articles"
    "news_article_tags"
    "news_comments"
    "postulaciones"
    "postulacion_aprobaciones"
    "site_sections"
)

for table in "${IMPORT_ORDER[@]}"; do
    sql_file="$SQL_DIR/${table}.sql"
    
    if [ -f "$sql_file" ]; then
        print_info "Importando tabla: $table"
        
        if wrangler d1 execute "$DB_NAME" --remote --file="$sql_file" > /dev/null 2>&1; then
            # Contar registros importados
            count=$(wrangler d1 execute "$DB_NAME" --remote \
                --command="SELECT COUNT(*) as total FROM $table" \
                --json 2>/dev/null | jq -r '.[0].results[0].total' || echo "?")
            print_success "Tabla $table importada ($count registros)"
        else
            print_error "Error importando $table"
        fi
    else
        print_info "Archivo no encontrado: $sql_file (omitiendo)"
    fi
done

print_success "Importación completada"

# Verificar totales
print_info "Verificando datos importados..."
wrangler d1 execute "$DB_NAME" --remote \
    --command="SELECT name as tabla, (SELECT COUNT(*) FROM sqlite_master s2 WHERE s2.name=s1.name AND s2.type='table') as existe FROM sqlite_master s1 WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' LIMIT 10"

IMPORT_EOF

chmod +x "$EXPORT_DIR/import-all-data.sh"

print_success "Script de importación creado: $EXPORT_DIR/import-all-data.sh"

# ============================================================
# Resumen final
# ============================================================
print_info "Generando resumen de exportación..."

cat > "$EXPORT_DIR/EXPORT_SUMMARY.txt" << SUMMARY_EOF
═══════════════════════════════════════════════════════════
RESUMEN DE EXPORTACIÓN - ACA CHILE
═══════════════════════════════════════════════════════════

Fecha de exportación: $(date '+%Y-%m-%d %H:%M:%S')
Base de datos: $DB_NAME
Directorio: $EXPORT_DIR

ARCHIVOS GENERADOS:
-----------------------------------------------------------

📁 json-data/
   └─ Datos crudos en formato JSON
   
📁 sql-dumps/
   └─ Scripts SQL con INSERT statements
   
📄 import-all-data.sh
   └─ Script automatizado de importación
   
📄 full-schema-$TIMESTAMP.json
   └─ Esquema completo de base de datos

TABLAS EXPORTADAS:
-----------------------------------------------------------
SUMMARY_EOF

# Agregar lista de tablas con conteo
for table in "${TABLES[@]}"; do
    if [ -f "$EXPORT_DIR/json-data/${table}.json" ]; then
        count=$(jq -r '.[0].results | length' "$EXPORT_DIR/json-data/${table}.json" 2>/dev/null || echo "0")
        printf "%-30s %10s registros\n" "$table" "$count" >> "$EXPORT_DIR/EXPORT_SUMMARY.txt"
    fi
done

cat >> "$EXPORT_DIR/EXPORT_SUMMARY.txt" << SUMMARY_EOF2

PRÓXIMOS PASOS:
-----------------------------------------------------------

1. Revisar archivos exportados en: $EXPORT_DIR

2. Para importar en nueva cuenta:
   cd $EXPORT_DIR
   ./import-all-data.sh

3. Verificar importación:
   wrangler d1 execute acachile-db --remote \\
     --command="SELECT COUNT(*) FROM usuarios"

═══════════════════════════════════════════════════════════
SUMMARY_EOF2

# Mostrar resumen
cat "$EXPORT_DIR/EXPORT_SUMMARY.txt"

print_success "✓ Exportación completa finalizada"
print_info "Ver resumen detallado en: $EXPORT_DIR/EXPORT_SUMMARY.txt"
