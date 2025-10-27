import React from 'react';
import { Container } from '../components/ui/Container';
import { JoinApplicationForm } from '../components/join/JoinApplicationForm';
import { CheckCircle2, ShieldCheck, Users } from 'lucide-react';

export const JoinPage: React.FC = () => {
  return (
    <div className="bg-soft-gradient-light py-20">
      <Container>
        <div className="mx-auto mb-16 max-w-4xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-4 py-2 text-sm font-semibold text-primary-600">
            <ShieldCheck className="h-4 w-4" />
            Comunidad ACA Chile
          </span>
          <h1 className="mt-6 text-4xl font-bold leading-tight text-neutral-900 sm:text-5xl">
            Postula para convertirte en socio oficial de ACA Chile
          </h1>
          <p className="mt-4 text-lg text-neutral-600">
            Buscamos personas apasionadas por la parrilla que quieran compartir conocimientos,
            representar a la comunidad y aportar a nuestros proyectos en todo el país.
          </p>
        </div>

        <div className="grid gap-6 pb-16 md:grid-cols-3">
          {[
            {
              icon: Users,
              title: 'Comunidad profesional',
              description:
                'Comparte experiencias con parrilleros de todo Chile y accede a capacitaciones exclusivas.',
            },
            {
              icon: CheckCircle2,
              title: 'Proceso transparente',
              description:
                'Tu postulación será revisada por dos miembros del directorio para garantizar la calidad de la red.',
            },
            {
              icon: ShieldCheck,
              title: 'Compromiso ACA',
              description:
                'Ser socio implica representar los valores de la asociación en eventos, talleres y competencias.',
            },
          ].map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-soft-lg backdrop-blur"
            >
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-100 text-primary-600">
                <Icon className="h-6 w-6" />
              </span>
              <h3 className="mt-4 text-lg font-semibold text-neutral-900">{title}</h3>
              <p className="mt-2 text-sm text-neutral-600">{description}</p>
            </div>
          ))}
        </div>

        <JoinApplicationForm />
      </Container>
    </div>
  );
};

export default JoinPage;
