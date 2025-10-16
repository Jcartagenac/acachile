// Función para inicializar estructura de carpetas en R2
// Cloudflare Pages Function: /functions/api/init-folders.ts

interface Env {
  IMAGES: any; // R2Bucket binding
}

interface CloudflareContext {
  request: Request;
  env: Env;
}

// Carpetas que deben existir en R2 (usando nombres en español para consistencia)
const REQUIRED_FOLDERS = [
  'avatars',
  'home', 
  'eventos',    // Cambio de 'events' a 'eventos' 
  'noticias',   // Cambio de 'news' a 'noticias'
  'gallery'
];

// Función para crear carpeta placeholder
async function createFolderPlaceholder(r2Bucket: any, folderName: string) {
  try {
    const placeholderKey = `${folderName}/.gitkeep`;
    const placeholderContent = `# Carpeta para ${folderName}\nCreada automáticamente por AcaChile\n`;
    
    await r2Bucket.put(placeholderKey, placeholderContent, {
      httpMetadata: {
        contentType: 'text/plain',
      },
      customMetadata: {
        createdAt: new Date().toISOString(),
        purpose: 'folder-placeholder',
        folder: folderName,
      },
    });

    console.log(`✅ Carpeta creada: ${folderName}/`);
    return { success: true, folder: folderName };

  } catch (error) {
    console.error(`❌ Error creando carpeta ${folderName}:`, error);
    return { 
      success: false, 
      folder: folderName, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Función para verificar si una carpeta existe
async function folderExists(r2Bucket: any, folderName: string): Promise<boolean> {
  try {
    const placeholderKey = `${folderName}/.gitkeep`;
    const object = await r2Bucket.get(placeholderKey);
    return object !== null;
  } catch (error) {
    return false;
  }
}

// Handler principal
export async function onRequestPost(context: CloudflareContext) {
  const { env } = context;

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

    console.log('🚀 Inicializando estructura de carpetas en R2...');

    const results = [];
    
    // Crear cada carpeta si no existe
    for (const folder of REQUIRED_FOLDERS) {
      const exists = await folderExists(env.IMAGES, folder);
      
      if (!exists) {
        console.log(`📁 Creando carpeta: ${folder}/`);
        const result = await createFolderPlaceholder(env.IMAGES, folder);
        results.push(result);
      } else {
        console.log(`✅ Carpeta ya existe: ${folder}/`);
        results.push({ success: true, folder, exists: true });
      }
    }

    // Contar éxitos y errores
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`📊 Inicialización completada: ${successful} éxitos, ${failed} errores`);

    return new Response(JSON.stringify({
      success: true,
      message: `Estructura de carpetas inicializada: ${successful}/${REQUIRED_FOLDERS.length} carpetas`,
      data: {
        total: REQUIRED_FOLDERS.length,
        successful,
        failed,
        results,
      }
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    });

  } catch (error) {
    console.error('❌ Error inicializando carpetas:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error inicializando estructura de carpetas',
      details: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// GET handler para verificar estado de carpetas
export async function onRequestGet(context: CloudflareContext) {
  const { env } = context;

  try {
    if (!env.IMAGES) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'R2 binding no configurado' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const folderStatus = [];
    
    for (const folder of REQUIRED_FOLDERS) {
      const exists = await folderExists(env.IMAGES, folder);
      folderStatus.push({ folder, exists });
    }

    return new Response(JSON.stringify({
      success: true,
      data: {
        folders: folderStatus,
        totalFolders: REQUIRED_FOLDERS.length,
        existingFolders: folderStatus.filter(f => f.exists).length,
      }
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Error verificando carpetas',
      details: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/*
INSTRUCCIONES DE USO:

1. Para crear todas las carpetas:
   POST /api/init-folders

2. Para verificar estado de carpetas:
   GET /api/init-folders

3. Carpetas que se crean:
   - avatars/     - Para fotos de perfil de usuarios
   - home/        - Para imágenes del home/banner  
   - events/      - Para imágenes de eventos
   - news/        - Para imágenes de noticias
   - gallery/     - Para galería general

4. Cada carpeta contiene un archivo .gitkeep para mantenerla activa
*/