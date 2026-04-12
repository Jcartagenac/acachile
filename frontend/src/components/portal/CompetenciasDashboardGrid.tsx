import { Link } from 'react-router-dom';
import { Award, BookOpen, CalendarDays, Flag, Trophy } from 'lucide-react';
import { competenciaSections } from '../../features/portal/competenciasSections';

const iconByKey = {
  equipos: Flag,
  ranking: Trophy,
  calendario: CalendarDays,
  resultados: Award,
  bases: BookOpen,
} as const;

export function CompetenciasDashboardGrid({
  basePath,
}: {
  basePath: string;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {competenciaSections.map((section) => {
        const Icon = iconByKey[section.key];
        return (
          <Link
            key={section.key}
            to={`${basePath}/${section.path}`}
            className="group rounded-[28px] border border-neutral-200 bg-white/90 p-5 shadow-soft-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-soft-lg"
          >
            <div className="inline-flex rounded-2xl bg-primary-50 p-3 text-primary-700 shadow-soft-sm">
              <Icon className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-neutral-950">{section.title}</h3>
            <p className="mt-2 text-sm leading-7 text-neutral-600">{section.description}</p>
          </Link>
        );
      })}
    </div>
  );
}
