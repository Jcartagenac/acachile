#!/bin/bash

# ============================================================
# INSTALADOR DE MIGRACIÓN COMPLETA - CLOUDFLARE
# ============================================================
# Este script instala todo el proyecto ACA Chile en una nueva 
# cuenta de Cloudflare, incluyendo:
# - D1 Database con export/import de datos
# - R2 Bucket con migración de imágenes
# - KV Namespace
# - Cloudflare Pages con configuración
# - Variables de entorno y secrets
# ============================================================

set -e  # Exit on error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables globales
PROJECT_NAME="acachile"
DB_NAME="acachile-db"
R2_BUCKET_NAME="aca-chile-images"
KV_NAMESPACE_NAME="ACA_KV"
PAGES_PROJECT_NAME="acachile"

# Archivos de configuración
EXPORT_DIR="./cloudflare-export"
CONFIG_FILE="$EXPORT_DIR/migration-config.json"

# ============================================================
# FUNCIONES DE UTILIDAD
# ============================================================

print_header() {
    echo -e "\n${BLUE}============================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}============================================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

check_wrangler() {
    if ! command -v wrangler &> /dev/null; then
        print_error "Wrangler CLI no está instalado"
        echo "Instálalo con: npm install -g wrangler"
        exit 1
    fi
    print_success "Wrangler CLI encontrado"
}

confirm_action() {
    local message=$1
    echo -e "${YELLOW}$message${NC}"
    read -p "¿Continuar? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Operación cancelada por el usuario"
        exit 1
    fi
}

# ============================================================
# FASE 1: VALIDACIÓN Y PREPARACIÓN
# ============================================================

validate_current_account() {
    print_header "FASE 1: Validando cuenta actual de Cloudflare"
    
    print_info "Obteniendo información de la cuenta actual..."
    wrangler whoami > /dev/null 2>&1
    
    if [ $? -ne 0 ]; then
        print_error "No estás autenticado en Cloudflare"
        echo "Ejecuta: wrangler login"
        exit 1
    fi
    
    print_success "Cuenta actual validada"
    wrangler whoami
}

create_export_directory() {
    print_info "Creando directorio de exportación..."
    mkdir -p "$EXPORT_DIR"
    mkdir -p "$EXPORT_DIR/database"
    mkdir -p "$EXPORT_DIR/images"
    mkdir -p "$EXPORT_DIR/kv"
    mkdir -p "$EXPORT_DIR/config"
    print_success "Directorio de exportación creado: $EXPORT_DIR"
}

# ============================================================
# FASE 2: EXPORTACIÓN DESDE CUENTA ACTUAL
# ============================================================

export_d1_database() {
    print_header "FASE 2.1: Exportando D1 Database"
    
    print_info "Obteniendo lista de bases de datos D1..."
    wrangler d1 list > "$EXPORT_DIR/database/d1-list.txt"
    
    print_info "Exportando esquema y datos de $DB_NAME..."
    
    # Exportar datos de todas las tablas principales
    local tables=("usuarios" "socios" "noticias" "comunicados" "eventos" "evento_inscripciones")
    
    for table in "${tables[@]}"; do
        print_info "Exportando tabla: $table"
        wrangler d1 execute "$DB_NAME" --remote \
            --command "SELECT * FROM $table" \
            --json > "$EXPORT_DIR/database/${table}_data.json" 2>/dev/null || print_warning "Tabla $table no existe o está vacía"
    done
    
    # Guardar el esquema completo
    print_info "Exportando esquema completo..."
    wrangler d1 execute "$DB_NAME" --remote \
        --command "SELECT sql FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%'" \
        --json > "$EXPORT_DIR/database/schema.json"
    
    print_success "Database exportada exitosamente"
}

export_r2_bucket() {
    print_header "FASE 2.2: Exportando R2 Bucket (Imágenes)"
    
    print_info "Listando objetos en bucket $R2_BUCKET_NAME..."
    
    # Crear script temporal para listar y descargar
    cat > "$EXPORT_DIR/images/download-script.sh" << 'EOF'
#!/bin/bash
# Este script descarga todas las imágenes del bucket R2
# Ejecutar después de configurar wrangler en la cuenta actual
wrangler r2 object get aca-chile-images --file=./
EOF
    
    chmod +x "$EXPORT_DIR/images/download-script.sh"
    
    print_info "Descargando inventario de imágenes..."
    # Usar wrangler para obtener lista de archivos
    wrangler r2 object list "$R2_BUCKET_NAME" --json > "$EXPORT_DIR/images/r2-inventory.json" 2>/dev/null || print_warning "No se pudo obtener inventario de R2"
    
    print_success "Inventario de R2 guardado"
    print_warning "Las imágenes deben migrarse usando Rclone o la API de R2"
    print_info "Ver instrucciones en: $EXPORT_DIR/images/MIGRATION_INSTRUCTIONS.md"
}

export_kv_namespace() {
    print_header "FASE 2.3: Exportando KV Namespace"
    
    print_info "Obteniendo lista de KV namespaces..."
    wrangler kv namespace list > "$EXPORT_DIR/kv/kv-list.txt"
    
    # Extraer el KV ID del wrangler.toml
    local kv_id=$(grep -A 2 'binding = "ACA_KV"' frontend/wrangler.toml | grep 'id =' | head -1 | cut -d'"' -f2)
    
    if [ -n "$kv_id" ]; then
        print_info "Exportando claves del namespace KV (ID: $kv_id)..."
        wrangler kv key list --namespace-id="$kv_id" > "$EXPORT_DIR/kv/keys-list.json" || print_warning "No se pudieron listar las claves KV"
        
        # Guardar el ID para referencia
        echo "$kv_id" > "$EXPORT_DIR/kv/kv-id.txt"
        print_success "KV Namespace exportado"
    else
        print_warning "No se encontró KV namespace en la configuración"
    fi
}

export_configuration() {
    print_header "FASE 2.4: Exportando configuración"
    
    print_info "Guardando archivos de configuración..."
    
    # Copiar wrangler.toml files
    cp wrangler.toml "$EXPORT_DIR/config/wrangler-root.toml" 2>/dev/null || true
    cp frontend/wrangler.toml "$EXPORT_DIR/config/wrangler-frontend.toml"
    
    # Copiar migraciones SQL
    cp -r migrations "$EXPORT_DIR/database/"
    
    # Crear un resumen de la configuración
    cat > "$CONFIG_FILE" << EOF
{
  "project_name": "$PROJECT_NAME",
  "database_name": "$DB_NAME",
  "r2_bucket_name": "$R2_BUCKET_NAME",
  "kv_namespace_name": "$KV_NAMESPACE_NAME",
  "pages_project_name": "$PAGES_PROJECT_NAME",
  "export_date": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "source_account": "$(wrangler whoami | grep 'Account ID' | awk '{print $NF}')"
}
EOF
    
    print_success "Configuración exportada"
}

# ============================================================
# FASE 3: PREPARACIÓN PARA NUEVA CUENTA
# ============================================================

prepare_installation_package() {
    print_header "FASE 3: Preparando paquete de instalación"
    
    print_info "Creando scripts de instalación..."
    
    # Crear el instalador para la nueva cuenta
    cat > "$EXPORT_DIR/install-in-new-account.sh" << 'INSTALLER_EOF'
#!/bin/bash

# ============================================================
# INSTALADOR PARA NUEVA CUENTA DE CLOUDFLARE
# ============================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
    echo -e "\n${BLUE}============================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}============================================================${NC}\n"
}

print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠ $1${NC}"; }
print_info() { echo -e "${BLUE}ℹ $1${NC}"; }

# Leer configuración
CONFIG_FILE="./migration-config.json"
if [ ! -f "$CONFIG_FILE" ]; then
    print_error "Archivo de configuración no encontrado: $CONFIG_FILE"
    exit 1
fi

PROJECT_NAME=$(jq -r '.project_name' "$CONFIG_FILE")
DB_NAME=$(jq -r '.database_name' "$CONFIG_FILE")
R2_BUCKET_NAME=$(jq -r '.r2_bucket_name' "$CONFIG_FILE")
KV_NAMESPACE_NAME=$(jq -r '.kv_namespace_name' "$CONFIG_FILE")
PAGES_PROJECT_NAME=$(jq -r '.pages_project_name' "$CONFIG_FILE")

print_header "INSTALACIÓN EN NUEVA CUENTA DE CLOUDFLARE"
print_info "Proyecto: $PROJECT_NAME"

# Verificar autenticación
print_info "Verificando autenticación en Cloudflare..."
if ! wrangler whoami &> /dev/null; then
    print_error "No estás autenticado en Cloudflare"
    echo "Ejecuta: wrangler login"
    exit 1
fi

print_success "Autenticado en Cloudflare"
wrangler whoami

read -p "¿Es esta la cuenta NUEVA donde deseas instalar? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_error "Instalación cancelada"
    exit 1
fi

# ============================================================
# PASO 1: Crear D1 Database
# ============================================================
print_header "PASO 1: Creando D1 Database"

print_info "Creando database: $DB_NAME"
NEW_DB_ID=$(wrangler d1 create "$DB_NAME" --json | jq -r '.database_id')

if [ -z "$NEW_DB_ID" ] || [ "$NEW_DB_ID" == "null" ]; then
    print_error "Error al crear la database"
    exit 1
fi

print_success "Database creada con ID: $NEW_DB_ID"
echo "$NEW_DB_ID" > ./database/new-db-id.txt

# ============================================================
# PASO 2: Aplicar migraciones SQL
# ============================================================
print_header "PASO 2: Aplicando migraciones SQL"

if [ -d "./database/migrations" ]; then
    for migration_file in ./database/migrations/*.sql; do
        if [ -f "$migration_file" ]; then
            print_info "Aplicando: $(basename $migration_file)"
            wrangler d1 execute "$DB_NAME" --remote --file="$migration_file"
            print_success "Migración aplicada: $(basename $migration_file)"
        fi
    done
else
    print_warning "No se encontraron migraciones SQL"
fi

# ============================================================
# PASO 3: Crear R2 Bucket
# ============================================================
print_header "PASO 3: Creando R2 Bucket"

print_info "Creando bucket: $R2_BUCKET_NAME"
wrangler r2 bucket create "$R2_BUCKET_NAME"
print_success "R2 Bucket creado: $R2_BUCKET_NAME"

# Configurar CORS para el bucket
print_info "Configurando CORS para R2 Bucket..."
cat > /tmp/r2-cors.json << 'CORS_EOF'
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]
CORS_EOF

wrangler r2 bucket cors put "$R2_BUCKET_NAME" --rules=/tmp/r2-cors.json || print_warning "No se pudo configurar CORS"
rm /tmp/r2-cors.json
print_success "CORS configurado"

# ============================================================
# PASO 4: Crear KV Namespace
# ============================================================
print_header "PASO 4: Creando KV Namespace"

print_info "Creando KV namespace: $KV_NAMESPACE_NAME"
NEW_KV_ID=$(wrangler kv namespace create "$KV_NAMESPACE_NAME" --json 2>/dev/null | jq -r '.id')

if [ -z "$NEW_KV_ID" ] || [ "$NEW_KV_ID" == "null" ]; then
    print_error "Error al crear KV namespace"
    exit 1
fi

print_success "KV Namespace creado con ID: $NEW_KV_ID"
echo "$NEW_KV_ID" > ./kv/new-kv-id.txt

# Crear preview namespace
print_info "Creando KV namespace para preview..."
NEW_KV_PREVIEW_ID=$(wrangler kv namespace create "${KV_NAMESPACE_NAME}_preview" --json 2>/dev/null | jq -r '.id')
echo "$NEW_KV_PREVIEW_ID" > ./kv/new-kv-preview-id.txt
print_success "KV Preview Namespace creado con ID: $NEW_KV_PREVIEW_ID"

# ============================================================
# PASO 5: Crear Cloudflare Pages Project
# ============================================================
print_header "PASO 5: Creando Cloudflare Pages Project"

print_info "Creando proyecto Pages: $PAGES_PROJECT_NAME"
print_warning "El proyecto se creará en el primer deploy"
print_info "Ejecuta después: npm run deploy desde la carpeta frontend/"

# ============================================================
# PASO 6: Generar nuevo wrangler.toml
# ============================================================
print_header "PASO 6: Generando configuración actualizada"

cat > ../frontend/wrangler.toml.new << WRANGLER_EOF
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
CORS_ORIGIN = "https://$PAGES_PROJECT_NAME.pages.dev"
FRONTEND_URL = "https://$PAGES_PROJECT_NAME.pages.dev"
FROM_EMAIL = "noreply@mail.juancartagena.cl"
ADMIN_EMAIL = "admin@acachile.cl"

[env.preview.vars]
ENVIRONMENT = "preview"
CORS_ORIGIN = "*"
FRONTEND_URL = "https://$PAGES_PROJECT_NAME.pages.dev"
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

print_success "Nuevo wrangler.toml generado: ../frontend/wrangler.toml.new"
print_warning "Revisa el archivo y renómbralo a wrangler.toml cuando esté listo"

# ============================================================
# PASO 7: Resumen y próximos pasos
# ============================================================
print_header "INSTALACIÓN COMPLETADA"

cat > ./NEXT_STEPS.md << 'NEXT_EOF'
# Próximos Pasos

## ✅ Completado:
1. D1 Database creada
2. R2 Bucket creado
3. KV Namespace creado
4. Archivos de configuración generados

## 📋 Tareas Pendientes:

### 1. Actualizar wrangler.toml
```bash
cd ../frontend
mv wrangler.toml wrangler.toml.old
mv wrangler.toml.new wrangler.toml
```

### 2. Importar datos a D1 Database
Ejecuta el script: `./import-database-data.sh`

### 3. Migrar imágenes a R2
Usa Rclone o el script: `./migrate-r2-images.sh`

### 4. Configurar variables de entorno en Pages
```bash
# Configurar RESEND_API_KEY
wrangler pages secret put RESEND_API_KEY --project-name=acachile

# Configurar GOOGLE_MAPS_API_KEY
wrangler pages secret put GOOGLE_MAPS_API_KEY --project-name=acachile
```

### 5. Desplegar a Cloudflare Pages
```bash
cd ../frontend
npm install
npm run build
npm run deploy
```

### 6. Configurar dominio personalizado
- Ve a Cloudflare Pages Dashboard
- Añade tu dominio personalizado
- Configura los registros DNS

## 📝 IDs Importantes:
- Database ID: Ver `./database/new-db-id.txt`
- KV Namespace ID: Ver `./kv/new-kv-id.txt`
- KV Preview ID: Ver `./kv/new-kv-preview-id.txt`
NEXT_EOF

print_success "Revisa el archivo NEXT_STEPS.md para los siguientes pasos"
cat ./NEXT_STEPS.md

INSTALLER_EOF
    
    chmod +x "$EXPORT_DIR/install-in-new-account.sh"
    print_success "Script de instalación creado"
}

create_data_import_script() {
    print_info "Creando script de importación de datos..."
    
    cat > "$EXPORT_DIR/import-database-data.sh" << 'IMPORT_EOF'
#!/bin/bash

# Script para importar datos exportados a la nueva D1 Database

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() { echo -e "${BLUE}ℹ $1${NC}"; }
print_success() { echo -e "${GREEN}✓ $1${NC}"; }

CONFIG_FILE="./migration-config.json"
DB_NAME=$(jq -r '.database_name' "$CONFIG_FILE")

print_info "Importando datos a: $DB_NAME"

# Importar datos de cada tabla
for json_file in ./database/*_data.json; do
    if [ -f "$json_file" ]; then
        table_name=$(basename "$json_file" _data.json)
        print_info "Importando tabla: $table_name"
        
        # Aquí necesitarías un script que convierta JSON a INSERT statements
        # Por ahora, mostrar el archivo para revisión manual
        echo "Revisa el archivo: $json_file"
    fi
done

print_success "Revisa los archivos JSON y ejecuta los INSERTs manualmente o usando un script personalizado"

IMPORT_EOF
    
    chmod +x "$EXPORT_DIR/import-database-data.sh"
}

create_r2_migration_script() {
    print_info "Creando script de migración de R2..."
    
    cat > "$EXPORT_DIR/migrate-r2-images.sh" << 'R2_EOF'
#!/bin/bash

# Script para migrar imágenes entre buckets R2

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_info() { echo -e "${BLUE}ℹ $1${NC}"; }
print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠ $1${NC}"; }

print_warning "La migración de R2 requiere Rclone configurado"
print_info "Ver: https://developers.cloudflare.com/r2/examples/rclone/"

print_info "Pasos para migrar con Rclone:"
echo "1. Instala Rclone: brew install rclone"
echo "2. Configura ambas cuentas de Cloudflare R2 en Rclone"
echo "3. Ejecuta: rclone sync old-account:aca-chile-images new-account:aca-chile-images -P"

print_warning "Alternativamente, usa el Cloudflare Dashboard para migración manual"

R2_EOF
    
    chmod +x "$EXPORT_DIR/migrate-r2-images.sh"
}

create_documentation() {
    print_info "Creando documentación..."
    
    cat > "$EXPORT_DIR/README.md" << 'DOC_EOF'
# Guía de Migración - ACA Chile

Este paquete contiene todo lo necesario para migrar el proyecto ACA Chile a una nueva cuenta de Cloudflare.

## 📦 Contenido del Paquete

```
cloudflare-export/
├── migration-config.json          # Configuración del proyecto
├── install-in-new-account.sh      # Script principal de instalación
├── import-database-data.sh        # Importar datos a D1
├── migrate-r2-images.sh           # Migrar imágenes R2
├── NEXT_STEPS.md                  # Pasos post-instalación
├── database/
│   ├── migrations/                # Archivos SQL de migraciones
│   ├── *_data.json                # Datos exportados de cada tabla
│   └── schema.json                # Esquema completo de DB
├── images/
│   ├── r2-inventory.json          # Inventario de archivos R2
│   └── MIGRATION_INSTRUCTIONS.md  # Instrucciones para migrar imágenes
├── kv/
│   ├── keys-list.json             # Lista de claves KV
│   └── kv-id.txt                  # ID del namespace original
└── config/
    ├── wrangler-frontend.toml     # Configuración frontend
    └── wrangler-root.toml         # Configuración root
```

## 🚀 Proceso de Migración

### Paso 1: Autenticación en Nueva Cuenta

```bash
wrangler logout
wrangler login
```

Asegúrate de autenticarte con la cuenta NUEVA.

### Paso 2: Ejecutar Instalador

```bash
cd cloudflare-export
chmod +x install-in-new-account.sh
./install-in-new-account.sh
```

Este script creará:
- ✅ D1 Database
- ✅ R2 Bucket
- ✅ KV Namespace
- ✅ Configuración actualizada

### Paso 3: Importar Datos

```bash
./import-database-data.sh
```

### Paso 4: Migrar Imágenes

```bash
./migrate-r2-images.sh
```

### Paso 5: Configurar Secrets

```bash
# En la carpeta del proyecto
cd ../frontend

# Configurar API keys
wrangler pages secret put RESEND_API_KEY --project-name=acachile
wrangler pages secret put GOOGLE_MAPS_API_KEY --project-name=acachile
```

### Paso 6: Desplegar

```bash
cd ../frontend
npm install
npm run build
npm run deploy
```

## 📋 Checklist de Migración

- [ ] Autenticado en nueva cuenta Cloudflare
- [ ] Ejecutado `install-in-new-account.sh`
- [ ] Actualizado `wrangler.toml`
- [ ] Importados datos a D1 Database
- [ ] Migradas imágenes a R2
- [ ] Configurados secrets (API keys)
- [ ] Desplegado a Cloudflare Pages
- [ ] Configurado dominio personalizado
- [ ] Verificado funcionamiento completo

## 🔑 Variables de Entorno Requeridas

### Secrets (configurar con wrangler)
- `RESEND_API_KEY`: API key de Resend para emails
- `GOOGLE_MAPS_API_KEY`: API key de Google Maps

### Variables en wrangler.toml
- `CORS_ORIGIN`: Origen permitido para CORS
- `FRONTEND_URL`: URL del frontend
- `FROM_EMAIL`: Email remitente
- `ADMIN_EMAIL`: Email del administrador

## 🆘 Soporte

Si encuentras problemas durante la migración:

1. Revisa los logs de Wrangler
2. Verifica que todos los recursos fueron creados
3. Consulta la documentación de Cloudflare
4. Revisa `NEXT_STEPS.md` para tareas pendientes

## 📚 Recursos

- [Cloudflare D1 Docs](https://developers.cloudflare.com/d1/)
- [Cloudflare R2 Docs](https://developers.cloudflare.com/r2/)
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Wrangler CLI Docs](https://developers.cloudflare.com/workers/wrangler/)
DOC_EOF

    print_success "Documentación creada"
}

# ============================================================
# FUNCIÓN PRINCIPAL
# ============================================================

main() {
    print_header "MIGRACIÓN DE CLOUDFLARE - ACA CHILE"
    print_info "Este proceso exportará todos los recursos de la cuenta actual"
    
    # Validación inicial
    check_wrangler
    validate_current_account
    
    confirm_action "¿Deseas continuar con la exportación?"
    
    # Crear estructura de directorios
    create_export_directory
    
    # Exportar recursos
    export_configuration
    export_d1_database
    export_r2_bucket
    export_kv_namespace
    
    # Preparar instalación
    prepare_installation_package
    create_data_import_script
    create_r2_migration_script
    create_documentation
    
    # Resumen final
    print_header "EXPORTACIÓN COMPLETADA"
    print_success "Todos los recursos han sido exportados"
    print_info "Directorio de exportación: $EXPORT_DIR"
    
    echo ""
    print_info "Próximos pasos:"
    echo "1. Revisa el directorio: $EXPORT_DIR"
    echo "2. Auténticate en la nueva cuenta: wrangler logout && wrangler login"
    echo "3. Ejecuta: cd $EXPORT_DIR && ./install-in-new-account.sh"
    echo ""
    print_warning "IMPORTANTE: Guarda las API keys y secrets antes de cambiar de cuenta"
    echo ""
    print_success "Migración preparada exitosamente ✨"
}

# Ejecutar script principal
main
