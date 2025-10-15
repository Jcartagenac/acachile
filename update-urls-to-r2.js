#!/usr/bin/env node

/**
 * Script para actualizar URLs de imágenes a R2 en el código
 */

import fs from 'fs/promises';
import path from 'path';

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const BUCKET_NAME = 'aca-chile-images';

if (!ACCOUNT_ID) {
  console.log('❌ Falta CLOUDFLARE_ACCOUNT_ID');
  process.exit(1);
}

const R2_BASE_URL = `https://pub-${ACCOUNT_ID}.r2.dev/${BUCKET_NAME}`;

// Mapeo de URLs para actualizar
const URL_MAPPINGS = {
  eventos: {
    'campeonato-nacional-asado': `${R2_BASE_URL}/eventos/campeonato-nacional-asado.jpg`,
    'taller-principiantes-asado': `${R2_BASE_URL}/eventos/taller-principiantes-asado.jpg`, 
    'encuentro-asadores': `${R2_BASE_URL}/eventos/encuentro-asadores.jpg`,
    'competencia-rapida': `${R2_BASE_URL}/eventos/competencia-rapida.jpg`,
    'masterclass-parrilla': `${R2_BASE_URL}/eventos/masterclass-parrilla.jpg`
  },
  noticias: {
    'mundial-barbacoa-2024': `${R2_BASE_URL}/noticias/mundial-barbacoa-2024.jpg`,
    'curso-basico-asado': `${R2_BASE_URL}/noticias/curso-basico-asado.jpg`,
    'campeonato-regional-asadores': `${R2_BASE_URL}/noticias/campeonato-regional-asadores.jpg`,
    'centro-excelencia-valparaiso': `${R2_BASE_URL}/noticias/centro-excelencia-valparaiso.jpg`,
    'masterclass-patagonico': `${R2_BASE_URL}/noticias/masterclass-patagonico.jpg`
  }
};

async function updateEventosFile() {
  const filePath = 'frontend/functions/api/eventos/init.js';
  console.log(`🔄 Actualizando: ${filePath}`);
  
  try {
    let content = await fs.readFile(filePath, 'utf-8');
    
    // Reemplazar URLs de Unsplash con URLs de R2
    const replacements = [
      {
        old: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=600&h=400&fit=crop&auto=format',
        new: URL_MAPPINGS.eventos['campeonato-nacional-asado']
      },
      {
        old: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&h=400&fit=crop&auto=format',
        new: URL_MAPPINGS.eventos['taller-principiantes-asado']
      },
      {
        old: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&h=400&fit=crop&auto=format',
        new: URL_MAPPINGS.eventos['encuentro-asadores']
      },
      {
        old: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop&auto=format',
        new: URL_MAPPINGS.eventos['competencia-rapida']
      },
      {
        old: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=400&fit=crop&auto=format',
        new: URL_MAPPINGS.eventos['masterclass-parrilla']
      }
    ];
    
    replacements.forEach(({ old, new: newUrl }) => {
      content = content.replace(old, newUrl);
    });
    
    await fs.writeFile(filePath, content, 'utf-8');
    console.log(`✅ Actualizado: ${filePath}`);
    
  } catch (error) {
    console.log(`❌ Error actualizando ${filePath}: ${error.message}`);
  }
}

async function updateNoticiasFile() {
  const filePath = 'frontend/functions/api/noticias/index.js';
  console.log(`🔄 Actualizando: ${filePath}`);
  
  try {
    let content = await fs.readFile(filePath, 'utf-8');
    
    // Reemplazar URLs de Unsplash con URLs de R2
    const replacements = [
      {
        old: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&h=400&fit=crop&auto=format',
        new: URL_MAPPINGS.noticias['mundial-barbacoa-2024']
      },
      {
        old: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=600&h=400&fit=crop&auto=format',
        new: URL_MAPPINGS.noticias['curso-basico-asado']
      },
      {
        old: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop&auto=format',
        new: URL_MAPPINGS.noticias['campeonato-regional-asadores']
      },
      {
        old: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&h=400&fit=crop&auto=format',
        new: URL_MAPPINGS.noticias['centro-excelencia-valparaiso']
      },
      {
        old: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=400&fit=crop&auto=format',
        new: URL_MAPPINGS.noticias['masterclass-patagonico']
      }
    ];
    
    replacements.forEach(({ old, new: newUrl }) => {
      content = content.replace(old, newUrl);
    });
    
    await fs.writeFile(filePath, content, 'utf-8');
    console.log(`✅ Actualizado: ${filePath}`);
    
  } catch (error) {
    console.log(`❌ Error actualizando ${filePath}: ${error.message}`);
  }
}

async function main() {
  console.log('🔄 Actualizando URLs de imágenes a R2...\n');
  console.log(`📦 Bucket R2: ${R2_BASE_URL}\n`);
  
  await updateEventosFile();
  await updateNoticiasFile();
  
  console.log('\n✅ URLs actualizadas a R2');
  console.log('\n📋 Próximos pasos:');
  console.log('1. Verificar que las URLs funcionan');
  console.log('2. Hacer commit y push');
  console.log('3. Verificar en producción');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}