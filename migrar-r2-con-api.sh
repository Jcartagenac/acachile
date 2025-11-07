#!/bin/bash

echo "=================================================="
echo "MIGRACIÓN DE IMÁGENES R2 - USANDO API"
echo "=================================================="

# Necesitamos las credenciales de R2 API Token
echo ""
echo "Para listar objetos R2, necesitas crear un API Token:"
echo ""
echo "1. Ve a: https://dash.cloudflare.com/172194a6569df504cbb8a638a94d3d2c/r2/overview"
echo "2. Click en 'Manage R2 API Tokens'"
echo "3. Create API Token con permisos de lectura"
echo "4. Guarda el Access Key ID y Secret Access Key"
echo ""

read -p "¿Tienes un R2 API Token? (s/n): " HAS_TOKEN

if [ "$HAS_TOKEN" != "s" ]; then
    echo ""
    echo "Por favor, crea un API Token primero y ejecuta este script nuevamente."
    echo ""
    echo "ALTERNATIVA: Usa Rclone para listar y copiar:"
    echo "  brew install rclone"
    echo "  rclone config"
    echo "  # Configura ambas cuentas"
    echo "  rclone lsl cloudflare-old:aca-chile-images"
    echo "  rclone sync cloudflare-old:aca-chile-images cloudflare-new:aca-chile-images -P"
    exit 1
fi

echo ""
read -p "Access Key ID (cuenta antigua): " OLD_ACCESS_KEY
read -sp "Secret Access Key (cuenta antigua): " OLD_SECRET_KEY
echo ""

echo ""
echo "Ahora necesitamos las credenciales de la cuenta NUEVA:"
echo "Ve a: https://dash.cloudflare.com/876bb78a66fe6e1932038334d6f44117/r2/overview"
echo ""

read -p "Access Key ID (cuenta nueva): " NEW_ACCESS_KEY
read -sp "Secret Access Key (cuenta nueva): " NEW_SECRET_KEY
echo ""

# Guardar configuración temporalmente
cat > /tmp/r2-migration-config.json << EOF
{
  "old_account": {
    "account_id": "172194a6569df504cbb8a638a94d3d2c",
    "access_key": "$OLD_ACCESS_KEY",
    "secret_key": "$OLD_SECRET_KEY",
    "bucket": "aca-chile-images"
  },
  "new_account": {
    "account_id": "876bb78a66fe6e1932038334d6f44117",
    "access_key": "$NEW_ACCESS_KEY",
    "secret_key": "$NEW_SECRET_KEY",
    "bucket": "aca-chile-images"
  }
}
EOF

echo ""
echo "✅ Configuración guardada"
echo ""
echo "=================================================="
echo "LISTANDO OBJETOS CON AWS CLI"
echo "=================================================="

# Verificar si aws cli está instalado
if ! command -v aws &> /dev/null; then
    echo "⚠️  AWS CLI no está instalado"
    echo ""
    echo "Instálalo con:"
    echo "  brew install awscli"
    echo ""
    read -p "¿Deseas continuar usando curl (manual)? (s/n): " USE_CURL
    
    if [ "$USE_CURL" != "s" ]; then
        exit 1
    fi
fi

# Endpoint de R2
OLD_ENDPOINT="https://172194a6569df504cbb8a638a94d3d2c.r2.cloudflarestorage.com"
NEW_ENDPOINT="https://876bb78a66fe6e1932038334d6f44117.r2.cloudflarestorage.com"

# Configurar AWS CLI profile temporal para cuenta antigua
export AWS_ACCESS_KEY_ID="$OLD_ACCESS_KEY"
export AWS_SECRET_ACCESS_KEY="$OLD_SECRET_KEY"

echo ""
echo "📋 Listando objetos en bucket aca-chile-images (cuenta antigua)..."

aws s3 ls s3://aca-chile-images --endpoint-url "$OLD_ENDPOINT" --recursive > /tmp/r2-objects-list.txt

TOTAL=$(wc -l < /tmp/r2-objects-list.txt | tr -d ' ')
echo "✅ Encontrados $TOTAL objetos"

if [ "$TOTAL" -eq 0 ]; then
    echo "⚠️  No hay objetos para migrar"
    rm /tmp/r2-migration-config.json
    exit 0
fi

echo ""
echo "=================================================="
echo "COPIANDO OBJETOS"
echo "=================================================="

# Cambiar a credenciales de cuenta nueva
export AWS_ACCESS_KEY_ID="$NEW_ACCESS_KEY"
export AWS_SECRET_ACCESS_KEY="$NEW_SECRET_KEY"

# Usar aws s3 sync
echo ""
echo "🔄 Sincronizando buckets..."

# Necesitamos reconfigurar para hacer la copia
export AWS_ACCESS_KEY_ID="$OLD_ACCESS_KEY"
export AWS_SECRET_ACCESS_KEY="$OLD_SECRET_KEY"

# Descargar todos los objetos
mkdir -p /tmp/r2-migration
aws s3 sync s3://aca-chile-images /tmp/r2-migration --endpoint-url "$OLD_ENDPOINT"

# Cambiar a nueva cuenta y subir
export AWS_ACCESS_KEY_ID="$NEW_ACCESS_KEY"
export AWS_SECRET_ACCESS_KEY="$NEW_SECRET_KEY"

aws s3 sync /tmp/r2-migration s3://aca-chile-images --endpoint-url "$NEW_ENDPOINT"

echo ""
echo "✅ Migración completada!"
echo ""

# Limpiar
read -p "¿Deseas eliminar archivos temporales? (s/n): " CLEAN
if [ "$CLEAN" = "s" ]; then
    rm -rf /tmp/r2-migration
    rm /tmp/r2-migration-config.json
    rm /tmp/r2-objects-list.txt
    echo "✅ Archivos temporales eliminados"
fi
