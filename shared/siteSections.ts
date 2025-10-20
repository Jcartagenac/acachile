export type SiteSectionSourceType = 'custom' | 'event' | 'news';

export interface SiteSection {
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

export const DEFAULT_SITE_SECTIONS: SiteSection[] = [
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
      'El 29 y 30 de noviembre de 2025 estaremos junto a la World Barbecue Association recibiendo a 80 equipos de 40 países. La gran final del WBQA International BBQ Championship se vive en Viña del Mar, y queremos que formes parte de este hito profesional.',
    image_url: 'https://acachile.com/wp-content/uploads/2024/07/CONFEDERACION.png',
    sort_order: 1,
    source_type: 'custom',
    cta_label: 'Eventos WBQA',
    cta_url: 'https://wbqachile2025.cl/'
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
];

export const SECTION_CACHE_KEY = 'site:sections';
