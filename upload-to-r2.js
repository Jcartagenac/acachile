#!/usr/bin/env node

/**
 * Script para subir imágenes locales al bucket R2
 * Requiere configurar las credenciales de R2 en variables de entorno
 */

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración R2 (compatible con S3)
const R2_CONFIG = {
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
};

const BUCKET_NAME = 'aca-chile-images';
const IMAGES_DIR = path.join(__dirname, '..', 'temp-images');

// Mapeo de imágenes para subir
const IMAGE_MAPPING = [
  {
    local: 'eventos/campeonato-nacional-asado.jpg',
    r2Key: 'eventos/campeonato-nacional-asado.jpg',
    contentType: 'image/jpeg'
  },
  {
    local: 'eventos/taller-principiantes-asado.jpg',
    r2Key: 'eventos/taller-principiantes-asado.jpg',
    contentType: 'image/jpeg'
  },
  {
    local: 'eventos/encuentro-asadores.jpg',
    r2Key: 'eventos/encuentro-asadores.jpg',
    contentType: 'image/jpeg'
  },
  {
    local: 'eventos/competencia-rapida.jpg',
    r2Key: 'eventos/competencia-rapida.jpg',
    contentType: 'image/jpeg'
  },
  {
    local: 'eventos/masterclass-parrilla.jpg',
    r2Key: 'eventos/masterclass-parrilla.jpg',
    contentType: 'image/jpeg'
  },
  {
    local: 'noticias/mundial-barbacoa-2024.jpg',
    r2Key: 'noticias/mundial-barbacoa-2024.jpg',
    contentType: 'image/jpeg'
  },
  {
    local: 'noticias/curso-basico-asado.jpg',
    r2Key: 'noticias/curso-basico-asado.jpg',
    contentType: 'image/jpeg'
  },
  {
    local: 'noticias/campeonato-regional-asadores.jpg',
    r2Key: 'noticias/campeonato-regional-asadores.jpg',
    contentType: 'image/jpeg'
  },
  {
    local: 'noticias/centro-excelencia-valparaiso.jpg',
    r2Key: 'noticias/centro-excelencia-valparaiso.jpg',
    contentType: 'image/jpeg'
  },
  {
    local: 'noticias/masterclass-patagonico.jpg',
    r2Key: 'noticias/masterclass-patagonico.jpg',
    contentType: 'image/jpeg'
  }
];

async function uploadToR2(imagePath, r2Key, contentType) {
  try {
    // Verificar que las credenciales estén configuradas
    if (!process.env.CLOUDFLARE_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
      throw new Error('Faltan variables de entorno para R2. Configura: CLOUDFLARE_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY');
    }

    const s3Client = new S3Client(R2_CONFIG);
    
    // Leer archivo
    const fileBuffer = await fs.readFile(imagePath);
    
    // Subir a R2
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: r2Key,
      Body: fileBuffer,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000', // 1 año
    });

    await s3Client.send(command);
    
    return {
      success: true,
      url: `https://pub-${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.dev/${r2Key}`,
      key: r2Key
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function main() {
  console.log('🚀 Subiendo imágenes a Cloudflare R2...');
  
  if (!process.env.CLOUDFLARE_ACCOUNT_ID) {
    console.log(`
📝 Instrucciones de configuración:

1. Ve a Cloudflare Dashboard → R2 Object Storage
2. Crea un bucket llamado "aca-chile-images"
3. Ve a "Manage R2 API tokens" y crea un token
4. Configura las variables de entorno:

export CLOUDFLARE_ACCOUNT_ID="tu_account_id"
export R2_ACCESS_KEY_ID="tu_access_key"
export R2_SECRET_ACCESS_KEY="tu_secret_key"

5. Ejecuta este script nuevamente
    `);
    return;
  }
  
  let uploaded = 0;
  let failed = 0;
  
  for (const image of IMAGE_MAPPING) {
    const localPath = path.join(IMAGES_DIR, image.local);
    
    try {
      // Verificar que el archivo existe
      await fs.access(localPath);
      
      console.log(`📤 Subiendo: ${image.local}`);
      const result = await uploadToR2(localPath, image.r2Key, image.contentType);
      
      if (result.success) {
        console.log(`✅ Subido: ${image.r2Key}`);
        console.log(`   URL: ${result.url}`);
        uploaded++;
      } else {
        console.log(`❌ Error: ${image.local} - ${result.error}`);
        failed++;
      }
      
    } catch (error) {
      console.log(`❌ Archivo no encontrado: ${localPath}`);
      failed++;
    }
  }
  
  console.log(`\n📊 Resumen:`);
  console.log(`✅ Subidas exitosas: ${uploaded}`);
  console.log(`❌ Fallos: ${failed}`);
  
  if (uploaded > 0) {
    console.log(`\n🔄 Próximo paso: Actualizar URLs en el código para usar R2`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}