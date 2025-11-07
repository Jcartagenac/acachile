#!/bin/bash

echo "=================================================="
echo "RESUMEN FINAL DE MIGRACIÓN"
echo "=================================================="

echo ""
echo "✅ CUENTA NUEVA:"
wrangler whoami

echo ""
echo "📊 D1 DATABASE:"
wrangler d1 list

echo ""
echo "🔑 KV NAMESPACES:"
wrangler kv namespace list

echo ""
echo "📦 R2 BUCKETS:"
wrangler r2 bucket list 2>&1 || echo "⚠️  R2 aún no habilitado"

echo ""
echo "=================================================="
echo "DATOS IMPORTADOS:"
echo "=================================================="

# Usuarios
USUARIOS=$(wrangler d1 execute acachile-db --remote --command="SELECT COUNT(*) as total FROM usuarios" 2>&1 | grep -A1 "total" | tail -1 | tr -d '│ ')
echo "✅ Usuarios: $USUARIOS"

# Cuotas
CUOTAS=$(wrangler d1 execute acachile-db --remote --command="SELECT COUNT(*) as total FROM cuotas" 2>&1 | grep -A1 "total" | tail -1 | tr -d '│ ')
echo "✅ Cuotas: $CUOTAS"

# Eventos
EVENTOS=$(wrangler d1 execute acachile-db --remote --command="SELECT COUNT(*) as total FROM eventos" 2>&1 | grep -A1 "total" | tail -1 | tr -d '│ ')
echo "✅ Eventos: $EVENTOS"

# Pagos
PAGOS=$(wrangler d1 execute acachile-db --remote --command="SELECT COUNT(*) as total FROM pagos" 2>&1 | grep -A1 "total" | tail -1 | tr -d '│ ')
echo "✅ Pagos: $PAGOS"

# News articles
ARTICLES=$(wrangler d1 execute acachile-db --remote --command="SELECT COUNT(*) as total FROM news_articles" 2>&1 | grep -A1 "total" | tail -1 | tr -d '│ ')
echo "✅ News Articles: $ARTICLES"

# News categories
CATEGORIES=$(wrangler d1 execute acachile-db --remote --command="SELECT COUNT(*) as total FROM news_categories" 2>&1 | grep -A1 "total" | tail -1 | tr -d '│ ')
echo "✅ News Categories: $CATEGORIES"

# News tags
TAGS=$(wrangler d1 execute acachile-db --remote --command="SELECT COUNT(*) as total FROM news_tags" 2>&1 | grep -A1 "total" | tail -1 | tr -d '│ ')
echo "✅ News Tags: $TAGS"

# Postulaciones
POSTULACIONES=$(wrangler d1 execute acachile-db --remote --command="SELECT COUNT(*) as total FROM postulaciones" 2>&1 | grep -A1 "total" | tail -1 | tr -d '│ ')
echo "✅ Postulaciones: $POSTULACIONES"

echo ""
echo "=================================================="
echo "PRÓXIMOS PASOS:"
echo "=================================================="
echo ""
echo "1. ⚠️  HABILITAR R2 en el Dashboard de Cloudflare"
echo "   https://dash.cloudflare.com/876bb78a66fe6e1932038334d6f44117/r2/overview"
echo ""
echo "2. 📝 ACTUALIZAR wrangler.toml con:"
echo "   - D1 Database ID: 2af4176e-ad62-4f85-a6d2-0bccef75fc66"
echo "   - KV Namespace ID: 4325e2596d6c455a8e90be44b3239ca4"
echo "   - KV Preview ID: 5390e4691c2c45d787ccd2a6d5383ea1"
echo ""
echo "3. 🔐 CONFIGURAR SECRETS:"
echo "   wrangler secret put RESEND_API_KEY"
echo "   wrangler secret put GOOGLE_MAPS_API_KEY"
echo ""
echo "4. 🖼️  MIGRAR IMÁGENES (después de habilitar R2)"
echo "   ./setup-rclone.sh"
echo ""
echo "5. 🚀 DESPLEGAR APLICACIÓN:"
echo "   npm run build && npm run deploy"
echo ""
