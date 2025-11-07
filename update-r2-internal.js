#!/usr/bin/env node

/**
 * Actualizar URLs para usar el dominio de Cloudflare Pages
 * Como alternativa al acceso público directo de R2
 */

import fs from 'fs/promises';

// Usando el endpoint interno de R2 que funciona con CORS
const R2_DOMAIN = `172194a6569df504cbb8a638a94d3d2c.r2.cloudflarestorage.com`;
const BUCKET_NAME = 'aca-chile-images';

console.log('🔄 Actualizando URLs para usar endpoint interno de R2...\n');

async function updateToInternalR2() {
  try {
    // Mapeo eventos con URLs internas
    const eventosMapping = [
      {
        old: 'https://pub-172194a6569df504cbb8a638a94d3d2c.r2.dev/aca-chile-images/eventos/campeonato-nacional-asado.jpg',
        new: `https://${R2_DOMAIN}/${BUCKET_NAME}/eventos/campeonato-nacional-asado.jpg`
      },
      {
        old: 'https://pub-172194a6569df504cbb8a638a94d3d2c.r2.dev/aca-chile-images/eventos/taller-principiantes-asado.jpg',
        new: `https://${R2_DOMAIN}/${BUCKET_NAME}/eventos/taller-principiantes-asado.jpg`
      },
      {
        old: 'https://pub-172194a6569df504cbb8a638a94d3d2c.r2.dev/aca-chile-images/eventos/encuentro-asadores.jpg',
        new: `https://${R2_DOMAIN}/${BUCKET_NAME}/eventos/encuentro-asadores.jpg`
      },
      {
        old: 'https://pub-172194a6569df504cbb8a638a94d3d2c.r2.dev/aca-chile-images/eventos/competencia-rapida.jpg',
        new: `https://${R2_DOMAIN}/${BUCKET_NAME}/eventos/competencia-rapida.jpg`
      },
      {
        old: 'https://pub-172194a6569df504cbb8a638a94d3d2c.r2.dev/aca-chile-images/eventos/masterclass-parrilla.jpg',
        new: `https://${R2_DOMAIN}/${BUCKET_NAME}/eventos/masterclass-parrilla.jpg`
      }
    ];

    // Actualizar eventos
    console.log('📝 Actualizando eventos...');
    let eventosContent = await fs.readFile('frontend/functions/api/eventos/init.js', 'utf-8');
    
    eventosMapping.forEach(({old, new: newUrl}) => {
      eventosContent = eventosContent.replace(old, newUrl);
    });
    
    await fs.writeFile('frontend/functions/api/eventos/init.js', eventosContent);
    console.log('✅ Eventos actualizados');

    // Mapeo noticias con URLs internas
    const noticiasMapping = [
      {
        old: 'https://pub-172194a6569df504cbb8a638a94d3d2c.r2.dev/aca-chile-images/noticias/mundial-barbacoa-2024.jpg',
        new: `https://${R2_DOMAIN}/${BUCKET_NAME}/noticias/mundial-barbacoa-2024.jpg`
      },
      {
        old: 'https://pub-172194a6569df504cbb8a638a94d3d2c.r2.dev/aca-chile-images/noticias/curso-basico-asado.jpg',
        new: `https://${R2_DOMAIN}/${BUCKET_NAME}/noticias/curso-basico-asado.jpg`
      },
      {
        old: 'https://pub-172194a6569df504cbb8a638a94d3d2c.r2.dev/aca-chile-images/noticias/campeonato-regional-asadores.jpg',
        new: `https://${R2_DOMAIN}/${BUCKET_NAME}/noticias/campeonato-regional-asadores.jpg`
      },
      {
        old: 'https://pub-172194a6569df504cbb8a638a94d3d2c.r2.dev/aca-chile-images/noticias/centro-excelencia-valparaiso.jpg',
        new: `https://${R2_DOMAIN}/${BUCKET_NAME}/noticias/centro-excelencia-valparaiso.jpg`
      },
      {
        old: 'https://pub-172194a6569df504cbb8a638a94d3d2c.r2.dev/aca-chile-images/noticias/masterclass-patagonico.jpg',
        new: `https://${R2_DOMAIN}/${BUCKET_NAME}/noticias/masterclass-patagonico.jpg`
      }
    ];

    // Actualizar noticias
    console.log('📝 Actualizando noticias...');
    let noticiasContent = await fs.readFile('frontend/functions/api/noticias/index.js', 'utf-8');
    
    noticiasMapping.forEach(({old, new: newUrl}) => {
      noticiasContent = noticiasContent.replace(old, newUrl);
    });

    await fs.writeFile('frontend/functions/api/noticias/index.js', noticiasContent);
    console.log('✅ Noticias actualizadas');

    console.log('\n🎉 URLs actualizadas a endpoint interno!');
    console.log(`🌐 Base URL: https://${R2_DOMAIN}/${BUCKET_NAME}/`);
    
    console.log('\n💡 Próximo: Configurar dominio personalizado en Cloudflare:');
    console.log('1. R2 → aca-chile-images → Settings → Custom domains');
    console.log('2. Agregar: images.beta.acachile.com');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

updateToInternalR2();