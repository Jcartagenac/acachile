export async function getNewsCategoriesFromDb(env) {
  try {
    const { results } = await env.DB.prepare(
      'SELECT id, name, slug, description, color FROM news_categories ORDER BY id ASC'
    ).all();
    return Array.isArray(results) ? results : [];
  } catch (error) {
    console.error('[NOTICIAS] Error loading news_categories from DB:', error);
    return [];
  }
}

export function getFallbackNewsCategories() {
  return [
    { id: 1, name: 'Competencias', slug: 'competencias', color: '#DC2626', description: 'Campeonatos, torneos y competencias de asado' },
    { id: 2, name: 'Educación', slug: 'educacion', color: '#059669', description: 'Cursos, talleres y capacitaciones' },
    { id: 3, name: 'Eventos', slug: 'eventos', color: '#2563EB', description: 'Eventos sociales, encuentros y celebraciones' },
    { id: 4, name: 'Institucional', slug: 'institucional', color: '#7C3AED', description: 'Noticias oficiales de la ACA Chile' },
    { id: 5, name: 'Internacional', slug: 'internacional', color: '#EA580C', description: 'Noticias y eventos internacionales' },
    { id: 6, name: 'Comunidad', slug: 'comunidad', color: '#0891B2', description: 'Historias y actividades de la comunidad' },
    { id: 7, name: 'Técnicas', slug: 'tecnicas', color: '#CA8A04', description: 'Tips, técnicas y mejores prácticas' },
    { id: 8, name: 'General', slug: 'general', color: '#64748B', description: 'Noticias generales' },
  ];
}

export async function getCategoryMap(env) {
  const categories = await getNewsCategoriesFromDb(env);
  const source = categories.length > 0 ? categories : getFallbackNewsCategories();
  return Object.fromEntries(source.map((category) => [category.id, category]));
}

export async function resolveValidCategoryId(env, requestedCategoryId, fallbackCategoryId = null) {
  const categories = await getNewsCategoriesFromDb(env);
  if (categories.length === 0) {
    return Number.isFinite(Number(requestedCategoryId)) ? Number(requestedCategoryId) : fallbackCategoryId;
  }

  const availableIds = new Set(categories.map((category) => Number(category.id)));
  const requested = Number(requestedCategoryId);
  if (Number.isFinite(requested) && availableIds.has(requested)) {
    return requested;
  }

  const fallback = Number(fallbackCategoryId);
  if (Number.isFinite(fallback) && availableIds.has(fallback)) {
    return fallback;
  }

  return Number(categories[0].id);
}

export async function resolveValidAuthorId(env, preferredAuthorId = null) {
  const candidates = [];
  const parsedPreferred = Number(preferredAuthorId);
  if (Number.isFinite(parsedPreferred) && parsedPreferred > 0) {
    candidates.push(parsedPreferred);
  }
  candidates.push(1);

  for (const candidate of candidates) {
    try {
      const found = await env.DB.prepare('SELECT id FROM users WHERE id = ?').bind(candidate).first();
      if (found?.id) return Number(found.id);
    } catch (error) {
      console.error('[NOTICIAS] Error validating author candidate in users:', error);
      break;
    }
  }

  try {
    const firstUser = await env.DB.prepare('SELECT id FROM users ORDER BY id ASC LIMIT 1').first();
    if (firstUser?.id) return Number(firstUser.id);
  } catch (error) {
    console.error('[NOTICIAS] Error loading fallback author from users:', error);
  }

  return null;
}
