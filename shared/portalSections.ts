export type PortalSectionKey =
  | 'inicio'
  | 'beneficios'
  | 'marketplace'
  | 'documentos'
  | 'competencias'
  | 'comunidad'
  | 'administracion'
  | 'etica'
  | 'comunicaciones'
  | 'eventos'
  | 'formacion'
  | 'perfil';

export interface PortalSectionDefinition {
  key: PortalSectionKey;
  path: string;
  defaultTitle: string;
  defaultDescription: string;
}

export interface PortalSectionContent {
  key: PortalSectionKey;
  path: string;
  title: string;
  description: string;
  sort_order: number;
  updated_at?: string;
}

export const portalSectionDefinitions: PortalSectionDefinition[] = [
  {
    key: 'inicio',
    path: 'inicio',
    defaultTitle: 'Inicio',
    defaultDescription: 'Bienvenido al Portal del Socio. Desde aquí podrás navegar rápidamente por todas las áreas del portal.',
  },
  {
    key: 'beneficios',
    path: 'beneficios',
    defaultTitle: 'Beneficios',
    defaultDescription: 'Bienvenido a la sección Beneficios. Aquí podrás revisar convenios, descuentos y ventajas para socios.',
  },
  {
    key: 'marketplace',
    path: 'marketplace',
    defaultTitle: 'Marketplace',
    defaultDescription: 'Bienvenido a la sección Marketplace. Este espacio quedará preparado para publicaciones, productos y oportunidades entre socios.',
  },
  {
    key: 'documentos',
    path: 'documentos',
    defaultTitle: 'Documentos',
    defaultDescription: 'Bienvenido a la sección Documentos. Aquí se podrán consultar archivos, reglamentos y material interno.',
  },
  {
    key: 'competencias',
    path: 'competencias',
    defaultTitle: 'Competencias',
    defaultDescription: 'Bienvenido a la sección Competencias. Este espacio reunirá información, bases y seguimiento de torneos.',
  },
  {
    key: 'comunidad',
    path: 'comunidad',
    defaultTitle: 'Comunidad',
    defaultDescription: 'Bienvenido a la sección Comunidad. Aquí se articularán espacios de encuentro, interacción y participación.',
  },
  {
    key: 'administracion',
    path: 'administracion',
    defaultTitle: 'Administración',
    defaultDescription: 'Bienvenido a la sección Administración. Este módulo quedará preparado para trámites y gestiones internas.',
  },
  {
    key: 'etica',
    path: 'etica',
    defaultTitle: 'Ética',
    defaultDescription: 'Bienvenido a la sección Ética. Aquí se podrá consultar normativa, principios y orientaciones institucionales.',
  },
  {
    key: 'comunicaciones',
    path: 'comunicaciones',
    defaultTitle: 'Comunicaciones',
    defaultDescription: 'Bienvenido a la sección Comunicaciones. Este espacio servirá para anuncios, publicaciones y mensajes relevantes.',
  },
  {
    key: 'eventos',
    path: 'eventos',
    defaultTitle: 'Eventos',
    defaultDescription: 'Bienvenido a la sección Eventos. Aquí se centralizará la actividad y agenda relevante para socios.',
  },
  {
    key: 'formacion',
    path: 'formacion',
    defaultTitle: 'Formación',
    defaultDescription: 'Bienvenido a la sección Formación. Este módulo quedará listo para cursos, talleres y recursos de aprendizaje.',
  },
  {
    key: 'perfil',
    path: 'perfil',
    defaultTitle: 'Perfil',
    defaultDescription: 'Bienvenido a la sección Perfil. Aquí el socio podrá revisar y gestionar su información personal.',
  },
];

export const getDefaultPortalSections = (): PortalSectionContent[] =>
  portalSectionDefinitions.map((section, index) => ({
    key: section.key,
    path: section.path,
    title: section.defaultTitle,
    description: section.defaultDescription,
    sort_order: index,
  }));
