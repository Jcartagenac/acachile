// Endpoint para registrar compartidos de artículos
// POST /api/compartir/[articleId]

export async function onRequestPost(context) {
  const { env, params, request } = context;

  try {
    const articleId = parseInt(params.articleId);
    
    if (isNaN(articleId)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'ID de artículo inválido'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const { platform } = body;

    if (!platform || !['facebook', 'twitter', 'whatsapp', 'email', 'copy'].includes(platform)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Plataforma inválida'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Obtener datos actuales de compartidos
    const sharesKey = `shares:article:${articleId}`;
    const sharesData = await env.ACA_KV.get(sharesKey);
    const shares = sharesData ? JSON.parse(sharesData) : {
      total: 0,
      byPlatform: {
        facebook: 0,
        twitter: 0,
        whatsapp: 0,
        email: 0,
        copy: 0
      },
      history: []
    };

    // Incrementar contador
    shares.total = (shares.total || 0) + 1;
    shares.byPlatform[platform] = (shares.byPlatform[platform] || 0) + 1;
    
    // Agregar al historial (mantener últimos 100)
    shares.history = shares.history || [];
    shares.history.unshift({
      platform,
      timestamp: new Date().toISOString()
    });
    
    if (shares.history.length > 100) {
      shares.history = shares.history.slice(0, 100);
    }

    // Guardar en KV
    await env.ACA_KV.put(sharesKey, JSON.stringify(shares));

    // También actualizar el contador en la noticia
    const noticiasData = await env.ACA_KV.get('noticias:all');
    if (noticiasData) {
      const noticias = JSON.parse(noticiasData);
      const noticiaIndex = noticias.findIndex(n => n.id === articleId);
      
      if (noticiaIndex !== -1) {
        noticias[noticiaIndex].shares = shares.total;
        await env.ACA_KV.put('noticias:all', JSON.stringify(noticias));
        await env.ACA_KV.put(`noticia:${articleId}`, JSON.stringify(noticias[noticiaIndex]));
      }
    }

    console.log(`[COMPARTIR] Artículo ${articleId} compartido en ${platform}. Total: ${shares.total}`);

    return new Response(JSON.stringify({
      success: true,
      data: {
        total: shares.total,
        platform,
        message: 'Compartido registrado exitosamente'
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[COMPARTIR] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error registrando compartido'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// GET para obtener estadísticas de compartidos
export async function onRequestGet(context) {
  const { env, params } = context;

  try {
    const articleId = parseInt(params.articleId);
    
    if (isNaN(articleId)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'ID de artículo inválido'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const sharesKey = `shares:article:${articleId}`;
    const sharesData = await env.ACA_KV.get(sharesKey);
    const shares = sharesData ? JSON.parse(sharesData) : {
      total: 0,
      byPlatform: {
        facebook: 0,
        twitter: 0,
        whatsapp: 0,
        email: 0,
        copy: 0
      }
    };

    return new Response(JSON.stringify({
      success: true,
      data: shares
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[COMPARTIR] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error obteniendo estadísticas'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
