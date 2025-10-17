// Cloudflare Pages Function para subida de imágenes a R2
// Ruta: /functions/api/upload-image.ts

interface Env {
  IMAGES: any; // R2Bucket binding
  R2_PUBLIC_URL: string;
}

// Tipos simplificados para evitar dependencias
interface CloudflareContext {
  request: Request;
  env: Env;
}

interface ImageUploadRequest {
  filename: string;
  folder: string;
  contentType: string;
}

// Función para subir imagen sin procesamiento (temporalmente desactivado)
async function processImage(file: File, folder: string): Promise<{buffer: ArrayBuffer, size: number, contentType: string}> {
  console.log(`📁 Subiendo imagen original sin procesamiento para ${folder}:`, {
    originalSize: file.size,
    originalType: file.type,
    name: file.name
  });
  
  // Retornar imagen original sin ningún procesamiento
  const buffer = await file.arrayBuffer();
  return { 
    buffer, 
    size: buffer.byteLength, 
    contentType: file.type 
  };
}

// Validaciones de seguridad (usando nombres en español para consistencia)
const ALLOWED_FOLDERS = ['avatars', 'home', 'eventos', 'noticias', 'gallery'];
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Configuración de compresión por tipo de carpeta
const COMPRESSION_CONFIG = {
  avatars: { maxWidth: 800, maxHeight: 1200, quality: 0.8 }, // Permitir imágenes más altas para fotos verticales
  home: { maxWidth: 1200, maxHeight: 800, quality: 0.85 },
  eventos: { maxWidth: 800, maxHeight: 600, quality: 0.8 },
  noticias: { maxWidth: 600, maxHeight: 400, quality: 0.8 },
  gallery: { maxWidth: 1920, maxHeight: 1080, quality: 0.9 }
};

// Función para subir imagen a R2
async function uploadToR2(
  r2Bucket: any, 
  file: File, 
  request: ImageUploadRequest,
  publicUrl: string
) {
  try {
    const { filename, folder, contentType } = request;
    
    // Validar carpeta
    if (!ALLOWED_FOLDERS.includes(folder)) {
      throw new Error(`Carpeta no permitida: ${folder}`);
    }

    // Validar tipo de archivo
    if (!ALLOWED_TYPES.includes(contentType)) {
      throw new Error(`Tipo de archivo no permitido: ${contentType}`);
    }

    // Validar tamaño
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`Archivo muy grande: ${file.size} bytes (máximo ${MAX_FILE_SIZE})`);
    }

    // Procesar y optimizar imagen
    const { buffer: arrayBuffer, size: finalSize, contentType: optimizedContentType } = await processImage(file, folder);

    // Subir a R2 usando el binding
    await r2Bucket.put(filename, arrayBuffer, {
      httpMetadata: {
        contentType: optimizedContentType,
        cacheControl: 'public, max-age=31536000', // 1 año
      },
      customMetadata: {
        uploadedAt: new Date().toISOString(),
        folder: folder,
        originalName: file.name,
        originalSize: file.size.toString(),
        finalSize: finalSize.toString(),
        originalType: file.type,
        finalType: optimizedContentType,
      },
    });

    // Construir URL pública
    const imageUrl = `${publicUrl}/${filename}`;

    console.log('✅ Imagen subida exitosamente a R2:', {
      filename,
      imageUrl,
      originalSize: file.size,
      finalSize: finalSize,
      originalType: file.type,
      finalType: optimizedContentType
    });

    return {
      success: true,
      data: {
        url: imageUrl,
        publicUrl: imageUrl,
        filename: filename,
        originalSize: file.size,
        finalSize: finalSize,
        originalType: file.type,
        finalType: optimizedContentType
      },
    };

  } catch (error) {
    console.error('❌ Error subiendo imagen a R2:', error);
    return {
      success: false,
      error: 'Error subiendo imagen a R2',
      details: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Handler principal de Cloudflare Pages Function
export async function onRequestPost(context: CloudflareContext) {
  const { request, env } = context;

  try {
    // Verificar que tengamos el binding R2
    if (!env.IMAGES) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'R2 binding no configurado' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Parsear FormData
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const filename = formData.get('filename') as string;
    const folder = formData.get('folder') as string;

    if (!file || !filename || !folder) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Faltan campos requeridos: file, filename, folder'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // URL pública del bucket (desde variable de entorno o default)
    const publicUrl = env.R2_PUBLIC_URL || 'https://pub-85ac8c62baca4966b2ac0b16e1b9b6c6.r2.dev';

    // Subir a R2
    const result = await uploadToR2(env.IMAGES, file, {
      filename,
      folder,
      contentType: file.type,
    }, publicUrl);

    const statusCode = result.success ? 200 : 500;
    return new Response(JSON.stringify(result), {
      status: statusCode,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });

  } catch (error) {
    console.error('Handler error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Handler para preflight CORS
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

/*
CONFIGURACIÓN REQUERIDA:

1. En wrangler.toml (ya configurado):
   [[r2_buckets]]
   binding = "IMAGES"
   bucket_name = "aca-chile-images"

2. En Cloudflare Pages > Settings > Environment Variables:
   R2_PUBLIC_URL = https://pub-xxxxx.r2.dev

3. Estructura de carpetas con compresión automática:
   /avatars/          - Avatares 400x400px, calidad 80%
   /home/             - Imágenes del home 1200x800px, calidad 85%
   /eventos/          - Imágenes de eventos 800x600px, calidad 80%
   /noticias/         - Imágenes de noticias 600x400px, calidad 80%
   /gallery/          - Galería 1920x1080px, calidad 90%

4. Límite de archivo: 5MB (se optimiza automáticamente)
5. Optimización automática: PNG grandes → JPEG para mejor compresión

EJEMPLO DE USO:
POST /api/upload-image
FormData:
- file: <File object>
- filename: "avatars/user-123-1634567890-abc.jpg"
- folder: "avatars"
*/