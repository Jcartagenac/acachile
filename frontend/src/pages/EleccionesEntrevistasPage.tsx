import React, { useEffect, useMemo, useState } from 'react';
import { SEOHelmet } from '../components/SEOHelmet';
import { Container } from '../components/layout/Container';
import { FileText, PlayCircle, ScrollText, Users } from 'lucide-react';

import danielInterview from '../content/elecciones/Daniel Tolosa-limpio.txt?raw';
import danielSummary from '../content/elecciones/Daniel Tolosa-resumen.txt?raw';
import jorgeInterview from '../content/elecciones/Jorge Silva-limpio.txt?raw';
import jorgeSummary from '../content/elecciones/Jorge Silva-resumen.txt?raw';
import karinaInterview from '../content/elecciones/Karina Norero-limpio.txt?raw';
import karinaSummary from '../content/elecciones/Karina Norero-resumen.txt?raw';
import bloqueEticaInterview from '../content/elecciones/Bloque etica-limpio.txt?raw';
import bloqueEticaSummary from '../content/elecciones/Bloque etica-resumen.txt?raw';
import barbaraInterview from '../content/elecciones/Bárbara Inostroza-limpio.txt?raw';
import barbaraSummary from '../content/elecciones/Bárbara Inostroza-resumen.txt?raw';
import pauliInterview from '../content/elecciones/Pauli-limpio.txt?raw';
import pauliSummary from '../content/elecciones/Pauli-resumen.txt?raw';
import eduardoInterview from '../content/elecciones/Eduardo Elgueta-limpio.txt?raw';
import eduardoSummary from '../content/elecciones/Eduardo Elgueta-resumen.txt?raw';
import oscarInterview from '../content/elecciones/Oscar Cerda-limpio.txt?raw';
import oscarSummary from '../content/elecciones/Oscar Cerda-resumen.txt?raw';

type ViewMode = 'entrevista' | 'video' | 'resumen';

type CandidateInterview = {
  id: string;
  name: string;
  role: string;
  interview: string;
  summary: string;
  videoUrl: string;
};

type ParsedLine =
  | { type: 'speaker'; speaker: string; timestamp?: string; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; text: string };

const VIDEO_BASE_URL = 'https://images.acachile.com/videos/elecciones';

const interviews: CandidateInterview[] = [
  {
    id: 'daniel-tolosa',
    name: 'Daniel Tolosa',
    role: 'Candidato a tesorería',
    interview: danielInterview,
    summary: danielSummary,
    videoUrl: `${VIDEO_BASE_URL}/01-daniel-tolosa.mp4`,
  },
  {
    id: 'jorge-silva',
    name: 'Jorge Silva',
    role: 'Candidato',
    interview: jorgeInterview,
    summary: jorgeSummary,
    videoUrl: `${VIDEO_BASE_URL}/02-jorge-silva.mp4`,
  },
  {
    id: 'karina-norero',
    name: 'Karina Norero',
    role: 'Postulante a directora de torneos',
    interview: karinaInterview,
    summary: karinaSummary,
    videoUrl: `${VIDEO_BASE_URL}/03-karina-norero.mp4`,
  },
  {
    id: 'barbara-inostroza',
    name: 'Bárbara Inostroza',
    role: 'Postulante a director de comunicaciones',
    interview: barbaraInterview,
    summary: barbaraSummary,
    videoUrl: `${VIDEO_BASE_URL}/05-barbara-inostroza.mp4`,
  },
  {
    id: 'pauli',
    name: 'Paulina Sandoval',
    role: 'Postulante a director de comunicaciones',
    interview: pauliInterview,
    summary: pauliSummary,
    videoUrl: `${VIDEO_BASE_URL}/06-paulina-sandoval.mp4`,
  },
  {
    id: 'eduardo-elgueta',
    name: 'Eduardo Elgueta',
    role: 'Candidato',
    interview: eduardoInterview,
    summary: eduardoSummary,
    videoUrl: `${VIDEO_BASE_URL}/07-eduardo-elgueta.mp4`,
  },
  {
    id: 'oscar-cerda',
    name: 'Oscar Cerda',
    role: 'Candidato',
    interview: oscarInterview,
    summary: oscarSummary,
    videoUrl: `${VIDEO_BASE_URL}/08-oscar-cerda.mp4`,
  },
  {
    id: 'bloque-etica',
    name: 'Bloque Ética',
    role: 'Postulantes al Comité de Ética',
    interview: bloqueEticaInterview,
    summary: bloqueEticaSummary,
    videoUrl: `${VIDEO_BASE_URL}/04-bloque-etica.mp4`,
  },
];

const introText = 'Reunimos en un solo lugar las entrevistas y resúmenes de candidaturas de cara a la elección de directorio del día 28. La idea es facilitar una revisión directa, simple y comparable, respetando el contexto de cada conversación y manteniendo una lectura rápida para quienes quieran llegar informados a la votación.';

const parseInterview = (raw: string): ParsedLine[] => {
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const speakerMatch = line.match(/^\[(\d{2}:\d{2}:\d{2})\]\s+([^:]+):\s*(.*)$/);
      if (speakerMatch) {
        return {
          type: 'speaker' as const,
          timestamp: speakerMatch[1],
          speaker: speakerMatch[2].trim(),
          text: speakerMatch[3].trim(),
        };
      }

      const looksLikeHeading = !line.includes(':') && line === line.toUpperCase() && line.length < 80;
      if (looksLikeHeading) {
        return { type: 'heading' as const, text: line };
      }

      return { type: 'paragraph' as const, text: line };
    });
};

const parseSummary = (raw: string) => {
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !/^resumen ejecutivo$/i.test(line) && !/^-{3,}$/.test(line));
};

const setRobotsNoIndex = () => {
  let robots = document.querySelector('meta[name="robots"]');
  if (!robots) {
    robots = document.createElement('meta');
    robots.setAttribute('name', 'robots');
    document.head.appendChild(robots);
  }
  robots.setAttribute('content', 'noindex,nofollow,noarchive');
};

const CandidateList: React.FC<{
  candidates: CandidateInterview[];
  selectedId: string;
  onSelect: (id: string) => void;
}> = ({ candidates, selectedId, onSelect }) => {
  return (
    <div className="rounded-3xl border border-stone-200 bg-white/90 p-4 shadow-sm backdrop-blur-sm">
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">
        <Users className="h-4 w-4" />
        Selecciona una entrevista
      </div>
      <div className="flex flex-col gap-2">
        {candidates.map((candidate) => {
          const isActive = candidate.id === selectedId;
          return (
            <button
              key={candidate.id}
              type="button"
              onClick={() => onSelect(candidate.id)}
              className={`rounded-2xl border px-4 py-3 text-left transition-all ${
                isActive
                  ? 'border-red-600 bg-red-600 text-white shadow-lg shadow-red-200'
                  : 'border-stone-200 bg-stone-50 text-stone-700 hover:border-red-300 hover:bg-red-50 hover:text-red-700'
              }`}
            >
              <div className="font-semibold">{candidate.name}</div>
              <div className={`mt-1 text-sm ${isActive ? 'text-red-100' : 'text-stone-500'}`}>{candidate.role}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

const ViewSwitcher: React.FC<{
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}> = ({ mode, onChange }) => {
  return (
    <div className="inline-flex rounded-2xl border border-stone-200 bg-stone-100 p-1">
      <button
        type="button"
        onClick={() => onChange('entrevista')}
        className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
          mode === 'entrevista' ? 'bg-white text-red-700 shadow-sm' : 'text-stone-600 hover:text-stone-900'
        }`}
      >
        <ScrollText className="h-4 w-4" />
        Entrevista
      </button>
      <button
        type="button"
        onClick={() => onChange('video')}
        className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
          mode === 'video' ? 'bg-white text-red-700 shadow-sm' : 'text-stone-600 hover:text-stone-900'
        }`}
      >
        <PlayCircle className="h-4 w-4" />
        Video
      </button>
      <button
        type="button"
        onClick={() => onChange('resumen')}
        className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
          mode === 'resumen' ? 'bg-white text-red-700 shadow-sm' : 'text-stone-600 hover:text-stone-900'
        }`}
      >
        <FileText className="h-4 w-4" />
        Resumen
      </button>
    </div>
  );
};

const EleccionesEntrevistasPage: React.FC = () => {
  const [selectedId, setSelectedId] = useState(interviews[0].id);
  const [viewMode, setViewMode] = useState<ViewMode>('entrevista');

  useEffect(() => {
    setRobotsNoIndex();
  }, []);

  const selected = useMemo(
    () => interviews.find((candidate) => candidate.id === selectedId) ?? interviews[0],
    [selectedId],
  );

  const parsedInterview = useMemo(() => parseInterview(selected.interview), [selected]);
  const parsedSummary = useMemo(() => parseSummary(selected.summary), [selected]);

  const handleSelectCandidate = (id: string) => {
    setSelectedId(id);
    setViewMode('entrevista');
  };

  return (
    <div className="min-h-screen bg-soft-gradient-light py-4 sm:py-10">
      <SEOHelmet
        title="Entrevistas elecciones directorio ACA Chile"
        description="Entrevistas y resúmenes de candidaturas para la elección de directorio del día 28."
        url="https://acachile.com/elecciones/entrevistas"
      />

      <Container size="xl" className="space-y-4 sm:space-y-8">
        <section className="overflow-hidden rounded-[1.5rem] border border-white/70 bg-white/75 shadow-xl shadow-stone-200/70 backdrop-blur-md sm:rounded-[2rem]">
          <div className="px-4 py-4 sm:px-8 sm:py-8 lg:px-10 lg:py-10">
            <div className="space-y-4 sm:space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-red-700">
                  Elecciones ACA · 28 de marzo
                </span>
              </div>
              <div className="space-y-2 sm:space-y-3">
                <h1 className="text-2xl font-bold tracking-tight text-stone-900 sm:text-4xl lg:text-5xl">
                  Elecciones ACA 28 de marzo
                </h1>
                <p className="max-w-3xl text-sm leading-6 text-stone-600 sm:text-lg sm:leading-7">
                  {introText}
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-4 sm:gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-3xl border border-stone-200 bg-white/90 p-3 shadow-sm backdrop-blur-sm lg:hidden">
              <div className="mb-3 text-sm font-semibold text-stone-700">Selecciona una entrevista</div>
              <div className="grid grid-cols-2 gap-2">
                {interviews.map((candidate) => {
                  const isActive = candidate.id === selectedId;
                  return (
                    <button
                      key={candidate.id}
                      type="button"
                      onClick={() => handleSelectCandidate(candidate.id)}
                      className={`min-h-[64px] rounded-2xl border px-3 py-3 text-center text-xs font-semibold leading-4 shadow-sm transition-all ${
                        isActive
                          ? 'border-red-600 bg-red-600 text-white shadow-red-200'
                          : 'border-stone-200 bg-white text-stone-700 hover:border-red-300 hover:bg-red-50 hover:text-red-700'
                      }`}
                    >
                      {candidate.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="hidden lg:block">
              <CandidateList candidates={interviews} selectedId={selectedId} onSelect={handleSelectCandidate} />
            </div>
          </aside>

          <section className="overflow-hidden rounded-[1.5rem] border border-stone-200 bg-white shadow-xl shadow-stone-200/70 sm:rounded-[2rem]">
            <div className="border-b border-stone-200 bg-stone-50/80 px-4 py-4 sm:px-8 sm:py-5">
              <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500 sm:text-sm">Contenido seleccionado</div>
                  <h2 className="mt-2 text-xl font-bold text-stone-900 sm:text-3xl">{selected.name}</h2>
                  <p className="mt-1 text-sm text-stone-600">{selected.role}</p>
                </div>
                <ViewSwitcher mode={viewMode} onChange={setViewMode} />
              </div>
            </div>

            <div className="px-4 py-4 sm:px-8 sm:py-8">
              {viewMode === 'entrevista' ? (
                <div className="space-y-4">
                  {parsedInterview.map((entry, index) => {
                    if (entry.type === 'heading') {
                      return (
                        <div key={`${entry.text}-${index}`} className="pb-1 sm:pb-2">
                          <h3 className="text-lg font-bold uppercase tracking-[0.12em] text-stone-900 sm:text-xl">{entry.text}</h3>
                        </div>
                      );
                    }

                    if (entry.type === 'speaker') {
                      return (
                        <article
                          key={`${entry.speaker}-${entry.timestamp}-${index}`}
                          className="rounded-2xl border border-stone-200 bg-gradient-to-br from-stone-50 to-white p-4 shadow-sm sm:p-5"
                        >
                          <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                            <span className="text-red-700">{entry.speaker}</span>
                          </div>
                          <p className="whitespace-pre-wrap text-sm leading-6 text-stone-700 sm:text-base sm:leading-7">{entry.text}</p>
                        </article>
                      );
                    }

                    return (
                      <p key={`${entry.text}-${index}`} className="text-sm leading-7 text-stone-700 sm:text-base sm:leading-8">
                        {entry.text}
                      </p>
                    );
                  })}
                </div>
              ) : viewMode === 'video' ? (
                <div className="space-y-4">
                  <div className="overflow-hidden rounded-3xl border border-stone-200 bg-black shadow-sm">
                    <video
                      key={selected.videoUrl}
                      controls
                      playsInline
                      preload="metadata"
                      className="block aspect-video w-full"
                    >
                      <source src={selected.videoUrl} type="video/mp4" />
                      Tu navegador no soporta la reproducción de video.
                    </video>
                  </div>
                  <p className="text-sm leading-6 text-stone-500">
                    Reproductor nativo HTML5, sin autoplay, optimizado para escritorio y mobile.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {parsedSummary.map((line, index) => {
                    if (!line.startsWith('- ')) {
                      return (
                        <p key={`${line}-${index}`} className="text-sm leading-7 text-stone-700 sm:text-base sm:leading-8">
                          {line}
                        </p>
                      );
                    }

                    return (
                      <div
                        key={`${line}-${index}`}
                        className="rounded-2xl border border-stone-200 bg-gradient-to-br from-stone-50 to-white px-4 py-4 text-stone-700 shadow-sm"
                      >
                        <p className="text-sm leading-6 sm:text-base sm:leading-7">{line.slice(2)}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </div>
      </Container>
    </div>
  );
};

export default EleccionesEntrevistasPage;
