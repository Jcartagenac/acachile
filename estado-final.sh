#!/bin/bash

echo "=================================================="
echo "✅ CONFIGURACIÓN R2 COMPLETADA"
echo "=================================================="

echo ""
echo "Bucket R2 creado exitosamente:"
wrangler r2 bucket list

echo ""
echo "=================================================="
echo "🔐 CONFIGURACIÓN DE SECRETS (Cloudflare Pages)"
echo "=================================================="

echo ""
echo "Para Cloudflare Pages, los secrets se configuran en el Dashboard:"
echo ""
echo "1. Abre: https://dash.cloudflare.com/876bb78a66fe6e1932038334d6f44117/pages"
echo ""
echo "2. Selecciona tu proyecto 'acachile'"
echo ""
echo "3. Ve a Settings → Environment Variables"
echo ""
echo "4. Agrega las siguientes variables:"
echo ""
echo "   Production Environment:"
echo "   ┌─────────────────────────┬──────────────────────────┐"
echo "   │ Variable Name           │ Type                     │"
echo "   ├─────────────────────────┼──────────────────────────┤"
echo "   │ RESEND_API_KEY          │ Secret (Encrypted)       │"
echo "   │ GOOGLE_MAPS_API_KEY     │ Secret (Encrypted)       │"
echo "   └─────────────────────────┴──────────────────────────┘"
echo ""
echo "   Preview Environment:"
echo "   (Las mismas variables)"
echo ""

echo "=================================================="
echo "📊 ESTADO ACTUAL DE LA MIGRACIÓN"
echo "=================================================="

echo ""
echo "✅ Cuenta: webmaster@acachile.com"
wrangler whoami | tail -5

echo ""
echo "✅ D1 Database:"
wrangler d1 list | grep acachile-db

echo ""
echo "✅ KV Namespaces:"
wrangler kv namespace list | grep -A1 "ACA_KV"

echo ""
echo "✅ R2 Bucket:"
wrangler r2 bucket list | grep aca-chile-images

echo ""
echo "✅ wrangler.toml actualizado con:"
echo "   - D1: 2af4176e-ad62-4f85-a6d2-0bccef75fc66"
echo "   - KV: 4325e2596d6c455a8e90be44b3239ca4"
echo "   - R2: aca-chile-images"

echo ""
echo "=================================================="
echo "✅ LISTO PARA DESPLEGAR"
echo "=================================================="

echo ""
echo "Pasos finales:"
echo ""
echo "1. ⚠️  Configurar secrets en el Dashboard (ver arriba)"
echo ""
echo "2. 🖼️  Migrar imágenes (opcional si tienes acceso a cuenta antigua):"
echo "   ./setup-rclone.sh"
echo ""
echo "3. 🚀 Build y Deploy:"
echo "   cd frontend"
echo "   npm install"
echo "   npm run build"
echo "   npx wrangler pages deploy dist"
echo ""
echo "   O si prefieres usar npm run deploy:"
echo "   npm run deploy"
echo ""
