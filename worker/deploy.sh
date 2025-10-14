#!/bin/bash

# Script para desplegar ACA Chile Worker
echo "🚀 Desplegando ACA Chile Worker..."

# Verificar que estemos en el directorio correcto
if [ ! -f "wrangler.toml" ]; then
  echo "❌ Error: Ejecuta este script desde la carpeta worker/"
  exit 1
fi

# Función para desplegar a staging
deploy_staging() {
  echo "🔄 Desplegando a STAGING..."
  wrangler deploy --env staging
  if [ $? -eq 0 ]; then
    echo "✅ Staging desplegado correctamente"
    echo "🌐 URL: https://acachile-api-staging.{tu-subdomain}.workers.dev"
  else
    echo "❌ Error en despliegue de staging"
    exit 1
  fi
}

# Función para desplegar a producción
deploy_production() {
  echo "🔄 Desplegando a PRODUCCIÓN..."
  echo "⚠️  ¿Estás seguro? Esta acción afectará el sitio en vivo."
  read -p "Escribe 'SI' para confirmar: " confirm
  
  if [ "$confirm" = "SI" ]; then
    wrangler deploy --env production
    if [ $? -eq 0 ]; then
      echo "✅ Producción desplegada correctamente"
      echo "🌐 URL: https://acachile-api-production.{tu-subdomain}.workers.dev"
    else
      echo "❌ Error en despliegue de producción"
      exit 1
    fi
  else
    echo "❌ Despliegue cancelado"
    exit 1
  fi
}

# Menú de opciones
case "$1" in
  "staging"|"test"|"dev")
    deploy_staging
    ;;
  "production"|"prod"|"live")
    deploy_production
    ;;
  *)
    echo "🎯 Uso: ./deploy.sh [staging|production]"
    echo ""
    echo "Opciones:"
    echo "  staging     - Despliega a entorno de pruebas"
    echo "  production  - Despliega a entorno de producción"
    echo ""
    echo "Ejemplos:"
    echo "  ./deploy.sh staging"
    echo "  ./deploy.sh production"
    exit 1
    ;;
esac