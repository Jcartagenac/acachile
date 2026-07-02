import { useEffect, useRef, useState } from 'react';
import { ExternalLink, Flame, Volume2 } from 'lucide-react';
import { SEOHelmet } from '../components/SEOHelmet';

const CLICK_STORAGE_KEY = 'aca_inscripciones_clicked';
const COUNTER_ENDPOINT = '/api/landing-inscritos';
const RICKROLL_VIDEO_ID = 'dQw4w9WgXcQ';
const YOUTUBE_WATCH_URL = `https://www.youtube.com/watch?v=${RICKROLL_VIDEO_ID}&autoplay=1&mute=1`;

declare global {
  interface Window {
    YT?: {
      Player: new (elementId: string, options: Record<string, unknown>) => {
        playVideo: () => void;
        unMute: () => void;
        setVolume: (value: number) => void;
      };
      PlayerState?: {
        PLAYING: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

function setRobotsNoIndex() {
  let robots = document.querySelector('meta[name="robots"]');
  if (!robots) {
    robots = document.createElement('meta');
    robots.setAttribute('name', 'robots');
    document.head.appendChild(robots);
  }
  robots.setAttribute('content', 'noindex,nofollow,noarchive');
}

const InscripcionesLandingPage = () => {
  const [inscritos, setInscritos] = useState<number>(0);
  const [isLoadingCount, setIsLoadingCount] = useState(true);
  const [hasClicked, setHasClicked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countError, setCountError] = useState('');
  const playerReadyRef = useRef(false);
  const playerRef = useRef<{
    playVideo: () => void;
    unMute: () => void;
    setVolume: (value: number) => void;
  } | null>(null);

  useEffect(() => {
    setRobotsNoIndex();
    setHasClicked(localStorage.getItem(CLICK_STORAGE_KEY) === 'true');

    let isMounted = true;

    const loadCount = async () => {
      try {
        const response = await fetch(COUNTER_ENDPOINT);
        if (!response.ok) {
          throw new Error(`Counter request failed: ${response.status}`);
        }

        const payload = await response.json();
        if (isMounted) {
          setInscritos(Number(payload?.count) || 0);
        }
      } catch (error) {
        if (isMounted) {
          setCountError('No se pudo cargar el contador.');
        }
      } finally {
        if (isMounted) {
          setIsLoadingCount(false);
        }
      }
    };

    loadCount();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const bootPlayer = () => {
      if (cancelled || !window.YT?.Player || playerReadyRef.current) {
        return;
      }

      playerReadyRef.current = true;

      playerRef.current = new window.YT.Player('aca-rickroll-player', {
        videoId: RICKROLL_VIDEO_ID,
        playerVars: {
          autoplay: 1,
          controls: 1,
          loop: 1,
          mute: 1,
          playlist: RICKROLL_VIDEO_ID,
          playsinline: 1,
          rel: 0,
          modestbranding: 1,
        },
        events: {
          onReady: (event: { target: { unMute: () => void; setVolume: (value: number) => void; playVideo: () => void } }) => {
            playerRef.current = event.target;
            event.target.playVideo();
          },
        },
      });
    };

    if (window.YT?.Player) {
      bootPlayer();
      return () => {
        cancelled = true;
      };
    }

    const existingScript = document.querySelector<HTMLScriptElement>('script[data-youtube-api="true"]');
    if (!existingScript) {
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      script.dataset.youtubeApi = 'true';
      document.body.appendChild(script);
    }

    const previousReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof previousReady === 'function') {
        previousReady();
      }
      bootPlayer();
    };

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const enableAudio = () => {
      playerRef.current?.unMute();
      playerRef.current?.setVolume(100);
      playerRef.current?.playVideo();
      window.removeEventListener('pointerdown', enableAudio);
      window.removeEventListener('keydown', enableAudio);
    };

    window.addEventListener('pointerdown', enableAudio, { once: true });
    window.addEventListener('keydown', enableAudio, { once: true });

    return () => {
      window.removeEventListener('pointerdown', enableAudio);
      window.removeEventListener('keydown', enableAudio);
    };
  }, []);

  const handleInscribirme = async () => {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (!hasClicked) {
        const response = await fetch(COUNTER_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ source: 'landing-cta' }),
        });

        if (!response.ok) {
          throw new Error(`Counter increment failed: ${response.status}`);
        }

        const payload = await response.json();
        const nextCount = Number(payload?.count);
        if (Number.isFinite(nextCount)) {
          setInscritos(nextCount);
        }

        localStorage.setItem(CLICK_STORAGE_KEY, 'true');
        setHasClicked(true);
      }
    } catch {
      setCountError('No se pudo registrar el click, pero el video sigue su curso.');
    } finally {
      setIsSubmitting(false);
      playerRef.current?.unMute();
      playerRef.current?.setVolume(100);
      playerRef.current?.playVideo();
    }
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(255,167,38,0.2),_transparent_35%),linear-gradient(160deg,_#130a03_0%,_#2b1302_42%,_#070707_100%)] text-white">
      <SEOHelmet
        title="Taller de IA ACA"
        description="Inscripciones para el Taller de IA ACA."
        url="https://acachile.com/inscripciones"
      />

      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-8 sm:px-10 lg:px-12">
        <div className="grid flex-1 items-center gap-10 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-orange-400/30 bg-orange-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-orange-200">
              <Flame className="h-4 w-4" />
              Taller de IA ACA
            </div>

            <h1 className="mt-6 max-w-2xl font-serif text-5xl leading-none text-orange-50 sm:text-6xl lg:text-7xl">
              Inscripciones abiertas para el Taller de IA ACA.
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-orange-50/78">
              Reserva tu lugar antes de que se agoten. El contador refleja a quienes ya hicieron click para sumarse a este taller.
            </p>

            <div className="mt-8 flex flex-wrap items-end gap-4">
              <div className="rounded-[1.8rem] border border-white/10 bg-white/8 px-6 py-5 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur-md">
                <div className="text-xs font-semibold uppercase tracking-[0.28em] text-orange-200/80">
                  Inscritos
                </div>
                <div className="mt-2 text-4xl font-black text-white sm:text-5xl">
                  {isLoadingCount ? '...' : inscritos.toLocaleString('es-CL')}
                </div>
                <div className="mt-2 text-sm text-orange-100/70">
                  Basado en clicks confirmados en esta landing.
                </div>
              </div>

              <div className="rounded-[1.8rem] border border-orange-400/20 bg-black/20 px-5 py-4 text-sm leading-6 text-orange-50/80">
                <div className="flex items-center gap-2 font-semibold text-orange-100">
                  <Volume2 className="h-4 w-4" />
                  Video con autoplay
                </div>
                <p className="mt-2 max-w-xs">
                  Ahora arranca automático en modo compatible. En cuanto detecta tu primer gesto, activa audio al máximo.
                </p>
              </div>
            </div>

            <div className="mt-10 flex flex-wrap gap-4">
              <button
                type="button"
                onClick={handleInscribirme}
                className="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-orange-500 via-red-500 to-orange-400 px-7 py-4 text-base font-black uppercase tracking-[0.18em] text-white shadow-[0_18px_60px_rgba(255,102,0,0.35)] transition hover:scale-[1.02]"
              >
                {hasClicked ? 'Ya estás inscrito' : 'Inscribirme ahora'}
                <ExternalLink className="h-5 w-5" />
              </button>

              <a
                href={YOUTUBE_WATCH_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/8 px-7 py-4 text-base font-semibold text-white/90 backdrop-blur-md transition hover:bg-white/12"
              >
                Abrir directo en YouTube
              </a>
            </div>

            {countError ? (
              <p className="mt-4 text-sm text-orange-200/80">{countError}</p>
            ) : null}
          </section>

          <section className="relative">
            <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-orange-500/25 via-red-500/10 to-transparent blur-2xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/12 bg-black/45 p-3 shadow-[0_30px_90px_rgba(0,0,0,0.45)] backdrop-blur-md">
              <div className="mb-3 flex items-center justify-between rounded-[1.25rem] border border-white/8 bg-black/30 px-4 py-3 text-xs uppercase tracking-[0.25em] text-orange-100/70">
                <span>Streaming de bienvenida</span>
                <span>ACA Live</span>
              </div>
              <div className="aspect-video overflow-hidden rounded-[1.4rem] bg-black">
                <div id="aca-rickroll-player" className="h-full w-full" />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default InscripcionesLandingPage;
