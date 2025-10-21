// Endpoint de sugerencias para búsqueda
// GET /api/search/suggestions?q={query}&limit={number}

const SECTION_PAGES = [
  { key: 'home', label: 'Inicio' },
  { key: 'about', label: 'Quiénes Somos' },
  { key: 'contact', label: 'Contacto' }
];

const SECTION_KV_PREFIX = 'site:sections:';
const DEFAULT_SECTION_FALLBACK = {
  home: [
    { title: 'Asociación Chilena de Asadores' },
    { title: 'Somos Internacionales' },
    { title: 'Comunidad y Formación' }
  ],
  about: [
    { title: 'Quiénes Somos' },
    { title: 'Nuestra Misión' }
  ],
  contact: [
    { title: 'Hablemos' },
    { title: 'Información de contacto' }
  ]
};

const ensurePrivacyTable = async (db) => {
  if (!db) return;
  await db
    .prepare(
      `
        CREATE TABLE IF NOT EXISTS user_privacy_settings (
          user_id INTEGER PRIMARY KEY,
          show_email INTEGER DEFAULT 0,
          show_phone INTEGER DEFAULT 0,
          show_rut INTEGER DEFAULT 0,
          show_address INTEGER DEFAULT 0,
          show_birthdate INTEGER DEFAULT 0,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `
    )
    .run();
};

const mapPrivacyFlags = (row) => ({
  showAddress: row?.show_address === 1
});

function toLikeParam(term) {
  return `%${term}%`;
}

async function fetchSections(env, pageKey) {
  let sections = [];

  if (env.ACA_KV) {
    try {
      const cached = await env.ACA_KV.get(`${SECTION_KV_PREFIX}${pageKey}`);
      if (cached) {
        sections = JSON.parse(cached);
      }
    } catch (error) {
      console.error('[SEARCH/SUGGESTIONS] Error leyendo secciones desde KV:', error);
    }
  }

  if ((!sections || sections.length === 0) && env.DB) {
    try {
      const dbResult = await env.DB.prepare(
        `
          SELECT title
          FROM site_sections
          WHERE page = ?
        `
      )
        .bind(pageKey)
        .all();

      if (dbResult?.results?.length) {
        sections = dbResult.results;
      }
    } catch (error) {
      // Tabla puede no existir aún; ignorar
    }
  }

  if (!sections || sections.length === 0) {
    sections = DEFAULT_SECTION_FALLBACK[pageKey] || [];
  }

  return sections;
}

async function getSectionSuggestions(env, searchTerm, limit) {
  const matches = [];

  for (const page of SECTION_PAGES) {
    const sections = await fetchSections(env, page.key);
    sections
      .filter((section) => section.title?.toLowerCase().includes(searchTerm))
      .forEach((section) => {
        matches.push(`${section.title} (${page.label})`);
      });
  }

  return matches.slice(0, limit);
}

async function getUserSuggestions(env, searchTerm, limit) {
  if (!env.DB) return [];

  try {
    await ensurePrivacyTable(env.DB);

    const likeParam = toLikeParam(searchTerm);
    const result = await env.DB.prepare(
      `
        SELECT 
          u.nombre,
          u.apellido,
          u.ciudad,
          privacy.show_address
        FROM usuarios u
        LEFT JOIN user_privacy_settings privacy ON privacy.user_id = u.id
        WHERE u.activo = 1
          AND (
            LOWER(u.nombre) LIKE ?
            OR LOWER(u.apellido) LIKE ?
            OR LOWER(u.ciudad) LIKE ?
            OR LOWER(u.nombre || ' ' || IFNULL(u.apellido, '')) LIKE ?
            OR LOWER(u.apellido || ' ' || IFNULL(u.nombre, '')) LIKE ?
            OR LOWER(REPLACE(u.nombre || u.apellido, ' ', '')) LIKE REPLACE(?, ' ', '')
          )
        ORDER BY u.nombre ASC
        LIMIT ?
      `
    )
      .bind(likeParam, likeParam, likeParam, likeParam, likeParam, likeParam, limit)
      .all();

    const rows = result?.results || [];

    return rows
      .map((row) => {
        const name = [row.nombre, row.apellido].filter(Boolean).join(' ').trim();
        if (!name) return null;
        const privacy = mapPrivacyFlags(row);
        const city = privacy.showAddress && row.ciudad ? ` (${row.ciudad})` : '';
        return `${name}${city}`;
      })
      .filter(Boolean);
  } catch (error) {
    console.error('[SEARCH/SUGGESTIONS] Error obteniendo socios:', error);
    return [];
  }
}

export async function onRequestGet(context) {
  const { request, env } = context;

  try {
    const url = new URL(request.url);
    const query = url.searchParams.get('q');
    const limit = parseInt(url.searchParams.get('limit')) || 8;

    console.log(`[SEARCH/SUGGESTIONS] Query: "${query}", Limit: ${limit}`);

    if (!query || query.trim().length < 1) {
      return new Response(
        JSON.stringify({
          success: true,
          data: []
        }),
        {
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const searchTerm = query.toLowerCase().trim();
    const suggestions = new Set();

    // Eventos
    try {
      const eventosData = await env.ACA_KV.get('eventos:all');
      if (eventosData) {
        const eventos = JSON.parse(eventosData) || [];
        eventos.forEach((evento) => {
          if (evento.title?.toLowerCase().includes(searchTerm)) {
            suggestions.add(evento.title);
          }
          evento.tags?.forEach((tag) => {
            if (tag.toLowerCase().includes(searchTerm)) {
              suggestions.add(tag);
            }
          });
          if (evento.location?.toLowerCase().includes(searchTerm)) {
            suggestions.add(evento.location);
          }
        });
      }
    } catch (error) {
      console.error('[SEARCH/SUGGESTIONS] Error obteniendo eventos:', error);
    }

    // Noticias
    try {
      const noticiasData = await env.ACA_KV.get('noticias:all');
      if (noticiasData) {
        const noticias = JSON.parse(noticiasData) || [];
        noticias.forEach((noticia) => {
          if (noticia.title?.toLowerCase().includes(searchTerm)) {
            suggestions.add(noticia.title);
          }
          noticia.tags?.forEach((tag) => {
            if (tag.toLowerCase().includes(searchTerm)) {
              suggestions.add(tag);
            }
          });
          if (noticia.category?.toLowerCase().includes(searchTerm)) {
            suggestions.add(noticia.category);
          }
        });
      }
    } catch (error) {
      console.error('[SEARCH/SUGGESTIONS] Error obteniendo noticias:', error);
    }

    // Secciones del sitio
    try {
      const sectionSuggestions = await getSectionSuggestions(env, searchTerm, Math.max(2, Math.floor(limit / 2)));
      sectionSuggestions.forEach((suggestion) => suggestions.add(suggestion));
    } catch (error) {
      console.error('[SEARCH/SUGGESTIONS] Error obteniendo secciones:', error);
    }

    // Socios (perfiles públicos)
    try {
      const userSuggestions = await getUserSuggestions(env, searchTerm, Math.max(2, Math.floor(limit / 2)));
      userSuggestions.forEach((suggestion) => suggestions.add(suggestion));
    } catch (error) {
      console.error('[SEARCH/SUGGESTIONS] Error obteniendo socios:', error);
    }

    // Términos comunes
    const commonTerms = [
      'calendario de eventos',
      'quiénes somos',
      'noticias ACA',
      'directorio de socios',
      'campeonato',
      'taller',
      'competencia',
      'parrilla'
    ];

    commonTerms.forEach((term) => {
      if (term.includes(searchTerm)) {
        suggestions.add(term);
      }
    });

    const suggestionsArray = Array.from(suggestions)
      .sort((a, b) => {
        const aLower = a.toLowerCase();
        const bLower = b.toLowerCase();
        const aStarts = aLower.startsWith(searchTerm);
        const bStarts = bLower.startsWith(searchTerm);

        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        return a.length - b.length;
      })
      .slice(0, limit);

    console.log(`[SEARCH/SUGGESTIONS] Encontradas: ${suggestionsArray.length} sugerencias`);

    return new Response(
      JSON.stringify({
        success: true,
        data: suggestionsArray
      }),
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('[SEARCH/SUGGESTIONS] Error general:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Error interno del servidor',
        details: env.ENVIRONMENT === 'development' ? error.message : undefined
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
