import React from 'react';
import { Link } from 'react-router-dom';
import { Container } from '../components/ui/Container';

const JoinPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-primary-50/30 to-white py-16 sm:py-24">
      <Container>
        <div className="mx-auto max-w-3xl rounded-3xl border border-neutral-200 bg-white p-8 text-center shadow-sm sm:p-12">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <span className="text-2xl">⏸️</span>
          </div>
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">
            Postulaciones cerradas
          </p>
          <h1 className="mb-4 text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
            Únete a ACA, cerrado temporalmente
          </h1>
          <p className="mx-auto max-w-2xl text-base leading-7 text-neutral-600 sm:text-lg">
            En este momento el formulario de postulaciones se encuentra temporalmente deshabilitado.
            Cuando el proceso vuelva a estar disponible lo anunciaremos por los canales oficiales de ACA Chile.
          </p>

          <div className="mt-8 rounded-2xl bg-neutral-50 p-5 text-left text-sm leading-6 text-neutral-600 sm:text-base">
            <p className="font-semibold text-neutral-900">Mientras tanto</p>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>puedes revisar nuestras noticias y eventos en la página principal,</li>
              <li>seguir nuestras redes sociales para enterarte de la reapertura,</li>
              <li>o contactarte con ACA por los canales oficiales publicados en el sitio.</li>
            </ul>
          </div>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-2xl bg-primary-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-700"
            >
              Volver al inicio
            </Link>
            <span className="inline-flex items-center justify-center rounded-2xl border border-neutral-200 bg-neutral-100 px-6 py-3 text-sm font-semibold text-neutral-500">
              Formulario temporalmente cerrado
            </span>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default JoinPage;
