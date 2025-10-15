#!/usr/bin/env node

/**
 * Actualizar URLs para usar el proxy de imágenes de Cloudflare Pages
 * /api/images/eventos/imagen.jpg y /api/images/noticias/imagen.jpg
 */

import fs from 'fs/promises';

console.log('🔄 Actualizando URLs para usar proxy de imágenes...\n');

async function updateToImageProxy() {
  try {
    // Mapeo eventos usando el proxy
    const eventosMapping = [
      {
        old: 'https://pub-172194a6569df504cbb8a638a94d3d2c.r2.dev/aca-chile-images/eventos/campeonato-nacional-asado.jpg',
        new: '/api/images/eventos/campeonato-nacional-asado.jpg'
      },
      {
        old: 'https://pub-172194a6569df504cbb8a638a94d3d2c.r2.dev/aca-chile-images/eventos/taller-principiantes-asado.jpg',
        new: '/api/images/eventos/taller-principiantes-asado.jpg'
      },
      {
        old: 'https://pub-172194a6569df504cbb8a638a94d3d2c.r2.dev/aca-chile-images/eventos/encuentro-asadores.jpg',
        new: '/api/images/eventos/encuentro-asadores.jpg'
      },
      {
        old: 'https://pub-172194a6569df504cbb8a638a94d3d2c.r2.dev/aca-chile-images/eventos/competencia-rapida.jpg',
        new: '/api/images/eventos/competencia-rapida.jpg'
      },
      {
        old: 'https://pub-172194a6569df504cbb8a638a94d3d2c.r2.dev/aca-chile-images/eventos/masterclass-parrilla.jpg',
        new: '/api/images/eventos/masterclass-parrilla.jpg'
      }
    ];

    // Leer contenido actual de eventos
    console.log('📝 Actualizando eventos...');
    let eventosContent = await fs.readFile('frontend/functions/api/eventos/init.js', 'utf-8');
    
    eventosMapping.forEach(({old, new: newUrl}) => {
      eventosContent = eventosContent.replace(old, newUrl);
    });
    
    await fs.writeFile('frontend/functions/api/eventos/init.js', eventosContent);
    console.log('✅ Eventos actualizados');

    // Mapeo noticias usando el proxy
    const noticiasMapping = [
      {
        old: 'https://pub-172194a6569df504cbb8a638a94d3d2c.r2.dev/aca-chile-images/noticias/mundial-barbacoa-2024.jpg',
        new: '/api/images/noticias/mundial-barbacoa-2024.jpg'
      },
      {
        old: 'https://pub-172194a6569df504cbb8a638a94d3d2c.r2.dev/aca-chile-images/noticias/curso-basico-asado.jpg',
        new: '/api/images/noticias/curso-basico-asado.jpg'
      },
      {
        old: 'https://pub-172194a6569df504cbb8a638a94d3d2c.r2.dev/aca-chile-images/noticias/campeonato-regional-asadores.jpg',
        new: '/api/images/noticias/campeonato-regional-asadores.jpg'
      },
      {
        old: 'https://pub-172194a6569df504cbb8a638a94d3d2c.r2.dev/aca-chile-images/noticias/centro-excelencia-valparaiso.jpg',
        new: '/api/images/noticias/centro-excelencia-valparaiso.jpg'
      },
      {
        old: 'https://pub-172194a6569df504cbb8a638a94d3d2c.r2.dev/aca-chile-images/noticias/masterclass-patagonico.jpg',
        new: '/api/images/noticias/masterclass-patagonico.jpg'
      }
    ];

    // Leer contenido actual de noticias
    console.log('📝 Actualizando noticias...');
    let noticiasContent = await fs.readFile('frontend/functions/api/noticias/index.js', 'utf-8');
    
    noticiasMapping.forEach(({old, new: newUrl}) => {
      noticiasContent = noticiasContent.replace(old, newUrl);
    });

    await fs.writeFile('frontend/functions/api/noticias/index.js', noticiasContent);
    console.log('✅ Noticias actualizadas');

    console.log('\n🎉 URLs actualizadas al proxy de imágenes!');
    console.log('📡 Las imágenes ahora se sirven vía: /api/images/[categoria]/[archivo].jpg');
    console.log('🔧 El proxy obtiene las imágenes desde R2 con CORS correcto');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

updateToImageProxy();