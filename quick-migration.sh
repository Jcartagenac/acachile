#!/bin/bash

# ============================================================
# QUICK MIGRATION - Migración Rápida ACA Chile
# ============================================================
# Script ejecutor principal para migración en un solo comando
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

print_header "MIGRACIÓN CLOUDFLARE - ACA CHILE"
print_info "Asistente de Migración Paso a Paso"

# ============================================================
# Menú Principal
# ============================================================

show_menu() {
    echo ""
    echo "┌─────────────────────────────────────────────────────┐"
    echo "│         MENÚ DE MIGRACIÓN - ACA CHILE              │"
    echo "├─────────────────────────────────────────────────────┤"
    echo "│                                                     │"
    echo "│  [1] 🔍 Verificar cuenta actual                     │"
    echo "│  [2] 📦 Exportar todo desde cuenta actual           │"
    echo "│  [3] 🔄 Cambiar a cuenta nueva                      │"
    echo "│  [4] 🚀 Instalar en cuenta nueva                    │"
    echo "│  [5] 💾 Importar datos a D1                         │"
    echo "│  [6] 🖼️  Migrar imágenes R2                         │"
    echo "│  [7] 🔑 Configurar secrets                          │"
    echo "│  [8] 🌐 Desplegar aplicación                        │"
    echo "│  [9] ✅ Verificar instalación                       │"
    echo "│                                                     │"
    echo "│  [A] 🎯 Migración automática completa               │"
    echo "│  [H] 📚 Ver guía de migración                       │"
    echo "│  [Q] ❌ Salir                                       │"
    echo "│                                                     │"
    echo "└─────────────────────────────────────────────────────┘"
    echo ""
}

# ============================================================
# Funciones de cada paso
# ============================================================

verify_current_account() {
    print_header "VERIFICAR CUENTA ACTUAL"
    
    print_info "Verificando autenticación..."
    if ! wrangler whoami &> /dev/null; then
        print_error "No estás autenticado en Cloudflare"
        print_info "Ejecutando: wrangler login"
        wrangler login
    fi
    
    echo ""
    print_success "Cuenta verificada:"
    wrangler whoami
    
    echo ""
    read -p "¿Es esta la cuenta de ORIGEN (actual)? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Por favor, auténticate en la cuenta correcta"
        wrangler logout
        wrangler login
    fi
}

export_from_current() {
    print_header "EXPORTAR DESDE CUENTA ACTUAL"
    
    if [ ! -f "migration-installer.sh" ]; then
        print_error "Script migration-installer.sh no encontrado"
        exit 1
    fi
    
    print_warning "Este proceso exportará todos los recursos de la cuenta actual"
    read -p "¿Continuar? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        return
    fi
    
    chmod +x migration-installer.sh
    ./migration-installer.sh
    
    print_success "Exportación completada"
    print_info "Archivos guardados en: ./cloudflare-export/"
}

switch_account() {
    print_header "CAMBIAR A CUENTA NUEVA"
    
    print_warning "Vas a cerrar sesión en la cuenta actual"
    read -p "¿Continuar? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        return
    fi
    
    print_info "Cerrando sesión..."
    wrangler logout
    
    print_info "Iniciando sesión en nueva cuenta..."
    print_warning "⚠️  IMPORTANTE: Auténticate con la cuenta NUEVA (destino)"
    wrangler login
    
    echo ""
    print_success "Cuenta cambiada. Verificando..."
    wrangler whoami
    
    echo ""
    read -p "¿Es esta la cuenta NUEVA (destino)? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_error "Cuenta incorrecta. Por favor ejecuta este paso nuevamente."
        exit 1
    fi
}

install_in_new_account() {
    print_header "INSTALAR EN CUENTA NUEVA"
    
    if [ ! -d "cloudflare-export" ]; then
        print_error "Directorio cloudflare-export no encontrado"
        print_info "Ejecuta primero la opción [2] para exportar"
        return
    fi
    
    cd cloudflare-export
    
    if [ ! -f "install-in-new-account.sh" ]; then
        print_error "Script de instalación no encontrado"
        cd ..
        return
    fi
    
    chmod +x install-in-new-account.sh
    ./install-in-new-account.sh
    
    cd ..
    print_success "Instalación completada"
}

import_database() {
    print_header "IMPORTAR DATOS A D1"
    
    if [ ! -d "cloudflare-export/database/sql-dumps" ]; then
        print_warning "No se encontraron SQL dumps"
        print_info "Ejecuta primero: ./export-database-complete.sh"
        return
    fi
    
    DB_NAME="acachile-db"
    
    print_info "Importando datos a: $DB_NAME"
    
    for sql_file in cloudflare-export/database/sql-dumps/*.sql; do
        if [ -f "$sql_file" ]; then
            filename=$(basename "$sql_file")
            print_info "Importando: $filename"
            wrangler d1 execute "$DB_NAME" --remote --file="$sql_file" || print_warning "Error en $filename"
            print_success "$filename importado"
        fi
    done
    
    print_success "Importación de datos completada"
}

migrate_r2_images() {
    print_header "MIGRAR IMÁGENES R2"
    
    print_warning "La migración de R2 requiere Rclone configurado"
    
    if ! command -v rclone &> /dev/null; then
        print_error "Rclone no está instalado"
        print_info "Instalar con: brew install rclone"
        read -p "¿Deseas instalar Rclone ahora? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            brew install rclone
        else
            return
        fi
    fi
    
    print_success "Rclone encontrado"
    
    print_info "Configuración de Rclone requerida:"
    echo "1. Configura perfil 'cloudflare-old' para cuenta antigua"
    echo "2. Configura perfil 'cloudflare-new' para cuenta nueva"
    echo ""
    
    read -p "¿Ya configuraste Rclone? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Abriendo configuración de Rclone..."
        rclone config
        return
    fi
    
    BUCKET_NAME="aca-chile-images"
    
    print_info "Iniciando migración de bucket: $BUCKET_NAME"
    print_warning "Esto puede tardar varios minutos..."
    
    rclone sync cloudflare-old:$BUCKET_NAME cloudflare-new:$BUCKET_NAME -P --checksum
    
    print_success "Migración de imágenes completada"
    
    # Verificar
    echo ""
    print_info "Verificando migración..."
    old_count=$(rclone ls cloudflare-old:$BUCKET_NAME | wc -l)
    new_count=$(rclone ls cloudflare-new:$BUCKET_NAME | wc -l)
    
    echo "Archivos en cuenta antigua: $old_count"
    echo "Archivos en cuenta nueva: $new_count"
    
    if [ "$old_count" -eq "$new_count" ]; then
        print_success "✓ Migración verificada: todos los archivos copiados"
    else
        print_warning "⚠ Diferencia en cantidad de archivos"
    fi
}

configure_secrets() {
    print_header "CONFIGURAR SECRETS"
    
    PROJECT_NAME="acachile"
    
    print_info "Configurando secrets para proyecto: $PROJECT_NAME"
    echo ""
    
    print_warning "Necesitarás los siguientes valores:"
    echo "1. RESEND_API_KEY"
    echo "2. GOOGLE_MAPS_API_KEY"
    echo ""
    
    read -p "¿Tienes estos valores? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Guarda estos valores antes de continuar"
        return
    fi
    
    # RESEND_API_KEY
    echo ""
    print_info "Configurando RESEND_API_KEY..."
    wrangler pages secret put RESEND_API_KEY --project-name="$PROJECT_NAME"
    
    # GOOGLE_MAPS_API_KEY
    echo ""
    print_info "Configurando GOOGLE_MAPS_API_KEY..."
    wrangler pages secret put GOOGLE_MAPS_API_KEY --project-name="$PROJECT_NAME"
    
    print_success "Secrets configurados"
    
    # Verificar
    echo ""
    print_info "Secrets actuales:"
    wrangler pages secret list --project-name="$PROJECT_NAME"
}

deploy_application() {
    print_header "DESPLEGAR APLICACIÓN"
    
    if [ ! -d "frontend" ]; then
        print_error "Directorio frontend no encontrado"
        return
    fi
    
    cd frontend
    
    # Verificar wrangler.toml
    if [ ! -f "wrangler.toml" ]; then
        print_error "wrangler.toml no encontrado"
        
        if [ -f "wrangler.toml.new" ]; then
            print_info "Se encontró wrangler.toml.new"
            read -p "¿Deseas usarlo? (y/n): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                mv wrangler.toml wrangler.toml.backup 2>/dev/null || true
                mv wrangler.toml.new wrangler.toml
                print_success "wrangler.toml actualizado"
            else
                cd ..
                return
            fi
        else
            cd ..
            return
        fi
    fi
    
    # Instalar dependencias
    print_info "Verificando dependencias..."
    if [ ! -d "node_modules" ]; then
        print_info "Instalando dependencias..."
        npm install
    fi
    
    # Build
    print_info "Construyendo aplicación..."
    npm run build
    
    if [ $? -ne 0 ]; then
        print_error "Error en el build"
        cd ..
        return
    fi
    
    print_success "Build completado"
    
    # Deploy
    print_info "Desplegando a Cloudflare Pages..."
    npm run deploy
    
    if [ $? -eq 0 ]; then
        print_success "Aplicación desplegada exitosamente"
        echo ""
        print_info "URL: https://beta.acachile.com"
    else
        print_error "Error en el deploy"
    fi
    
    cd ..
}

verify_installation() {
    print_header "VERIFICAR INSTALACIÓN"
    
    PROJECT_URL="https://beta.acachile.com"
    
    # Verificar D1
    print_info "Verificando D1 Database..."
    wrangler d1 list | grep "acachile-db" && print_success "D1 Database OK" || print_error "D1 Database no encontrada"
    
    # Verificar R2
    echo ""
    print_info "Verificando R2 Bucket..."
    wrangler r2 bucket list | grep "aca-chile-images" && print_success "R2 Bucket OK" || print_error "R2 Bucket no encontrado"
    
    # Verificar KV
    echo ""
    print_info "Verificando KV Namespace..."
    wrangler kv namespace list | grep "ACA_KV" && print_success "KV Namespace OK" || print_error "KV Namespace no encontrado"
    
    # Verificar Pages
    echo ""
    print_info "Verificando Cloudflare Pages..."
    wrangler pages project list | grep "acachile" && print_success "Pages Project OK" || print_error "Pages Project no encontrado"
    
    # Health check
    echo ""
    print_info "Verificando health endpoint..."
    if command -v curl &> /dev/null; then
        response=$(curl -s "$PROJECT_URL/api/health")
        if echo "$response" | grep -q "healthy"; then
            print_success "Health check OK"
            echo "$response" | jq . 2>/dev/null || echo "$response"
        else
            print_warning "Health check falló"
            echo "$response"
        fi
    else
        print_warning "curl no disponible, verifica manualmente: $PROJECT_URL/api/health"
    fi
    
    echo ""
    print_success "Verificación completada"
}

auto_migration() {
    print_header "MIGRACIÓN AUTOMÁTICA COMPLETA"
    
    print_warning "Este proceso ejecutará todos los pasos automáticamente"
    print_info "Pasos a ejecutar:"
    echo "  1. Verificar cuenta actual"
    echo "  2. Exportar recursos"
    echo "  3. Cambiar a cuenta nueva"
    echo "  4. Instalar en cuenta nueva"
    echo "  5. Configurar secrets"
    echo "  6. Desplegar aplicación"
    echo "  7. Verificar instalación"
    echo ""
    print_warning "⚠️  La migración de imágenes R2 y datos DB debe hacerse manualmente"
    echo ""
    
    read -p "¿Continuar con migración automática? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        return
    fi
    
    verify_current_account
    export_from_current
    switch_account
    install_in_new_account
    
    print_warning "Pasos manuales pendientes:"
    echo "  - Importar datos a D1 (opción 5)"
    echo "  - Migrar imágenes R2 (opción 6)"
    echo ""
    read -p "Presiona ENTER cuando hayas completado estos pasos..."
    
    configure_secrets
    deploy_application
    verify_installation
    
    print_success "¡Migración automática completada!"
}

show_guide() {
    if [ -f "MIGRATION_GUIDE.md" ]; then
        if command -v less &> /dev/null; then
            less MIGRATION_GUIDE.md
        else
            cat MIGRATION_GUIDE.md
        fi
    else
        print_error "Guía de migración no encontrada"
    fi
}

# ============================================================
# Loop Principal
# ============================================================

while true; do
    show_menu
    read -p "Selecciona una opción: " choice
    
    case $choice in
        1) verify_current_account ;;
        2) export_from_current ;;
        3) switch_account ;;
        4) install_in_new_account ;;
        5) import_database ;;
        6) migrate_r2_images ;;
        7) configure_secrets ;;
        8) deploy_application ;;
        9) verify_installation ;;
        A|a) auto_migration ;;
        H|h) show_guide ;;
        Q|q) 
            print_info "Saliendo..."
            exit 0
            ;;
        *)
            print_error "Opción inválida"
            ;;
    esac
    
    echo ""
    read -p "Presiona ENTER para continuar..."
done
