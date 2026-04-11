import { NavLink, Outlet } from 'react-router-dom';
import { ChevronRight, LayoutDashboard } from 'lucide-react';
import { cn } from '../../utils/cn';
import { portalSections } from '../../features/portal/portalSections';

export default function PortalDelSocioLayout() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-neutral-100 via-white to-neutral-50">
      <div className="flex min-h-screen w-full flex-col lg:flex-row">
        <aside className="w-full border-b border-neutral-200 bg-white/95 backdrop-blur lg:sticky lg:top-0 lg:min-h-screen lg:w-[320px] lg:flex-shrink-0 lg:border-b-0 lg:border-r">
          <div className="px-4 py-5 sm:px-6 lg:px-7 lg:py-8">
            <div className="mb-5 space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-primary-700">
                <LayoutDashboard className="h-4 w-4" /> Portal del Socio
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
                  Navegación full page para socios
                </h1>
                <p className="text-sm leading-6 text-neutral-600 sm:text-[15px]">
                  El portal ahora usa una estructura de ancho completo, con menú persistente y experiencia optimizada tanto en navegador como en móvil.
                </p>
              </div>
            </div>

            <nav className="flex gap-2 overflow-x-auto pb-2 lg:block lg:space-y-1 lg:overflow-visible lg:pb-0">
              {portalSections.map((section) => (
                <NavLink
                  key={section.key}
                  to={`/portaldelsocio/${section.path}`}
                  className={({ isActive }) =>
                    cn(
                      'group flex min-w-fit items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition-all lg:min-w-0',
                      isActive
                        ? 'border-primary-600 bg-primary-600 text-white shadow-lg shadow-primary-500/20'
                        : 'border-transparent bg-neutral-50 text-neutral-700 hover:border-neutral-200 hover:bg-neutral-100 hover:text-neutral-950',
                    )
                  }
                >
                  <span className="truncate">{section.title}</span>
                  <ChevronRight className="h-4 w-4 flex-shrink-0 opacity-70 transition-transform group-hover:translate-x-0.5" />
                </NavLink>
              ))}
            </nav>
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8 xl:px-10">
          <div className="w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
