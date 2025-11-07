import React, { useEffect, useMemo, useState } from 'react';
import type { Evento } from '@shared/index';
import type { SiteSection, SiteSectionSourceType } from '@shared/siteSections';
import type { NewsArticle } from '../services/newsService';

type SectionDisplay = SiteSection & {
  display_title: string;
  display_content: string;
  display_image?: string;
  display_cta_label?: string;
  display_cta_url?: string;
};

// NO usar defaults - trabajar solo con datos reales de BD
const normalizeSections = (incoming: Partial<SiteSection>[] | undefined): SiteSection[] => {
  // Si no hay datos, retornar array vacío
  if (!incoming || incoming.length === 0) {
    return [];
  }

  const normalized: SiteSection[] = [];

  incoming.forEach((raw, index) => {
    const tentativeKey =
      typeof raw?.key === 'string' && raw.key.trim().length > 0
        ? raw.key.trim()
        : `section_${index}`;

    const sortOrder =
      typeof raw?.sort_order === 'number'
        ? raw.sort_order
        : index;

    normalized.push({
      page: 'home',
      key: tentativeKey,
      title: typeof raw?.title === 'string' ? raw.title : '',
      content: typeof raw?.content === 'string' ? raw.content : '',
      image_url: typeof raw?.image_url === 'string' ? raw.image_url : '',
      sort_order: sortOrder,
      source_type: (raw?.source_type as SiteSectionSourceType) ?? 'custom',
      source_id: raw?.source_id != null ? String(raw.source_id) : undefined,
      cta_label: raw?.cta_label != null ? String(raw.cta_label) : undefined,
      cta_url: raw?.cta_url != null ? String(raw.cta_url) : undefined
    });
  });

  return normalized.sort((a, b) => a.sort_order - b.sort_order);
};

const parseContentBlocks = (content: string) => {
  const lines = content.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const blocks: Array<{ type: 'paragraph'; text: string } | { type: 'list'; items: string[] }> = [];
  let currentList: string[] | null = null;

  lines.forEach((line) => {
    if (line.startsWith('- ')) {
      if (!currentList) {
        currentList = [];
        blocks.push({ type: 'list', items: currentList });
      }
      currentList.push(line.slice(2));
    } else {
      currentList = null;
      blocks.push({ type: 'paragraph', text: line });
    }
  });

  return blocks;
};

const SectionBlock: React.FC<{ section: SectionDisplay; reverse?: boolean }> = ({ section, reverse }) => {
  const blocks = useMemo(() => parseContentBlocks(section.display_content || ''), [section.display_content]);

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-soft-gradient-light relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className={`flex flex-col lg:gap-16 ${reverse ? 'lg:flex-row-reverse' : 'lg:flex-row'}`}>
          {/* Título - siempre primero en mobile */}
          <div className="order-1 lg:w-1/2 mb-6 lg:mb-0">
            <h2 className="text-2xl sm:text-4xl font-bold text-neutral-900 leading-tight">
              {section.display_title}
            </h2>
          </div>
          
          {/* Imagen - segundo en mobile, respeta reverse en desktop */}
          {section.display_image ? (
            <div className={`order-2 lg:w-1/2 mb-8 lg:mb-0 ${reverse ? 'lg:order-1' : 'lg:order-3'}`}>
              <div className="relative bg-white/40 backdrop-blur-md rounded-2xl sm:rounded-3xl border border-white/60 shadow-soft-lg overflow-hidden">
                <img
                  src={section.display_image}
                  alt={section.display_title}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out hover:scale-105"
                />
              </div>
            </div>
          ) : null}
          
          {/* Texto y CTA - tercero en mobile */}
          <div className={`order-3 lg:w-1/2 flex flex-col justify-center space-y-5 sm:space-y-6 ${reverse ? 'lg:order-3' : 'lg:order-2'}`}>
            <div className="space-y-3 sm:space-y-4 text-neutral-600 text-base sm:text-lg leading-relaxed">
              {blocks.length === 0 ? (
                <p>{section.display_content}</p>
              ) : (
                blocks.map((block, blockIndex) => {
                  if (block.type === 'paragraph') {
                    return <p key={blockIndex}>{block.text}</p>;
                  }
                  return (
                    <ul key={blockIndex} className="list-disc pl-5 space-y-1">
                      {block.items.map((item, itemIndex) => (
                        <li key={itemIndex}>{item}</li>
                      ))}
                    </ul>
                  );
                })
              )}
            </div>
            {section.display_cta_label && section.display_cta_url ? (
              <div>
                <a
                  href={section.display_cta_url}
                  className="inline-flex items-center px-5 py-3 sm:px-6 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl transition-all duration-300"
                >
                  {section.display_cta_label}
                </a>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
};

const HeroSection: React.FC<{ section: SectionDisplay; loading: boolean }> = ({ section, loading }) => {
  const blocks = useMemo(() => parseContentBlocks(section.display_content || ''), [section.display_content]);

  return (
    <section className="relative overflow-hidden py-14 sm:py-20 bg-soft-gradient-light">
      <div className="relative px-4 py-14 sm:py-16 mx-auto max-w-7xl sm:px-6 lg:px-8 lg:py-24">
        <div className="flex flex-col lg:grid lg:grid-cols-12 lg:gap-16 lg:items-center">
          {/* Badge y Título - orden 1 en mobile */}
          <div className="order-1 lg:col-span-6 mb-6 lg:mb-0">
            <span className="inline-block px-6 py-2 bg-soft-gradient-primary rounded-full shadow-soft-sm border border-white/40 text-primary-700 font-semibold text-sm uppercase tracking-wide">
              {loading ? 'Cargando…' : 'Inicio ACA Chile'}
            </span>
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold leading-tight text-neutral-900 mt-8">
              {section.display_title}
            </h1>
          </div>
          
          {/* Imagen - orden 2 en mobile */}
          {section.display_image ? (
            <div className="order-2 lg:order-3 lg:col-span-6 mb-8 lg:mb-0">
              <div className="relative bg-white/20 backdrop-blur-md rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-soft-xl border border-white/40">
                <div className="overflow-hidden rounded-xl sm:rounded-2xl">
                  <img
                    src={section.display_image}
                    alt={section.display_title}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out hover:scale-105"
                  />
                </div>
              </div>
            </div>
          ) : null}
          
          {/* Texto y CTA - orden 3 en mobile */}
          <div className="order-3 lg:order-2 lg:col-span-6 space-y-8">
            <div className="text-base sm:text-xl text-neutral-600 font-light leading-relaxed space-y-3 sm:space-y-4 max-w-xl">
              {blocks.length === 0 ? (
                <p>{section.display_content}</p>
              ) : (
                blocks.map((block, index) =>
                  block.type === 'paragraph' ? (
                    <p key={index}>{block.text}</p>
                  ) : (
                    <ul key={index} className="list-disc pl-5 space-y-1">
                      {block.items.map((item, itemIndex) => (
                        <li key={itemIndex}>{item}</li>
                      ))}
                    </ul>
                  )
                )
              )}
            </div>
            {section.display_cta_label && section.display_cta_url ? (
              <div>
                <a
                  href={section.display_cta_url}
                  className="inline-flex items-center px-7 py-3 sm:px-8 sm:py-4 rounded-xl sm:rounded-2xl text-white font-semibold text-lg transition-all duration-500"
                  style={{
                    background: 'linear-gradient(135deg, #f56934 0%, #e04c1a 50%, #b93c14 100%)'
                  }}
                >
                  {section.display_cta_label}
                </a>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
};

const HomePage: React.FC = () => {
  const [sections, setSections] = useState<SiteSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventLookup, setEventLookup] = useState<Record<string, Evento>>({});
  const [newsLookup, setNewsLookup] = useState<Record<string, NewsArticle>>({});
  const [eventsLoaded, setEventsLoaded] = useState(false);
  const [newsLoaded, setNewsLoaded] = useState(false);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const res = await fetch('/api/content?page=home', { cache: 'no-store' });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const json = await res.json();
        if (active && json?.success) {
          setSections(normalizeSections(json.sections));
        }
      } catch (error) {
        console.warn('[HomePage] No se pudo obtener contenido dinámico.', error);
        if (active) {
          setSections([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const eventIds = new Set(
      sections
        .filter((section) => section.source_type === 'event' && section.source_id)
        .map((section) => String(section.source_id))
    );

    if (eventIds.size === 0 || eventsLoaded) {
      return;
    }

    (async () => {
      try {
        const res = await fetch('/api/eventos?status=published&limit=200', { cache: 'no-store' });
        const json = await res.json();
        if (json?.success && Array.isArray(json.data)) {
          const map: Record<string, Evento> = {};
          (json.data as Evento[]).forEach((event) => {
            map[String(event.id)] = event;
          });
          setEventLookup(map);
        }
      } finally {
        setEventsLoaded(true);
      }
    })();
  }, [sections, eventsLoaded]);

  useEffect(() => {
    const newsSlugs = new Set(
      sections
        .filter((section) => section.source_type === 'news' && section.source_id)
        .map((section) => String(section.source_id))
    );

    if (newsSlugs.size === 0 || newsLoaded) {
      return;
    }

    (async () => {
      try {
        const res = await fetch('/api/noticias?limit=200', { cache: 'no-store' });
        const json = await res.json();
        if (json?.success && Array.isArray(json.data)) {
          const map: Record<string, NewsArticle> = {};
          (json.data as NewsArticle[]).forEach((article) => {
            map[article.slug] = article;
          });
          setNewsLookup(map);
        }
      } finally {
        setNewsLoaded(true);
      }
    })();
  }, [sections, newsLoaded]);

  const resolvedSections = useMemo<SectionDisplay[]>(() => {
    return sections.map((section) => {
      let title = section.title || '';
      let content = section.content || '';
      let image = section.image_url || '';
      let ctaLabel = section.cta_label;
      let ctaUrl = section.cta_url;

      if (section.source_type === 'event' && section.source_id) {
        const event = eventLookup[String(section.source_id)];
        if (event) {
          title = section.title || event.title || title;
          if (!section.content && event.description) {
            const parts = [event.description];
            if (event.date) {
              const formattedDate = new Date(event.date).toLocaleDateString('es-CL', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              });
              parts.push(`Fecha: ${formattedDate}`);
            }
            if (event.location) parts.push(`Lugar: ${event.location}`);
            if (event.registrationOpen) parts.push('Inscripciones abiertas');
            content = parts.filter(Boolean).join('\n\n');
          }
          image = section.image_url || event.image || image;
          ctaLabel = section.cta_label || 'Ver evento';
          ctaUrl = section.cta_url || `/eventos/${event.id}`;
        }
      }

      if (section.source_type === 'news' && section.source_id) {
        const article = newsLookup[String(section.source_id)];
        if (article) {
          title = section.title || article.title || title;
          if (!section.content) {
            content = article.excerpt || article.content || content;
          }
          image = section.image_url || article.featured_image || image;
          ctaLabel = section.cta_label || 'Leer noticia';
          ctaUrl = section.cta_url || `/noticias/${article.slug}`;
        }
      }

      return {
        ...section,
        display_title: title,
        display_content: content,
        display_image: image,
        display_cta_label: ctaLabel,
        display_cta_url: ctaUrl
      };
    });
  }, [sections, eventLookup, newsLookup]);

  const defaultHero = {
    page: 'home' as const,
    key: 'hero',
    title: '',
    content: '',
    image_url: '',
    sort_order: 0,
    source_type: 'custom' as const,
    cta_label: undefined,
    cta_url: undefined
  };
  
  const heroSection: SectionDisplay = resolvedSections[0] ?? {
    ...defaultHero,
    display_title: defaultHero.title,
    display_content: defaultHero.content,
    display_image: defaultHero.image_url,
    display_cta_label: defaultHero.cta_label,
    display_cta_url: defaultHero.cta_url
  };
  const otherSections = resolvedSections.slice(1);

  return (
    <div className="min-h-screen bg-soft-gradient-light">
      <HeroSection section={heroSection} loading={loading} />
      {otherSections.map((section, index) => (
        <SectionBlock key={section.key ?? index} section={section} reverse={index % 2 === 0} />
      ))}
    </div>
  );
};

export { HomePage };
export default HomePage;
