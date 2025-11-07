#!/usr/bin/env node

/**
 * Configurar dominio personalizado para R2
 * Permite acceso público a las imágenes
 */

import { S3Client, PutBucketPolicyCommand } from '@aws-sdk/client-s3';

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || '172194a6569df504cbb8a638a94d3d2c';
const ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || 'e240d283c1ee769400d8633eeff0983d';
const SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || '8b50f6b8708768187da5ba596572b04bbfefd5b7a0f3b41967798e44e50846a0';
const BUCKET_NAME = 'aca-chile-images';

console.log('🔧 Configurando acceso público al bucket R2...\n');

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: ACCESS_KEY_ID,
    secretAccessKey: SECRET_ACCESS_KEY,
  },
});

async function configurarAccesoPublico() {
  try {
    // Política para permitir acceso público de lectura
    const bucketPolicy = {
      Version: "2012-10-17",
      Statement: [
        {
          Sid: "PublicReadGetObject",
          Effect: "Allow",
          Principal: "*",
          Action: "s3:GetObject",
          Resource: `arn:aws:s3:::${BUCKET_NAME}/*`
        }
      ]
    };

    const command = new PutBucketPolicyCommand({
      Bucket: BUCKET_NAME,
      Policy: JSON.stringify(bucketPolicy)
    });

    await s3Client.send(command);
    console.log('✅ Política de acceso público configurada');

    // Generar URLs de prueba
    const testUrls = [
      `https://pub-${ACCOUNT_ID}.r2.dev/${BUCKET_NAME}/eventos/campeonato-nacional-asado.jpg`,
      `https://pub-${ACCOUNT_ID}.r2.dev/${BUCKET_NAME}/noticias/mundial-barbacoa-2024.jpg`
    ];

    console.log('\n🔗 URLs de prueba:');
    testUrls.forEach(url => console.log(`   ${url}`));

    console.log('\n💡 Configurar dominio personalizado en Cloudflare:');
    console.log(`1. Ve a R2 → ${BUCKET_NAME} → Settings → Custom domains`);
    console.log(`2. Agregar: images.acachile.com`);
    console.log(`3. Las URLs serán: https://images.acachile.com/eventos/...`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

configurarAccesoPublico();