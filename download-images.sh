#!/bin/bash

# Script para descargar todas las imágenes de Unsplash y organizarlas
# para subirlas después a Cloudflare R2

echo "🚀 Descargando imágenes para ACA Chile..."

# Crear estructura de directorios
mkdir -p temp-images/eventos
mkdir -p temp-images/noticias

# Función para descargar imagen
download_image() {
    local url="$1"
    local filename="$2"
    local description="$3"
    
    echo "📥 Descargando: $description"
    curl -L -o "temp-images/$filename" "$url"
    
    if [ $? -eq 0 ]; then
        echo "✅ Guardado: temp-images/$filename"
    else
        echo "❌ Error descargando: $filename"
    fi
}

# Eventos
download_image "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=600&h=400&fit=crop&auto=format" "eventos/campeonato-nacional-asado.jpg" "Campeonato Nacional de Asado"
download_image "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&h=400&fit=crop&auto=format" "eventos/taller-principiantes-asado.jpg" "Taller de Técnicas de Asado"
download_image "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&h=400&fit=crop&auto=format" "eventos/encuentro-asadores.jpg" "Encuentro de Asadores"
download_image "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop&auto=format" "eventos/competencia-rapida.jpg" "Competencia de Asado Rápido"
download_image "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=400&fit=crop&auto=format" "eventos/masterclass-parrilla.jpg" "Masterclass de Parrilla Argentina"

# Noticias
download_image "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&h=400&fit=crop&auto=format" "noticias/mundial-barbacoa-2024.jpg" "Campeonato Mundial de Barbacoa"
download_image "https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=600&h=400&fit=crop&auto=format" "noticias/curso-basico-asado.jpg" "Curso Básico de Asado"
download_image "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop&auto=format" "noticias/campeonato-regional-asadores.jpg" "Campeonato Regional de Asadores"
download_image "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&h=400&fit=crop&auto=format" "noticias/centro-excelencia-valparaiso.jpg" "Centro de Excelencia en Valparaíso"
download_image "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=400&fit=crop&auto=format" "noticias/masterclass-patagonico.jpg" "Masterclass Asado Patagónico"

echo ""
echo "✅ Descarga completada!"
echo "📁 Las imágenes están en: temp-images/"
echo ""
echo "📋 Próximos pasos:"
echo "1. Configurar bucket R2 en Cloudflare"
echo "2. Subir las imágenes a R2"
echo "3. Actualizar las URLs en el código"
echo ""
echo "Estructura creada:"
find temp-images -type f -name "*.jpg" | sort