import { Link, useOutletContext, useParams } from 'react-router-dom';
import { ArrowUpRight, Blocks, Compass, Layers3 } from 'lucide-react';
import type { PortalSectionContent } from '@shared/portalSections';
import type { PortalLayoutContextValue } from '../components/portal/PortalDelSocioLayout';

export default function PortalSectionPage() {
  const { section: sectionPath } = useParams();
  const { sections } = useOutletContext<PortalLayoutContextValue>();

  const section: PortalSectionContent | undefined = sections.find((item) => item.path === sectionPath) || sections[0];

  if (!section) {
    return (
      <div className="rounded-[32px] border border-white/80 bg-white/85 p-8 shadow-soft-xl backdrop-blur-soft">
        <h2 className="text-2xl font-bold text-neutral-950">Portal del Socio</h2>
        <p className="mt-2 text-sm text-neutral-600">No se pudo resolver la sección solicitada.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-10rem)] w-full flex-col gap-6 rounded-[32px] border border-white/80 bg-white/85 p-5 shadow-soft-xl backdrop-blur-soft sm:p-8 lg:p-10">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_360px] xl:items-start">
        <div className="space-y-4">
          <p className="inline-flex items-center rounded-full border border-primary-200/70 bg-primary-50/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-primary-700">
            Portal del Socio
          </p>
          <div className="space-y-3">
            <h2 className="text-3xl font-bold tracking-tight text-neutral-950 sm:text-4xl lg:text-[2.6rem]">
              {section.title}
            </h2>
            <p className="max-w-4xl text-sm leading-8 text-neutral-600 sm:text-base">
              {section.description}
            </p>
          </div>
        </div>

        <div className="rounded-[28px] border border-primary-100 bg-gradient-to-br from-primary-50 via-white to-primary-100/70 p-5 shadow-soft-lg">
          <p className="text-sm font-semibold text-neutral-900">Visión del módulo</p>
          <p className="mt-3 text-sm leading-7 text-neutral-600">
            Esta sección ya está estructurada para crecer con componentes, integraciones, permisos, contenidos y herramientas propias.
          </p>
          <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary-700 shadow-soft-sm">
            <ArrowUpRight className="h-4 w-4" /> Preparada para siguiente etapa
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-[28px] border border-neutral-200 bg-neutral-50/90 p-5 shadow-soft-sm transition-transform duration-200 hover:-translate-y-1">
          <div className="inline-flex rounded-2xl bg-white p-3 shadow-soft-sm">
            <Blocks className="h-5 w-5 text-primary-600" />
          </div>
          <p className="mt-4 text-base font-semibold text-neutral-900">Base funcional</p>
          <p className="mt-2 text-sm leading-7 text-neutral-600">
            La sección ya está habilitada dentro del portal con navegación propia y una base clara para sumar contenido real.
          </p>
        </div>

        <div className="rounded-[28px] border border-neutral-200 bg-neutral-50/90 p-5 shadow-soft-sm transition-transform duration-200 hover:-translate-y-1">
          <div className="inline-flex rounded-2xl bg-white p-3 shadow-soft-sm">
            <Layers3 className="h-5 w-5 text-primary-600" />
          </div>
          <p className="mt-4 text-base font-semibold text-neutral-900">Escalabilidad</p>
          <p className="mt-2 text-sm leading-7 text-neutral-600">
            El módulo puede crecer con vistas, servicios, permisos, componentes específicos y lógica independiente cuando lo definan.
          </p>
        </div>

        <div className="rounded-[28px] border border-neutral-200 bg-neutral-50/90 p-5 shadow-soft-sm transition-transform duration-200 hover:-translate-y-1 md:col-span-2 xl:col-span-1">
          <div className="inline-flex rounded-2xl bg-white p-3 shadow-soft-sm">
            <Compass className="h-5 w-5 text-primary-600" />
          </div>
          <p className="mt-4 text-base font-semibold text-neutral-900">Navegación clara</p>
          <p className="mt-2 text-sm leading-7 text-neutral-600">
            Puedes moverte entre módulos sin salir del portal, manteniendo una experiencia fluida y consistente.
          </p>
        </div>
      </div>

      <div className="mt-auto overflow-hidden rounded-[32px] bg-gradient-to-r from-neutral-950 via-neutral-900 to-primary-900 px-6 py-7 text-white shadow-[0_24px_60px_-30px_rgba(15,23,42,0.8)] sm:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-lg font-semibold">Bienvenido a la sección {section.title}</p>
            <p className="mt-2 text-sm leading-7 text-white/80 sm:text-base">
              Este módulo ya tiene una base visual y estructural sólida para evolucionar hacia una experiencia completa dentro del Portal del Socio.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/portaldelsocio/inicio"
              className="inline-flex items-center rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-primary-700 transition hover:bg-primary-50"
            >
              Volver al inicio
            </Link>
            <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-2.5 text-xs uppercase tracking-[0.2em] text-white/70">
              Espacio listo para crecer
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
