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

