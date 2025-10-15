// Configuración de URLs de imágenes
// Este archivo centraliza todas las URLs de imágenes para fácil actualización

// URL base para imágenes - cambiar cuando R2 esté configurado
const IMAGE_BASE_URL = 'https://images.acachile.pages.dev';

// Mapeo de imágenes
export const IMAGES = {
  eventos: {
    'campeonato-nacional-asado': `${IMAGE_BASE_URL}/eventos/campeonato-nacional-asado.jpg`,
    'taller-principiantes-asado': `${IMAGE_BASE_URL}/eventos/taller-principiantes-asado.jpg`,
    'encuentro-asadores': `${IMAGE_BASE_URL}/eventos/encuentro-asadores.jpg`,
    'competencia-rapida': `${IMAGE_BASE_URL}/eventos/competencia-rapida.jpg`,
    'masterclass-parrilla': `${IMAGE_BASE_URL}/eventos/masterclass-parrilla.jpg`,
  },
  noticias: {
    'mundial-barbacoa-2024': `${IMAGE_BASE_URL}/noticias/mundial-barbacoa-2024.jpg`,
    'curso-basico-asado': `${IMAGE_BASE_URL}/noticias/curso-basico-asado.jpg`,
    'campeonato-regional-asadores': `${IMAGE_BASE_URL}/noticias/campeonato-regional-asadores.jpg`,
    'centro-excelencia-valparaiso': `${IMAGE_BASE_URL}/noticias/centro-excelencia-valparaiso.jpg`,
    'masterclass-patagonico': `${IMAGE_BASE_URL}/noticias/masterclass-patagonico.jpg`,
  }
};

// Función helper para obtener URL de imagen
export function getImageUrl(type, key) {
  return IMAGES[type]?.[key] || `${IMAGE_BASE_URL}/placeholder.jpg`;
}

// URLs para desarrollo (usando las imágenes descargadas localmente temporalmente)
const DEV_IMAGES = {
  eventos: {
    'campeonato-nacional-asado': 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=600&h=400&fit=crop&auto=format',
    'taller-principiantes-asado': 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&h=400&fit=crop&auto=format',
    'encuentro-asadores': 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&h=400&fit=crop&auto=format',
    'competencia-rapida': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop&auto=format',
    'masterclass-parrilla': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=400&fit=crop&auto=format',
  },
  noticias: {
    'mundial-barbacoa-2024': 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&h=400&fit=crop&auto=format',
    'curso-basico-asado': 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=600&h=400&fit=crop&auto=format',
    'campeonato-regional-asadores': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop&auto=format',
    'centro-excelencia-valparaiso': 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&h=400&fit=crop&auto=format',
    'masterclass-patagonico': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=400&fit=crop&auto=format',
  }
};

// Usar imágenes de desarrollo por ahora (hasta configurar R2)
export const CURRENT_IMAGES = process.env.NODE_ENV === 'production' ? IMAGES : DEV_IMAGES;