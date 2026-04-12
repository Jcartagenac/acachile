import { Link } from 'react-router-dom';

export function CompetenciasDashboardGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <Link
        to="/portaldelsocio/competencias/nacional"
        className="group rounded-[22px] border border-neutral-200 bg-white/90 px-5 py-5 shadow-soft-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-soft-lg"
      >
        <p className="text-base font-semibold text-neutral-950">Nacional</p>
        <p className="mt-2 text-sm leading-7 text-neutral-600">
          Gestiona y revisa los equipos de competencia.
        </p>
      </Link>
    </div>
  );
}
