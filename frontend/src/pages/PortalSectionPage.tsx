import { Link } from 'react-router-dom';
import type { PortalSection } from '../features/portal/portalSections';

interface PortalSectionPageProps {
  section: PortalSection;
}

export default function PortalSectionPage({ section }: PortalSectionPageProps) {
  return (
    <div className="space-y-6 rounded-[28px] border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="space-y-3 border-b border-neutral-100 pb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-700">Portal del Socio</p>
        <h2 className="text-3xl font-bold tracking-tight text-neutral-950">{section.title}</h2>
        <p className="max-w-3xl text-sm leading-7 text-neutral-600 sm:text-base">{section.description}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
          <p className="text-sm font-semibold text-neutral-900">Estado del módulo</p>
          <p className="mt-2 text-sm text-neutral-600">
            Esta sección ya quedó disponible dentro del portal y preparada para recibir funcionalidades específicas.
          </p>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
          <p className="text-sm font-semibold text-neutral-900">Escalabilidad</p>
          <p className="mt-2 text-sm text-neutral-600">
            La estructura actual permite agregar componentes, servicios, permisos y vistas propias por sección.
          </p>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-5 md:col-span-2 xl:col-span-1">
          <p className="text-sm font-semibold text-neutral-900">Navegación</p>
          <p className="mt-2 text-sm text-neutral-600">
            Usa el menú lateral o superior para cambiar de módulo sin salir del Portal del Socio.
          </p>
        </div>
      </div>

      <div className="rounded-3xl bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-6 text-white shadow-lg shadow-primary-500/20">
        <p className="text-lg font-semibold">Bienvenido a la sección {section.title}</p>
        <p className="mt-2 max-w-2xl text-sm text-white/85 sm:text-base">
          Aquí podremos sumar contenido, herramientas y flujos propios del módulo cuando definan su alcance funcional.
        </p>
        <div className="mt-4">
          <Link
            to="/portaldelsocio/inicio"
            className="inline-flex items-center rounded-xl bg-white px-4 py-2 text-sm font-semibold text-primary-700 transition hover:bg-primary-50"
          >
            Volver al inicio del portal
          </Link>
        </div>
      </div>
    </div>
  );
}
