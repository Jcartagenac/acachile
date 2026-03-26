import React, { useEffect, useMemo, useState } from 'react';
import { SEOHelmet } from '../components/SEOHelmet';
import { Container } from '../components/layout/Container';
import { FileText, ScrollText, Users } from 'lucide-react';

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

type ViewMode = 'entrevista' | 'resumen';

type CandidateInterview = {
  id: string;
  name: string;
  role: string;
  interview: string;
  summary: string;
};

type ParsedLine =
  | { type: 'speaker'; speaker: string; timestamp?: string; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; text: string };

const interviews: CandidateInterview[] = [
  {
    id: 'daniel-tolosa',
    name: 'Daniel Tolosa',
    role: 'Candidato a tesorería',
    interview: danielInterview,
    summary: danielSummary,
  },
  {
    id: 'jorge-silva',
    name: 'Jorge Silva',
    role: 'Candidato',
    interview: jorgeInterview,
    summary: jorgeSummary,
  },
  {
    id: 'karina-norero',
    name: 'Karina Norero',
    role: 'Candidata',
    interview: karinaInterview,
    summary: karinaSummary,
  },
  {
    id: 'barbara-inostroza',
    name: 'Bárbara Inostroza',
    role: 'Candidata',
    interview: barbaraInterview,
    summary: barbaraSummary,
  },
  {
    id: 'pauli',
    name: 'Pauli',
    role: 'Candidata',
    interview: pauliInterview,
    summary: pauliSummary,
  },
  {
    id: 'eduardo-elgueta',
    name: 'Eduardo Elgueta',
    role: 'Candidato',
    interview: eduardoInterview,
    summary: eduardoSummary,
  },
  {
    id: 'oscar-cerda',
    name: 'Oscar Cerda',
    role: 'Candidato',
    interview: oscarInterview,
    summary: oscarSummary,
  },
  {
    id: 'bloque-etica',
    name: 'Bloque Ética',
    role: 'Postulantes al Comité de Ética',
    interview: bloqueEticaInterview,
    summary: bloqueEticaSummary,
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
        Selección
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
    <div className="min-h-screen bg-soft-gradient-light py-10 sm:py-14">
      <SEOHelmet
        title="Entrevistas elecciones directorio ACA Chile"
        description="Entrevistas y resúmenes de candidaturas para la elección de directorio del día 28."
        url="https://acachile.com/elecciones/entrevistas"
      />

      <Container size="xl" className="space-y-8">
        <section className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/75 shadow-xl shadow-stone-200/70 backdrop-blur-md">
          <div className="grid gap-8 px-6 py-8 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:px-10 lg:py-10">
            <div className="space-y-5">
              <div className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-red-700">
                Elecciones directorio · 28
              </div>
              <div className="space-y-3">
                <h1 className="text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl lg:text-5xl">
                  Entrevistas y resúmenes de candidaturas
                </h1>
                <p className="max-w-3xl text-base leading-7 text-stone-600 sm:text-lg">
                  {introText}
                </p>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-stone-200 bg-stone-50/80 p-6">
              <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">Cómo usar esta página</h2>
              <div className="mt-4 space-y-3 text-sm leading-6 text-stone-600">
                <p>Selecciona un nombre para abrir su contenido. Cada perfil carga por defecto la entrevista completa.</p>
                <p>En la parte superior del panel principal puedes alternar entre <strong>Entrevista</strong> y <strong>Resumen</strong> sin perder el contexto visual.</p>
                <p>Esta ruta está pensada para acceso directo y no está enlazada desde la navegación pública del sitio.</p>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-3xl border border-stone-200 bg-white/90 p-4 shadow-sm backdrop-blur-sm lg:hidden">
              <label htmlFor="candidate-selector" className="mb-2 block text-sm font-semibold text-stone-700">
                Selecciona una candidatura
              </label>
              <select
                id="candidate-selector"
                value={selectedId}
                onChange={(event) => handleSelectCandidate(event.target.value)}
                className="w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-stone-800 shadow-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-200"
              >
                {interviews.map((candidate) => (
                  <option key={candidate.id} value={candidate.id}>
                    {candidate.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="hidden lg:block">
              <CandidateList candidates={interviews} selectedId={selectedId} onSelect={handleSelectCandidate} />
            </div>
          </aside>

          <section className="overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-xl shadow-stone-200/70">
            <div className="border-b border-stone-200 bg-stone-50/80 px-6 py-5 sm:px-8">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">Contenido seleccionado</div>
                  <h2 className="mt-2 text-2xl font-bold text-stone-900 sm:text-3xl">{selected.name}</h2>
                  <p className="mt-1 text-sm text-stone-600">{selected.role}</p>
                </div>
                <ViewSwitcher mode={viewMode} onChange={setViewMode} />
              </div>
            </div>

            <div className="px-6 py-6 sm:px-8 sm:py-8">
              {viewMode === 'entrevista' ? (
                <div className="space-y-4">
                  {parsedInterview.map((entry, index) => {
                    if (entry.type === 'heading') {
                      return (
                        <div key={`${entry.text}-${index}`} className="pb-2">
                          <h3 className="text-xl font-bold uppercase tracking-[0.12em] text-stone-900">{entry.text}</h3>
                        </div>
                      );
                    }

                    if (entry.type === 'speaker') {
                      return (
                        <article
                          key={`${entry.speaker}-${entry.timestamp}-${index}`}
                          className="rounded-2xl border border-stone-200 bg-stone-50/80 p-4 sm:p-5"
                        >
                          <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                            {entry.timestamp ? <span>{entry.timestamp}</span> : null}
                            <span className="text-red-700">{entry.speaker}</span>
                          </div>
                          <p className="whitespace-pre-wrap text-[15px] leading-7 text-stone-700 sm:text-base">{entry.text}</p>
                        </article>
                      );
                    }

                    return (
                      <p key={`${entry.text}-${index}`} className="text-base leading-8 text-stone-700">
                        {entry.text}
                      </p>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-4">
                  {parsedSummary.map((line, index) => {
                    if (!line.startsWith('- ')) {
                      return (
                        <p key={`${line}-${index}`} className="text-base leading-8 text-stone-700">
                          {line}
                        </p>
                      );
                    }

                    return (
                      <div
                        key={`${line}-${index}`}
                        className="rounded-2xl border border-stone-200 bg-stone-50/80 px-4 py-4 text-stone-700"
                      >
                        <p className="text-base leading-7">{line.slice(2)}</p>
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
