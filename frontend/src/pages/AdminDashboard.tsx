/**
 * Panel de administración principal
 * ACA Chile Frontend
 */

import React, { useState, useEffect } from 'react';
import { adminService, DashboardStats } from '../services/adminService';
import { 
  Users,
  FileText,
  MessageSquare,
  Eye,
  TrendingUp,
  Calendar,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { SEOHelmet } from '../components/SEOHelmet';

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    loadDashboardStats();
  }, [timeRange]);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await adminService.getDashboardStats(timeRange);
      
      if (response.success && response.data) {
        setStats(response.data);
      } else {
        setError(response.error || 'Error cargando estadísticas');
      }
    } catch (err) {
      setError('Error cargando el dashboard');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const StatCard: React.FC<{
    title: string;
    value: number;
    icon: React.ReactNode;
    color: string;
    change?: number;
    changeType?: 'increase' | 'decrease';
  }> = ({ title, value, icon, color, change, changeType }) => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
          {change !== undefined && (
            <div className={`flex items-center mt-2 text-sm ${
              changeType === 'increase' ? 'text-green-600' : 'text-red-600'
            }`}>
              <TrendingUp className="h-4 w-4 mr-1" />
              <span>{change > 0 ? '+' : ''}{change.toFixed(1)}%</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <>
        <SEOHelmet title="Panel Administrativo - acachile.com" />
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-96 bg-gray-200 rounded-lg"></div>
              <div className="h-96 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <SEOHelmet title="Panel Administrativo - acachile.com" />
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600">{error}</p>
            <button
              onClick={loadDashboardStats}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Intentar de nuevo
            </button>
          </div>
        </div>
      </div>
      </>
    );
  }

  return (
    <>
      <SEOHelmet title="Panel Administrativo - acachile.com" />
      <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Panel de Administración</h1>
            <p className="text-gray-600">Resumen de actividad y estadísticas</p>
          </div>
          
          <div className="flex items-center space-x-2">
            <label htmlFor="timeRange" className="text-sm font-medium text-gray-700">
              Período:
            </label>
            <select
              id="timeRange"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as 'week' | 'month' | 'year')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="week">Última semana</option>
              <option value="month">Último mes</option>
              <option value="year">Último año</option>
            </select>
          </div>
        </div>

        {stats && (
          <>
            {/* Estadísticas principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                title="Total Usuarios"
                value={stats.users.total}
                icon={<Users className="h-6 w-6 text-white" />}
                color="bg-blue-500"
                change={stats.users.growth}
                changeType="increase"
              />
              
              <StatCard
                title="Eventos Activos"
                value={stats.events.active}
                icon={<Calendar className="h-6 w-6 text-white" />}
                color="bg-green-500"
                change={stats.events.growth}
                changeType="increase"
              />
              
              <StatCard
                title="Artículos Publicados"
                value={stats.articles.published}
                icon={<FileText className="h-6 w-6 text-white" />}
                color="bg-purple-500"
                change={stats.articles.growth}
                changeType="increase"
              />
              
              <StatCard
                title="Comentarios"
                value={stats.comments.total}
                icon={<MessageSquare className="h-6 w-6 text-white" />}
                color="bg-orange-500"
                change={stats.comments.growth}
                changeType="increase"
              />
            </div>

            {/* Sección de actividad reciente */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Usuarios activos */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Usuarios Activos ({timeRange})
                </h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Nuevos registros</span>
                    <span className="font-semibold text-green-600">+{stats.users.newRegistrations}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Usuarios activos</span>
                    <span className="font-semibold text-blue-600">{stats.users.activeUsers}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Tasa de actividad</span>
                    <span className="font-semibold text-gray-900">
                      {((stats.users.activeUsers / stats.users.total) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Contenido pendiente */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Contenido Pendiente
                </h2>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <AlertCircle className="h-4 w-4 text-yellow-500 mr-2" />
                      <span className="text-sm text-gray-600">Eventos por aprobar</span>
                    </div>
                    <span className="font-semibold text-yellow-600">{stats.events.pending}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <AlertCircle className="h-4 w-4 text-yellow-500 mr-2" />
                      <span className="text-sm text-gray-600">Artículos en borrador</span>
                    </div>
                    <span className="font-semibold text-yellow-600">{stats.articles.draft}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                      <span className="text-sm text-gray-600">Comentarios por moderar</span>
                    </div>
                    <span className="font-semibold text-red-600">{stats.comments.pending}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Estadísticas de engagement */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Vistas */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Vistas Totales
                </h2>
                <div className="flex items-center">
                  <Eye className="h-8 w-8 text-blue-500 mr-3" />
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.pageViews.total.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      +{stats.pageViews.growth.toFixed(1)}% vs período anterior
                    </p>
                  </div>
                </div>
              </div>

              {/* Inscripciones */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Inscripciones a Eventos
                </h2>
                <div className="flex items-center">
                  <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.registrations.total.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      +{stats.registrations.growth.toFixed(1)}% vs período anterior
                    </p>
                  </div>
                </div>
              </div>

              {/* Cancelaciones */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Cancelaciones
                </h2>
                <div className="flex items-center">
                  <XCircle className="h-8 w-8 text-red-500 mr-3" />
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.cancellations.total.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      Tasa: {((stats.cancellations.total / stats.registrations.total) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Acciones rápidas */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Acciones Rápidas
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors">
                  <Users className="h-6 w-6 text-gray-400 mr-2" />
                  <span className="text-gray-600">Gestionar Usuarios</span>
                </button>
                
                <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors">
                  <Calendar className="h-6 w-6 text-gray-400 mr-2" />
                  <span className="text-gray-600">Aprobar Eventos</span>
                </button>
                
                <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors">
                  <FileText className="h-6 w-6 text-gray-400 mr-2" />
                  <span className="text-gray-600">Moderar Artículos</span>
                </button>
                
                <button className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors">
                  <MessageSquare className="h-6 w-6 text-gray-400 mr-2" />
                  <span className="text-gray-600">Revisar Comentarios</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
    </>
  );
};

export default AdminDashboard;