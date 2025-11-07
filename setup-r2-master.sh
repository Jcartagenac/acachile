#!/bin/bash

# Script maestro para configurar R2 completamente
# Este script ejecuta todo el proceso de configuración de R2

echo "🚀 Configuración Completa de Cloudflare R2 para ACA Chile"
echo "========================================================="
echo ""

# Verificar que Node.js esté disponible
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no encontrado. Por favor instala Node.js primero."
    exit 1
fi

# Verificar variables de entorno
if [[ -z "$CLOUDFLARE_ACCOUNT_ID" || -z "$R2_ACCESS_KEY_ID" || -z "$R2_SECRET_ACCESS_KEY" ]]; then
    echo "❌ Variables de entorno faltantes"
    echo ""
    echo "📝 Antes de ejecutar este script, configura:"
    echo "export CLOUDFLARE_ACCOUNT_ID=\"tu_account_id\""
    echo "export R2_ACCESS_KEY_ID=\"tu_access_key_id\""
    echo "export R2_SECRET_ACCESS_KEY=\"tu_secret_access_key\""
    echo ""
    echo "💡 Para obtener estas credenciales:"
    echo "1. Ve a Cloudflare Dashboard → R2 Object Storage"
    echo "2. Clic en 'Manage R2 API tokens'"
    echo "3. Crear token con permisos 'Object Read & Write'"
    exit 1
fi

echo "✅ Variables de entorno configuradas"
echo "   CLOUDFLARE_ACCOUNT_ID: $CLOUDFLARE_ACCOUNT_ID"
echo ""

# Paso 1: Configurar R2 y subir imágenes
echo "📦 Paso 1: Configurando bucket R2 y subiendo imágenes..."
node setup-r2-complete.js

if [ $? -ne 0 ]; then
    echo "❌ Error en la configuración de R2. Abortando."
    exit 1
fi

echo ""

# Paso 2: Actualizar URLs en el código
echo "🔄 Paso 2: Actualizando URLs en el código..."
node update-urls-to-r2.js

if [ $? -ne 0 ]; then
    echo "❌ Error actualizando URLs. Revisa manualmente."
    exit 1
fi

echo ""

# Paso 3: Compilar para verificar
echo "🔧 Paso 3: Verificando compilación..."
cd frontend && npm run build

if [ $? -ne 0 ]; then
    echo "❌ Error en la compilación. Revisa el código."
    exit 1
fi

cd ..

# Paso 4: Mostrar resumen
echo ""
echo "🎉 ¡Configuración de R2 completada exitosamente!"
echo ""
echo "📋 Resumen:"
echo "✅ Bucket 'aca-chile-images' configurado"
echo "✅ 10 imágenes subidas a R2"
echo "✅ URLs actualizadas en el código"
echo "✅ Compilación exitosa"
echo ""
echo "🌐 URLs públicas base:"
echo "https://pub-$CLOUDFLARE_ACCOUNT_ID.r2.dev/aca-chile-images/"
echo ""
echo "🚀 Próximos pasos:"
echo "1. git add . && git commit -m 'feat: Migrar imágenes a Cloudflare R2'"
echo "2. git push origin main"
echo "3. Verificar en https://beta.acachile.com"
echo ""
echo "💡 Opcional: Configurar custom domain 'images.beta.acachile.com' en Cloudflare"