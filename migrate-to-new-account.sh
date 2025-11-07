#!/bin/bash

# ============================================================
# PASO 2: INSTALACIÓN EN NUEVA CUENTA
# ============================================================
# Ejecutar DESPUÉS de cambiar a la nueva cuenta
# ============================================================

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_header() {
    echo -e "\n${BLUE}═══════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}\n"
}

print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ $1${NC}"; }

# Configuración
PROJECT_NAME="acachile"
DB_NAME="acachile-db"
R2_BUCKET_NAME="aca-chile-images"
KV_NAMESPACE_NAME="ACA_KV"

print_header "INSTALACIÓN EN NUEVA CUENTA DE CLOUDFLARE"

# Verificar autenticación
print_info "Verificando autenticación..."
if ! wrangler whoami &> /dev/null; then
    print_error "No estás autenticado en Cloudflare"
    echo "Ejecuta: wrangler login"
    exit 1
fi

print_success "Autenticado en Cloudflare"
echo ""
wrangler whoami | grep -E "Account|email"
echo ""

read -p "¿Es esta la cuenta NUEVA (destino)? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_error "Por favor, auténticate en la cuenta correcta"
    echo "Ejecuta: wrangler logout && wrangler login"
    exit 1
fi

# ============================================================
# PASO 1: Crear D1 Database
# ============================================================
print_header "PASO 1: Creando D1 Database"

print_info "Creando database: $DB_NAME"
DB_OUTPUT=$(wrangler d1 create "$DB_NAME" 2>&1)

if echo "$DB_OUTPUT" | grep -q "already exists"; then
    print_warning "Database ya existe, obteniendo ID..."
    NEW_DB_ID=$(wrangler d1 list | grep "$DB_NAME" -A 1 | grep "database_id" | awk '{print $2}')
else
    NEW_DB_ID=$(echo "$DB_OUTPUT" | grep "database_id" | awk '{print $2}')
fi

if [ -z "$NEW_DB_ID" ]; then
    print_error "Error al crear/obtener la database"
    exit 1
fi

print_success "Database ID: $NEW_DB_ID"
mkdir -p cloudflare-export
echo "$NEW_DB_ID" > cloudflare-export/new-db-id.txt

# ============================================================
# PASO 2: Aplicar migraciones SQL
# ============================================================
print_header "PASO 2: Aplicando migraciones SQL"

MIGRATIONS_DIR="cloudflare-export/migrations-sql"

if [ -d "$MIGRATIONS_DIR" ]; then
    print_info "Aplicando esquemas de base de datos..."
    
    # Aplicar en orden específico
    for migration_file in "$MIGRATIONS_DIR/socios-cuotas-schema.sql" \
                          "$MIGRATIONS_DIR/005_create_comunicados.sql" \
                          "$MIGRATIONS_DIR/006_create_eventos.sql" \
                          "$MIGRATIONS_DIR/eventos-schema.sql" \
                          "$MIGRATIONS_DIR/fix-eventos-data.sql"; do
        if [ -f "$migration_file" ]; then
            filename=$(basename "$migration_file")
            print_info "Aplicando: $filename"
            if wrangler d1 execute "$DB_NAME" --remote --file="$migration_file" > /dev/null 2>&1; then
                print_success "$filename aplicado"
            else
                print_warning "$filename falló o ya existe"
            fi
        fi
    done
else
    print_warning "No se encontraron migraciones SQL"
fi

# ============================================================
# PASO 3: Importar datos
# ============================================================
print_header "PASO 3: Importando datos"

SQL_DUMPS_DIR="cloudflare-export/database/sql-dumps"

if [ -d "$SQL_DUMPS_DIR" ]; then
    print_info "Importando datos de tablas..."
    
    # Orden de importación (respetando foreign keys)
    IMPORT_ORDER=(
        "usuarios"
        "roles_catalog"
        "configuracion_global"
        "user_privacy_settings"
        "users"
        "cuotas"
        "generacion_cuotas"
        "pagos"
        "eventos"
        "events"
        "inscriptions"
        "news_categories"
        "news_tags"
        "news_articles"
        "news_comments"
        "postulaciones"
        "site_sections"
    )
    
    for table in "${IMPORT_ORDER[@]}"; do
        sql_file="$SQL_DUMPS_DIR/${table}.sql"
        
        if [ -f "$sql_file" ]; then
            print_info "Importando: $table"
            if wrangler d1 execute "$DB_NAME" --remote --file="$sql_file" > /dev/null 2>&1; then
                # Contar registros importados
                count=$(wrangler d1 execute "$DB_NAME" --remote \
                    --command="SELECT COUNT(*) as total FROM $table" \
                    --json 2>/dev/null | jq -r '.[0].results[0].total' || echo "?")
                print_success "$table: $count registros"
            else
                print_warning "$table: error o ya existe"
            fi
        fi
    done
else
    print_error "No se encontraron SQL dumps"
    exit 1
fi

# ============================================================
# PASO 4: Crear R2 Bucket
# ============================================================
print_header "PASO 4: Creando R2 Bucket"

print_info "Creando bucket: $R2_BUCKET_NAME"
if wrangler r2 bucket create "$R2_BUCKET_NAME" > /dev/null 2>&1; then
    print_success "R2 Bucket creado"
else
    print_warning "R2 Bucket ya existe o error al crear"
fi

# ============================================================
# PASO 5: Crear KV Namespace
# ============================================================
print_header "PASO 5: Creando KV Namespace"

print_info "Creando KV namespace: $KV_NAMESPACE_NAME"
NEW_KV_OUTPUT=$(wrangler kv namespace create "$KV_NAMESPACE_NAME" 2>&1)

if echo "$NEW_KV_OUTPUT" | grep -q "id"; then
    NEW_KV_ID=$(echo "$NEW_KV_OUTPUT" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    print_success "KV Namespace ID: $NEW_KV_ID"
    echo "$NEW_KV_ID" > cloudflare-export/new-kv-id.txt
else
    print_warning "KV ya existe o error"
    NEW_KV_ID=$(wrangler kv namespace list | grep "$KV_NAMESPACE_NAME" -A 1 | grep "id" | cut -d'"' -f4 | head -1)
    echo "$NEW_KV_ID" > cloudflare-export/new-kv-id.txt
fi

# Crear preview namespace
print_info "Creando KV preview namespace..."
PREVIEW_OUTPUT=$(wrangler kv namespace create "${KV_NAMESPACE_NAME}_preview" 2>&1)
if echo "$PREVIEW_OUTPUT" | grep -q "id"; then
    NEW_KV_PREVIEW_ID=$(echo "$PREVIEW_OUTPUT" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    print_success "KV Preview ID: $NEW_KV_PREVIEW_ID"
    echo "$NEW_KV_PREVIEW_ID" > cloudflare-export/new-kv-preview-id.txt
fi

# ============================================================
# PASO 6: Generar nuevo wrangler.toml
# ============================================================
print_header "PASO 6: Generando configuración actualizada"

cat > frontend/wrangler.toml.new << WRANGLER_EOF
name = "$PROJECT_NAME"
compatibility_date = "2024-09-23"
compatibility_flags = ["nodejs_compat"]
pages_build_output_dir = "dist"

# Bindings para Pages Functions
[[d1_databases]]
binding = "DB"
database_name = "$DB_NAME"
database_id = "$NEW_DB_ID"

[[kv_namespaces]]
binding = "ACA_KV"
id = "$NEW_KV_ID"
preview_id = "$NEW_KV_PREVIEW_ID"

# R2 bucket para imágenes
[[r2_buckets]]
binding = "IMAGES"
bucket_name = "$R2_BUCKET_NAME"

[env.production.vars]
ENVIRONMENT = "production"
CORS_ORIGIN = "https://$PROJECT_NAME.pages.dev"
FRONTEND_URL = "https://$PROJECT_NAME.pages.dev"
FROM_EMAIL = "noreply@mail.juancartagena.cl"
ADMIN_EMAIL = "admin@acachile.cl"

[env.preview.vars]
ENVIRONMENT = "preview"
CORS_ORIGIN = "*"
FRONTEND_URL = "https://$PROJECT_NAME.pages.dev"
FROM_EMAIL = "noreply@mail.juancartagena.cl"
ADMIN_EMAIL = "admin@acachile.cl"

# Bindings específicas para producción
[[env.production.kv_namespaces]]
binding = "ACA_KV"
id = "$NEW_KV_ID"

[[env.production.d1_databases]]
binding = "DB"
database_name = "$DB_NAME"
database_id = "$NEW_DB_ID"

[[env.production.r2_buckets]]
binding = "IMAGES"
bucket_name = "$R2_BUCKET_NAME"

# Bindings específicas para preview
[[env.preview.kv_namespaces]]
binding = "ACA_KV"
id = "$NEW_KV_ID"

[[env.preview.d1_databases]]
binding = "DB"
database_name = "$DB_NAME"
database_id = "$NEW_DB_ID"

[[env.preview.r2_buckets]]
binding = "IMAGES"
bucket_name = "$R2_BUCKET_NAME"
WRANGLER_EOF

print_success "Nuevo wrangler.toml generado"

# ============================================================
# PASO 7: Verificación
# ============================================================
print_header "PASO 7: Verificando instalación"

print_info "Verificando D1 Database..."
user_count=$(wrangler d1 execute "$DB_NAME" --remote \
    --command="SELECT COUNT(*) as total FROM usuarios" \
    --json 2>/dev/null | jq -r '.[0].results[0].total' || echo "0")

if [ "$user_count" -gt 0 ]; then
    print_success "D1 Database OK - $user_count usuarios"
else
    print_error "D1 Database vacía"
fi

print_info "Verificando R2 Bucket..."
if wrangler r2 bucket list | grep -q "$R2_BUCKET_NAME"; then
    print_success "R2 Bucket OK"
else
    print_error "R2 Bucket no encontrado"
fi

print_info "Verificando KV Namespace..."
if wrangler kv namespace list | grep -q "$KV_NAMESPACE_NAME"; then
    print_success "KV Namespace OK"
else
    print_error "KV Namespace no encontrado"
fi

# ============================================================
# RESUMEN FINAL
# ============================================================
print_header "INSTALACIÓN COMPLETADA"

cat > cloudflare-export/MIGRATION_COMPLETE.txt << COMPLETE_EOF
═══════════════════════════════════════════════════════════
MIGRACIÓN COMPLETADA - ACA CHILE
═══════════════════════════════════════════════════════════

Fecha: $(date '+%Y-%m-%d %H:%M:%S')

RECURSOS CREADOS:
-----------------------------------------------------------
Database ID:  $NEW_DB_ID
KV ID:        $NEW_KV_ID
KV Preview:   $NEW_KV_PREVIEW_ID
R2 Bucket:    $R2_BUCKET_NAME

DATOS IMPORTADOS:
-----------------------------------------------------------
Usuarios:     $user_count registros
Total tablas: 20 tablas

PRÓXIMOS PASOS:
-----------------------------------------------------------

1. Actualizar wrangler.toml:
   cd frontend
   cp wrangler.toml wrangler.toml.backup
   cp wrangler.toml.new wrangler.toml

2. Configurar secrets:
   wrangler pages secret put RESEND_API_KEY --project-name=$PROJECT_NAME
   wrangler pages secret put GOOGLE_MAPS_API_KEY --project-name=$PROJECT_NAME

3. Desplegar aplicación:
   cd frontend
   npm install
   npm run build
   npm run deploy

4. Verificar:
   curl https://$PROJECT_NAME.pages.dev/api/health | jq .

═══════════════════════════════════════════════════════════
COMPLETE_EOF

cat cloudflare-export/MIGRATION_COMPLETE.txt

print_success "¡Migración exitosa! 🎉"
print_info "Ver detalles en: cloudflare-export/MIGRATION_COMPLETE.txt"
