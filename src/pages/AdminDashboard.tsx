import React, { useEffect, useState } from 'react';
import { adminService, type DashboardStats, type RecentActivity } from '../services/adminService';
import { authService } from '../services/authService';

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Verificar que el usuario sea admin
    if (!authService.isAdmin()) {
      setError('Acceso denegado. Se requieren permisos de administrador.');
      setLoading(false);
      return;
    }

    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, activityData] = await Promise.all([
        adminService.getDashboardStats(),
        adminService.getRecentActivity()
      ]);
      
      setStats(statsData);
      setRecentActivity(activityData);
      setError(null);
    } catch (err) {
      console.error('Error cargando dashboard:', err);
      setError('Error cargando los datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('es-ES').format(num);
  };

  const formatDate = (dateStr: string): string => {
    return new Date(dateStr).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActivityIcon = (type: string): string => {
    switch (type) {
      case 'user_registration': return '👤';
      case 'event_created': return '📅';
      case 'news_published': return '📰';
      case 'comment_added': return '💬';
      case 'login': return '🔐';
      default: return '📋';
    }
  };

  const getActivityColor = (type: string): string => {
    switch (type) {
      case 'user_registration': return 'bg-green-100 text-green-800';
      case 'event_created': return 'bg-blue-100 text-blue-800';
      case 'news_published': return 'bg-purple-100 text-purple-800';
      case 'comment_added': return 'bg-yellow-100 text-yellow-800';
      case 'login': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <div className="flex items-center">
            <div className="text-red-400 mr-3">⚠️</div>
            <div>
              <h3 className="text-red-800 font-medium">Error</h3>
              <p className="text-red-600 mt-1">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Panel de Administración
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Gestión y monitoreo del sistema
              </p>
            </div>
            <button
              onClick={loadDashboardData}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              🔄 Actualizar
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estadísticas principales */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Usuarios */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="text-2xl">👥</div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Usuarios
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {formatNumber(stats.users.total)}
                      </dd>
                    </dl>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="text-green-600 font-medium">
                      +{stats.users.new_today}
                    </span>
                    <span className="ml-1">hoy</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Eventos */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="text-2xl">📅</div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Eventos
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {formatNumber(stats.events.total)}
                      </dd>
                    </dl>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="text-blue-600 font-medium">
                      {stats.events.active} activos
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Noticias */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="text-2xl">📰</div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Noticias
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {formatNumber(stats.news.total)}
                      </dd>
                    </dl>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="text-purple-600 font-medium">
                      {stats.news.published} publicadas
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Comentarios */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="text-2xl">💬</div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Comentarios
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {formatNumber(stats.comments.total)}
                      </dd>
                    </dl>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="text-yellow-600 font-medium">
                      {stats.comments.pending} pendientes
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actividad reciente */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Actividad Reciente
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Últimas acciones realizadas en el sistema
            </p>
          </div>
          <ul className="divide-y divide-gray-200">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
                <li key={activity.id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center text-sm ${getActivityColor(activity.type)}`}>
                            {getActivityIcon(activity.type)}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {activity.description}
                          </div>
                          <div className="text-sm text-gray-500">
                            {activity.user.username} • {activity.user.email}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDate(activity.timestamp)}
                      </div>
                    </div>
                  </div>
                </li>
              ))
            ) : (
              <li>
                <div className="px-4 py-8 text-center text-gray-500">
                  <div className="text-4xl mb-2">📋</div>
                  <p>No hay actividad reciente</p>
                </div>
              </li>
            )}
          </ul>
        </div>

        {/* Estado del sistema */}
        {stats?.system && (
          <div className="mt-8 bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Estado del Sistema
              </h3>
              <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
                <div className="bg-gray-50 overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="text-lg">⏱️</div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Tiempo activo
                          </dt>
                          <dd className="text-sm text-gray-900">
                            {stats.system.uptime}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="text-lg">
                          {stats.system.health === 'healthy' ? '✅' : '⚠️'}
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Estado
                          </dt>
                          <dd className="text-sm text-gray-900 capitalize">
                            {stats.system.health}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 overflow-hidden shadow rounded-lg">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="text-lg">💾</div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            Último backup
                          </dt>
                          <dd className="text-sm text-gray-900">
                            {stats.system.last_backup || 'No disponible'}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}