/**
 * Dashboard principal del Panel de Administración
 * ACA Chile Frontend
 */

import { Link } from 'react-router-dom';
import { 
  Users, 
  FileText, 
  CreditCard, 
  Megaphone,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2
} from 'lucide-react';
import { useDashboardStats } from '../hooks/useDashboardStats';

export default function PanelAdminDashboard() {
  const { totalSocios, cuotasPendientes, eventosActivos, comunicados, loading, error } = useDashboardStats();

  const stats = [
    {
      label: 'Total Socios',
      value: loading ? '...' : totalSocios.toString(),
      change: '+0%',
      trend: 'up',
      icon: Users,
      color: 'blue'
    },
    {
      label: 'Cuotas Pendientes',
      value: loading ? '...' : cuotasPendientes.toString(),
      change: '-0%',
      trend: 'down',
      icon: Clock,
      color: 'yellow'
    },
    {
      label: 'Eventos Activos',
      value: loading ? '...' : eventosActivos.toString(),
      change: '+0%',
      trend: 'up',
      icon: FileText,
      color: 'green'
    },
    {
      label: 'Comunicados Publicados',
      value: loading ? '...' : comunicados.toString(),
      change: '+0%',
      trend: 'up',
      icon: Megaphone,
      color: 'purple'
    }
  ];

  const quickActions = [
    {
      title: 'Gestión de Socios',
      description: 'Ver y administrar todos los socios',
      icon: Users,
      link: '/panel-admin/users',
      color: 'blue'
    },
    {
      title: 'Gestión de Cuotas',
      description: 'Administrar pagos y cuotas mensuales',
      icon: CreditCard,
      link: '/panel-admin/payments',
      color: 'green'
    },
    {
      title: 'Gestión de Contenido',
      description: 'Crear y editar eventos y noticias',
      icon: FileText,
      link: '/panel-admin/content',
      color: 'purple'
    },
    {
      title: 'Comunicados',
      description: 'Publicar anuncios y avisos importantes',
      icon: Megaphone,
      link: '/panel-admin/news',
      color: 'red'
    }
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; border: string; icon: string }> = {
      blue: {
        bg: 'bg-blue-50',
        text: 'text-blue-600',
        border: 'border-blue-200',
        icon: 'text-blue-500'
      },
      yellow: {
        bg: 'bg-yellow-50',
        text: 'text-yellow-600',
        border: 'border-yellow-200',
        icon: 'text-yellow-500'
      },
      green: {
        bg: 'bg-green-50',
        text: 'text-green-600',
        border: 'border-green-200',
        icon: 'text-green-500'
      },
      purple: {
        bg: 'bg-purple-50',
        text: 'text-purple-600',
        border: 'border-purple-200',
        icon: 'text-purple-500'
      },
      red: {
        bg: 'bg-red-50',
        text: 'text-red-600',
        border: 'border-red-200',
        icon: 'text-red-500'
      }
    };
    return colors[color] ?? colors.blue;
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Administrativo</h1>
          <p className="text-gray-600 mt-2">
            Bienvenido al panel de administración de ACA Chile
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12 mb-8">
            <Loader2 className="h-8 w-8 text-red-600 animate-spin mr-2" />
            <span className="text-gray-600">Cargando estadísticas...</span>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon;
            const colors = getColorClasses(stat.color);

            return (
              <div
                key={stat.label}
                className={`${colors!.bg} border ${colors!.border} rounded-lg p-6`}
              >
                <div className="flex items-center justify-between mb-4">
                  <Icon className={`h-8 w-8 ${colors!.icon}`} />
                  <div className="flex items-center text-sm">
                    <TrendingUp className={`h-4 w-4 ${colors!.text} mr-1`} />
                    <span className={colors!.text}>{stat.change}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                  <p className={`text-2xl font-bold ${colors!.text}`}>{stat.value}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Accesos Rápidos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {quickActions.map((action) => {
              const Icon = action.icon;
              const colors = getColorClasses(action.color);

              return (
                <Link
                  key={action.link}
                  to={action.link}
                  className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow group"
                >
                  <div className="flex items-start">
                    <div className={`${colors!.bg} p-3 rounded-lg mr-4`}>
                      <Icon className={`h-6 w-6 ${colors!.icon}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-red-600 transition-colors">
                        {action.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">{action.description}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Actividad Reciente</h2>
          <div className="space-y-4">
            <div className="flex items-start p-4 bg-gray-50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-gray-900">Sistema configurado correctamente</p>
                <p className="text-xs text-gray-500 mt-1">Hace unos momentos</p>
              </div>
            </div>
            <div className="flex items-start p-4 bg-blue-50 rounded-lg">
              <AlertCircle className="h-5 w-5 text-blue-500 mr-3 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-gray-900">
                  Comienza a gestionar tu organización desde el panel
                </p>
                <p className="text-xs text-gray-500 mt-1">Sugerencia</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
