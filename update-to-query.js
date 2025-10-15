#!/usr/bin/env node

/**
 * Actualizar URLs para usar el proxy de imágenes con query parameters
 * /api/images?path=eventos/imagen.jpg
 */

import fs from 'fs/promises';

console.log('🔄 Actualizando URLs para usar query parameters...\n');

async function updateToQueryParams() {
  try {
    // Verificar ediciones del usuario primero
    console.log('📖 Verificando contenido actual de archivos...');
    
    let eventosContent = await fs.readFile('frontend/functions/api/eventos/init.js', 'utf-8');
    let noticiasContent = await fs.readFile('frontend/functions/api/noticias/index.js', 'utf-8');

    // Mapeo eventos con query parameters
    const eventosUpdates = [
      {
        old: '/api/images/eventos/campeonato-nacional-asado.jpg',
        new: '/api/images?path=eventos/campeonato-nacional-asado.jpg'
      },
      {
        old: '/api/images/eventos/taller-principiantes-asado.jpg',
        new: '/api/images?path=eventos/taller-principiantes-asado.jpg'
      },
      {
        old: '/api/images/eventos/encuentro-asadores.jpg',
        new: '/api/images?path=eventos/encuentro-asadores.jpg'
      },
      {
        old: '/api/images/eventos/competencia-rapida.jpg',
        new: '/api/images?path=eventos/competencia-rapida.jpg'
      },
      {
        old: '/api/images/eventos/masterclass-parrilla.jpg',
        new: '/api/images?path=eventos/masterclass-parrilla.jpg'
      }
    ];

    console.log('📝 Actualizando eventos...');
    eventosUpdates.forEach(({old, new: newUrl}) => {
      if (eventosContent.includes(old)) {
        eventosContent = eventosContent.replace(new RegExp(old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newUrl);
        console.log(`   ✓ ${old} → ${newUrl}`);
      }
    });
    
    await fs.writeFile('frontend/functions/api/eventos/init.js', eventosContent);
    console.log('✅ Eventos actualizados');

    // Mapeo noticias con query parameters
    const noticiasUpdates = [
      {
        old: '/api/images/noticias/mundial-barbacoa-2024.jpg',
        new: '/api/images?path=noticias/mundial-barbacoa-2024.jpg'
      },
      {
        old: '/api/images/noticias/curso-basico-asado.jpg',
        new: '/api/images?path=noticias/curso-basico-asado.jpg'
      },
      {
        old: '/api/images/noticias/campeonato-regional-asadores.jpg',
        new: '/api/images?path=noticias/campeonato-regional-asadores.jpg'
      },
      {
        old: '/api/images/noticias/centro-excelencia-valparaiso.jpg',
        new: '/api/images?path=noticias/centro-excelencia-valparaiso.jpg'
      },
      {
        old: '/api/images/noticias/masterclass-patagonico.jpg',
        new: '/api/images?path=noticias/masterclass-patagonico.jpg'
      }
    ];

    console.log('📝 Actualizando noticias...');
    noticiasUpdates.forEach(({old, new: newUrl}) => {
      if (noticiasContent.includes(old)) {
        noticiasContent = noticiasContent.replace(new RegExp(old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newUrl);
        console.log(`   ✓ ${old} → ${newUrl}`);
      }
    });

    await fs.writeFile('frontend/functions/api/noticias/index.js', noticiasContent);
    console.log('✅ Noticias actualizadas');

    console.log('\n🎉 URLs actualizadas con query parameters!');
    console.log('📡 Formato: /api/images?path=categoria/archivo.jpg');
    console.log('🔧 Compatible con Cloudflare Pages Functions');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

updateToQueryParams();