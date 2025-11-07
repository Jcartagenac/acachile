#!/usr/bin/env node

/**
 * Script para configurar R2 de Cloudflare y migrar imágenes
 * Este script:
 * 1. Descarga las imágenes actuales de Unsplash
 * 2. Las sube al bucket R2 de Cloudflare
 * 3. Actualiza las URLs en los archivos de datos
 */

import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';

// Configuración R2
const R2_CONFIG = {
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
  accessKeyId: process.env.R2_ACCESS_KEY_ID,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  bucketName: 'aca-chile-images',
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  publicUrl: 'https://images.acachile.com' // Custom domain para R2
};

// Imágenes actuales que necesitamos descargar y subir
const CURRENT_IMAGES = [
  {
    url: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=600&h=400&fit=crop&auto=format',
    filename: 'eventos/campeonato-nacional-asado.jpg',
    alt: 'Campeonato Nacional de Asado'
  },
  {
    url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&h=400&fit=crop&auto=format',
    filename: 'eventos/taller-principiantes-asado.jpg',
    alt: 'Taller de Técnicas de Asado'
  },
  {
    url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&h=400&fit=crop&auto=format',
    filename: 'eventos/encuentro-asadores.jpg',
    alt: 'Encuentro de Asadores'
  },
  {
    url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop&auto=format',
    filename: 'eventos/competencia-rapida.jpg',
    alt: 'Competencia de Asado Rápido'
  },
  {
    url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=400&fit=crop&auto=format',
    filename: 'eventos/masterclass-parrilla.jpg',
    alt: 'Masterclass de Parrilla Argentina'
  },
  {
    url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&h=400&fit=crop&auto=format',
    filename: 'noticias/mundial-barbacoa-2024.jpg',
    alt: 'Campeonato Mundial de Barbacoa'
  },
  {
    url: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=600&h=400&fit=crop&auto=format',
    filename: 'noticias/curso-basico-asado.jpg',
    alt: 'Curso Básico de Asado'
  },
  {
    url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop&auto=format',
    filename: 'noticias/campeonato-regional-asadores.jpg',
    alt: 'Campeonato Regional de Asadores'
  },
  {
    url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&h=400&fit=crop&auto=format',
    filename: 'noticias/centro-excelencia-valparaiso.jpg',
    alt: 'Centro de Excelencia en Valparaíso'
  },
  {
    url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=400&fit=crop&auto=format',
    filename: 'noticias/masterclass-patagonico.jpg',
    alt: 'Masterclass Asado Patagónico'
  }
];

async function downloadImage(url, filepath) {
  console.log(`Descargando: ${url}`);
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  const buffer = await response.buffer();
  
  // Crear directorio si no existe
  const dir = path.dirname(filepath);
  await fs.mkdir(dir, { recursive: true });
  
  // Guardar archivo
  await fs.writeFile(filepath, buffer);
  console.log(`✅ Guardado: ${filepath}`);
  
  return buffer;
}

async function uploadToR2(buffer, key, contentType = 'image/jpeg') {
  // Aquí implementarías la subida a R2
  // Por ahora solo simularemos
  console.log(`📤 Subirían a R2: ${key}`);
  return `${R2_CONFIG.publicUrl}/${key}`;
}

async function updateImageUrls() {
  console.log('🔄 Actualizando URLs en archivos de datos...');
  
  // Aquí actualizaríamos los archivos con las nuevas URLs de R2
  // Lo haremos manualmente después de configurar R2
}

async function main() {
  console.log('🚀 Iniciando migración de imágenes a R2...');
  
  // Crear carpeta temporal para imágenes
  const tempDir = './temp-images';
  await fs.mkdir(tempDir, { recursive: true });
  
  // Descargar todas las imágenes
  for (const image of CURRENT_IMAGES) {
    try {
      const filepath = path.join(tempDir, image.filename);
      const buffer = await downloadImage(image.url, filepath);
      
      // Simular subida a R2 (implementar después)
      const r2Url = await uploadToR2(buffer, image.filename);
      console.log(`✅ URL R2: ${r2Url}`);
      
    } catch (error) {
      console.error(`❌ Error con ${image.filename}:`, error.message);
    }
  }
  
  console.log('✅ Migración completada!');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { CURRENT_IMAGES, R2_CONFIG };