import React, { useEffect, useMemo, useState } from 'react';
import type { SiteSection } from '@shared/siteSections';

type DisplaySection = SiteSection & {
  display_title: string;
  display_content: string;
  display_image?: string;
  display_cta_label?: string;
  display_cta_url?: string;
};

// NO usar defaults - trabajar solo con datos reales de BD
const normalizeSections = (incoming: Partial<SiteSection>[] | undefined): SiteSection[] => {
  if (!incoming || incoming.length === 0) {
    return [];
  }

  const normalized: SiteSection[] = [];
  incoming.forEach((raw, index) => {
    normalized.push({
      page: 'about',
      key: typeof raw?.key === 'string' && raw.key.trim() ? raw.key.trim() : `section_${index}`,
      title: typeof raw?.title === 'string' ? raw.title : '',
      content: typeof raw?.content === 'string' ? raw.content : '',
      image_url: typeof raw?.image_url === 'string' ? raw.image_url : '',
      sort_order: typeof raw?.sort_order === 'number' ? raw.sort_order : index,
      source_type: raw?.source_type ?? 'custom',
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

const HeroSection: React.FC<{ section: DisplaySection; loading: boolean }> = ({ section, loading }) => {
  const blocks = useMemo(() => parseContentBlocks(section.display_content || ''), [section.display_content]);

  return (
    <section className="relative overflow-hidden py-8 sm:py-12 bg-soft-gradient-light">
      <div className="relative px-4 py-6 mx-auto max-w-7xl sm:px-6 lg:px-8 lg:py-12">
        <div className="lg:grid lg:grid-cols-12 lg:gap-16 items-center">
          <div className="lg:col-span-7 space-y-8">
            <span className="inline-flex items-center gap-2 px-6 py-3 bg-white/80 backdrop-blur-soft rounded-full shadow-soft-sm border border-white/40 text-primary-600 font-semibold text-sm tracking-wide uppercase">
              {loading ? 'Cargando…' : 'Nuestra historia'}
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight text-neutral-900">
              {section.display_title}
            </h1>
            <div className="text-lg sm:text-xl text-neutral-600 font-light leading-relaxed space-y-4 max-w-2xl">
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
              <a
                href={section.display_cta_url}
                className="inline-flex items-center px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl transition-all duration-300"
              >
                {section.display_cta_label}
              </a>
            ) : null}
          </div>
          {section.display_image ? (
            <div className="mt-12 lg:mt-0 lg:col-span-5">
              <div className="relative bg-white/20 backdrop-blur-md rounded-3xl p-6 shadow-soft-xl border border-white/40">
                <div className="overflow-hidden rounded-2xl">
                  <img
                    src={section.display_image}
                    alt={section.display_title}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out hover:scale-105"
                  />
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
};

const SectionBlock: React.FC<{ section: DisplaySection; reverse?: boolean }> = ({ section, reverse }) => {
  const blocks = useMemo(() => parseContentBlocks(section.display_content || ''), [section.display_content]);

  return (
    <section className="py-20 bg-soft-gradient-light relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className={`flex flex-col gap-10 lg:gap-16 ${reverse ? 'lg:flex-row-reverse' : 'lg:flex-row'}`}>
          <div className="lg:w-1/2 flex flex-col justify-center space-y-6">
            <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 leading-tight">
              {section.display_title}
            </h2>
            <div className="space-y-4 text-neutral-600 text-lg leading-relaxed">
              {blocks.length === 0 ? (
                <p>{section.display_content}</p>
              ) : (
                blocks.map((block, blockIndex) =>
                  block.type === 'paragraph' ? (
                    <p key={blockIndex}>{block.text}</p>
                  ) : (
                    <ul key={blockIndex} className="list-disc pl-5 space-y-1">
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
                  className="inline-flex items-center px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl transition-all duration-300"
                >
                  {section.display_cta_label}
                </a>
              </div>
            ) : null}
          </div>
          {section.display_image ? (
            <div className="lg:w-1/2">
              <div className="relative bg-white/40 backdrop-blur-md rounded-3xl border border-white/60 shadow-soft-lg overflow-hidden">
                <img
                  src={section.display_image}
                  alt={section.display_title}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out hover:scale-105"
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
};

export const AboutPage: React.FC = () => {
  const [sections, setSections] = useState<SiteSection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const res = await fetch('/api/content?page=about', { cache: 'no-store' });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const json = await res.json();
        if (active && json?.success) {
          setSections(normalizeSections(json.sections));
        }
      } catch (error) {
        console.warn('[AboutPage] No se pudo obtener contenido dinámico.', error);
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

  const displaySections: DisplaySection[] = useMemo(() => {
    return sections.map((section, index) => ({
      ...section,
      display_title: section.title || `Sección ${index + 1}`,
      display_content: section.content || '',
      display_image: section.image_url || undefined,
      display_cta_label: section.cta_label,
      display_cta_url: section.cta_url
    }));
  }, [sections]);

  const defaultHero: DisplaySection = {
    page: 'about',
    key: 'hero',
    title: '',
    content: '',
    image_url: '',
    sort_order: 0,
    source_type: 'custom',
    display_title: '',
    display_content: '',
    display_image: ''
  };
  
  const heroSection = displaySections[0] ?? defaultHero;
  const otherSections = displaySections.slice(1);

  return (
    <div className="min-h-screen bg-soft-gradient-light">
      <HeroSection section={heroSection} loading={loading} />
      {otherSections.map((section, index) => (
        <SectionBlock key={section.key ?? index} section={section} reverse={index % 2 === 0} />
      ))}
    </div>
  );
};

export default AboutPage;
