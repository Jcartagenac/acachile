import { Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { PortalCompetitionTeam } from '@shared/portalCompetencias';
import { cn } from '../../utils/cn';

export function PortalCompetenciasGrid({
  teams,
  basePath = '/portaldelsocio/competencias',
  pathField = 'slug',
  emptyMessage = 'Aún no hay equipos publicados.',
  className,
}: {
  teams: PortalCompetitionTeam[];
  basePath?: string;
  pathField?: 'slug' | 'id';
  emptyMessage?: string;
  className?: string;
}) {
  if (teams.length === 0) {
    return (
      <div className={cn('rounded-[28px] border border-dashed border-neutral-300 bg-neutral-50/90 px-6 py-10 text-center text-sm text-neutral-500', className)}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={cn('grid gap-4 sm:grid-cols-2 xl:grid-cols-3', className)}>
      {teams.map((team) => (
        <Link
          key={team.id}
          to={`${basePath}/${pathField === 'id' ? team.id : team.slug}`}
          className="group rounded-[28px] border border-neutral-200 bg-white/90 p-4 shadow-soft-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-soft-lg"
        >
          <div className="aspect-square overflow-hidden rounded-2xl border border-neutral-100 bg-neutral-50">
            {team.main_image_url ? (
              <img src={team.main_image_url} alt={team.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-neutral-100 text-neutral-400">
                <Users className="h-12 w-12" />
              </div>
            )}
          </div>
          <div className="mt-4">
            <p className="text-lg font-semibold text-neutral-900 line-clamp-2">{team.name}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
