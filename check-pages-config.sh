#!/bin/bash

# Script para verificar que todo esté listo para Cloudflare Pages
echo "🔍 Verificando configuración para Cloudflare Pages..."

echo ""
echo "📋 URLs actualizadas:"
echo "   🌐 Frontend: https://acachile.pages.dev"
echo "   🔧 API Staging: https://acachile-api-staging.juecart.workers.dev"  
echo "   🚀 API Production: https://acachile-api-production.juecart.workers.dev"

echo ""
echo "⚙️ Variables de entorno configuradas:"
if [ -f "frontend/.env" ]; then
    echo "   ✅ frontend/.env (para Pages)"
    cat frontend/.env
else
    echo "   ❌ frontend/.env - FALTA"
fi

echo ""
if [ -f "frontend/.env.production" ]; then
    echo "   ✅ frontend/.env.production"
    cat frontend/.env.production
else
    echo "   ❌ frontend/.env.production - FALTA"
fi

echo ""
echo "🔧 Worker deployments:"
echo "   ✅ Staging desplegado"
echo "   🔄 Production - ejecutar: cd worker && ./deploy.sh production"

echo ""
echo "📦 Para conectar a Cloudflare Pages:"
echo "   1. Ve a dash.cloudflare.com → Pages"
echo "   2. Conecta este repositorio: https://github.com/Jcartagenac/acachile"
echo "   3. Configura build settings:"
echo "      - Build command: npm run build"  
echo "      - Build output: frontend/dist"
echo "      - Root directory: frontend/"
echo "   4. Agrega variable de entorno:"
echo "      - VITE_API_BASE_URL = https://acachile-api-production.juecart.workers.dev"

echo ""
echo "✅ ¡Todo listo para desplegar a Pages!"