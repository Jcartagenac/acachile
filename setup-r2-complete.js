#!/usr/bin/env node

/**
 * Script automatizado para configurar Cloudflare R2 y subir imágenes
 * Basado en: https://developers.cloudflare.com/r2/api/workers/workers-api-usage/
 */

import { S3Client, CreateBucketCommand, PutObjectCommand, PutBucketCorsCommand } from '@aws-sdk/client-s3';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración R2
const BUCKET_NAME = 'aca-chile-images';
const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;

const R2_CONFIG = {
  region: 'auto',
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: ACCESS_KEY_ID,
    secretAccessKey: SECRET_ACCESS_KEY,
  },
};

// Mapeo de imágenes
const IMAGES_TO_UPLOAD = [
  {
    localPath: 'temp-images/eventos/campeonato-nacional-asado.jpg',
    r2Key: 'eventos/campeonato-nacional-asado.jpg',
    contentType: 'image/jpeg'
  },
  {
    localPath: 'temp-images/eventos/taller-principiantes-asado.jpg',
    r2Key: 'eventos/taller-principiantes-asado.jpg',
    contentType: 'image/jpeg'
  },
  {
    localPath: 'temp-images/eventos/encuentro-asadores.jpg',
    r2Key: 'eventos/encuentro-asadores.jpg',
    contentType: 'image/jpeg'
  },
  {
    localPath: 'temp-images/eventos/competencia-rapida.jpg',
    r2Key: 'eventos/competencia-rapida.jpg',
    contentType: 'image/jpeg'
  },
  {
    localPath: 'temp-images/eventos/masterclass-parrilla.jpg',
    r2Key: 'eventos/masterclass-parrilla.jpg',
    contentType: 'image/jpeg'
  },
  {
    localPath: 'temp-images/noticias/mundial-barbacoa-2024.jpg',
    r2Key: 'noticias/mundial-barbacoa-2024.jpg',
    contentType: 'image/jpeg'
  },
  {
    localPath: 'temp-images/noticias/curso-basico-asado.jpg',
    r2Key: 'noticias/curso-basico-asado.jpg',
    contentType: 'image/jpeg'
  },
  {
    localPath: 'temp-images/noticias/campeonato-regional-asadores.jpg',
    r2Key: 'noticias/campeonato-regional-asadores.jpg',
    contentType: 'image/jpeg'
  },
  {
    localPath: 'temp-images/noticias/centro-excelencia-valparaiso.jpg',
    r2Key: 'noticias/centro-excelencia-valparaiso.jpg',
    contentType: 'image/jpeg'
  },
  {
    localPath: 'temp-images/noticias/masterclass-patagonico.jpg',
    r2Key: 'noticias/masterclass-patagonico.jpg',
    contentType: 'image/jpeg'
  }
];

function validateEnvironment() {
  const missing = [];
  
  if (!ACCOUNT_ID) missing.push('CLOUDFLARE_ACCOUNT_ID');
  if (!ACCESS_KEY_ID) missing.push('R2_ACCESS_KEY_ID'); 
  if (!SECRET_ACCESS_KEY) missing.push('R2_SECRET_ACCESS_KEY');
  
  if (missing.length > 0) {
    console.log('❌ Variables de entorno faltantes:');
    missing.forEach(var_name => console.log(`   - ${var_name}`));
    console.log('\n📝 Para configurar:');
    console.log('1. Ve a Cloudflare Dashboard → R2 Object Storage');
    console.log('2. Clic en "Manage R2 API tokens"');
    console.log('3. Crea un token con permisos Object Read & Write');
    console.log('4. Exporta las variables:');
    console.log('   export CLOUDFLARE_ACCOUNT_ID="tu_account_id"');
    console.log('   export R2_ACCESS_KEY_ID="tu_access_key_id"');
    console.log('   export R2_SECRET_ACCESS_KEY="tu_secret_access_key"');
    return false;
  }
  
  return true;
}

async function createBucket(s3Client) {
  try {
    console.log(`📦 Creando bucket: ${BUCKET_NAME}`);
    
    await s3Client.send(new CreateBucketCommand({
      Bucket: BUCKET_NAME
    }));
    
    console.log(`✅ Bucket ${BUCKET_NAME} creado exitosamente`);
    return true;
    
  } catch (error) {
    if (error.name === 'BucketAlreadyOwnedByYou') {
      console.log(`ℹ️  Bucket ${BUCKET_NAME} ya existe`);
      return true;
    }
    
    console.log(`❌ Error creando bucket: ${error.message}`);
    return false;
  }
}

async function configureCORS(s3Client) {
  try {
    console.log('🌐 Configurando CORS para el bucket...');
    
    const corsConfiguration = {
      CORSRules: [
        {
          AllowedHeaders: ['*'],
          AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
          AllowedOrigins: ['*'],
          ExposeHeaders: ['ETag'],
          MaxAgeSeconds: 3600,
        },
      ],
    };

    await s3Client.send(new PutBucketCorsCommand({
      Bucket: BUCKET_NAME,
      CORSConfiguration: corsConfiguration,
    }));
    
    console.log('✅ CORS configurado correctamente');
    return true;
    
  } catch (error) {
    console.log(`⚠️  Error configurando CORS: ${error.message}`);
    // No es crítico, continuamos
    return true;
  }
}

async function uploadImage(s3Client, localPath, r2Key, contentType) {
  try {
    const fullPath = path.join(__dirname, localPath);
    
    // Verificar que el archivo existe
    await fs.access(fullPath);
    
    // Leer el archivo
    const fileBuffer = await fs.readFile(fullPath);
    
    console.log(`📤 Subiendo: ${r2Key}`);
    
    await s3Client.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: r2Key,
      Body: fileBuffer,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000', // 1 año de cache
      Metadata: {
        'uploaded-by': 'aca-chile-setup',
        'uploaded-at': new Date().toISOString()
      }
    }));
    
    const publicUrl = `https://pub-${ACCOUNT_ID}.r2.dev/${BUCKET_NAME}/${r2Key}`;
    console.log(`✅ Subido: ${publicUrl}`);
    
    return {
      success: true,
      key: r2Key,
      url: publicUrl
    };
    
  } catch (error) {
    console.log(`❌ Error subiendo ${r2Key}: ${error.message}`);
    return {
      success: false,
      key: r2Key,
      error: error.message
    };
  }
}

async function updateCodeWithR2URLs(uploadResults) {
  console.log('\n🔄 Actualizando URLs en el código...');
  
  // URLs base para actualizar
  const baseUrl = `https://pub-${ACCOUNT_ID}.r2.dev/${BUCKET_NAME}`;
  
  // Mapeo para eventos
  const eventosUpdates = {
    'campeonato-nacional-asado': `${baseUrl}/eventos/campeonato-nacional-asado.jpg`,
    'taller-principiantes-asado': `${baseUrl}/eventos/taller-principiantes-asado.jpg`,
    'encuentro-asadores': `${baseUrl}/eventos/encuentro-asadores.jpg`,
    'competencia-rapida': `${baseUrl}/eventos/competencia-rapida.jpg`,
    'masterclass-parrilla': `${baseUrl}/eventos/masterclass-parrilla.jpg`,
  };
  
  // Mapeo para noticias
  const noticiasUpdates = {
    'mundial-barbacoa-2024': `${baseUrl}/noticias/mundial-barbacoa-2024.jpg`,
    'curso-basico-asado': `${baseUrl}/noticias/curso-basico-asado.jpg`,
    'campeonato-regional-asadores': `${baseUrl}/noticias/campeonato-regional-asadores.jpg`,
    'centro-excelencia-valparaiso': `${baseUrl}/noticias/centro-excelencia-valparaiso.jpg`,
    'masterclass-patagonico': `${baseUrl}/noticias/masterclass-patagonico.jpg`,
  };
  
  console.log('📝 URLs generadas:');
  console.log('   Eventos:');
  Object.entries(eventosUpdates).forEach(([key, url]) => {
    console.log(`     - ${key}: ${url}`);
  });
  console.log('   Noticias:');
  Object.entries(noticiasUpdates).forEach(([key, url]) => {
    console.log(`     - ${key}: ${url}`);
  });
  
  console.log('\n⚠️  Necesitas actualizar manualmente:');
  console.log('   - frontend/functions/api/eventos/init.js');
  console.log('   - frontend/functions/api/noticias/index.js');
  console.log('\n   O ejecutar el script update-urls-to-r2.js que crearemos');
}

async function main() {
  console.log('🚀 Configurando Cloudflare R2 para ACA Chile...\n');
  
  // Validar variables de entorno
  if (!validateEnvironment()) {
    process.exit(1);
  }
  
  console.log(`✅ Configuración válida`);
  console.log(`   Account ID: ${ACCOUNT_ID}`);
  console.log(`   Bucket: ${BUCKET_NAME}`);
  console.log(`   Endpoint: https://${ACCOUNT_ID}.r2.cloudflarestorage.com\n`);
  
  // Crear cliente S3 para R2
  const s3Client = new S3Client(R2_CONFIG);
  
  // Crear bucket
  const bucketCreated = await createBucket(s3Client);
  if (!bucketCreated) {
    console.log('❌ No se pudo crear el bucket. Abortando.');
    process.exit(1);
  }
  
  // Configurar CORS
  await configureCORS(s3Client);
  
  // Subir todas las imágenes
  console.log(`\n📸 Subiendo ${IMAGES_TO_UPLOAD.length} imágenes...\n`);
  
  const uploadResults = [];
  let successCount = 0;
  let failCount = 0;
  
  for (const image of IMAGES_TO_UPLOAD) {
    const result = await uploadImage(s3Client, image.localPath, image.r2Key, image.contentType);
    uploadResults.push(result);
    
    if (result.success) {
      successCount++;
    } else {
      failCount++;
    }
    
    // Pequeña pausa entre subidas
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Resumen final
  console.log('\n📊 Resumen de subida:');
  console.log(`   ✅ Exitosas: ${successCount}`);
  console.log(`   ❌ Fallidas: ${failCount}`);
  console.log(`   📦 Bucket: https://pub-${ACCOUNT_ID}.r2.dev/${BUCKET_NAME}/`);
  
  if (successCount > 0) {
    await updateCodeWithR2URLs(uploadResults);
  }
  
  console.log('\n🎉 ¡Configuración de R2 completada!');
  
  if (failCount === 0) {
    console.log('\n🔄 Próximo paso: Actualizar URLs en el código y hacer commit');
  }
}

// Ejecutar si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });
}

export { main as setupR2 };