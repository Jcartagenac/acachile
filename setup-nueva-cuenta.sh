#!/bin/bash

echo "=================================================="
echo "PASO 2: HABILITAR R2 Y CONFIGURAR SECRETS"
echo "=================================================="

echo ""
echo "⚠️  IMPORTANTE: Antes de continuar, debes habilitar R2 manualmente:"
echo ""
echo "1. Abre el Dashboard de Cloudflare:"
echo "   https://dash.cloudflare.com/876bb78a66fe6e1932038334d6f44117/r2/overview"
echo ""
echo "2. Haz clic en 'Enable R2'"
echo "3. Acepta los términos y condiciones"
echo "4. Espera a que R2 se habilite"
echo ""
read -p "¿Ya habilitaste R2 en el dashboard? (s/n): " R2_ENABLED

if [ "$R2_ENABLED" != "s" ]; then
    echo ""
    echo "Por favor, habilita R2 primero y luego ejecuta este script nuevamente."
    exit 1
fi

echo ""
echo "=================================================="
echo "CREANDO BUCKET R2"
echo "=================================================="

# Crear bucket
echo ""
echo "📦 Creando bucket 'aca-chile-images'..."
wrangler r2 bucket create aca-chile-images

if [ $? -eq 0 ]; then
    echo "✅ Bucket creado exitosamente"
else
    echo "⚠️  El bucket ya existe o hubo un error"
fi

echo ""
echo "=================================================="
echo "CONFIGURANDO SECRETS"
echo "=================================================="

echo ""
echo "🔐 Configurando RESEND_API_KEY..."
echo "Ingresa tu Resend API Key (o presiona Enter para omitir):"
read -s RESEND_KEY

if [ ! -z "$RESEND_KEY" ]; then
    echo "$RESEND_KEY" | wrangler secret put RESEND_API_KEY
    echo "✅ RESEND_API_KEY configurado"
else
    echo "⚠️  RESEND_API_KEY omitido"
fi

echo ""
echo "🔐 Configurando GOOGLE_MAPS_API_KEY..."
echo "Ingresa tu Google Maps API Key (o presiona Enter para omitir):"
read -s GOOGLE_KEY

if [ ! -z "$GOOGLE_KEY" ]; then
    echo "$GOOGLE_KEY" | wrangler secret put GOOGLE_MAPS_API_KEY
    echo "✅ GOOGLE_MAPS_API_KEY configurado"
else
    echo "⚠️  GOOGLE_MAPS_API_KEY omitido"
fi

echo ""
echo "=================================================="
echo "VERIFICANDO CONFIGURACIÓN"
echo "=================================================="

echo ""
echo "📊 D1 Database:"
wrangler d1 list | grep acachile-db

echo ""
echo "🔑 KV Namespaces:"
wrangler kv namespace list

echo ""
echo "📦 R2 Buckets:"
wrangler r2 bucket list

echo ""
echo "=================================================="
echo "✅ CONFIGURACIÓN COMPLETADA"
echo "=================================================="

echo ""
echo "Próximos pasos:"
echo ""
echo "1. Migrar imágenes R2 (si tienes acceso a la cuenta antigua):"
echo "   ./setup-rclone.sh"
echo ""
echo "2. O bien, desplegar la aplicación y subir imágenes nuevas:"
echo "   npm run build"
echo "   npm run deploy"
echo ""
