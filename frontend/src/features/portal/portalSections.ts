export interface PortalSection {
  key:
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
  path: string;
  title: string;
  description: string;
}

export const portalSections: PortalSection[] = [
  {
    key: 'inicio',
    path: 'inicio',
    title: 'Inicio',
    description: 'Bienvenido al Portal del Socio. Desde aquí podrás navegar rápidamente por todas las áreas del portal.',
  },
  {
    key: 'beneficios',
    path: 'beneficios',
    title: 'Beneficios',
    description: 'Bienvenido a la sección Beneficios. Aquí podrás revisar convenios, descuentos y ventajas para socios.',
  },
  {
    key: 'marketplace',
    path: 'marketplace',
    title: 'Marketplace',
    description: 'Bienvenido a la sección Marketplace. Este espacio quedará preparado para publicaciones, productos y oportunidades entre socios.',
  },
  {
    key: 'documentos',
    path: 'documentos',
    title: 'Documentos',
    description: 'Bienvenido a la sección Documentos. Aquí se podrán consultar archivos, reglamentos y material interno.',
  },
  {
    key: 'competencias',
    path: 'competencias',
    title: 'Competencias',
    description: 'Bienvenido a la sección Competencias. Este espacio reunirá información, bases y seguimiento de torneos.',
  },
  {
    key: 'comunidad',
    path: 'comunidad',
    title: 'Comunidad',
    description: 'Bienvenido a la sección Comunidad. Aquí se articularán espacios de encuentro, interacción y participación.',
  },
  {
    key: 'administracion',
    path: 'administracion',
    title: 'Administración',
    description: 'Bienvenido a la sección Administración. Este módulo quedará preparado para trámites y gestiones internas.',
  },
  {
    key: 'etica',
    path: 'etica',
    title: 'Ética',
    description: 'Bienvenido a la sección Ética. Aquí se podrá consultar normativa, principios y orientaciones institucionales.',
  },
  {
    key: 'comunicaciones',
    path: 'comunicaciones',
    title: 'Comunicaciones',
    description: 'Bienvenido a la sección Comunicaciones. Este espacio servirá para anuncios, publicaciones y mensajes relevantes.',
  },
  {
    key: 'eventos',
    path: 'eventos',
    title: 'Eventos',
    description: 'Bienvenido a la sección Eventos. Aquí se centralizará la actividad y agenda relevante para socios.',
  },
  {
    key: 'formacion',
    path: 'formacion',
    title: 'Formación',
    description: 'Bienvenido a la sección Formación. Este módulo quedará listo para cursos, talleres y recursos de aprendizaje.',
  },
  {
    key: 'perfil',
    path: 'perfil',
    title: 'Perfil',
    description: 'Bienvenido a la sección Perfil. Aquí el socio podrá revisar y gestionar su información personal.',
  },
];

export const portalSectionMap = Object.fromEntries(
  portalSections.map((section) => [section.path, section] as const),
);
