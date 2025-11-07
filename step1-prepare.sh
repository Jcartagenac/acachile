#!/bin/bash

# ============================================================
# PASO 1: PREPARACIÓN ANTES DE CAMBIAR DE CUENTA
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

print_header "PREPARACIÓN PARA MIGRACIÓN"

echo "Antes de cambiar de cuenta, verifica que tienes guardados:"
echo ""
echo "📋 CHECKLIST PRE-MIGRACIÓN"
echo "─────────────────────────────────────────────────"
echo ""

# Verificar cuenta actual
print_info "Cuenta actual de Cloudflare:"
wrangler whoami | grep -E "Account|email"
echo ""

# Verificar recursos actuales
print_info "Recursos en cuenta actual:"
echo ""
echo "  D1 Databases:"
wrangler d1 list | grep -E "name:|database_id" | head -4
echo ""
echo "  R2 Buckets:"
wrangler r2 bucket list | grep -E "name:"
echo ""
echo "  KV Namespaces:"
wrangler kv namespace list | grep -E "title|id" | head -6
echo ""

# Checklist interactivo
print_warning "IMPORTANTE: ¿Has guardado estos valores?"
echo ""

read -p "  [1] ¿Tienes guardado RESEND_API_KEY? (y/n): " resend_saved
read -p "  [2] ¿Tienes guardado GOOGLE_MAPS_API_KEY? (y/n): " google_saved
read -p "  [3] ¿Tienes acceso a la nueva cuenta de Cloudflare? (y/n): " new_account
read -p "  [4] ¿Has creado R2 API Tokens para ambas cuentas? (y/n): " r2_tokens

echo ""

all_good=true

if [[ ! $resend_saved =~ ^[Yy]$ ]]; then
    print_error "Necesitas guardar RESEND_API_KEY antes de continuar"
    echo "    Obtenerlo de: https://resend.com/api-keys"
    all_good=false
fi

if [[ ! $google_saved =~ ^[Yy]$ ]]; then
    print_error "Necesitas guardar GOOGLE_MAPS_API_KEY antes de continuar"
    echo "    Obtenerlo de: https://console.cloud.google.com/apis/credentials"
    all_good=false
fi

if [[ ! $new_account =~ ^[Yy]$ ]]; then
    print_error "Necesitas tener acceso a la nueva cuenta de Cloudflare"
    all_good=false
fi

if [[ ! $r2_tokens =~ ^[Yy]$ ]]; then
    print_warning "Necesitarás R2 API Tokens para migrar imágenes"
    echo "    Crear en: Cloudflare Dashboard > R2 > Manage R2 API Tokens"
fi

echo ""

if [ "$all_good" = true ]; then
    print_success "✓ Todo listo para continuar"
    echo ""
    print_header "RESUMEN DE EXPORTACIÓN"
    cat cloudflare-export/database/EXPORT_SUMMARY.txt
    echo ""
    print_header "PRÓXIMO PASO"
    echo ""
    echo "Ahora ejecuta estos comandos:"
    echo ""
    echo "  1. Cerrar sesión en cuenta actual:"
    echo "     ${YELLOW}wrangler logout${NC}"
    echo ""
    echo "  2. Iniciar sesión en cuenta NUEVA:"
    echo "     ${YELLOW}wrangler login${NC}"
    echo ""
    echo "  3. Verificar que estás en la cuenta correcta:"
    echo "     ${YELLOW}wrangler whoami${NC}"
    echo ""
    echo "  4. Ejecutar instalador en nueva cuenta:"
    echo "     ${YELLOW}./migrate-to-new-account.sh${NC}"
    echo ""
else
    print_error "✗ Completa los pasos faltantes antes de continuar"
    exit 1
fi
