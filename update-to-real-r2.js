#!/usr/bin/env node

/**
 * Script para actualizar URLs a R2 real (una vez creado el bucket)
 * Solo necesitas tu ACCOUNT_ID
 */

import fs from 'fs/promises';

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || 'TU_ACCOUNT_ID_AQUI';
const BUCKET_NAME = 'aca-chile-images';

// URLs reales una vez subidas a R2
const R2_BASE_URL = `https://pub-${ACCOUNT_ID}.r2.dev/${BUCKET_NAME}`;

console.log(`🔄 Actualizando URLs a R2 real: ${R2_BASE_URL}\n`);

async function updateToR2URLs() {
  // Mapeo eventos
  const eventosMapping = [
    {
      old: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=600&h=400&fit=crop&auto=format',
      new: `${R2_BASE_URL}/eventos/campeonato-nacional-asado.jpg`
    },
    {
      old: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&h=400&fit=crop&auto=format', 
      new: `${R2_BASE_URL}/eventos/taller-principiantes-asado.jpg`
    },
    {
      old: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&h=400&fit=crop&auto=format',
      new: `${R2_BASE_URL}/eventos/encuentro-asadores.jpg`
    },
    {
      old: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop&auto=format',
      new: `${R2_BASE_URL}/eventos/competencia-rapida.jpg`
    },
    {
      old: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=400&fit=crop&auto=format',
      new: `${R2_BASE_URL}/eventos/masterclass-parrilla.jpg`
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

  // Actualizar noticias  
  console.log('📝 Actualizando noticias...');
  let noticiasContent = await fs.readFile('frontend/functions/api/noticias/index.js', 'utf-8');
  
  // Mapeo noticias (usando las mismas imágenes reales)
  const noticiasMapping = [
    {
      old: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&h=400&fit=crop&auto=format',
      new: `${R2_BASE_URL}/noticias/mundial-barbacoa-2024.jpg`
    },
    {
      old: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=600&h=400&fit=crop&auto=format', 
      new: `${R2_BASE_URL}/noticias/curso-basico-asado.jpg`
    },
    {
      old: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop&auto=format',
      new: `${R2_BASE_URL}/noticias/campeonato-regional-asadores.jpg`
    },
    {
      old: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&h=400&fit=crop&auto=format',
      new: `${R2_BASE_URL}/noticias/centro-excelencia-valparaiso.jpg`
    },
    {
      old: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=400&fit=crop&auto=format',
      new: `${R2_BASE_URL}/noticias/masterclass-patagonico.jpg`
    }
  ];

  noticiasMapping.forEach(({old, new: newUrl}) => {
    noticiasContent = noticiasContent.replace(old, newUrl);
  });

  await fs.writeFile('frontend/functions/api/noticias/index.js', noticiasContent);
  console.log('✅ Noticias actualizadas');

  console.log('\n🎉 URLs actualizadas a R2 real!');
  console.log(`🌐 Base URL: ${R2_BASE_URL}`);
}

if (ACCOUNT_ID === 'TU_ACCOUNT_ID_AQUI') {
  console.log('❌ Configura primero tu ACCOUNT_ID:');
  console.log('export CLOUDFLARE_ACCOUNT_ID="tu_account_id_real"');
} else {
  updateToR2URLs().catch(console.error);
}