/**
 * Layout para el Panel de Administración con navegación lateral
 * ACA Chile Frontend
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Users, 
  FileText, 
  CreditCard, 
  Megaphone,
  LayoutDashboard,
  ChevronLeft
} from 'lucide-react';

interface PanelAdminLayoutProps {
  children: React.ReactNode;
}

const menuItems = [
  {
    path: '/panel-admin',
    label: 'Dashboard',
    icon: LayoutDashboard,
    description: 'Vista general'
  },
  {
    path: '/panel-admin/users',
    label: 'Gestión de Socios',
    icon: Users,
    description: 'Administrar socios'
  },
  {
    path: '/panel-admin/payments',
    label: 'Gestión de Cuotas',
    icon: CreditCard,
    description: 'Pagos y cuotas'
  },
  {
    path: '/panel-admin/content',
    label: 'Gestión de Contenido',
    icon: FileText,
    description: 'Eventos y noticias'
  },
  {
    path: '/panel-admin/news',
    label: 'Comunicados',
    icon: Megaphone,
    description: 'Anuncios y avisos'
  }
];

export default function PanelAdminLayout({ children }: PanelAdminLayoutProps) {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/panel-admin') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
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

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);

              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-start p-3 rounded-lg transition-all ${
                      active
                        ? 'bg-red-50 text-red-600 border border-red-200'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-red-600'
                    }`}
                  >
                    <Icon className={`h-5 w-5 mt-0.5 mr-3 flex-shrink-0 ${
                      active ? 'text-red-600' : 'text-gray-400'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-medium ${
                        active ? 'text-red-600' : 'text-gray-900'
                      }`}>
                        {item.label}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        {item.description}
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            ACA Chile © 2025
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
