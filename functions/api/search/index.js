// Endpoint de búsqueda global
// GET /api/search?q={query}&type={eventos|noticias|all}&limit={number}

// Helper: Buscar en eventos
async function searchEventos(env, searchTerm, limit) {
  try {
    const eventosData = await env.ACA_KV.get('eventos:all');
    if (!eventosData) return [];

    const eventos = JSON.parse(eventosData);
    const eventosFiltered = eventos.filter(evento => 
      evento.title?.toLowerCase().includes(searchTerm) ||
      evento.description?.toLowerCase().includes(searchTerm) ||
      evento.location?.toLowerCase().includes(searchTerm) ||
      evento.type?.toLowerCase().includes(searchTerm) ||
      evento.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
    ).slice(0, limit);

    return eventosFiltered.map(evento => ({
      type: 'evento',
      id: evento.id,
      title: evento.title,
      description: evento.description?.substring(0, 150) + '...',
      date: evento.date,
      location: evento.location,
      slug: `/eventos/${evento.id}`,
      image: evento.image,
      relevance: calculateRelevance(evento, searchTerm)
    }));
  } catch (error) {
    console.error('[SEARCH] Error buscando eventos:', error);
    return [];
  }
}

// Helper: Buscar en noticias
async function searchNoticias(env, searchTerm, limit) {
  try {
    const noticiasData = await env.ACA_KV.get('noticias:all');
    if (!noticiasData) return [];

    const noticias = JSON.parse(noticiasData);
    const noticiasFiltered = noticias.filter(noticia => 
      noticia.title?.toLowerCase().includes(searchTerm) ||
      noticia.excerpt?.toLowerCase().includes(searchTerm) ||
      noticia.content?.toLowerCase().includes(searchTerm) ||
      noticia.category?.toLowerCase().includes(searchTerm) ||
      noticia.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
    ).slice(0, limit);

    return noticiasFiltered.map(noticia => ({
      type: 'noticia',
      id: noticia.id,
      title: noticia.title,
      excerpt: noticia.excerpt,
      publishedAt: noticia.publishedAt,
      category: noticia.category,
      slug: `/noticias/${noticia.slug}`,
      image: noticia.image,
      relevance: calculateRelevance(noticia, searchTerm)
    }));
  } catch (error) {
    console.error('[SEARCH] Error buscando noticias:', error);
    return [];
  }
}

// Helper: Combinar y ordenar resultados
function combineResults(eventos, noticias, limit) {
  return [...eventos, ...noticias]
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, limit);
}

export async function onRequestGet(context) {
  const { request, env } = context;

  try {
    const url = new URL(request.url);
    const query = url.searchParams.get('q');
    const type = url.searchParams.get('type') || 'all';
    const limit = parseInt(url.searchParams.get('limit')) || 10;

    console.log(`[SEARCH] Query: "${query}", Type: ${type}, Limit: ${limit}`);

    if (!query || query.trim().length < 2) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Query de búsqueda debe tener al menos 2 caracteres'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const searchTerm = query.toLowerCase().trim();
    const results = {
      query: query,
      total: 0,
      eventos: [],
      noticias: []
    };

    // Buscar según tipo
    if (type === 'eventos' || type === 'all') {
      results.eventos = await searchEventos(env, searchTerm, limit);
    }

    if (type === 'noticias' || type === 'all') {
      results.noticias = await searchNoticias(env, searchTerm, limit);
    }

    // Combinar resultados si es búsqueda general
    const allResults = type === 'all' 
      ? combineResults(results.eventos, results.noticias, limit)
      : [];

    results.total = results.eventos.length + results.noticias.length;

    console.log(`[SEARCH] Encontrados: ${results.total} resultados`);

    return new Response(JSON.stringify({
      success: true,
      data: type === 'all' ? {
        ...results,
        combined: allResults
      } : results
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[SEARCH] Error:', error);
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

// Función para calcular relevancia de resultados
function calculateRelevance(item, searchTerm) {
  let score = 0;
  const term = searchTerm.toLowerCase();

  // Título tiene más peso
  if (item.title?.toLowerCase().includes(term)) {
    score += 10;
    if (item.title.toLowerCase().startsWith(term)) {
      score += 5; // Boost si empieza con el término
    }
  }

  // Descripción/excerpt
  if (item.description?.toLowerCase().includes(term) || 
      item.excerpt?.toLowerCase().includes(term)) {
    score += 5;
  }

  // Tags
  if (item.tags?.some(tag => tag.toLowerCase().includes(term))) {
    score += 3;
  }

  // Tipo/categoría
  if (item.type?.toLowerCase().includes(term) || 
      item.category?.toLowerCase().includes(term)) {
    score += 2;
  }

  // Contenido completo (menor peso)
  if (item.content?.toLowerCase().includes(term)) {
    score += 1;
  }

  return score;
}