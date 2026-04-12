import { CompetenciasDashboardGrid } from '../components/portal/CompetenciasDashboardGrid';

export default function PortalCompetenciasPage() {
  return (
    <div className="space-y-6 rounded-[32px] border border-white/80 bg-white/85 p-5 shadow-soft-xl backdrop-blur-soft sm:p-8 lg:p-10">
      <div className="space-y-3">
        <p className="inline-flex items-center rounded-full border border-primary-200/70 bg-primary-50/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-primary-700">
          Competencias
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-neutral-950 sm:text-4xl">Módulo de Competencias</h1>
        <p className="max-w-4xl text-sm leading-8 text-neutral-600 sm:text-base">
          Este espacio organiza las áreas clave del módulo de Competencias mediante navegación interna clara y preparada para futuras funcionalidades.
        </p>
      </div>

      <CompetenciasDashboardGrid basePath="/portaldelsocio/competencias" />
    </div>
  );
}
