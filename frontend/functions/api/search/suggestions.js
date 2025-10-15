// Endpoint de sugerencias para búsqueda
// GET /api/search/suggestions?q={query}&limit={number}

export async function onRequestGet(context) {
  const { request, env } = context;

  try {
    const url = new URL(request.url);
    const query = url.searchParams.get('q');
    const limit = parseInt(url.searchParams.get('limit')) || 5;

    console.log(`[SEARCH/SUGGESTIONS] Query: "${query}", Limit: ${limit}`);

    if (!query || query.trim().length < 1) {
      return new Response(JSON.stringify({
        success: true,
        data: []
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const searchTerm = query.toLowerCase().trim();
    const suggestions = new Set(); // Usar Set para evitar duplicados

    // Obtener sugerencias de eventos
    try {
      const eventosData = await env.ACA_KV.get('eventos:all');
      if (eventosData) {
        const eventos = JSON.parse(eventosData);
        eventos.forEach(evento => {
          // Agregar título si contiene el término
          if (evento.title?.toLowerCase().includes(searchTerm)) {
            suggestions.add(evento.title);
          }
          
          // Agregar tags que contengan el término
          evento.tags?.forEach(tag => {
            if (tag.toLowerCase().includes(searchTerm)) {
              suggestions.add(tag);
            }
          });

          // Agregar tipo si contiene el término
          if (evento.type?.toLowerCase().includes(searchTerm)) {
            suggestions.add(evento.type);
          }

          // Agregar ubicación si contiene el término
          if (evento.location?.toLowerCase().includes(searchTerm)) {
            suggestions.add(evento.location);
          }
        });
      }
    } catch (error) {
      console.error('[SEARCH/SUGGESTIONS] Error obteniendo eventos:', error);
    }

    // Obtener sugerencias de noticias
    try {
      const noticiasData = await env.ACA_KV.get('noticias:all');
      if (noticiasData) {
        const noticias = JSON.parse(noticiasData);
        noticias.forEach(noticia => {
          // Agregar título si contiene el término
          if (noticia.title?.toLowerCase().includes(searchTerm)) {
            suggestions.add(noticia.title);
          }
          
          // Agregar tags que contengan el término
          noticia.tags?.forEach(tag => {
            if (tag.toLowerCase().includes(searchTerm)) {
              suggestions.add(tag);
            }
          });

          // Agregar categoría si contiene el término
          if (noticia.category?.toLowerCase().includes(searchTerm)) {
            suggestions.add(noticia.category);
          }
        });
      }
    } catch (error) {
      console.error('[SEARCH/SUGGESTIONS] Error obteniendo noticias:', error);
    }

    // Agregar términos comunes predefinidos
    const commonTerms = [
      'campeonato', 'taller', 'encuentro', 'torneo', 
      'asado', 'parrilla', 'carne', 'técnicas',
      'nacional', 'regional', 'local',
      'chile', 'santiago', 'valparaíso', 'concepción',
      'barbacoa', 'costillar', 'chorizo', 'ahumado'
    ];

    commonTerms.forEach(term => {
      if (term.includes(searchTerm)) {
        suggestions.add(term);
      }
    });

    // Convertir Set a Array, ordenar y limitar
    const suggestionsArray = Array.from(suggestions)
      .sort((a, b) => {
        // Priorizar coincidencias al inicio
        const aStartsWith = a.toLowerCase().startsWith(searchTerm);
        const bStartsWith = b.toLowerCase().startsWith(searchTerm);
        
        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;
        
        // Luego por longitud (más cortos primero)
        return a.length - b.length;
      })
      .slice(0, limit);

    console.log(`[SEARCH/SUGGESTIONS] Encontradas: ${suggestionsArray.length} sugerencias`);

    return new Response(JSON.stringify({
      success: true,
      data: suggestionsArray
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[SEARCH/SUGGESTIONS] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Error interno del servidor',
      details: env.ENVIRONMENT === 'development' ? error.message : undefined
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}