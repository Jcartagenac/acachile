import { competenciaSections } from '../../features/portal/competenciasSections';

export function CompetenciasDashboardGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {competenciaSections.map((section) => (
        <div
          key={section.key}
          className="rounded-[22px] border border-neutral-200 bg-white/90 px-5 py-4 shadow-soft-sm"
        >
          <p className="text-base font-semibold text-neutral-950">{section.title}</p>
        </div>
      ))}
    </div>
  );
}
