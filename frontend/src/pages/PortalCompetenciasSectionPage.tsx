import { useParams } from 'react-router-dom';
import { competenciaSectionMap } from '../features/portal/competenciasSections';

export default function PortalCompetenciasSectionPage() {
  const { subSection } = useParams();
  const section = subSection ? competenciaSectionMap[subSection] : undefined;

  if (!section) {
    return (
      <div className="rounded-[32px] border border-white/80 bg-white/85 p-8 shadow-soft-xl backdrop-blur-soft">
        <h1 className="text-2xl font-bold text-neutral-950">Competencias</h1>
        <p className="mt-2 text-sm text-neutral-600">No se encontró la sub-sección solicitada.</p>
      </div>
    );
  }

  return (
    <div className="rounded-[32px] border border-white/80 bg-white/85 p-5 shadow-soft-xl backdrop-blur-soft sm:p-8 lg:p-10">
      <p className="inline-flex items-center rounded-full border border-primary-200/70 bg-primary-50/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-primary-700">
        Competencias
      </p>
      <h1 className="mt-4 text-3xl font-bold tracking-tight text-neutral-950 sm:text-4xl">{section.title}</h1>
      <p className="mt-3 text-sm leading-8 text-neutral-600 sm:text-base">{section.description}</p>
    </div>
  );
}
