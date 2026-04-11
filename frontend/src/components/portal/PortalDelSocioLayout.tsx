import { NavLink, Outlet } from 'react-router-dom';
import { ChevronRight, LayoutDashboard } from 'lucide-react';
import { Container } from '../ui/Container';
import { cn } from '../../utils/cn';
import { portalSections } from '../../features/portal/portalSections';

export default function PortalDelSocioLayout() {
  return (
    <div className="bg-gradient-to-b from-neutral-50 via-white to-neutral-100 py-10 sm:py-12 lg:py-16">
      <Container>
        <div className="mb-8 rounded-[28px] border border-white/70 bg-white/90 p-6 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.35)] backdrop-blur sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-primary-700">
                <LayoutDashboard className="h-4 w-4" /> Portal del Socio
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-neutral-950 sm:text-4xl">
                Un espacio interno, claro y listo para crecer
              </h1>
              <p className="text-sm leading-7 text-neutral-600 sm:text-base">
                Este portal organiza los módulos clave para socios en una sola navegación persistente,
                con estructura preparada para sumar funcionalidades futuras sin romper la experiencia.
              </p>
            </div>

            <div className="rounded-2xl border border-primary-100 bg-primary-50/80 px-5 py-4 text-sm text-primary-900">
              <p className="font-semibold">Navegación interna persistente</p>
              <p className="mt-1 text-primary-800/80">Cada sección carga dentro del mismo layout del portal.</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start">
          <aside className="lg:sticky lg:top-24">
            <div className="rounded-[24px] border border-neutral-200 bg-white p-4 shadow-sm">
              <div className="mb-3 px-2">
                <p className="text-sm font-semibold text-neutral-900">Menú del portal</p>
                <p className="mt-1 text-xs text-neutral-500">Accede rápidamente a cada módulo.</p>
              </div>

              <nav className="flex gap-2 overflow-x-auto pb-2 lg:block lg:space-y-1 lg:overflow-visible lg:pb-0">
                {portalSections.map((section) => (
                  <NavLink
                    key={section.key}
                    to={`/portaldelsocio/${section.path}`}
                    className={({ isActive }) =>
                      cn(
                        'group flex min-w-fit items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition-all',
                        isActive
                          ? 'border-primary-600 bg-primary-600 text-white shadow-lg shadow-primary-500/20'
                          : 'border-transparent bg-neutral-50 text-neutral-700 hover:border-neutral-200 hover:bg-neutral-100 hover:text-neutral-950',
                      )
                    }
                  >
                    <span>{section.title}</span>
                    <ChevronRight className="h-4 w-4 opacity-70 transition-transform group-hover:translate-x-0.5" />
                  </NavLink>
                ))}
              </nav>
            </div>
          </aside>

          <main>
            <Outlet />
          </main>
        </div>
      </Container>
    </div>
  );
}
