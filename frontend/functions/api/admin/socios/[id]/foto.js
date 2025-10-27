import { requireAdminOrDirector, authErrorResponse, errorResponse } from '../../_middleware';

// Endpoint para subir foto de perfil de socio
// POST /api/admin/socios/[id]/foto

export async function onRequestPost(context) {
  const { request, env, params } = context;

  try {
    try {
      await requireAdminOrDirector(request, env);
    } catch (error) {
      return authErrorResponse(error, env);
    }

    const socioId = Number.parseInt(params.id, 10);
    
    if (!socioId || Number.isNaN(socioId)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'ID de socio inválido'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log(`[ADMIN SOCIOS FOTO] Subiendo foto para socio ID: ${socioId}`);

    // Verificar que el socio existe
    const socio = await env.DB.prepare(
      'SELECT id FROM usuarios WHERE id = ? AND activo = 1'
    ).bind(socioId).first();

    if (!socio) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Socio no encontrado'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Obtener la foto del FormData
    const formData = await request.formData();
    const foto = formData.get('foto');

    if (!foto || !(foto instanceof File)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No se proporcionó ninguna foto'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validar tipo de archivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(foto.type)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Formato de imagen no válido. Use JPG, PNG o WebP'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validar tamaño (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (foto.size > maxSize) {
      return new Response(JSON.stringify({
        success: false,
        error: 'La imagen es demasiado grande. Tamaño máximo: 5MB'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generar nombre único para la foto
    const extension = foto.name.split('.').pop() || 'jpg';
    const fileName = `socio-${socioId}-${Date.now()}.${extension}`;
    const folderPath = `socios/${socioId}`;
    const filePath = `${folderPath}/${fileName}`;

    // Subir foto a R2
    try {
      const arrayBuffer = await foto.arrayBuffer();
      await env.ACA_BUCKET.put(filePath, arrayBuffer, {
        httpMetadata: {
          contentType: foto.type,
        },
        customMetadata: {
          uploadedBy: 'admin',
          socioId: socioId.toString(),
          uploadedAt: new Date().toISOString(),
        }
      });

      console.log(`[ADMIN SOCIOS FOTO] Foto subida a R2: ${filePath}`);
    } catch (r2Error) {
      console.error('[ADMIN SOCIOS FOTO] Error subiendo a R2:', r2Error);
      return new Response(JSON.stringify({
        success: false,
        error: 'Error al subir la foto al almacenamiento'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Construir URL pública de la foto
    const fotoUrl = `https://pub-d31f7eb8b5c14675a4fa9da7a5746eb7.r2.dev/${filePath}`;

    // Actualizar foto_url en la base de datos
    try {
      await env.DB.prepare(`
        UPDATE usuarios 
        SET foto_url = ?,
            updated_at = datetime('now')
        WHERE id = ?
      `).bind(fotoUrl, socioId).run();

      console.log(`[ADMIN SOCIOS FOTO] Base de datos actualizada con foto_url: ${fotoUrl}`);
    } catch (dbError) {
      console.error('[ADMIN SOCIOS FOTO] Error actualizando base de datos:', dbError);
      // La foto ya está en R2, así que no fallar completamente
      return new Response(JSON.stringify({
        success: true,
        data: {
          fotoUrl,
          warning: 'Foto subida pero hubo un problema actualizando la base de datos'
        }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      data: {
        fotoUrl,
        fileName,
        filePath
      },
      message: 'Foto subida exitosamente'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[ADMIN SOCIOS FOTO] Error:', error);

    return errorResponse(
      'Error al procesar la foto',
      500,
      env.ENVIRONMENT === 'development'
        ? { details: error instanceof Error ? error.stack || error.message : error }
        : undefined
    );
  }
}
