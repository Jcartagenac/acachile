export type SiteSectionSourceType = 'custom' | 'event' | 'news';
export type SitePageKey = 'home' | 'about' | 'contact';

export interface SiteSection {
  page: SitePageKey;
  key: string;
  title: string;
  content: string;
  image_url: string;
  sort_order: number;
  source_type?: SiteSectionSourceType;
  source_id?: string;
  cta_label?: string;
  cta_url?: string;
}

const withPage = (page: SitePageKey, sections: Omit<SiteSection, 'page'>[]): SiteSection[] =>
  sections.map((section) => ({ ...section, page }));

export const DEFAULT_SECTIONS: Record<SitePageKey, SiteSection[]> = {
  home: withPage('home', [
    {
      key: 'hero',
      title: 'Asociación Chilena de Asadores',
      content:
        'Somos la comunidad oficial de asadores en Chile. Conectamos a parrilleros, aficionados y profesionales en torno al fuego, la gastronomía y la camaradería. Únete a ACA para vivir experiencias únicas y compartir nuestra pasión por la parrilla.',
      image_url: 'https://acachile.com/wp-content/uploads/2024/08/post-alemania-500x375.jpg',
      sort_order: 0,
      source_type: 'custom',
      cta_label: 'Conoce más',
      cta_url: '/quienes-somos'
    },
    {
      key: 'international',
      title: 'Somos Internacionales',
      content:
        '',  // Contenido manejado por el editor del panel de admin
      image_url: '',  // Imagen manejada por el editor del panel de admin
      sort_order: 1,
      source_type: 'custom',
      cta_label: '',
      cta_url: ''
    },
    {
      key: 'community',
      title: 'Comunidad y Formación',
      content:
        'Creamos instancias permanentes de perfeccionamiento para nuestros socios, talleres de técnicas de cocción, cursos de parrilla y encuentros recreativos. Nuestra misión es elevar el estándar gastronómico y mantener viva la cultura parrillera chilena.',
      image_url: 'https://acachile.com/wp-content/uploads/2025/03/64694334-bbdc-4e97-b4a7-ef75e6bbe50d-500x375.jpg',
      sort_order: 2,
      source_type: 'custom',
      cta_label: 'Únete a ACA',
      cta_url: '/unete'
    },
    {
      key: 'events',
      title: 'Eventos Destacados',
      content:
        'Durante todo el año organizamos campeonatos nacionales, competencias internacionales, talleres temáticos y actividades abiertas al público. Revisa constantemente nuestro calendario y participa de las próximas fechas oficiales de ACA.',
      image_url: 'https://acachile.com/wp-content/uploads/2025/06/post-_2025-12-500x375.png',
      sort_order: 3,
      source_type: 'custom',
      cta_label: 'Calendario de eventos',
      cta_url: '/eventos'
    }
  ]),
  about: withPage('about', [
    {
      key: 'about-hero',
      title: 'Quiénes Somos',
      content:
        'Somos la Asociación Chilena de Asadores (ACA), una organización sin fines de lucro que reúne a amantes de la parrilla y del fuego de todo Chile. Promovemos la cultura parrillera, la camaradería y el perfeccionamiento de las técnicas de asado.',
      image_url: 'https://acachile.com/wp-content/uploads/2024/07/CONFEDERACION.png',
      sort_order: 0,
      cta_label: 'Únete a ACA',
      cta_url: '/unete'
    },
    {
      key: 'about-mission',
      title: 'Nuestra Misión',
      content:
        'Difundir la tradición parrillera chilena, compartir conocimientos y generar instancias de encuentro. Involucramos a expertos asadores, aficionados y principiantes en torno a proyectos gastronómicos y sociales.',
      image_url: 'https://acachile.com/wp-content/uploads/2025/03/64694334-bbdc-4e97-b4a7-ef75e6bbe50d-500x375.jpg',
      sort_order: 1
    },
    {
      key: 'about-legal',
      title: 'Organización Legal',
      content:
        'Estamos legalmente constituidos en Viña del Mar y contamos con asociados a lo largo de todo Chile. Participamos activamente en la comunidad WBQA representando a nuestro país en eventos internacionales.',
      image_url: 'https://acachile.com/wp-content/uploads/2024/08/post-alemania-500x375.jpg',
      sort_order: 2
    },
    {
      key: 'about-call-to-action',
      title: 'Sé Parte de Nuestra Comunidad',
      content:
        'Si te apasiona el fuego, el asado y la camaradería, ACA es tu lugar. Organizamos talleres, competencias y encuentros recreativos durante todo el año.',
      image_url: 'https://acachile.com/wp-content/uploads/2025/06/post-_2025-12-500x375.png',
      sort_order: 3,
      cta_label: 'Postula como Socio',
      cta_url: 'https://docs.google.com/forms/d/e/1FAIpQLScm_pK1mysojBZGSNODV2RY0CT1DwNg06Eqhc1aoO5D7l4M6g/viewform'
    }
  ]),
  contact: withPage('contact', [
    {
      key: 'contact-hero',
      title: 'Hablemos',
      content:
        '¿Quieres sumarte a ACA, organizar un evento o colaborar con nosotros? Escríbenos y conversemos. Nuestro equipo responde a la brevedad.',
      image_url: 'https://acachile.com/wp-content/uploads/2024/07/CONFEDERACION.png',
      sort_order: 0,
      cta_label: 'Escríbenos',
      cta_url: 'mailto:info@acachile.cl'
    },
    {
      key: 'contact-info',
      title: 'Información de contacto',
      content:
        'Dirección: Sporting Club, Viña del Mar\nEmail: info@acachile.cl\nTeléfono: +56 9 1234 5678\nInstagram: @acachile\nFacebook: /acachileoficial',
      image_url: '',
      sort_order: 1
    },
    {
      key: 'contact-map',
      title: 'Visítanos',
      content:
        'Estamos ubicados en Viña del Mar, Región de Valparaíso. Agenda una visita para conocer nuestra sede y actividades.',
      image_url: `https://maps.googleapis.com/maps/api/staticmap?center=Vi%C3%B1a+del+Mar,+Chile&zoom=14&size=600x400&markers=Vi%C3%B1a+del+Mar,+Chile&key=${process.env.GOOGLE_MAPS_API_KEY || ''}`,
      sort_order: 2,
      cta_label: 'Abrir en Google Maps',
      cta_url: 'https://maps.google.com/?q=Sporting+Club,+Vi%C3%B1a+del+Mar'
    }
  ])
};

export const DEFAULT_SITE_SECTIONS = DEFAULT_SECTIONS.home;

export const getDefaultSections = (page: SitePageKey): SiteSection[] =>
  DEFAULT_SECTIONS[page].map((section) => ({ ...section }));

export const SECTION_CACHE_KEY = 'site:sections';
