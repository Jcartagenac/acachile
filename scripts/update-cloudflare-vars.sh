#!/bin/bash

# Script para actualizar variables de entorno en Cloudflare Pages
# Uso: ./scripts/update-cloudflare-vars.sh

PROJECT_NAME="acachile"

echo "🔧 Actualizando variables de entorno en Cloudflare Pages..."
echo ""
echo "⚠️  NOTA: Las variables en wrangler.toml [env.production.vars] se usan automáticamente"
echo "   cuando se despliega desde Git. Solo necesitas actualizar manualmente en el Dashboard"
echo "   si las variables fueron configuradas previamente ahí y tienen prioridad."
echo ""
echo "Variables actuales en wrangler.toml:"
echo "- R2_PUBLIC_URL=https://images.acachile.com"
echo "- VITE_R2_PUBLIC_URL=https://images.acachile.com"
echo ""

read -p "¿Quieres actualizar estas variables en el Dashboard de Cloudflare? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo ""
    echo "📋 Para actualizar las variables manualmente en Cloudflare Pages:"
    echo ""
    echo "1. Ve a: https://dash.cloudflare.com"
    echo "2. Workers & Pages → acachile → Settings → Environment variables"
    echo "3. En la sección 'Production', actualiza:"
    echo "   - R2_PUBLIC_URL = https://images.acachile.com"
    echo "   - VITE_R2_PUBLIC_URL = https://images.acachile.com"
    echo "4. Guarda los cambios"
    echo "5. Re-despliega para aplicar los cambios (o espera el próximo deployment desde Git)"
    echo ""
    echo "Alternativamente, las variables en wrangler.toml se aplicarán automáticamente"
    echo "en el próximo deployment desde Git (que ya se hizo con el commit 8dca1051)."
    echo ""
fi

echo ""
echo "✅ Las variables ya están actualizadas en wrangler.toml"
echo "   El deployment desde Git las aplicará automáticamente."
