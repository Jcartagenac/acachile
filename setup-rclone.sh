#!/bin/bash

# ============================================================
# HELPER PARA CONFIGURACIÓN DE RCLONE
# ============================================================
# Este script ayuda a configurar Rclone para migrar entre
# cuentas de Cloudflare R2
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

print_header "CONFIGURACIÓN DE RCLONE PARA CLOUDFLARE R2"

# Verificar si rclone está instalado
if ! command -v rclone &> /dev/null; then
    print_error "Rclone no está instalado"
    echo ""
    print_info "Instalación:"
    echo "  macOS:  brew install rclone"
    echo "  Linux:  curl https://rclone.org/install.sh | sudo bash"
    echo ""
    read -p "¿Deseas instalar Rclone ahora (solo macOS)? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        brew install rclone
        print_success "Rclone instalado"
    else
        exit 1
    fi
fi

print_success "Rclone encontrado: $(rclone version | head -1)"

echo ""
print_info "Para migrar imágenes entre cuentas de Cloudflare R2, necesitas:"
echo "  1. Account ID de ambas cuentas"
echo "  2. R2 Access Key ID y Secret de ambas cuentas"
echo ""

print_warning "IMPORTANTE: Necesitas crear R2 API Tokens en ambas cuentas"
echo ""
print_info "Pasos para crear R2 API Token:"
echo "  1. Ve a Cloudflare Dashboard"
echo "  2. Selecciona tu cuenta"
echo "  3. Ve a R2 > Manage R2 API Tokens"
echo "  4. Crea nuevo token con permisos: Object Read & Write"
echo "  5. Guarda Access Key ID y Secret Access Key"
echo ""

read -p "¿Ya tienes los R2 API Tokens de ambas cuentas? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_warning "Por favor, crea los tokens antes de continuar"
    echo ""
    print_info "URLs útiles:"
    echo "  https://dash.cloudflare.com/"
    exit 0
fi

# Menú de configuración
echo ""
echo "┌─────────────────────────────────────────────────────┐"
echo "│         CONFIGURACIÓN DE RCLONE                     │"
echo "├─────────────────────────────────────────────────────┤"
echo "│  [1] Configurar cuenta ANTIGUA (origen)             │"
echo "│  [2] Configurar cuenta NUEVA (destino)              │"
echo "│  [3] Configurar ambas cuentas                       │"
echo "│  [4] Ver configuración actual                       │"
echo "│  [5] Probar conexión                                │"
echo "│  [6] Migrar bucket completo                         │"
echo "│  [Q] Salir                                          │"
echo "└─────────────────────────────────────────────────────┘"
echo ""

configure_account() {
    local profile_name=$1
    local description=$2
    
    print_header "CONFIGURAR: $description"
    
    echo ""
    print_info "Ingresa la información de la cuenta:"
    echo ""
    
    read -p "Account ID: " account_id
    read -p "Access Key ID: " access_key_id
    read -sp "Secret Access Key: " secret_access_key
    echo ""
    
    if [ -z "$account_id" ] || [ -z "$access_key_id" ] || [ -z "$secret_access_key" ]; then
        print_error "Todos los campos son requeridos"
        return 1
    fi
    
    print_info "Creando configuración de Rclone..."
    
    # Crear configuración usando rclone config
    cat > /tmp/rclone-config-$profile_name.txt << EOF
$profile_name
s3
Cloudflare
$access_key_id
$secret_access_key

https://$account_id.r2.cloudflarestorage.com
1
$account_id




EOF
    
    print_info "Ejecutando rclone config..."
    print_warning "Sigue las instrucciones y selecciona las opciones por defecto"
    
    # Instrucciones para el usuario
    echo ""
    print_info "Cuando se te pida:"
    echo "  - Storage: Selecciona 's3' (Amazon S3)"
    echo "  - Provider: Selecciona 'Cloudflare'"
    echo "  - Access Key ID: Ingresa el que proporcionaste"
    echo "  - Secret Access Key: Ingresa el que proporcionaste"
    echo "  - Region: Deja en blanco (presiona Enter)"
    echo "  - Endpoint: https://$account_id.r2.cloudflarestorage.com"
    echo "  - Location constraint: Presiona Enter"
    echo "  - ACL: Presiona Enter (default)"
    echo "  - Edit advanced config: n"
    echo "  - Keep this remote: y"
    echo ""
    
    read -p "Presiona ENTER para abrir rclone config..."
    
    rclone config
    
    # Verificar
    if rclone config show "$profile_name" &> /dev/null; then
        print_success "Configuración creada: $profile_name"
        return 0
    else
        print_error "Error al crear configuración"
        return 1
    fi
}

show_current_config() {
    print_header "CONFIGURACIÓN ACTUAL DE RCLONE"
    
    if rclone listremotes | grep -q "cloudflare-old"; then
        print_success "cloudflare-old configurado"
    else
        print_warning "cloudflare-old NO configurado"
    fi
    
    if rclone listremotes | grep -q "cloudflare-new"; then
        print_success "cloudflare-new configurado"
    else
        print_warning "cloudflare-new NO configurado"
    fi
    
    echo ""
    print_info "Remotes configurados:"
    rclone listremotes
}

test_connection() {
    print_header "PROBAR CONEXIONES"
    
    BUCKET_NAME="aca-chile-images"
    
    # Probar cuenta antigua
    if rclone listremotes | grep -q "cloudflare-old"; then
        print_info "Probando cloudflare-old..."
        if rclone ls cloudflare-old:$BUCKET_NAME --max-depth 1 &> /dev/null; then
            count=$(rclone ls cloudflare-old:$BUCKET_NAME | wc -l)
            print_success "cloudflare-old OK - $count archivos encontrados"
        else
            print_error "cloudflare-old FALLO - No se pudo conectar"
        fi
    else
        print_warning "cloudflare-old no configurado"
    fi
    
    echo ""
    
    # Probar cuenta nueva
    if rclone listremotes | grep -q "cloudflare-new"; then
        print_info "Probando cloudflare-new..."
        if rclone ls cloudflare-new:$BUCKET_NAME --max-depth 1 &> /dev/null; then
            count=$(rclone ls cloudflare-new:$BUCKET_NAME | wc -l)
            print_success "cloudflare-new OK - $count archivos encontrados"
        else
            print_warning "cloudflare-new OK - Bucket vacío o sin archivos"
        fi
    else
        print_warning "cloudflare-new no configurado"
    fi
}

migrate_bucket() {
    print_header "MIGRAR BUCKET COMPLETO"
    
    BUCKET_NAME="aca-chile-images"
    
    # Verificar que ambos remotes existen
    if ! rclone listremotes | grep -q "cloudflare-old"; then
        print_error "cloudflare-old no configurado"
        return 1
    fi
    
    if ! rclone listremotes | grep -q "cloudflare-new"; then
        print_error "cloudflare-new no configurado"
        return 1
    fi
    
    print_success "Ambos remotes configurados"
    
    # Mostrar preview
    echo ""
    print_info "Contando archivos en origen..."
    old_count=$(rclone ls cloudflare-old:$BUCKET_NAME 2>/dev/null | wc -l || echo "0")
    print_info "Archivos en origen: $old_count"
    
    print_info "Contando archivos en destino..."
    new_count=$(rclone ls cloudflare-new:$BUCKET_NAME 2>/dev/null | wc -l || echo "0")
    print_info "Archivos en destino: $new_count"
    
    echo ""
    print_warning "Se copiarán $old_count archivos"
    print_info "Comando: rclone sync cloudflare-old:$BUCKET_NAME cloudflare-new:$BUCKET_NAME -P --checksum"
    echo ""
    
    read -p "¿Continuar con la migración? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Migración cancelada"
        return 0
    fi
    
    print_info "Iniciando migración..."
    print_warning "Esto puede tardar varios minutos dependiendo del tamaño..."
    echo ""
    
    # Ejecutar sync con progress
    if rclone sync cloudflare-old:$BUCKET_NAME cloudflare-new:$BUCKET_NAME -P --checksum; then
        print_success "Migración completada"
        
        # Verificar
        echo ""
        print_info "Verificando migración..."
        final_count=$(rclone ls cloudflare-new:$BUCKET_NAME | wc -l)
        
        echo ""
        echo "Archivos origen:  $old_count"
        echo "Archivos destino: $final_count"
        
        if [ "$old_count" -eq "$final_count" ]; then
            print_success "✓ Verificación exitosa - Todos los archivos copiados"
        else
            print_warning "⚠ Diferencia en cantidad de archivos"
        fi
    else
        print_error "Error durante la migración"
        return 1
    fi
}

# Loop principal
while true; do
    read -p "Selecciona una opción: " choice
    
    case $choice in
        1)
            configure_account "cloudflare-old" "Cuenta ANTIGUA (origen)"
            ;;
        2)
            configure_account "cloudflare-new" "Cuenta NUEVA (destino)"
            ;;
        3)
            configure_account "cloudflare-old" "Cuenta ANTIGUA (origen)"
            configure_account "cloudflare-new" "Cuenta NUEVA (destino)"
            ;;
        4)
            show_current_config
            ;;
        5)
            test_connection
            ;;
        6)
            migrate_bucket
            ;;
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
    
    echo ""
    echo "┌─────────────────────────────────────────────────────┐"
    echo "│         CONFIGURACIÓN DE RCLONE                     │"
    echo "├─────────────────────────────────────────────────────┤"
    echo "│  [1] Configurar cuenta ANTIGUA (origen)             │"
    echo "│  [2] Configurar cuenta NUEVA (destino)              │"
    echo "│  [3] Configurar ambas cuentas                       │"
    echo "│  [4] Ver configuración actual                       │"
    echo "│  [5] Probar conexión                                │"
    echo "│  [6] Migrar bucket completo                         │"
    echo "│  [Q] Salir                                          │"
    echo "└─────────────────────────────────────────────────────┘"
    echo ""
done
