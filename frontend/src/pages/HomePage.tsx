import React, { useEffect, useMemo, useState } from 'react';
import type { Evento } from '@shared/index';
import type { SiteSection, SiteSectionSourceType } from '@shared/siteSections';
import type { NewsArticle } from '../services/newsService';

type SectionDisplay = SiteSection & {
  display_title: string;
  display_content: string;
  display_image?: string;
  display_image_2?: string;
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
      image_url_2: typeof raw?.image_url_2 === 'string' ? raw.image_url_2 : undefined,
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

const isHTML = (content: string): boolean => {
  // Detectar si el contenido contiene etiquetas HTML
  return /<\/?[a-z][\s\S]*>/i.test(content);
};

const SectionBlock: React.FC<{ section: SectionDisplay; reverse?: boolean }> = ({ section, reverse }) => {
  const blocks = useMemo(() => parseContentBlocks(section.display_content || ''), [section.display_content]);
  const hasHTML = useMemo(() => isHTML(section.display_content || ''), [section.display_content]);

  return (
    <section className="py-16 sm:py-20 lg:py-28 bg-soft-gradient-light relative overflow-hidden">
      {/* Elementos decorativos de fondo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute ${reverse ? 'left-0' : 'right-0'} top-1/4 w-96 h-96 bg-primary-100/30 rounded-full blur-3xl`}></div>
        <div className={`absolute ${reverse ? 'right-0' : 'left-0'} bottom-1/4 w-80 h-80 bg-pastel-blue/40 rounded-full blur-3xl`}></div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Mobile: orden natural - Título, Imagen, Texto */}
        {/* Desktop: usar grid de 2 columnas como hero */}
        <div className={`flex flex-col lg:grid lg:grid-cols-2 gap-10 lg:gap-20 lg:items-center ${reverse ? 'lg:flex-row-reverse' : ''}`}>
          {/* Título - siempre primero en mobile */}
          <div className="lg:hidden mb-6">
            <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 leading-tight tracking-tight">
              {section.display_title}
            </h2>
            <div className="mt-3 h-1 w-20 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full"></div>
          </div>

          {/* Columna izquierda en desktop: Título y Texto */}
          <div className={`space-y-6 sm:space-y-8 order-3 lg:order-none ${reverse ? 'lg:col-start-2' : 'lg:col-start-1'}`}>
            {/* Título - solo visible en desktop */}
            <div className="hidden lg:block">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-neutral-900 leading-tight tracking-tight mb-4">
                {section.display_title}
              </h2>
              <div className="h-1.5 w-24 bg-gradient-to-r from-primary-500 to-primary-600 rounded-full"></div>
            </div>
            
            {/* Texto y CTA */}
            <div className="mt-8">
              {hasHTML ? (
                <div 
                  className="prose prose-lg max-w-none text-neutral-700 
                    prose-headings:text-neutral-900 prose-headings:font-bold prose-headings:tracking-tight
                    prose-p:text-neutral-700 prose-p:leading-relaxed 
                    prose-a:text-primary-600 prose-a:no-underline prose-a:font-semibold hover:prose-a:text-primary-700 hover:prose-a:underline
                    prose-strong:text-neutral-900 prose-strong:font-bold
                    prose-ul:text-neutral-700 prose-ul:space-y-2
                    prose-ol:text-neutral-700 prose-ol:space-y-2
                    prose-li:marker:text-primary-500"
                  dangerouslySetInnerHTML={{ __html: section.display_content }}
                />
              ) : (
                <div className="space-y-4 sm:space-y-5 text-neutral-700 text-base sm:text-lg leading-relaxed">
                  {blocks.length === 0 ? (
                    <p className="text-lg">{section.display_content}</p>
                  ) : (
                    blocks.map((block, blockIndex) => {
                      if (block.type === 'paragraph') {
                        return <p key={blockIndex} className="text-lg leading-relaxed">{block.text}</p>;
                      }
                      return (
                        <ul key={blockIndex} className="space-y-3 pl-6">
                          {block.items.map((item, itemIndex) => (
                            <li key={itemIndex} className="relative pl-2 before:content-[''] before:absolute before:left-[-1.25rem] before:top-[0.6rem] before:w-2 before:h-2 before:bg-primary-500 before:rounded-full">
                              {item}
                            </li>
                          ))}
                        </ul>
                      );
                    })
                  )}
                </div>
              )}
              {section.display_cta_label && section.display_cta_url ? (
                <div className="mt-8">
                  <a
                    href={section.display_cta_url}
                    className="group inline-flex items-center gap-3 px-7 py-4 sm:px-8 sm:py-4 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-bold rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-soft-colored-red shadow-soft-lg"
                  >
                    <span>{section.display_cta_label}</span>
                    <svg 
                      className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </a>
                </div>
              ) : null}
            </div>
          </div>
          
          {/* Columna derecha en desktop: Imagen - segundo en mobile (después del título) */}
          {section.display_image ? (
            <div className={`order-2 lg:order-none mb-8 lg:mb-0 ${reverse ? 'lg:col-start-1 lg:row-start-1' : 'lg:col-start-2'}`}>
              <div className="relative group">
                {/* Fondo decorativo */}
                <div className="absolute -inset-4 bg-gradient-to-r from-primary-200/50 to-primary-300/50 rounded-3xl blur-2xl group-hover:blur-3xl transition-all duration-500 opacity-40 group-hover:opacity-60"></div>
                
                {/* Contenedor de imagen */}
                <div className="relative bg-white/60 backdrop-blur-md rounded-2xl sm:rounded-3xl p-3 sm:p-4 border border-white/80 shadow-soft-xl overflow-hidden">
                  <div className="overflow-hidden rounded-xl sm:rounded-2xl">
                    <img
                      src={section.display_image}
                      alt={section.display_title}
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110 group-hover:rotate-1"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
};

const HeroSection: React.FC<{ section: SectionDisplay; loading: boolean }> = ({ section }) => {
  const blocks = useMemo(() => parseContentBlocks(section.display_content || ''), [section.display_content]);
  const hasHTML = useMemo(() => isHTML(section.display_content || ''), [section.display_content]);

  return (
    <section className="relative overflow-hidden py-12 sm:py-20 lg:py-28 bg-soft-gradient-light">
      {/* Elementos decorativos animados de fondo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute right-0 top-0 w-[600px] h-[600px] bg-gradient-to-br from-primary-100/40 to-primary-200/30 rounded-full blur-3xl animate-float"></div>
        <div className="absolute left-0 bottom-0 w-[500px] h-[500px] bg-gradient-to-tr from-pastel-blue/50 to-pastel-purple/40 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute right-1/4 bottom-1/4 w-[400px] h-[400px] bg-gradient-to-tl from-pastel-orange/30 to-pastel-yellow/30 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative px-4 py-8 sm:py-12 mx-auto max-w-7xl sm:px-6 lg:px-8 z-10">
        {/* Layout vertical: Título → Imagen → Texto */}
        <div className="flex flex-col space-y-10 sm:space-y-12 lg:space-y-16">
          
          {/* 1. TÍTULO - Ocupa todo el ancho */}
          <div className="text-center animate-slide-up">
            <div className="inline-block px-4 py-2 bg-primary-50 rounded-full mb-6">
              <span className="text-sm font-semibold text-primary-700 tracking-wide uppercase">Bienvenido</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight text-neutral-900 tracking-tight mb-6">
              {section.display_title}
            </h1>
            <div className="mx-auto h-2 w-28 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700 rounded-full"></div>
          </div>

          {/* 2. IMAGEN(ES) - Ocupa todo el ancho */}
          {(section.display_image || section.display_image_2) && (
            <div className="w-full animate-slide-up" style={{ animationDelay: '0.2s' }}>
              {section.display_image_2 ? (
                /* Si hay 2 imágenes, mostrarlas en grid */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                  {section.display_image && (
                    <div className="relative group">
                      {/* Efecto de brillo de fondo */}
                      <div className="absolute -inset-6 bg-gradient-to-r from-primary-200/50 via-primary-300/50 to-primary-400/50 rounded-3xl blur-3xl group-hover:blur-3xl transition-all duration-700 opacity-40 group-hover:opacity-70"></div>
                      
                      {/* Contenedor de imagen */}
                      <div className="relative bg-white/70 backdrop-blur-md rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-soft-2xl border border-white/90 overflow-hidden">
                        <div className="overflow-hidden rounded-xl sm:rounded-2xl">
                          <img
                            src={section.display_image}
                            alt={section.display_title}
                            className="w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-110 group-hover:rotate-1"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="relative group">
                    {/* Efecto de brillo de fondo */}
                    <div className="absolute -inset-6 bg-gradient-to-l from-pastel-purple/50 via-pastel-blue/50 to-primary-200/50 rounded-3xl blur-3xl group-hover:blur-3xl transition-all duration-700 opacity-40 group-hover:opacity-70"></div>
                    
                    {/* Contenedor de imagen */}
                    <div className="relative bg-white/70 backdrop-blur-md rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-soft-2xl border border-white/90 overflow-hidden">
                      <div className="overflow-hidden rounded-xl sm:rounded-2xl">
                        <img
                          src={section.display_image_2}
                          alt={`${section.display_title} - Imagen 2`}
                          className="w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-110 group-hover:-rotate-1"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Si solo hay 1 imagen, mostrarla centrada con max-width */
                section.display_image && (
                  <div className="max-w-5xl mx-auto">
                    <div className="relative group">
                      {/* Efecto de brillo de fondo */}
                      <div className="absolute -inset-6 bg-gradient-to-r from-primary-200/50 via-primary-300/50 to-primary-400/50 rounded-3xl blur-3xl group-hover:blur-3xl transition-all duration-700 opacity-40 group-hover:opacity-70"></div>
                      
                      {/* Contenedor de imagen */}
                      <div className="relative bg-white/70 backdrop-blur-md rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-soft-2xl border border-white/90 overflow-hidden">
                        <div className="overflow-hidden rounded-xl sm:rounded-2xl">
                          <img
                            src={section.display_image}
                            alt={section.display_title}
                            className="w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-110"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          )}

          {/* 3. TEXTO Y CTA - Ocupa todo el ancho */}
          <div className="max-w-5xl mx-auto w-full animate-slide-up" style={{ animationDelay: '0.4s' }}>
            {hasHTML ? (
              <div 
                className="prose prose-xl max-w-none text-neutral-700
                  prose-headings:text-neutral-900 prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-center
                  prose-p:text-neutral-700 prose-p:text-xl prose-p:leading-relaxed prose-p:text-center
                  prose-a:text-primary-600 prose-a:no-underline prose-a:font-semibold hover:prose-a:text-primary-700 hover:prose-a:underline
                  prose-strong:text-neutral-900 prose-strong:font-bold
                  prose-ul:text-neutral-700 prose-ul:space-y-3 prose-ul:max-w-3xl prose-ul:mx-auto
                  prose-ol:text-neutral-700 prose-ol:space-y-3 prose-ol:max-w-3xl prose-ol:mx-auto
                  prose-li:marker:text-primary-500"
                dangerouslySetInnerHTML={{ __html: section.display_content }}
              />
            ) : (
              <div className="text-lg sm:text-xl text-neutral-700 leading-relaxed space-y-4 sm:space-y-5 text-center">
                {blocks.length === 0 ? (
                  <p className="text-xl">{section.display_content}</p>
                ) : (
                  blocks.map((block, index) =>
                    block.type === 'paragraph' ? (
                      <p key={index} className="text-xl leading-relaxed">{block.text}</p>
                    ) : (
                      <ul key={index} className="space-y-3 max-w-3xl mx-auto text-left">
                        {block.items.map((item, itemIndex) => (
                          <li key={itemIndex} className="relative pl-8 before:content-[''] before:absolute before:left-0 before:top-[0.7rem] before:w-2.5 before:h-2.5 before:bg-primary-500 before:rounded-full">
                            {item}
                          </li>
                        ))}
                      </ul>
                    )
                  )
                )}
              </div>
            )}
            
            {section.display_cta_label && section.display_cta_url && (
              <div className="mt-10 sm:mt-12 text-center">
                <a
                  href={section.display_cta_url}
                  className="group relative inline-flex items-center justify-center gap-4 px-10 py-5 sm:px-12 sm:py-6 rounded-2xl sm:rounded-3xl text-white font-bold text-lg sm:text-xl transition-all duration-500 transform hover:scale-105 active:scale-95 shadow-soft-colored-red hover:shadow-2xl overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, #f56934 0%, #e04c1a 50%, #b93c14 100%)'
                  }}
                >
                  {/* Efecto de brillo en hover */}
                  <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></span>
                  
                  <span className="relative z-10">{section.display_cta_label}</span>
                  <svg 
                    className="relative z-10 w-6 h-6 sm:w-7 sm:h-7 transition-transform duration-300 group-hover:translate-x-2" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </a>
              </div>
            )}
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
        display_image_2: section.image_url_2 || undefined,
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
    image_url_2: undefined,
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
    display_image_2: defaultHero.image_url_2,
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
