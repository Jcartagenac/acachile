import React, { useEffect, useMemo, useState } from 'react';
import type { SiteSection } from '@shared/siteSections';
import { DEFAULT_SITE_SECTIONS } from '@shared/siteSections';

const cloneDefaults = (): SiteSection[] => DEFAULT_SITE_SECTIONS.map((section) => ({ ...section }));

const normalizeSections = (incoming: Partial<SiteSection>[] | undefined): SiteSection[] => {
  const defaults = new Map(DEFAULT_SITE_SECTIONS.map((section) => [section.key, section]));
  const merged = new Map<string, SiteSection>();

  (incoming || []).forEach((raw, index) => {
    const tentativeKey =
      typeof raw?.key === 'string' && raw.key.trim().length > 0
        ? raw.key.trim()
        : DEFAULT_SITE_SECTIONS[index]?.key ?? `section_${index}`;

    const fallback = defaults.get(tentativeKey);
    const sortOrder =
      typeof raw?.sort_order === 'number'
        ? raw.sort_order
        : fallback?.sort_order ?? index;

    merged.set(tentativeKey, {
      key: tentativeKey,
      title:
        typeof raw?.title === 'string' && raw.title.trim().length > 0
          ? raw.title.trim()
          : fallback?.title ?? '',
      content: typeof raw?.content === 'string' ? raw.content : fallback?.content ?? '',
      image_url:
        typeof raw?.image_url === 'string' && raw.image_url.trim().length > 0
          ? raw.image_url.trim()
          : fallback?.image_url ?? '',
      sort_order: sortOrder
    });

    defaults.delete(tentativeKey);
  });

  for (const remaining of defaults.values()) {
    merged.set(remaining.key, { ...remaining });
  }

  return Array.from(merged.values()).sort((a, b) => a.sort_order - b.sort_order);
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

const SectionBlock: React.FC<{ section: SiteSection; index: number }> = ({ section, index }) => {
  const reverse = index % 2 === 1;
  const blocks = useMemo(() => parseContentBlocks(section.content || ''), [section.content]);

  return (
    <section className="py-20 bg-soft-gradient-light relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          className={`flex flex-col gap-10 lg:gap-16 ${reverse ? 'lg:flex-row-reverse' : 'lg:flex-row'}`}
        >
          <div className="lg:w-1/2 flex flex-col justify-center space-y-6">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-soft-sm border border-white/40 text-sm font-semibold text-primary-600">
              {`Sección ${index + 1}`}
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-neutral-900 leading-tight">
              {section.title}
            </h2>
            <div className="space-y-4 text-neutral-600 text-lg leading-relaxed">
              {blocks.length === 0 ? (
                <p>{section.content}</p>
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
          </div>
          {section.image_url ? (
            <div className="lg:w-1/2">
              <div className="relative bg-white/40 backdrop-blur-md rounded-3xl border border-white/60 shadow-soft-lg overflow-hidden">
                <img
                  src={section.image_url}
                  alt={section.title}
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

const HeroSection: React.FC<{ section: SiteSection; loading: boolean }> = ({ section, loading }) => {
  return (
    <section className="relative overflow-hidden py-20 bg-soft-gradient-light">
      <div className="relative px-4 py-16 mx-auto max-w-7xl sm:px-6 lg:px-8 lg:py-28">
        <div className="lg:grid lg:grid-cols-12 lg:gap-16 items-center">
          <div className="lg:col-span-6 space-y-8">
            <span className="inline-block px-6 py-2 bg-soft-gradient-primary rounded-full shadow-soft-sm border border-white/40 text-primary-700 font-semibold text-sm uppercase tracking-wide">
              {loading ? 'Cargando…' : 'Inicio ACA Chile'}
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight text-neutral-900">
              {section.title}
            </h1>
            <div className="text-lg sm:text-xl text-neutral-600 font-light leading-relaxed space-y-4 max-w-xl">
              {parseContentBlocks(section.content).map((block, index) =>
                block.type === 'paragraph' ? (
                  <p key={index}>{block.text}</p>
                ) : (
                  <ul key={index} className="list-disc pl-5 space-y-1">
                    {block.items.map((item, itemIndex) => (
                      <li key={itemIndex}>{item}</li>
                    ))}
                  </ul>
                )
              )}
            </div>
          </div>
          {section.image_url ? (
            <div className="mt-12 lg:mt-0 lg:col-span-6">
              <div className="relative bg-white/20 backdrop-blur-md rounded-3xl p-6 shadow-soft-xl border border-white/40">
                <div className="overflow-hidden rounded-2xl">
                  <img
                    src={section.image_url}
                    alt={section.title}
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

const HomePage: React.FC = () => {
  const [sections, setSections] = useState<SiteSection[]>(cloneDefaults);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const res = await fetch('/api/admin/content', { cache: 'no-store' });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const json = await res.json();
        if (active && json?.success) {
          setSections(normalizeSections(json.sections));
        }
      } catch (error) {
        console.warn('[HomePage] No se pudo obtener contenido dinámico, usando valores por defecto.', error);
        if (active) {
          setSections(cloneDefaults());
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

  const heroSection = sections[0] ?? DEFAULT_SITE_SECTIONS[0];
  const otherSections = sections.slice(1);

  return (
    <div className="min-h-screen bg-soft-gradient-light">
      <HeroSection section={heroSection} loading={loading} />
      {otherSections.map((section, index) => (
        <SectionBlock key={section.key ?? index} section={section} index={index + 1} />
      ))}
    </div>
  );
};

export { HomePage };
export default HomePage;
