#!/bin/bash

# Script para importar datos en el orden correcto respetando foreign keys
# Orden: primero tablas sin dependencias, luego las que dependen de ellas

set -e

EXPORT_DIR="cloudflare-export/database/sql-dumps"
DB_NAME="acachile-db"

echo "=================================================="
echo "IMPORTANDO DATOS EN ORDEN CORRECTO"
echo "=================================================="

# Función para importar un archivo SQL
import_sql() {
    local file=$1
    local table=$2
    
    if [ ! -f "$EXPORT_DIR/$file" ]; then
        echo "⚠️  Archivo $file no encontrado, saltando..."
        return
    fi
    
    echo ""
    echo "📦 Importando $table..."
    if wrangler d1 execute "$DB_NAME" --remote --file="$EXPORT_DIR/$file" 2>&1 | grep -q "Executed"; then
        echo "✅ $table importado correctamente"
    else
        echo "⚠️  $table: error o ya existe"
    fi
}

# FASE 1: Tablas base sin dependencias
echo ""
echo "=== FASE 1: Tablas base ==="
import_sql "usuarios.sql" "usuarios"
import_sql "users.sql" "users"
import_sql "configuracion_global.sql" "configuracion_global"
import_sql "roles_catalog.sql" "roles_catalog"
import_sql "news_categories.sql" "news_categories"
import_sql "news_tags.sql" "news_tags"

# FASE 2: Tablas que dependen de usuarios
echo ""
echo "=== FASE 2: Tablas dependientes de usuarios ==="
import_sql "user_privacy_settings.sql" "user_privacy_settings"
import_sql "cuotas.sql" "cuotas"
import_sql "generacion_cuotas.sql" "generacion_cuotas"
import_sql "comunicados.sql" "comunicados"
import_sql "eventos.sql" "eventos"
import_sql "events.sql" "events"
import_sql "postulaciones.sql" "postulaciones"

# FASE 3: Tablas que dependen de cuotas
echo ""
echo "=== FASE 3: Tablas dependientes de cuotas/eventos ==="
import_sql "pagos.sql" "pagos"
import_sql "inscriptions.sql" "inscriptions"
import_sql "postulacion_aprobaciones.sql" "postulacion_aprobaciones"

# FASE 4: Tablas de noticias
echo ""
echo "=== FASE 4: Sistema de noticias ==="
import_sql "news_articles.sql" "news_articles"
import_sql "news_comments.sql" "news_comments"

# FASE 5: Otras tablas
echo ""
echo "=== FASE 5: Otras tablas ==="
import_sql "site_sections.sql" "site_sections"

echo ""
echo "=================================================="
echo "✅ IMPORTACIÓN COMPLETADA"
echo "=================================================="

# Verificar datos importados
echo ""
echo "📊 Verificando datos importados..."
echo ""

wrangler d1 execute "$DB_NAME" --remote --command="
SELECT 
    'usuarios' as tabla, COUNT(*) as registros FROM usuarios
UNION ALL
SELECT 'cuotas', COUNT(*) FROM cuotas
UNION ALL
SELECT 'eventos', COUNT(*) FROM eventos
UNION ALL
SELECT 'news_articles', COUNT(*) FROM news_articles
UNION ALL
SELECT 'news_categories', COUNT(*) FROM news_categories
UNION ALL
SELECT 'news_tags', COUNT(*) FROM news_tags
UNION ALL
SELECT 'pagos', COUNT(*) FROM pagos
UNION ALL
SELECT 'postulaciones', COUNT(*) FROM postulaciones
UNION ALL
SELECT 'comunicados', COUNT(*) FROM comunicados
UNION ALL
SELECT 'configuracion_global', COUNT(*) FROM configuracion_global
"

echo ""
echo "✅ Importación y verificación completadas!"
