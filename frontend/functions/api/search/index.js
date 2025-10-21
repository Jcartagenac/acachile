// Endpoint de búsqueda global
// GET /api/search?q={query}&type={eventos|noticias|usuarios|secciones|all}&limit={number}

const SECTION_PAGES = [
  { key: 'home', route: '/', label: 'Inicio' },
  { key: 'about', route: '/quienes-somos', label: 'Quiénes Somos' },
  { key: 'contact', route: '/contacto', label: 'Contacto' }
];

const SECTION_KV_PREFIX = 'site:sections:';

const DEFAULT_SECTION_FALLBACK = {
  home: [
    {
      key: 'hero',
      title: 'Asociación Chilena de Asadores',
      content:
        'Somos la comunidad oficial de asadores en Chile. Conectamos a parrilleros, aficionados y profesionales en torno al fuego, la gastronomía y la camaradería. Únete a ACA para vivir experiencias únicas y compartir nuestra pasión por la parrilla.'
    },
    {
      key: 'international',
      title: 'Somos Internacionales',
      content:
        'El 29 y 30 de noviembre de 2025 estaremos junto a la World Barbecue Association recibiendo a 80 equipos de 40 países. La gran final del WBQA International BBQ Championship se vive en Viña del Mar, y queremos que formes parte de este hito profesional.'
    },
    {
      key: 'community',
      title: 'Comunidad y Formación',
      content:
        'Creamos instancias permanentes de perfeccionamiento para nuestros socios, talleres de técnicas de cocción, cursos de parrilla y encuentros recreativos. Nuestra misión es elevar el estándar gastronómico y mantener viva la cultura parrillera chilena.'
    }
  ],
  about: [
    {
      key: 'about-hero',
      title: 'Quiénes Somos',
      content:
        'Somos la Asociación Chilena de Asadores (ACA), una organización sin fines de lucro que reúne a amantes de la parrilla y del fuego de todo Chile. Promovemos la cultura parrillera, la camaradería y el perfeccionamiento de las técnicas de asado.'
    },
    {
      key: 'about-mission',
      title: 'Nuestra Misión',
      content:
        'Difundir la tradición parrillera chilena, compartir conocimientos y generar instancias de encuentro. Involucramos a expertos asadores, aficionados y principiantes en torno a proyectos gastronómicos y sociales.'
    }
  ],
  contact: [
    {
      key: 'contact-hero',
      title: 'Hablemos',
      content:
        '¿Quieres sumarte a ACA, organizar un evento o colaborar con nosotros? Escríbenos y conversemos. Nuestro equipo responde a la brevedad.'
    },
    {
      key: 'contact-info',
      title: 'Información de contacto',
      content:
        'Dirección: Sporting Club, Viña del Mar\nEmail: info@acachile.cl\nTeléfono: +56 9 1234 5678\nInstagram: @acachile'
    }
  ]
};

const MIN_QUERY_LENGTH = 2;

const DEFAULT_MEMBER_FALLBACK = [
  {
    id: 1,
    nombre: 'Juan',
    apellido: 'Cartagena',
    email: 'juan@juancartagena.cl',
    telefono: '+56 9 1234 5678',
    ciudad: 'Santiago',
    region: 'Región Metropolitana',
    direccion: null,
    rut: null,
    foto_url: 'https://pub-85ac8c62baca4966b2ac0b16e1b9b6c6.r2.dev/socios/demo-juan-cartagena.jpg',
    show_email: 1,
    show_phone: 1,
    show_rut: 0,
    show_address: 0,
    show_birthdate: 0,
    show_public_profile: 1
  }
];

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
          show_public_profile INTEGER DEFAULT 1,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `
    )
    .run();

  try {
    await db.prepare(`ALTER TABLE user_privacy_settings ADD COLUMN show_public_profile INTEGER DEFAULT 1`).run();
  } catch (error) {
    // ignore if exists
  }
};

const mapPrivacyFlags = (row) => ({
  showEmail: row?.show_email === 1,
  showPhone: row?.show_phone === 1,
  showRut: row?.show_rut === 1,
  showAddress: row?.show_address === 1,
  showBirthdate: row?.show_birthdate === 1,
  showPublicProfile:
    row?.show_public_profile === null || row?.show_public_profile === undefined
      ? true
      : row.show_public_profile === 1
});

function truncateText(text = '', maxLength = 180) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trimEnd()}…`;
}

function normalizeScore(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function calculateRelevance(item, searchTerm) {
  let score = 0;
  const term = searchTerm.toLowerCase();

  if (item.title?.toLowerCase().includes(term)) {
    score += 12;
    if (item.title.toLowerCase().startsWith(term)) {
      score += 6;
    }
  }

  if (item.description?.toLowerCase().includes(term) || item.excerpt?.toLowerCase().includes(term)) {
    score += 6;
  }

  if (item.tags?.some((tag) => tag.toLowerCase().includes(term))) {
    score += 4;
  }

  if (item.type?.toLowerCase().includes(term) || item.category?.toLowerCase().includes(term)) {
    score += 3;
  }

  if (item.location?.toLowerCase().includes(term)) {
    score += 3;
  }

  if (item.content?.toLowerCase().includes(term)) {
    score += 2;
  }

  if (typeof item.metadata === 'object' && item.metadata !== null) {
    const metaValues = Object.values(item.metadata)
      .filter((value) => typeof value === 'string')
      .map((value) => value.toLowerCase());

    if (metaValues.some((value) => value.includes(term))) {
      score += 2;
    }
  }

  return score;
}

function combineResults(groups, limit) {
  return groups
    .flat()
    .sort((a, b) => normalizeScore(b.relevance) - normalizeScore(a.relevance))
    .slice(0, limit);
}

async function fetchSectionsFromSource(env, pageKey) {
  let sections = [];

  if (env.ACA_KV) {
    try {
      const cached = await env.ACA_KV.get(`${SECTION_KV_PREFIX}${pageKey}`);
      if (cached) {
        sections = JSON.parse(cached);
      }
    } catch (error) {
      console.error('[SEARCH] Error leyendo secciones desde KV:', error);
    }
  }

  if ((!sections || sections.length === 0) && env.DB) {
    try {
      const dbResult = await env.DB.prepare(
        `
          SELECT key, title, content
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
      // Tabla podría no existir todavía; ignorar silenciosamente
    }
  }

  if (!sections || sections.length === 0) {
    sections = DEFAULT_SECTION_FALLBACK[pageKey] || [];
  }

  return sections;
}

async function searchSections(env, searchTerm, limit) {
  try {
    const matches = [];

    for (const page of SECTION_PAGES) {
      const sections = await fetchSectionsFromSource(env, page.key);

      sections
        .filter((section) => {
          const title = section.title?.toLowerCase() || '';
          const content = section.content?.toLowerCase() || '';
          return title.includes(searchTerm) || content.includes(searchTerm);
        })
        .forEach((section) => {
          matches.push({
            type: 'section',
            id: `${page.key}-${section.key}`,
            title: section.title || page.label,
            description: truncateText(section.content, 200),
            url: `${page.route}${section.key ? `#${section.key}` : ''}`,
            metadata: {
              page: page.key,
              pageLabel: page.label
            },
            relevance: calculateRelevance(
              {
                title: section.title,
                description: section.content,
                content: section.content,
                type: 'section',
                metadata: { page: page.label }
              },
              searchTerm
            )
          });
        });
    }

    return matches.slice(0, limit);
  } catch (error) {
    console.error('[SEARCH] Error buscando secciones:', error);
    return [];
  }
}

async function searchEventos(env, searchTerm, limit) {
  try {
    const eventosData = await env.ACA_KV.get('eventos:all');
    if (!eventosData) return [];

    const eventos = JSON.parse(eventosData) || [];
    const filtered = eventos
      .filter((evento) => {
        const title = evento.title?.toLowerCase() || '';
        const description = evento.description?.toLowerCase() || '';
        const location = evento.location?.toLowerCase() || '';
        const type = evento.type?.toLowerCase() || '';
        const tags = Array.isArray(evento.tags) ? evento.tags.map((tag) => tag.toLowerCase()) : [];

        return (
          title.includes(searchTerm) ||
          description.includes(searchTerm) ||
          location.includes(searchTerm) ||
          type.includes(searchTerm) ||
          tags.some((tag) => tag.includes(searchTerm))
        );
      })
      .slice(0, limit);

    return filtered.map((evento) => ({
      type: 'evento',
      id: evento.id,
      title: evento.title,
      description: truncateText(evento.description, 200),
      date: evento.date,
      location: evento.location,
      url: `/eventos/${evento.id}`,
      image: evento.image,
      metadata: {
        location: evento.location,
        tags: evento.tags || []
      },
      relevance: calculateRelevance(
        {
          title: evento.title,
          description: evento.description,
          location: evento.location,
          tags: evento.tags,
          type: evento.type,
          content: [evento.description, evento.location, (evento.tags || []).join(' ')].join(' ')
        },
        searchTerm
      )
    }));
  } catch (error) {
    console.error('[SEARCH] Error buscando eventos:', error);
    return [];
  }
}

async function searchNoticias(env, searchTerm, limit) {
  try {
    const noticiasData = await env.ACA_KV.get('noticias:all');
    if (!noticiasData) return [];

    const noticias = JSON.parse(noticiasData) || [];
    const filtered = noticias
      .filter((noticia) => {
        const title = noticia.title?.toLowerCase() || '';
        const excerpt = noticia.excerpt?.toLowerCase() || '';
        const content = noticia.content?.toLowerCase() || '';
        const category = noticia.category?.toLowerCase() || '';
        const tags = Array.isArray(noticia.tags) ? noticia.tags.map((tag) => tag.toLowerCase()) : [];

        return (
          title.includes(searchTerm) ||
          excerpt.includes(searchTerm) ||
          content.includes(searchTerm) ||
          category.includes(searchTerm) ||
          tags.some((tag) => tag.includes(searchTerm))
        );
      })
      .slice(0, limit);

    return filtered.map((noticia) => ({
      type: 'noticia',
      id: noticia.id,
      title: noticia.title,
      description: truncateText(noticia.excerpt || noticia.content, 220),
      date: noticia.publishedAt,
      category: noticia.category,
      url: `/noticias/${noticia.slug}`,
      image: noticia.image,
      metadata: {
        category: noticia.category,
        tags: noticia.tags || []
      },
      relevance: calculateRelevance(
        {
          title: noticia.title,
          description: noticia.excerpt,
          content: noticia.content,
          category: noticia.category,
          tags: noticia.tags,
          type: 'noticia'
        },
        searchTerm
      )
    }));
  } catch (error) {
    console.error('[SEARCH] Error buscando noticias:', error);
    return [];
  }
}

async function searchUsuarios(env, searchTerm, limit) {
  if (!env.DB) return [];

  try {
    await ensurePrivacyTable(env.DB);

    const likeParam = `%${searchTerm}%`;
    const usuariosResult = await env.DB.prepare(
      `
        SELECT 
          u.id,
          u.nombre,
          u.apellido,
          u.email,
          u.telefono,
          u.ciudad,
          u.region,
          u.direccion,
          u.rut,
          u.foto_url,
          privacy.show_email,
          privacy.show_phone,
          privacy.show_rut,
          privacy.show_address,
          privacy.show_birthdate,
          privacy.show_public_profile
        FROM usuarios u
        LEFT JOIN user_privacy_settings privacy ON privacy.user_id = u.id
        WHERE u.activo = 1
          AND (
            LOWER(u.nombre) LIKE ?
            OR LOWER(u.apellido) LIKE ?
            OR LOWER(u.email) LIKE ?
            OR LOWER(u.ciudad) LIKE ?
            OR LOWER(u.region) LIKE ?
            OR LOWER(u.nombre || ' ' || IFNULL(u.apellido, '')) LIKE ?
            OR LOWER(u.apellido || ' ' || IFNULL(u.nombre, '')) LIKE ?
            OR LOWER(REPLACE(u.nombre || u.apellido, ' ', '')) LIKE REPLACE(?, ' ', '')
          )
        ORDER BY u.nombre ASC
        LIMIT ?
      `
    )
      .bind(likeParam, likeParam, likeParam, likeParam, likeParam, likeParam, likeParam, likeParam, limit)
      .all();

    let rows = usuariosResult?.results || [];

    if (rows.length === 0) {
      rows = DEFAULT_MEMBER_FALLBACK.filter((fallback) => {
        const fullName = `${fallback.nombre} ${fallback.apellido}`.toLowerCase();
        return (
          fullName.includes(searchTerm) ||
          (fallback.email && fallback.email.toLowerCase().includes(searchTerm)) ||
          (fallback.ciudad && fallback.ciudad.toLowerCase().includes(searchTerm)) ||
          (fallback.region && fallback.region.toLowerCase().includes(searchTerm))
        );
      }).slice(0, limit);
    }

    return rows
      .map((row) => {
        const fullName = [row.nombre, row.apellido].filter(Boolean).join(' ').trim() || row.email;
        const city = row.ciudad || '';
        const region = row.region || '';
        const address = row.direccion || '';
        const rut = row.rut || '';

        const privacy = mapPrivacyFlags(row);

        if (!privacy.showPublicProfile) {
          return null;
        }

        const searchablePieces = [fullName];
        const metadata = {};

      if (privacy.showEmail && row.email) {
        searchablePieces.push(row.email);
        metadata.email = row.email;
      }

      if (privacy.showPhone && row.telefono) {
        searchablePieces.push(row.telefono);
        metadata.phone = row.telefono;
      }

      if (privacy.showRut && rut) {
        searchablePieces.push(rut);
        metadata.rut = rut;
      }

      if (privacy.showAddress) {
        if (city) {
          searchablePieces.push(city);
          metadata.city = city;
        }
        if (region) {
          searchablePieces.push(region);
          metadata.region = region;
        }
        if (address) {
          searchablePieces.push(address);
          metadata.address = address;
        }
      }

        const description =
          privacy.showAddress && (city || region)
            ? `Reside en ${city}${region ? `, ${region}` : ''}`
            : 'Socio activo de ACA Chile.';

        const contentBlob = searchablePieces.filter(Boolean).join(' ');

        const metadataPayload = Object.keys(metadata).length > 0 ? metadata : undefined;

        return {
          type: 'usuario',
          id: row.id,
          title: fullName,
          description,
          url: `/socios/${row.id}`,
          avatar: row.foto_url || undefined,
          metadata: metadataPayload,
          privacy,
          relevance: calculateRelevance(
            {
              title: fullName,
              description,
              content: contentBlob,
              metadata: metadataPayload
            },
            searchTerm
          )
        };
      })
      .filter(Boolean);
  } catch (error) {
    console.error('[SEARCH] Error buscando usuarios:', error);
    return [];
  }
}

export async function onRequestGet(context) {
  const { request, env } = context;

  try {
    const url = new URL(request.url);
    const query = url.searchParams.get('q');
    const type = (url.searchParams.get('type') || 'all').toLowerCase();
    const limit = Math.max(parseInt(url.searchParams.get('limit')) || 10, 1);

    console.log(`[SEARCH] Query: "${query}", Type: ${type}, Limit: ${limit}`);

    if (!query || query.trim().length < MIN_QUERY_LENGTH) {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Query de búsqueda debe tener al menos ${MIN_QUERY_LENGTH} caracteres`
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const searchTerm = query.toLowerCase().trim();

    const results = {
      query,
      total: 0,
      eventos: [],
      noticias: [],
      usuarios: [],
      secciones: []
    };

    const perTypeLimit = Math.max(limit, 10);

    if (type === 'eventos' || type === 'all') {
      results.eventos = await searchEventos(env, searchTerm, perTypeLimit);
    }

    if (type === 'noticias' || type === 'all') {
      results.noticias = await searchNoticias(env, searchTerm, perTypeLimit);
    }

    if (type === 'usuarios' || type === 'all') {
      results.usuarios = await searchUsuarios(env, searchTerm, perTypeLimit);
    }

    if (type === 'secciones' || type === 'all') {
      results.secciones = await searchSections(env, searchTerm, perTypeLimit);
    }

    const combinedResults = combineResults(
      [
        ...(results.eventos.length ? [results.eventos] : []),
        ...(results.noticias.length ? [results.noticias] : []),
        ...(results.usuarios.length ? [results.usuarios] : []),
        ...(results.secciones.length ? [results.secciones] : [])
      ],
      limit
    );

    results.total =
      results.eventos.length +
      results.noticias.length +
      results.usuarios.length +
      results.secciones.length;

    console.log(`[SEARCH] Encontrados: ${results.total} resultados (combined: ${combinedResults.length})`);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          ...results,
          combined: combinedResults
        }
      }),
      {
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('[SEARCH] Error general:', error);
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
