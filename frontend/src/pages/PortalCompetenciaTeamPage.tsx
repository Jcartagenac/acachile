import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Trophy, Users } from 'lucide-react';
import type { PortalCompetitionTeam } from '@shared/portalCompetencias';

export default function PortalCompetenciaTeamPage() {
  const { slug } = useParams();
  const [team, setTeam] = useState<PortalCompetitionTeam | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/portal/competencias/${slug}`, { cache: 'no-store' });
        const json = await response.json();
        if (!response.ok || !json?.success) throw new Error(json?.error || 'No se pudo cargar el equipo');
        if (active) setTeam(json.team);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Error cargando equipo');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) return <div className="rounded-[32px] border border-white/80 bg-white/85 p-8 shadow-soft-xl">Cargando equipo…</div>;
  if (error || !team) return <div className="rounded-[32px] border border-red-200 bg-red-50 p-8 text-red-700">{error || 'Equipo no encontrado'}</div>;

  return (
    <div className="space-y-6 rounded-[32px] border border-white/80 bg-white/85 p-5 shadow-soft-xl backdrop-blur-soft sm:p-8 lg:p-10">
      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start">
        <div className="aspect-square overflow-hidden rounded-[28px] border border-neutral-200 bg-neutral-50 shadow-soft-sm">
          {team.main_image_url ? (
            <img src={team.main_image_url} alt={team.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-neutral-400"><Users className="h-16 w-16" /></div>
          )}
        </div>
        <div className="space-y-4">
          <p className="inline-flex items-center rounded-full border border-primary-200/70 bg-primary-50/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-primary-700">Competencias</p>
          <h1 className="text-3xl font-bold tracking-tight text-neutral-950 sm:text-4xl">{team.name}</h1>
          {team.achievements ? (
            <div className="rounded-[28px] border border-primary-100 bg-gradient-to-br from-primary-50 via-white to-primary-100/70 p-5 shadow-soft-lg">
              <div className="flex items-center gap-2 text-sm font-semibold text-neutral-900"><Trophy className="h-4 w-4 text-primary-600" /> Logros</div>
              <div className="mt-3 whitespace-pre-wrap text-sm leading-7 text-neutral-600">{team.achievements}</div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-neutral-950">Integrantes</h2>
        {team.members.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-neutral-300 bg-neutral-50/90 px-6 py-10 text-center text-sm text-neutral-500">Aún no hay integrantes publicados.</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {team.members.map((member) => (
              <div key={member.id} className="rounded-[28px] border border-neutral-200 bg-white p-4 shadow-soft-sm">
                <div className="aspect-square overflow-hidden rounded-2xl border border-neutral-100 bg-neutral-50">
                  {member.photo_url ? (
                    <img src={member.photo_url} alt={member.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-neutral-400"><Users className="h-10 w-10" /></div>
                  )}
                </div>
                <p className="mt-3 text-sm font-semibold text-neutral-900">{member.name}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {team.gallery.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-neutral-950">Galería</h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {team.gallery.map((image) => (
              <div key={image.id} className="overflow-hidden rounded-[28px] border border-neutral-200 bg-white shadow-soft-sm">
                <div className="aspect-square bg-neutral-50">
                  <img src={image.image_url} alt={team.name} className="h-full w-full object-cover" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
