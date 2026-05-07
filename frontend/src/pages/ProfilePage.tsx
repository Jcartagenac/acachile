import React, { useEffect, useMemo, useState } from 'react';
import { Container } from '../components/layout/Container';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import {
  Bell,
  ChevronRight,
  FileText,
  Gift,
  GraduationCap,
  Megaphone,
  Phone,
  Scale,
  ShoppingBag,
  Trophy,
  UserCircle,
  Wallet,
  ExternalLink,
  Mail,
  BadgeCheck,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ProfileModule } from '../components/profile/ProfileModule';
import { CuotasModule } from '../components/profile/CuotasModule';
import { SettingsModule } from '../components/profile/SettingsModule';

type ActiveModule =
  | 'profile'
  | 'account'
  | 'settings'
  | 'communications'
  | 'benefits'
  | 'marketplace'
  | 'documents'
  | 'competitions'
  | 'ethics'
  | 'training'
  | 'reviewer';

interface ProfilePageProps {
  defaultTab?: ActiveModule;
}

interface ResourceLink {
  label: string;
  href: string;
}

interface ContactInfo {
  name: string;
  role: string;
  email?: string;
  phone?: string;
}

interface SectionModuleProps {
  title: string;
  description: string;
  contact?: ContactInfo;
  resources?: ResourceLink[];
}

interface MenuItem {
  id: ActiveModule;
  title: string;
  description: string;
  icon: LucideIcon;
  activeIconClass: string;
  inactiveIconClass: string;
}

const menuItems: MenuItem[] = [
  {
    id: 'profile',
    title: 'Mi Perfil',
    description: 'Información personal y datos de contacto',
    icon: UserCircle,
    activeIconClass: 'bg-blue-500 text-white shadow-soft-xs',
    inactiveIconClass: 'bg-blue-100 text-blue-600 group-hover:bg-blue-200',
  },
  {
    id: 'account',
    title: 'Mi Cuenta',
    description: 'Cuotas, torneos, premios y eventos',
    icon: Wallet,
    activeIconClass: 'bg-green-500 text-white shadow-soft-xs',
    inactiveIconClass: 'bg-green-100 text-green-600 group-hover:bg-green-200',
  },
  {
    id: 'settings',
    title: 'Configuración',
    description: 'Contraseña, notificaciones y preferencias',
    icon: Bell,
    activeIconClass: 'bg-purple-500 text-white shadow-soft-xs',
    inactiveIconClass: 'bg-purple-100 text-purple-600 group-hover:bg-purple-200',
  },
  {
    id: 'communications',
    title: 'Comunicaciones',
    description: 'Canales oficiales y contacto de comunicaciones',
    icon: Megaphone,
    activeIconClass: 'bg-pink-500 text-white shadow-soft-xs',
    inactiveIconClass: 'bg-pink-100 text-pink-600 group-hover:bg-pink-200',
  },
  {
    id: 'benefits',
    title: 'Beneficios',
    description: 'Convenios y ventajas disponibles para socios',
    icon: Gift,
    activeIconClass: 'bg-amber-500 text-white shadow-soft-xs',
    inactiveIconClass: 'bg-amber-100 text-amber-600 group-hover:bg-amber-200',
  },
  {
    id: 'marketplace',
    title: 'MarketPlace',
    description: 'Espacio comercial y oportunidades entre socios',
    icon: ShoppingBag,
    activeIconClass: 'bg-emerald-500 text-white shadow-soft-xs',
    inactiveIconClass: 'bg-emerald-100 text-emerald-600 group-hover:bg-emerald-200',
  },
  {
    id: 'documents',
    title: 'Documentos',
    description: 'Archivos oficiales y material interno de ACA',
    icon: FileText,
    activeIconClass: 'bg-slate-600 text-white shadow-soft-xs',
    inactiveIconClass: 'bg-slate-100 text-slate-600 group-hover:bg-slate-200',
  },
  {
    id: 'competitions',
    title: 'Competencias',
    description: 'Accesos y referencias del área de torneos',
    icon: Trophy,
    activeIconClass: 'bg-orange-500 text-white shadow-soft-xs',
    inactiveIconClass: 'bg-orange-100 text-orange-600 group-hover:bg-orange-200',
  },
  {
    id: 'ethics',
    title: 'Ética',
    description: 'Canal y referencia del comité de ética',
    icon: Scale,
    activeIconClass: 'bg-rose-500 text-white shadow-soft-xs',
    inactiveIconClass: 'bg-rose-100 text-rose-600 group-hover:bg-rose-200',
  },
  {
    id: 'training',
    title: 'Formación',
    description: 'Recursos y espacios de aprendizaje para socios',
    icon: GraduationCap,
    activeIconClass: 'bg-cyan-500 text-white shadow-soft-xs',
    inactiveIconClass: 'bg-cyan-100 text-cyan-600 group-hover:bg-cyan-200',
  },
  {
    id: 'reviewer',
    title: 'Revisor de cuentas',
    description: 'Contacto del comité revisor de cuentas',
    icon: BadgeCheck,
    activeIconClass: 'bg-indigo-500 text-white shadow-soft-xs',
    inactiveIconClass: 'bg-indigo-100 text-indigo-600 group-hover:bg-indigo-200',
  },
];

const auxiliaryModules: Record<Exclude<ActiveModule, 'profile' | 'account' | 'settings'>, SectionModuleProps> = {
  communications: {
    title: 'Comunicaciones',
    description: 'Encuentra los canales oficiales de difusión de ACA y el contacto directo del área de comunicaciones.',
    contact: {
      name: 'Paulina Sandoval',
      role: 'Directora de Comunicaciones',
      email: 'comunicaciones@acachile.com',
      phone: '+56 9 5048 6915',
    },
    resources: [
      { label: 'Instagram ACA', href: 'https://www.instagram.com/aca.chile' },
      { label: 'ACA TV en YouTube', href: 'https://www.youtube.com/@acatvchile' },
      { label: 'Facebook ACA', href: 'https://www.facebook.com/groups/136196551792156/' },
    ],
  },
  benefits: {
    title: 'Beneficios',
    description: 'Revisa beneficios activos, convenios y accesos relevantes para socios desde un mismo lugar dentro del perfil.',
    resources: [
      { label: 'Convenios 2025', href: 'https://docs.google.com/spreadsheets/d/1z3poXdUG6DuNb57kK9Qpcmm8jVtz8moY-HhRqL8NiQg/edit?gid=0#gid=0' },
      { label: 'Link de pago Webpay', href: 'https://www.webpay.cl/company/61599?utm_source=transbank&utm_medium=portal3.0&utm_campaign=link_portal' },
    ],
  },
  marketplace: {
    title: 'MarketPlace',
    description: 'Sección pensada para concentrar publicaciones, productos, oportunidades y visibilidad comercial entre socios ACA.',
    resources: [
      { label: 'Ir al Portal del Socio / Marketplace', href: '/portaldelsocio/marketplace' },
    ],
  },
  documents: {
    title: 'Documentos',
    description: 'Accede rápidamente a documentos oficiales, archivos compartidos y material administrativo relevante para socios.',
    resources: [
      { label: 'Archivos Oficiales', href: 'https://drive.google.com/drive/folders/1ze6yNbu3PMrpzgPkpC5nWqXDeNzE7u6o?usp=sharing' },
      { label: 'Datos Bancarios', href: 'https://drive.google.com/file/d/1TJy_NyMf49uWW8HoCkHYQzVH95zcWJ82/view?usp=sharing' },
    ],
  },
  competitions: {
    title: 'Competencias',
    description: 'Mantén a mano el acceso al módulo de competencias y el contacto del área encargada para consultas y seguimiento.',
    contact: {
      name: 'Karina Norero',
      role: 'Directora de Torneos y Competencias',
      email: 'competencias@acachile.com',
      phone: '+56 9 2901 0492',
    },
    resources: [
      { label: 'Portal de Competencias', href: '/portaldelsocio/competencias' },
    ],
  },
  ethics: {
    title: 'Ética',
    description: 'Canal interno para consultas y referencias vinculadas al comité de ética de ACA.',
    contact: {
      name: 'Sergio Maturana',
      role: 'Comité de Ética',
      email: 'etica@acachile.com',
      phone: '+56 9 9309 8978',
    },
  },
  training: {
    title: 'Formación',
    description: 'Centraliza recursos de aprendizaje, encuentros formativos y material de apoyo pensado para los socios.',
    resources: [
      { label: 'Libros de Cocina', href: 'https://drive.google.com/drive/folders/16qUvneC58R57EKqvoqdLLUojJT0-0JCl?usp=sharing' },
      { label: 'Salón Zoom ACA', href: 'https://zoom.us/j/5690446271' },
    ],
  },
  reviewer: {
    title: 'Revisor de cuentas',
    description: 'Espacio de referencia para el comité revisor de cuentas, con su canal de contacto directo disponible para socios.',
    contact: {
      name: 'Javier Bianchi',
      role: 'Comité Revisor de Cuentas',
      email: 'contraloria@acachile.com',
      phone: '+56 9 7954 6507',
    },
  },
};

const SectionModule: React.FC<SectionModuleProps> = ({ title, description, contact, resources = [] }) => (
  <div className="bg-white/60 backdrop-blur-soft border border-white/30 rounded-2xl shadow-soft-lg p-6 sm:p-8 space-y-6">
    <div className="space-y-3">
      <span className="inline-flex items-center rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary-700 border border-primary-100">
        Área interna del perfil
      </span>
      <div>
        <h2 className="text-2xl font-bold text-neutral-700">{title}</h2>
        <p className="mt-2 text-sm leading-7 text-neutral-600 sm:text-base">{description}</p>
      </div>
    </div>

    <div className="grid gap-4 xl:grid-cols-2">
      <div className="rounded-2xl border border-primary-100 bg-gradient-to-br from-primary-50 via-white to-primary-50/50 p-5 shadow-soft-sm">
        <p className="text-sm font-semibold text-neutral-800">Estado del módulo</p>
        <p className="mt-2 text-sm leading-7 text-neutral-600">
          Esta sección ya quedó integrada al menú lateral del perfil, reutilizando la misma navegación interna, estados activos y comportamiento responsive del módulo actual.
        </p>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white/80 p-5 shadow-soft-sm">
        <p className="text-sm font-semibold text-neutral-800">Escalabilidad</p>
        <p className="mt-2 text-sm leading-7 text-neutral-600">
          La estructura permite sumar contenido específico más adelante sin cambiar la arquitectura de navegación existente en <span className="font-medium">/perfil</span>.
        </p>
      </div>
    </div>

    {(resources.length > 0 || contact) && (
      <div className="grid gap-4 lg:grid-cols-2">
        {resources.length > 0 && (
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50/80 p-5 shadow-soft-sm">
            <p className="text-sm font-semibold text-neutral-800">Accesos relacionados</p>
            <div className="mt-4 space-y-3">
              {resources.map((resource) => {
                const isExternal = resource.href.startsWith('http');
                return (
                  <a
                    key={resource.label}
                    href={resource.href}
                    target={isExternal ? '_blank' : undefined}
                    rel={isExternal ? 'noopener noreferrer' : undefined}
                    className="group flex items-center justify-between rounded-xl border border-white bg-white px-4 py-3 text-sm text-neutral-700 shadow-soft-sm transition-all duration-200 hover:border-primary-200 hover:text-primary-700"
                  >
                    <span className="pr-4">{resource.label}</span>
                    <ExternalLink className="h-4 w-4 flex-shrink-0 text-neutral-400 transition-colors group-hover:text-primary-500" />
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {contact && (
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50/80 p-5 shadow-soft-sm">
            <p className="text-sm font-semibold text-neutral-800">Contacto del área</p>
            <div className="mt-4 space-y-3 text-sm text-neutral-600">
              <div>
                <p className="font-medium text-neutral-800">{contact.name}</p>
                <p>{contact.role}</p>
              </div>
              {contact.email && (
                <a href={`mailto:${contact.email}`} className="flex items-center gap-2 transition-colors hover:text-primary-700">
                  <Mail className="h-4 w-4 text-primary-500" />
                  <span>{contact.email}</span>
                </a>
              )}
              {contact.phone && (
                <a href={`tel:${contact.phone.replace(/\s+/g, '')}`} className="flex items-center gap-2 transition-colors hover:text-primary-700">
                  <Phone className="h-4 w-4 text-primary-500" />
                  <span>{contact.phone}</span>
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    )}
  </div>
);

export const ProfilePage: React.FC<ProfilePageProps> = ({ defaultTab }) => {
  const location = useLocation();
  const { user, getRoleDisplayName } = useAuth();

  const getActiveModuleFromRoute = (): ActiveModule => {
    if (defaultTab) return defaultTab;

    const path = location.pathname;
    if (path === '/mi-cuenta') return 'account';
    if (path === '/configuracion') return 'settings';
    return 'profile';
  };

  const [activeModule, setActiveModule] = useState<ActiveModule>(getActiveModuleFromRoute());

  useEffect(() => {
    setActiveModule(getActiveModuleFromRoute());
  }, [location.pathname, defaultTab]);

  const activeMenuItem = useMemo(
    () => menuItems.find((item) => item.id === activeModule) ?? menuItems[0],
    [activeModule],
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-pastel-purple-50 to-neutral-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-neutral-700 mb-4">
            Acceso Denegado
          </h2>
          <p className="text-neutral-600">
            Debes iniciar sesión para acceder a tu perfil
          </p>
        </div>
      </div>
    );
  }

  const renderActiveModule = () => {
    switch (activeModule) {
      case 'profile':
        return <ProfileModule />;
      case 'account':
        return <CuotasModule />;
      case 'settings':
        return <SettingsModule />;
      case 'communications':
      case 'benefits':
      case 'marketplace':
      case 'documents':
      case 'competitions':
      case 'ethics':
      case 'training':
      case 'reviewer':
        return <SectionModule {...auxiliaryModules[activeModule]} />;
      default:
        return <ProfileModule />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-pastel-purple-50 to-neutral-100 relative overflow-hidden">
      <div className="absolute top-10 left-10 w-72 h-72 bg-gradient-to-r from-primary-200/20 to-pastel-blue-200/20 rounded-full blur-3xl animate-soft-pulse"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-pastel-pink-200/20 to-primary-200/20 rounded-full blur-3xl animate-soft-pulse delay-1000"></div>

      <Container>
        <div className="py-12 relative z-10">
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-4">
              <div
                className="rounded-full bg-gradient-to-r from-primary-600 to-primary-500 shadow-soft-lg overflow-hidden"
                style={{
                  width: '64px',
                  height: '64px',
                  minWidth: '64px',
                  minHeight: '64px',
                  maxWidth: '64px',
                  maxHeight: '64px'
                }}
              >
                {user.avatar ? (
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    position: 'relative',
                    backgroundColor: '#f3f4f6'
                  }}>
                    <img
                      src={user.avatar}
                      alt={user.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        objectPosition: 'center top',
                        display: 'block'
                      }}
                    />
                  </div>
                ) : (
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <span className="text-white font-bold text-xl">
                      {user.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
                  {user.name}
                </h1>
                <p className="text-lg text-neutral-600 flex items-center space-x-2">
                  <span>{getRoleDisplayName()}</span>
                  <span>•</span>
                  <span>{user.email}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1">
              <div className="bg-white/60 backdrop-blur-soft border border-white/30 rounded-2xl shadow-soft-lg p-6 sticky top-6">
                <h2 className="text-lg font-semibold text-neutral-700 mb-2">
                  Navegación
                </h2>
                <p className="mb-4 text-xs text-neutral-500 sm:text-sm">
                  Sección activa: <span className="font-medium text-primary-700">{activeMenuItem.title}</span>
                </p>
                <nav className="space-y-2">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeModule === item.id;

                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveModule(item.id)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-300 group ${
                          isActive
                            ? 'bg-gradient-to-r from-primary-100 to-primary-50 border border-primary-200 shadow-soft-sm'
                            : 'hover:bg-white/50 hover:shadow-soft-xs'
                        }`}
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
                            isActive ? item.activeIconClass : item.inactiveIconClass
                          }`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="text-left min-w-0">
                            <p className={`font-medium text-sm ${isActive ? 'text-primary-700' : 'text-neutral-700'}`}>
                              {item.title}
                            </p>
                            <p className="text-xs text-neutral-500 hidden sm:block">
                              {item.description}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className={`w-4 h-4 flex-shrink-0 transition-all duration-300 ${
                          isActive
                            ? 'text-primary-500 transform rotate-90'
                            : 'text-neutral-400 group-hover:text-primary-500 group-hover:translate-x-1'
                        }`} />
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>

            <div className="lg:col-span-3">
              {renderActiveModule()}
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
};

export default ProfilePage;
