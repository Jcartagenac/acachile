/**
 * Layout para el Panel de Administración con navegación lateral
 * ACA Chile Frontend
 */

import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Users,
  FileText,
  CreditCard,
  Megaphone,
  LayoutDashboard,
  ChevronLeft,
  UserCheck,
  Menu as MenuIcon,
  X,
  Gift,
  Trash2,
  BookOpen,
  ShoppingCart,
} from 'lucide-react';

interface PanelAdminLayoutProps {
  children: React.ReactNode;
}

interface MenuItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

interface MenuGroup {
  label?: string;
  items: MenuItem[];
}

const menuGroups: MenuGroup[] = [
  {
    items: [
      {
        path: '/panel-admin',
        label: 'Dashboard',
        icon: LayoutDashboard,
        description: 'Vista general',
      },
      {
        path: '/panel-admin/postulantes',
        label: 'Postulantes',
        icon: UserCheck,
        description: 'Revisión y aprobación',
      },
      {
        path: '/panel-admin/users',
        label: 'Gestión de Socios',
        icon: Users,
        description: 'Administrar socios',
      },
      {
        path: '/panel-admin/payments',
        label: 'Gestión de Cuotas',
        icon: CreditCard,
        description: 'Pagos y cuotas',
      },
      {
        path: '/panel-admin/content',
        label: 'Gestión de Contenido',
        icon: FileText,
        description: 'Eventos y noticias',
      },
      {
        path: '/panel-admin/news',
        label: 'Comunicados',
        icon: Megaphone,
        description: 'Anuncios y avisos',
      },
      {
        path: '/panel-admin/guestbook',
        label: 'Libro de Visitas',
        icon: BookOpen,
        description: 'Gestionar mensajes',
      },
      {
        path: '/panel-admin/ecommerce',
        label: 'Ecommerce',
        icon: ShoppingCart,
        description: 'Productos y órdenes',
      },
    ],
  },
  {
    items: [
      {
        path: '/panel-admin/papelera',
        label: 'Papelera',
        icon: Trash2,
        description: 'Noticias eliminadas',
      },
      {
        path: '/panel-admin/guestbook/trash',
        label: 'Papelera Visitas',
        icon: Trash2,
        description: 'Visitas eliminadas',
      },
      {
        path: '/panel-admin/participantes',
        label: 'Participantes Sorteo',
        icon: Gift,
        description: 'Lista de participantes',
      },
    ],
  },
];

export default function PanelAdminLayout({ children }: PanelAdminLayoutProps) {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/panel-admin') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const renderMenuItems = (onNavigate?: () => void) => (
    <div className="space-y-6">
      {menuGroups.map((group, groupIndex) => (
        <div key={groupIndex}>
          {group.label && (
            <div className="px-3 mb-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {group.label}
              </h3>
            </div>
          )}
          <ul className="space-y-2">
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={() => {
                      onNavigate?.();
                    }}
                    className={`flex items-start p-3 rounded-lg transition-all ${
                      active
                        ? 'bg-red-50 text-red-600 border border-red-200'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-red-600'
                    }`}
                  >
                    <Icon
                      className={`h-5 w-5 mt-0.5 mr-3 flex-shrink-0 ${
                        active ? 'text-red-600' : 'text-gray-400'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div
                        className={`text-sm font-medium ${
                          active ? 'text-red-600' : 'text-gray-900'
                        }`}
                      >
                        {item.label}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">{item.description}</div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );

  const closeSidebar = () => setIsSidebarOpen(false);
  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Mobile top bar */}
      <div className="md:hidden sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <Link
            to="/perfil"
            className="flex items-center text-gray-600 hover:text-red-600 transition-colors text-sm font-medium"
          >
            <ChevronLeft className="h-5 w-5 mr-2" />
            Volver a Mi Perfil
          </Link>
          <button
            type="button"
            onClick={toggleSidebar}
            className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 shadow-sm hover:text-red-600 hover:border-red-200 transition-colors"
            aria-label="Abrir menú de administración"
          >
            {isSidebarOpen ? <X className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
          </button>
        </div>
        <div className="px-4 pb-3">
          <h2 className="text-lg font-semibold text-gray-900">Panel Admin</h2>
          <p className="text-sm text-gray-600">Gestión de ACA Chile</p>
        </div>
      </div>

      <div className="flex flex-1 flex-col md:flex-row">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-col">
          <div className="p-6 border-b border-gray-200">
            <Link
              to="/perfil"
              className="flex items-center text-gray-600 hover:text-red-600 transition-colors mb-4"
            >
              <ChevronLeft className="h-5 w-5 mr-1" />
              <span className="text-sm">Volver a Mi Perfil</span>
            </Link>
            <h2 className="text-xl font-bold text-gray-900">Panel Admin</h2>
            <p className="text-sm text-gray-600 mt-1">Gestión de ACA Chile</p>
          </div>

          <nav className="flex-1 p-4 overflow-y-auto">{renderMenuItems()}</nav>

          <div className="p-4 border-t border-gray-200">
            <div className="text-xs text-gray-500 text-center">ACA Chile © 2025</div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/30" onClick={closeSidebar} />
          <aside className="relative ml-auto flex h-full w-72 max-w-[85%] flex-col bg-white border-l border-gray-200 shadow-xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Panel Admin</h2>
                <p className="text-sm text-gray-600">Gestión de ACA Chile</p>
              </div>
              <button
                type="button"
                onClick={closeSidebar}
                className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 hover:border-red-200 hover:text-red-600 transition-colors"
                aria-label="Cerrar menú de administración"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-4">{renderMenuItems(closeSidebar)}</nav>
            <div className="p-4 border-t border-gray-200 text-xs text-gray-500 text-center">
              ACA Chile © 2025
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
