import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { Evento } from '@shared/index';
import type { SiteSection, SiteSectionSourceType } from '@shared/siteSections';
import type { NewsArticle } from '../services/newsService';
import { SEOHelmet } from '../components/SEOHelmet';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type SectionDisplay = SiteSection & {
  display_title: string;
  display_content: string;
  display_image?: string;
  display_image_2?: string;
  display_cta_label?: string;
  display_cta_url?: string;
};

type HeroNewsItem = {
  id: number;
  title: string;
  summary: string;
  image?: string;
  url: string;
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

const resolvePreferredImage = (manualImage?: string, sourceImage?: string, fallbackImage?: string) => {
  const invalidImages = new Set(['', '/images/default-news.jpg']);
  if (manualImage && !invalidImages.has(manualImage)) return manualImage;
  if (sourceImage && !invalidImages.has(sourceImage)) return sourceImage;
  return fallbackImage || '';
};

const summarizeHeroNews = (content: string, maxLength = 120): string => {
  const plain = content
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/https?:\/\/\S+/gi, ' ')
    .replace(/[`*_#>[\]{}|~]/g, ' ')
    .replace(/&nbsp;|&amp;|&quot;|&#39;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!plain) return '';

  const cleaned = plain
    .split(/(?<=[.!?])\s+/)
    .filter((chunk) => chunk && !/[{}<>]|function\s*\(|=>|\.css|\.js/i.test(chunk))
    .join(' ')
    .trim();

  const safe = cleaned || plain;
  if (safe.length <= maxLength) return safe;

  const sentenceMatch = safe.match(/^[^.!?]+[.!?]/);
  if (sentenceMatch && sentenceMatch[0].length <= maxLength) {
    return sentenceMatch[0].trim();
  }

  const truncated = safe.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  return `${(lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated).trim()}…`;
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

const HeroSection: React.FC<{ section: SectionDisplay; loading: boolean; newsItems: HeroNewsItem[] }> = ({ section, newsItems }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const ctaUrl = section.display_cta_url || '/noticias';
  const hasSlides = newsItems.length > 0;

  useEffect(() => {
    if (!hasSlides || newsItems.length <= 1 || isPaused) return;

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % newsItems.length);
    }, 6000);

    return () => window.clearInterval(timer);
  }, [hasSlides, isPaused, newsItems.length]);

  useEffect(() => {
    if (activeIndex >= newsItems.length) {
      setActiveIndex(0);
    }
  }, [activeIndex, newsItems.length]);

  const goTo = (index: number) => setActiveIndex(index);
  const goNext = () => setActiveIndex((current) => (current + 1) % newsItems.length);
  const goPrev = () => setActiveIndex((current) => (current - 1 + newsItems.length) % newsItems.length);

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    touchStartX.current = event.changedTouches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current == null || newsItems.length <= 1) return;
    const deltaX = event.changedTouches[0]?.clientX - touchStartX.current;
    touchStartX.current = null;

    if (Math.abs(deltaX) < 40) return;
    if (deltaX < 0) goNext();
    else goPrev();
  };

  if (!hasSlides) {
    return (
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-primary-100 py-10 sm:py-12 lg:py-14">
        <div className="absolute inset-0 opacity-60 pointer-events-none">
          <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-primary-200/40 blur-3xl" />
          <div className="absolute -bottom-24 right-0 h-80 w-80 rounded-full bg-orange-200/30 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-[2rem] border border-white/60 bg-white/80 p-8 shadow-[0_25px_60px_-35px_rgba(15,23,42,0.35)] backdrop-blur sm:p-10 lg:p-12">
            <div className="max-w-3xl space-y-5">
              <div className="inline-flex items-center rounded-full border border-primary-200/80 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-primary-700 shadow-sm backdrop-blur">
                Asociación Chilena de Asadores
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-neutral-950 sm:text-5xl lg:text-6xl">
                {section.display_title}
              </h1>
              {section.display_content ? (
                <p className="max-w-2xl text-base leading-8 text-neutral-700 sm:text-lg">
                  {section.display_content}
                </p>
              ) : null}
              <a
                href={ctaUrl}
                className="inline-flex items-center justify-center rounded-2xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-primary-500/25 transition hover:-translate-y-0.5 hover:bg-primary-700"
              >
                Ver noticias
              </a>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-primary-100 py-8 sm:py-10 lg:py-12">
      <div className="absolute inset-0 opacity-60 pointer-events-none">
        <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-primary-200/40 blur-3xl" />
        <div className="absolute -bottom-24 right-0 h-80 w-80 rounded-full bg-orange-200/30 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          className="relative overflow-hidden rounded-[2rem] border border-white/60 bg-neutral-950 shadow-[0_25px_60px_-35px_rgba(15,23,42,0.4)]"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="relative h-[430px] sm:h-[520px] lg:h-[600px]">
            {newsItems.map((item, index) => (
              <article
                key={item.id}
                className={`absolute inset-0 transition-opacity duration-700 ease-out ${index === activeIndex ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
              >
                <div className="absolute inset-0">
                  {item.image ? (
                    <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-primary-700 via-neutral-900 to-orange-700" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/90 via-neutral-950/35 to-transparent" />
                </div>

                <div className="relative z-10 flex h-full items-end p-5 sm:p-7 lg:p-8">
                  <div className="max-w-xl text-white">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70 sm:text-xs">
                      Noticias destacadas
                    </p>
                    <h1 className="max-w-3xl text-2xl font-bold leading-tight tracking-tight text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.35)] sm:text-3xl lg:text-4xl">
                      {item.title}
                    </h1>
                    <p className="mt-3 max-w-lg text-sm leading-6 text-white/85 line-clamp-2 sm:text-[15px] sm:leading-6 lg:max-w-xl">
                      {item.summary}
                    </p>
                    <div className="mt-4">
                      <a
                        href={item.url}
                        className="inline-flex items-center justify-center rounded-xl bg-white/95 px-4 py-2.5 text-sm font-semibold text-neutral-900 transition hover:-translate-y-0.5 hover:bg-white"
                      >
                        Leer más
                      </a>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {newsItems.length > 1 ? (
            <>
              <button
                type="button"
                onClick={goPrev}
                className="absolute left-4 top-1/2 z-20 hidden -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/25 p-2.5 text-white backdrop-blur transition hover:bg-black/40 lg:flex"
                aria-label="Noticia anterior"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={goNext}
                className="absolute right-4 top-1/2 z-20 hidden -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/25 p-2.5 text-white backdrop-blur transition hover:bg-black/40 lg:flex"
                aria-label="Siguiente noticia"
              >
                <ChevronRight className="h-5 w-5" />
              </button>

              <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/25 px-3 py-2 backdrop-blur-sm">
                {newsItems.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => goTo(index)}
                    className={`h-2.5 rounded-full transition-all ${index === activeIndex ? 'w-6 bg-white' : 'w-2.5 bg-white/45 hover:bg-white/70'}`}
                    aria-label={`Ir a noticia ${index + 1}`}
                  />
                ))}
              </div>
            </>
          ) : null}
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
  const [allNews, setAllNews] = useState<NewsArticle[]>([]);
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

    if (newsLoaded) {
      return;
    }

    (async () => {
      try {
        const res = await fetch('/api/noticias?limit=200', { cache: 'no-store' });
        const json = await res.json();
        if (json?.success && Array.isArray(json.data)) {
          setAllNews(json.data as NewsArticle[]);
          const map: Record<string, NewsArticle> = {};
          (json.data as NewsArticle[]).forEach((article) => {
            if (newsSlugs.size === 0 || newsSlugs.has(article.slug)) {
              map[article.slug] = article;
            }
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
          image = resolvePreferredImage(section.image_url, event.image, image);
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
          image = resolvePreferredImage(section.image_url, article.featured_image, image);
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
  const heroCarouselSections = resolvedSections.filter(
    (section) => section.page === 'home' && section.key.startsWith('hero_slide_') && section.is_active !== false
  );
  const otherSections = resolvedSections.slice(1).filter((section) => !section.key.startsWith('hero_slide_'));
  const heroNewsItems = useMemo<HeroNewsItem[]>(() => {
    if (heroCarouselSections.length > 0) {
      return heroCarouselSections
        .sort((a, b) => a.sort_order - b.sort_order)
        .slice(0, 4)
        .map((section, index) => {
          const article = section.source_id ? allNews.find((item) => item.slug === section.source_id) : undefined;
          const title = section.title || article?.title || `Slide ${index + 1}`;
          const summarySource = section.content || article?.excerpt || article?.content || '';
          const image = section.image_url || article?.featured_image || undefined;
          const url = section.cta_url || (article ? `/noticias/${article.slug}` : '/noticias');

          return {
            id: article?.id || index + 1,
            title,
            summary: summarizeHeroNews(summarySource),
            image,
            url
          };
        });
    }

    const featured = allNews.filter((article) => article.is_featured);
    const source = (featured.length > 0 ? featured : allNews).slice(0, 4);

    return source.map((article) => ({
      id: article.id,
      title: article.title,
      summary: summarizeHeroNews(article.excerpt || article.content || ''),
      image: article.featured_image || undefined,
      url: `/noticias/${article.slug}`
    }));
  }, [allNews, heroCarouselSections]);

  return (
    <>
      <SEOHelmet
        title="ACA Chile - Asociación Chilena de Asadores"
        description="Asociación Chilena de Asadores A.G. 🔥 Comunidad de asadores profesionales en Chile. Eventos BBQ, campeonatos y más."
        url="https://acachile.com/"
      />
      
      <div className="min-h-screen bg-soft-gradient-light">
        <HeroSection section={heroSection} loading={loading} newsItems={heroNewsItems} />
        {otherSections.map((section, index) => (
          <SectionBlock key={section.key ?? index} section={section} reverse={index % 2 === 0} />
        ))}
      </div>
    </>
  );
};

export { HomePage };
export default HomePage;
