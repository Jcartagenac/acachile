#!/bin/bash

# Script para actualizar las variables de entorno en Cloudflare Pages
# Este script facilita el cambio de dominio sin necesidad de hacerlo manualmente

set -e

echo "🔧 Actualizador de Dominio para Cloudflare Pages"
echo "================================================"
echo ""

# Verificar que wrangler esté instalado
if ! command -v wrangler &> /dev/null; then
    echo "❌ Error: wrangler no está instalado"
    echo "   Instala con: npm install -g wrangler"
    exit 1
fi

# Solicitar información
echo "Ingresa el nuevo dominio (ejemplo: www.acachile.com):"
read -p "Dominio: " NEW_DOMAIN

if [ -z "$NEW_DOMAIN" ]; then
    echo "❌ Error: El dominio no puede estar vacío"
    exit 1
fi

# Construir URLs
FRONTEND_URL="https://${NEW_DOMAIN}"
IMAGES_DOMAIN="images.${NEW_DOMAIN#*.}"  # Extrae dominio base (quita www si existe)
R2_PUBLIC_URL="https://${IMAGES_DOMAIN}"

echo ""
echo "📋 Variables que se actualizarán:"
echo "   VITE_API_BASE_URL=${FRONTEND_URL}"
echo "   VITE_DOMAIN=${NEW_DOMAIN}"
echo "   VITE_R2_PUBLIC_URL=${R2_PUBLIC_URL}"
echo "   FRONTEND_URL=${FRONTEND_URL}"
echo "   CORS_ORIGIN=${FRONTEND_URL}"
echo "   R2_PUBLIC_URL=${R2_PUBLIC_URL}"
echo ""

read -p "¿Continuar? (y/n): " CONFIRM
if [ "$CONFIRM" != "y" ]; then
    echo "❌ Operación cancelada"
    exit 0
fi

PROJECT_NAME="acachile"

echo ""
echo "🚀 Actualizando variables en Cloudflare Pages..."
echo ""

# Función para actualizar una variable
update_var() {
    local VAR_NAME=$1
    local VAR_VALUE=$2
    local ENV_TYPE=$3
    
    echo "   Actualizando ${VAR_NAME} para ${ENV_TYPE}..."
    
    # Primero intentar borrar si existe
    wrangler pages project variable delete "${VAR_NAME}" \
        --project-name="${PROJECT_NAME}" \
        --environment="${ENV_TYPE}" 2>/dev/null || true
    
    # Luego crear/actualizar
    wrangler pages project variable create "${VAR_NAME}" \
        --value="${VAR_VALUE}" \
        --project-name="${PROJECT_NAME}" \
        --environment="${ENV_TYPE}"
}

# Variables frontend (para production)
echo "📦 Actualizando variables de producción..."
update_var "VITE_API_BASE_URL" "${FRONTEND_URL}" "production"
update_var "VITE_DOMAIN" "${NEW_DOMAIN}" "production"
update_var "VITE_R2_PUBLIC_URL" "${R2_PUBLIC_URL}" "production"
update_var "FRONTEND_URL" "${FRONTEND_URL}" "production"
update_var "CORS_ORIGIN" "${FRONTEND_URL}" "production"
update_var "R2_PUBLIC_URL" "${R2_PUBLIC_URL}" "production"

echo ""
echo "📦 Actualizando variables de preview..."
update_var "VITE_API_BASE_URL" "${FRONTEND_URL}" "preview"
update_var "VITE_DOMAIN" "${NEW_DOMAIN}" "preview"
update_var "VITE_R2_PUBLIC_URL" "${R2_PUBLIC_URL}" "preview"
update_var "FRONTEND_URL" "${FRONTEND_URL}" "preview"
update_var "R2_PUBLIC_URL" "${R2_PUBLIC_URL}" "preview"

echo ""
echo "✅ Variables actualizadas correctamente"
echo ""
echo "📝 Próximos pasos:"
echo ""
echo "1. Configura el custom domain en Cloudflare Pages:"
echo "   https://dash.cloudflare.com/pages → ${PROJECT_NAME} → Custom domains"
echo "   Agrega: ${NEW_DOMAIN}"
echo ""
echo "2. Configura el custom domain para imágenes en R2:"
echo "   https://dash.cloudflare.com/r2 → aca-chile-images → Settings → Public access"
echo "   Agrega: ${IMAGES_DOMAIN}"
echo ""
echo "3. Fuerza un nuevo deployment:"
echo "   wrangler pages deployment create dist --project-name=${PROJECT_NAME}"
echo ""
echo "4. Verifica que todo funcione:"
echo "   curl ${FRONTEND_URL}/api/health | jq ."
echo "   curl ${FRONTEND_URL}/api/bindings | jq ."
echo ""

exit 0
