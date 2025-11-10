import React, { useEffect, useMemo, useState } from 'react';
import type { SiteSection } from '@shared/siteSections';

type DisplaySection = SiteSection & {
  display_title: string;
  display_content: string;
  display_image?: string;
  display_cta_label?: string;
  display_cta_url?: string;
};

interface ContactDetail {
  label: string;
  value: string;
  href?: string;
  icon?: string;
}

// NO usar defaults - trabajar solo con datos reales de BD
const normalizeSections = (incoming: Partial<SiteSection>[] | undefined): SiteSection[] => {
  if (!incoming || incoming.length === 0) {
    return [];
  }

  const normalized: SiteSection[] = [];
  incoming.forEach((raw, index) => {
    normalized.push({
      page: 'contact',
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

const parseContactDetails = (content: string): ContactDetail[] => {
  const lines = content.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const details: ContactDetail[] = [];

  lines.forEach((line) => {
    const [rawLabel, ...rawValueParts] = line.split(':');
    const label = rawLabel?.trim();
    const value = rawValueParts.join(':').trim();
    if (!label || !value) return;

    let href: string | undefined;
    let icon = '📍';

    const lowerLabel = label.toLowerCase();
    if (lowerLabel.includes('mail') || value.includes('@')) {
      href = value.startsWith('mailto:') ? value : `mailto:${value}`;
      icon = '📧';
    } else if (lowerLabel.includes('tel') || lowerLabel.includes('fono') || /\+?\d/.test(value)) {
      href = value.startsWith('tel:') ? value : `tel:${value.replace(/\s+/g, '')}`;
      icon = '📱';
    } else if (lowerLabel.includes('instagram')) {
      const handle = value.replace(/^@/, '');
      href = value.startsWith('http') ? value : `https://www.instagram.com/${handle}`;
      icon = '/icons/instagram-favicon.ico';
    } else if (lowerLabel.includes('facebook')) {
      href = value.startsWith('http') ? value : `https://www.facebook.com/${value.replace(/^\//, '')}`;
      icon = '/icons/facebook-favicon.ico';
    }

    details.push({ label, value, href, icon });
  });

  return details;
};

const HeroSection: React.FC<{ section: DisplaySection; loading: boolean }> = ({ section, loading }) => {
  return (
    <section className="relative overflow-hidden py-20 bg-soft-gradient-light">
      {/* Imagen de fondo si existe */}
      {section.display_image && (
        <div className="absolute inset-0 z-0">
          <img
            src={section.display_image}
            alt={section.display_title}
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/60 to-white/80"></div>
        </div>
      )}
      
      <div className="relative z-10 px-4 py-16 mx-auto max-w-5xl sm:px-6 lg:px-8 lg:py-24 text-center space-y-6">
        <span className="inline-flex items-center gap-2 px-6 py-3 bg-white/80 backdrop-blur-soft rounded-full shadow-soft-sm border border-white/40 text-primary-600 font-semibold text-sm tracking-wide uppercase">
          {loading ? 'Cargando…' : 'Ponte en contacto'}
        </span>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight text-neutral-900">
          {section.display_title}
        </h1>
        <p className="text-lg sm:text-xl text-neutral-600 font-light leading-relaxed max-w-3xl mx-auto">
          {section.display_content}
        </p>
        {section.display_cta_label && section.display_cta_url ? (
          <a
            href={section.display_cta_url}
            className="inline-flex items-center px-8 py-4 rounded-2xl text-white font-semibold text-lg transition-all duration-500"
            style={{ background: 'linear-gradient(135deg, #f56934 0%, #e04c1a 50%, #b93c14 100%)' }}
          >
            {section.display_cta_label}
          </a>
        ) : null}
      </div>
    </section>
  );
};

const ContactCards: React.FC<{ details: ContactDetail[] }> = ({ details }) => {
  if (details.length === 0) return null;

  return (
    <div className="bg-white/60 backdrop-blur-soft rounded-3xl p-8 shadow-soft-lg border border-white/30">
      <h2 className="text-2xl font-bold text-neutral-800 mb-6 text-center">Información de contacto</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {details.map((detail, index) => (
          <div key={index} className="flex items-start gap-3 p-4 bg-white/40 rounded-xl border border-white/20">
            {detail.icon?.startsWith('http') ? (
              <img src={detail.icon} alt={detail.label} className="w-5 h-5 object-contain" />
            ) : (
              <span className="text-xl leading-none">{detail.icon ?? '📍'}</span>
            )}
            <div className="flex-1">
              {detail.href ? (
                <a 
                  href={detail.href} 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block hover:opacity-80 transition-opacity"
                >
                  <p className="text-sm font-semibold text-neutral-700 mb-1">{detail.label}</p>
                  <p className="text-sm text-primary-600 hover:underline break-words">
                    {detail.value}
                  </p>
                </a>
              ) : (
                <>
                  <p className="text-sm font-semibold text-neutral-700 mb-1">{detail.label}</p>
                  <p className="text-sm text-neutral-600 break-words">{detail.value}</p>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const MapSection: React.FC<{ section: DisplaySection }> = ({ section }) => {
  if (!section.display_image && !section.display_cta_url && !section.display_content) {
    return null;
  }

  return (
    <div className="bg-white/60 backdrop-blur-soft rounded-3xl p-8 shadow-soft-lg border border-white/30">
      <div className="flex flex-col lg:flex-row gap-6 items-center">
        <div className="flex-1 space-y-4">
          <h3 className="text-xl font-bold text-neutral-800">{section.display_title}</h3>
          <p className="text-neutral-600 leading-relaxed">{section.display_content}</p>
          {section.display_cta_label && section.display_cta_url ? (
            <a
              href={section.display_cta_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl transition-all duration-300"
            >
              {section.display_cta_label}
            </a>
          ) : null}
        </div>
        {section.display_image ? (
          <div className="flex-1 w-full">
            <img
              src={section.display_image}
              alt={section.display_title}
              className="w-full h-full object-cover rounded-2xl"
            />
          </div>
        ) : null}
      </div>
    </div>
  );
};

export const ContactPage: React.FC = () => {
  const [sections, setSections] = useState<SiteSection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        console.log('[ContactPage] Fetching contact sections...');
        const res = await fetch('/api/content?page=contact', { cache: 'no-store' });
        console.log('[ContactPage] Response status:', res.status);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const json = await res.json();
        console.log('[ContactPage] Response JSON:', JSON.stringify(json, null, 2));
        if (active && json?.success) {
          const normalized = normalizeSections(json.sections);
          console.log('[ContactPage] Normalized sections:', JSON.stringify(normalized, null, 2));
          setSections(normalized);
        } else {
          console.warn('[ContactPage] Response not successful or missing data');
        }
      } catch (error) {
        console.warn('[ContactPage] No se pudo obtener contenido dinámico.', error);
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
    page: 'contact',
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

  const infoSection = displaySections.find((section) => section.key === 'contact-info');
  const mapSection = displaySections.find((section) => section.key === 'contact-map');

  const contactDetails = infoSection ? parseContactDetails(infoSection.display_content) : [];

  return (
    <div className="min-h-screen bg-soft-gradient-light space-y-10">
      <HeroSection section={heroSection} loading={loading} />
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pb-16 space-y-8">
        {contactDetails.length > 0 ? <ContactCards details={contactDetails} /> : null}
        {mapSection ? <MapSection section={mapSection} /> : null}
      </div>
    </div>
  );
};

export default ContactPage;
