import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { ChevronRight, LayoutDashboard, ShieldCheck, Sparkles } from 'lucide-react';
import { cn } from '../../utils/cn';
import { portalSections } from '../../features/portal/portalSections';

export default function PortalDelSocioLayout() {
  const location = useLocation();
  const currentSection = portalSections.find((section) => location.pathname.endsWith(`/${section.path}`));

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(245,105,52,0.14),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(99,102,241,0.12),_transparent_28%),linear-gradient(180deg,_#f8fafc_0%,_#ffffff_46%,_#f8fafc_100%)]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-0 top-0 h-72 w-72 rounded-full bg-primary-200/35 blur-3xl" />
        <div className="absolute right-[-4rem] top-24 h-80 w-80 rounded-full bg-pastel-purple/70 blur-3xl" />
        <div className="absolute bottom-[-3rem] left-1/3 h-72 w-72 rounded-full bg-pastel-blue/80 blur-3xl" />
      </div>

      <div className="relative flex min-h-screen w-full flex-col lg:flex-row">
        <aside className="w-full border-b border-white/70 bg-white/80 backdrop-blur-soft lg:sticky lg:top-0 lg:min-h-screen lg:w-[340px] lg:flex-shrink-0 lg:border-b-0 lg:border-r lg:bg-white/72">
          <div className="flex h-full flex-col px-4 py-5 sm:px-6 lg:px-7 lg:py-8">
            <div className="rounded-[28px] border border-white/80 bg-gradient-to-br from-white via-white to-primary-50/80 p-5 shadow-soft-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary-200/70 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-primary-700 shadow-soft-sm">
                <LayoutDashboard className="h-4 w-4" /> Portal del Socio
              </div>

              <div className="mt-4 space-y-3">
                <h1 className="text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
                  Un espacio moderno, claro y listo para crecer
                </h1>
                <p className="text-sm leading-7 text-neutral-600 sm:text-[15px]">
                  El portal organiza toda la experiencia del socio en una navegación interna consistente, escalable y fácil de usar.
                </p>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <div className="rounded-2xl border border-primary-100 bg-primary-50/80 p-4 shadow-soft-sm">
                  <div className="flex items-center gap-2 text-sm font-semibold text-primary-800">
                    <Sparkles className="h-4 w-4" /> Experiencia premium
                  </div>
                  <p className="mt-2 text-xs leading-6 text-primary-900/80">
                    Jerarquía visual más clara y navegación más cómoda en desktop y móvil.
                  </p>
                </div>
                <div className="rounded-2xl border border-neutral-200 bg-white/90 p-4 shadow-soft-sm">
                  <div className="flex items-center gap-2 text-sm font-semibold text-neutral-800">
                    <ShieldCheck className="h-4 w-4 text-primary-600" /> Estructura escalable
                  </div>
                  <p className="mt-2 text-xs leading-6 text-neutral-600">
                    Lista para sumar módulos, herramientas y permisos sin rehacer la base.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 flex-1 rounded-[28px] border border-white/80 bg-white/75 p-3 shadow-soft-lg backdrop-blur-soft">
              <div className="mb-3 px-3 pt-2">
                <p className="text-sm font-semibold text-neutral-900">Menú del portal</p>
                <p className="mt-1 text-xs text-neutral-500">Todos los módulos disponibles para navegación interna.</p>
              </div>

              <nav className="flex gap-2 overflow-x-auto px-1 pb-2 lg:block lg:space-y-1 lg:overflow-visible lg:px-0 lg:pb-0">
                {portalSections.map((section) => (
                  <NavLink
                    key={section.key}
                    to={`/portaldelsocio/${section.path}`}
                    className={({ isActive }) =>
                      cn(
                        'group flex min-w-fit items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm font-medium transition-all duration-200 lg:min-w-0',
                        isActive
                          ? 'border-primary-500 bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-soft-colored-red'
                          : 'border-transparent bg-transparent text-neutral-700 hover:border-neutral-200 hover:bg-neutral-50 hover:text-neutral-950',
                      )
                    }
                  >
                    <span className="truncate">{section.title}</span>
                    <ChevronRight className="h-4 w-4 flex-shrink-0 opacity-70 transition-transform group-hover:translate-x-0.5" />
                  </NavLink>
                ))}
              </nav>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8 xl:px-10">
          <div className="mb-5 rounded-[24px] border border-white/80 bg-white/70 px-5 py-4 shadow-soft-md backdrop-blur-soft">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary-700">Sección activa</p>
            <div className="mt-2 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-neutral-950">
                  {currentSection?.title || 'Portal del Socio'}
                </h2>
                <p className="mt-1 text-sm text-neutral-600">
                  {currentSection?.description || 'Explora los distintos módulos del portal.'}
                </p>
              </div>
              <div className="text-xs text-neutral-500">
                Navegación interna persistente y preparada para ampliar funcionalidades.
              </div>
            </div>
          </div>

          <div className="w-full animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
