import React, { useState, useEffect } from 'react';
import { Container } from '../components/layout/Container';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../components/auth/PermissionGuard';
import { useLocation } from 'react-router-dom';
import { 
  Shield, 
  ChevronRight,
  UserCircle,
  Wallet,
  Bell
} from 'lucide-react';
import { ProfileModule } from '../components/profile/ProfileModule';
import { AccountModule } from '../components/profile/AccountModule';
import { SettingsModule } from '../components/profile/SettingsModule';
import { AdminModule } from '../components/profile/AdminModule';

type ActiveModule = 'profile' | 'account' | 'settings' | 'admin';

export const ProfilePage: React.FC = () => {
  const location = useLocation();
  const { user, getRoleDisplayName } = useAuth();
  const { isAdmin, isDirector, isDirectorEditor } = usePermissions();

  // Determine active module based on route
  const getActiveModuleFromRoute = (): ActiveModule => {
    const path = location.pathname;
    if (path === '/mi-cuenta') return 'account';
    if (path === '/configuracion') return 'settings';
    if (path === '/panel-admin') return 'admin';
    return 'profile';
  };

  const [activeModule, setActiveModule] = useState<ActiveModule>(getActiveModuleFromRoute());

  useEffect(() => {
    setActiveModule(getActiveModuleFromRoute());
  }, [location.pathname]);

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

  const showAdminPanel = isAdmin || isDirector || isDirectorEditor;

  const menuItems = [
    {
      id: 'profile' as ActiveModule,
      title: 'Mi Perfil',
      description: 'Información personal y datos de contacto',
      icon: UserCircle,
      color: 'blue'
    },
    {
      id: 'account' as ActiveModule,
      title: 'Mi Cuenta',
      description: 'Cuotas, torneos, premios y eventos',
      icon: Wallet,
      color: 'green'
    },
    {
      id: 'settings' as ActiveModule,
      title: 'Configuración',
      description: 'Contraseña, notificaciones y preferencias',
      icon: Bell,
      color: 'purple'
    }
  ];

  if (showAdminPanel) {
    menuItems.push({
      id: 'admin' as ActiveModule,
      title: 'Panel de Administración',
      description: 'Gestión de socios, eventos y comunicados',
      icon: Shield,
      color: 'red'
    });
  }

  const renderActiveModule = () => {
    switch (activeModule) {
      case 'profile':
        return <ProfileModule />;
      case 'account':
        return <AccountModule />;
      case 'settings':
        return <SettingsModule />;
      case 'admin':
        return showAdminPanel ? <AdminModule /> : null;
      default:
        return <ProfileModule />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-pastel-purple-50 to-neutral-100 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-gradient-to-r from-primary-200/20 to-pastel-blue-200/20 rounded-full blur-3xl animate-soft-pulse"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-pastel-pink-200/20 to-primary-200/20 rounded-full blur-3xl animate-soft-pulse delay-1000"></div>
      
      <Container>
        <div className="py-12 relative z-10">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-primary-600 to-primary-500 shadow-soft-lg flex items-center justify-center">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-white font-bold text-xl">
                    {user.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
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
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <div className="bg-white/60 backdrop-blur-soft border border-white/30 rounded-2xl shadow-soft-lg p-6 sticky top-6">
                <h2 className="text-lg font-semibold text-neutral-700 mb-4">
                  Navegación
                </h2>
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
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            isActive
                              ? `bg-${item.color}-500 text-white shadow-soft-xs`
                              : `bg-${item.color}-100 text-${item.color}-600 group-hover:bg-${item.color}-200`
                          } transition-all duration-300`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="text-left">
                            <p className={`font-medium text-sm ${
                              isActive ? 'text-primary-700' : 'text-neutral-700'
                            }`}>
                              {item.title}
                            </p>
                            <p className="text-xs text-neutral-500 hidden sm:block">
                              {item.description}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className={`w-4 h-4 transition-all duration-300 ${
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

            {/* Main Content */}
            <div className="lg:col-span-3">
              {renderActiveModule()}
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
};