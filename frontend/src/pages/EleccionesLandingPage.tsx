import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SEOHelmet } from '../components/SEOHelmet';
import { Container } from '../components/layout/Container';
import bannerElecciones from '../assets/elecciones/banner-elecciones-2026.jpg';

const tricelMembers = [
  { name: 'Alex Vidal', role: 'Presidente' },
  { name: 'Mario Pavez', role: 'Secretario' },
  { name: 'David Saavedra', role: 'Integrante' },
];

const setRobotsNoIndex = () => {
  let robots = document.querySelector('meta[name="robots"]');
  if (!robots) {
    robots = document.createElement('meta');
    robots.setAttribute('name', 'robots');
    document.head.appendChild(robots);
  }
  robots.setAttribute('content', 'noindex,nofollow,noarchive');
};

const EleccionesLandingPage: React.FC = () => {
  useEffect(() => {
    setRobotsNoIndex();
  }, []);

  return (
    <div className="min-h-screen bg-soft-gradient-light py-4 sm:py-10">
      <SEOHelmet
        title="Elecciones de directorio ACA 2026"
        description="Información oficial del proceso eleccionario y presentación del TRICEL 2026 de la Asociación Chilena de Asadores A.G."
        url="https://acachile.com/elecciones"
      />

      <Container size="xl" className="space-y-5 sm:space-y-8">
        <section className="overflow-hidden rounded-[1.5rem] border border-white/70 bg-white/80 shadow-xl shadow-stone-200/70 backdrop-blur-md sm:rounded-[2rem]">
          <div className="px-4 py-4 sm:px-8 sm:py-6">
            <div className="inline-flex items-center rounded-full border border-red-200 bg-red-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-red-700 sm:px-4">
              Proceso eleccionario 2026
            </div>
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-stone-900 sm:text-4xl lg:text-5xl">
              Elecciones de directorio ACA 2026
            </h1>
          </div>
          <div className="aspect-[16/9] w-full overflow-hidden bg-black">
            <img
              src={bannerElecciones}
              alt="Banner elecciones de directorio ACA 2026"
              className="h-full w-full object-cover"
            />
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr] lg:gap-6">
          <article className="rounded-[1.5rem] border border-stone-200 bg-white p-5 shadow-lg shadow-stone-200/60 sm:p-8">
            <div className="space-y-6 text-sm leading-7 text-stone-700 sm:text-base sm:leading-8">
              <p>Estimados socios de la Asociación Chilena de Asadores A.G.:</p>

              <p>
                Junto con saludar, nos dirigimos a ustedes para presentar formalmente al Tribunal Calificador de Elecciones (TRICEL), órgano responsable de velar por la transparencia, legalidad y correcto desarrollo del proceso eleccionario de nuestra asociación.
              </p>

              <p>El TRICEL para este proceso estará conformado por los siguientes socios:</p>

              <p>
                Como TRICEL, nuestro compromiso es actuar con total imparcialidad y apego a los estatutos vigentes, garantizando a todos los socios un proceso claro, ordenado y confiable.
              </p>

              <p>
                Agradecemos desde ya su participación y compromiso con la asociación. Y los esperamos para votar este 28 de Marzo 2026.
              </p>

              <div className="space-y-2 pt-2 text-sm leading-7 text-stone-800 sm:text-base">
                <p>Atentamente,</p>
                <p>TRICEL 2026</p>
                <p>Asociación Chilena de Asadores A.G.</p>
              </div>
            </div>
          </article>

          <aside className="space-y-4">
            <div className="rounded-[1.5rem] border border-stone-200 bg-white p-5 shadow-lg shadow-stone-200/60 sm:p-6">
              <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">Integrantes TRICEL</h2>
              <div className="mt-4 space-y-3">
                {tricelMembers.map((member) => (
                  <div key={member.name} className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-4">
                    <div className="text-base font-semibold text-stone-900">{member.name}</div>
                    <div className="mt-1 text-sm text-stone-600">{member.role}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-red-200 bg-gradient-to-br from-red-50 to-white p-5 shadow-lg shadow-red-100/50 sm:p-6">
              <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-red-700">Candidaturas y entrevistas</h2>
              <p className="mt-3 text-sm leading-6 text-stone-700 sm:text-base sm:leading-7">
                Revisa entrevistas, videos y resúmenes de las candidaturas en la sección preparada para este proceso.
              </p>
              <Link
                to="/elecciones/entrevistas"
                className="mt-4 inline-flex items-center rounded-2xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                Ver entrevistas
              </Link>
            </div>
          </aside>
        </section>
      </Container>
    </div>
  );
};

export default EleccionesLandingPage;
