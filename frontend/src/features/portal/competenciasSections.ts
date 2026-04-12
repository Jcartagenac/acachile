export interface CompetenciaSection {
  key: 'equipos' | 'ranking' | 'calendario' | 'resultados' | 'bases';
  path: string;
  title: string;
  description: string;
}

export const competenciaSections: CompetenciaSection[] = [
  {
    key: 'equipos',
    path: 'equipos',
    title: 'Equipos',
    description: 'Acceso a la estructura base para gestionar y visualizar equipos de competencias.',
  },
  {
    key: 'ranking',
    path: 'ranking',
    title: 'Ranking de equipos',
    description: 'Espacio preparado para futuros rankings dinámicos y clasificaciones.',
  },
  {
    key: 'calendario',
    path: 'calendario',
    title: 'Calendario de torneos',
    description: 'Sección base para calendario, agenda y cronograma de competencias.',
  },
  {
    key: 'resultados',
    path: 'resultados',
    title: 'Resultados históricos',
    description: 'Módulo preparado para registrar y consultar resultados de temporadas anteriores.',
  },
  {
    key: 'bases',
    path: 'bases',
    title: 'Bases de competencia',
    description: 'Área destinada a reglamentos, bases y documentación oficial de competencias.',
  },
];

export const competenciaSectionMap = Object.fromEntries(
  competenciaSections.map((section) => [section.path, section] as const),
);
