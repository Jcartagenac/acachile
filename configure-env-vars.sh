#!/bin/bash

# ==================================================
# CONFIGURACIÓN DE VARIABLES DE ENTORNO - CLOUDFLARE PAGES
# ==================================================
# 
# Este script configura todas las variables de entorno y secretos
# necesarios para el proyecto AcaChile en Cloudflare Pages.
# 
# Antes de ejecutar:
# 1. Instalar wrangler: npm install -g wrangler
# 2. Autenticar: wrangler auth
# 3. Configurar este script con los valores correctos
# 4. Ejecutar: bash configure-env-vars.sh
# 

set -e  # Exit on error

PROJECT_NAME="acachile"
ACCOUNT_ID="f5e02f0e0d3656c3b7c02948ee0f96ed"  # Tu Account ID de Cloudflare

echo "🔧 Configurando variables de entorno para Cloudflare Pages..."
echo "📋 Proyecto: $PROJECT_NAME"
echo "🆔 Account ID: $ACCOUNT_ID"
echo ""

# --------------------------------------------------
# VARIABLES PÚBLICAS (No sensibles)
# --------------------------------------------------
echo "📝 Configurando variables públicas..."

# Environment
wrangler pages project environment-variable add ENVIRONMENT production --project-name="$PROJECT_NAME" --compatibility-date="2024-09-23" || true

# URLs del frontend
wrangler pages project environment-variable add FRONTEND_URL "https://beta.acachile.com" --project-name="$PROJECT_NAME" --compatibility-date="2024-09-23" || true
wrangler pages project environment-variable add CORS_ORIGIN "https://beta.acachile.com" --project-name="$PROJECT_NAME" --compatibility-date="2024-09-23" || true

# Emails
wrangler pages project environment-variable add ADMIN_EMAIL "admin@acachile.cl" --project-name="$PROJECT_NAME" --compatibility-date="2024-09-23" || true
wrangler pages project environment-variable add FROM_EMAIL "noreply@mail.juancartagena.cl" --project-name="$PROJECT_NAME" --compatibility-date="2024-09-23" || true

echo "✅ Variables públicas configuradas"

# --------------------------------------------------
# SECRETOS (Sensibles)
# --------------------------------------------------
echo ""
echo "🔐 Configurando secretos..."

# JWT Secret - Generar uno nuevo si no existe
echo "🔑 JWT_SECRET:"
echo "   Genera un secreto seguro ejecutando: openssl rand -hex 32"
echo "   Luego ejecuta: wrangler pages project secret put JWT_SECRET --project-name=\"$PROJECT_NAME\""
echo ""

# Resend API Key
echo "📧 RESEND_API_KEY:"
echo "   1. Ve a https://resend.com/api-keys"
echo "   2. Crea una nueva API key"
echo "   3. Ejecuta: wrangler pages project secret put RESEND_API_KEY --project-name=\"$PROJECT_NAME\""
echo ""

# --------------------------------------------------
# BINDINGS (Se configuran automáticamente desde wrangler.toml)
# --------------------------------------------------
echo "🔗 Bindings (configurados automáticamente):"
echo "   ✅ DB - D1 Database"
echo "   ✅ ACA_KV - KV Namespace"
echo ""

# --------------------------------------------------
# VERIFICACIÓN
# --------------------------------------------------
echo "🧪 Verificando configuración..."

# Verificar que el proyecto existe
if ! wrangler pages project list | grep -q "$PROJECT_NAME"; then
  echo "❌ Proyecto '$PROJECT_NAME' no encontrado"
  echo "   Créalo ejecutando: wrangler pages project create $PROJECT_NAME"
  exit 1
fi

echo "✅ Proyecto '$PROJECT_NAME' encontrado"

# --------------------------------------------------
# COMANDOS PARA CONFIGURAR SECRETOS MANUALMENTE
# --------------------------------------------------
echo ""
echo "🔧 Comandos para configurar secretos manualmente:"
echo ""
echo "# Generar JWT Secret seguro:"
echo "openssl rand -hex 32"
echo ""
echo "# Configurar JWT_SECRET:"
echo "wrangler pages project secret put JWT_SECRET --project-name=\"$PROJECT_NAME\""
echo ""
echo "# Configurar RESEND_API_KEY:"
echo "wrangler pages project secret put RESEND_API_KEY --project-name=\"$PROJECT_NAME\""
echo ""

# --------------------------------------------------
# INFORMACIÓN ADICIONAL
# --------------------------------------------------
echo "📚 Información adicional:"
echo ""
echo "🌐 Dashboard de Cloudflare Pages:"
echo "   https://dash.cloudflare.com/$ACCOUNT_ID/pages/view/$PROJECT_NAME"
echo ""
echo "📖 Variables de entorno configurables:"
echo "   • ENVIRONMENT (production/development/staging)"
echo "   • FRONTEND_URL (URL del frontend)"
echo "   • CORS_ORIGIN (Origen permitido para CORS)"
echo "   • ADMIN_EMAIL (Email del administrador)"
echo "   • FROM_EMAIL (Email remitente del sistema)"
echo "   • JWT_SECRET (Secreto para tokens JWT)"
echo "   • RESEND_API_KEY (API key para envío de emails)"
echo ""
echo "🔄 Para diferentes entornos, usa variables como:"
echo "   • Staging: VITE_API_BASE_URL=https://staging-beta.acachile.com"
echo "   • Development: VITE_API_BASE_URL=http://localhost:8787"
echo ""

echo "✅ Configuración completada!"
echo ""
echo "📋 Próximos pasos:"
echo "   1. Configurar los secretos JWT_SECRET y RESEND_API_KEY manualmente"
echo "   2. Verificar el funcionamiento en: https://beta.acachile.com/api/bindings"
echo "   3. Revisar los logs en el dashboard de Cloudflare Pages"