import React, { useEffect, useState } from 'react';
import { adminService } from '../services/adminService';
import { authService } from '../services/authService';

interface SystemHealth {
  status: string;
  timestamp: string;
  checks: {
    [key: string]: {
      status: string;
      message: string;
      [key: string]: any;
    };
  };
  stats?: any;
}

interface MaintenanceStatus {
  mode: boolean;
  message: string;
  last_operations: Array<{
    id: string;
    action: string;
    success: boolean;
    timestamp: string;
  }>;
  system_status: string;
}

export default function AdminMonitoring() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [maintenance, setMaintenance] = useState<MaintenanceStatus | null>(null);
  const [logs, setLogs] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('health');
  const [performing, setPerforming] = useState<string | null>(null);

  useEffect(() => {
    if (!authService.isAdmin()) {
      setError('Acceso denegado. Se requieren permisos de administrador.');
      setLoading(false);
      return;
    }

    loadMonitoringData();
  }, []);

  const loadMonitoringData = async () => {
    try {
      setLoading(true);
      const [healthData, maintenanceData, logsData] = await Promise.all([
        adminService.getSystemHealth(true),
        adminService.getMaintenanceStatus(),
        adminService.getSystemLogs({ type: 'errors', limit: 20 })
      ]);
      
      setHealth(healthData);
      setMaintenance(maintenanceData.maintenance);
      setLogs(logsData.logs);
      setError(null);
    } catch (err) {
      console.error('Error cargando datos de monitoreo:', err);
      setError('Error cargando los datos de monitoreo');
    } finally {
      setLoading(false);
    }
  };

  const performMaintenanceAction = async (action: string, params: any = {}) => {
    try {
      setPerforming(action);
      const result = await adminService.performMaintenance(action, params);
      
      // Mostrar resultado
      alert(`✅ ${action} completado: ${result.result?.message || 'Operación exitosa'}`);
      
      // Recargar datos
      await loadMonitoringData();
    } catch (err) {
      console.error(`Error en ${action}:`, err);
      alert(`❌ Error ejecutando ${action}`);
    } finally {
      setPerforming(null);
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100';
      case 'degraded': return 'text-yellow-600 bg-yellow-100';
      case 'unhealthy': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'healthy': return '✅';
      case 'degraded': return '⚠️';
      case 'unhealthy': return '❌';
      default: return '❓';
    }
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

  const tabs = [
    { id: 'health', name: 'Estado del Sistema', icon: '🏥' },
    { id: 'maintenance', name: 'Mantenimiento', icon: '🔧' },
    { id: 'logs', name: 'Logs de Error', icon: '📋' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando monitoreo del sistema...</p>
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
                Monitoreo del Sistema
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Estado y mantenimiento del sistema
              </p>
            </div>
            <button
              onClick={loadMonitoringData}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              🔄 Actualizar
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow sm:rounded-lg">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-6 text-sm font-medium ${
                    activeTab === tab.id
                      ? 'border-b-2 border-blue-500 text-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.icon} {tab.name}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Tab de Estado del Sistema */}
            {activeTab === 'health' && health && (
              <div className="space-y-6">
                {/* Estado general */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        Estado General del Sistema
                      </h3>
                      <p className="text-sm text-gray-500">
                        Última actualización: {formatDate(health.timestamp)}
                      </p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(health.status)}`}>
                      {getStatusIcon(health.status)} {health.status.toUpperCase()}
                    </div>
                  </div>
                </div>

                {/* Checks individuales */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">
                    Verificaciones del Sistema
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(health.checks).map(([key, check]) => (
                      <div key={key} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium text-gray-900 capitalize">
                            {key.replace(/_/g, ' ')}
                          </h5>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(check.status)}`}>
                            {getStatusIcon(check.status)} {check.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {check.message}
                        </p>
                        {check.response_time && (
                          <p className="text-xs text-gray-500 mt-1">
                            Tiempo de respuesta: {check.response_time}ms
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Estadísticas */}
                {health.stats && (
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-4">
                      Estadísticas del Sistema
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <div className="text-blue-600 text-2xl font-bold">
                          {health.stats.data?.users_count || 0}
                        </div>
                        <div className="text-sm text-blue-800">Usuarios</div>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <div className="text-green-600 text-2xl font-bold">
                          {health.stats.data?.events_count || 0}
                        </div>
                        <div className="text-sm text-green-800">Eventos</div>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-4">
                        <div className="text-purple-600 text-2xl font-bold">
                          {health.stats.data?.news_count || 0}
                        </div>
                        <div className="text-sm text-purple-800">Noticias</div>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <div className="text-yellow-600 text-2xl font-bold">
                          {health.stats.data?.comments_count || 0}
                        </div>
                        <div className="text-sm text-yellow-800">Comentarios</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab de Mantenimiento */}
            {activeTab === 'maintenance' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Operaciones de Mantenimiento
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Limpiar caché */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="text-center">
                        <div className="text-3xl mb-2">🗑️</div>
                        <h4 className="font-medium text-gray-900 mb-2">
                          Limpiar Caché
                        </h4>
                        <p className="text-sm text-gray-600 mb-4">
                          Eliminar datos en caché del sistema
                        </p>
                        <button
                          onClick={() => performMaintenanceAction('clear_cache')}
                          disabled={performing === 'clear_cache'}
                          className="w-full bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                          {performing === 'clear_cache' ? '⏳ Limpiando...' : 'Limpiar Caché'}
                        </button>
                      </div>
                    </div>

                    {/* Reconstruir estadísticas */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="text-center">
                        <div className="text-3xl mb-2">📊</div>
                        <h4 className="font-medium text-gray-900 mb-2">
                          Reconstruir Stats
                        </h4>
                        <p className="text-sm text-gray-600 mb-4">
                          Recalcular estadísticas del sistema
                        </p>
                        <button
                          onClick={() => performMaintenanceAction('rebuild_stats')}
                          disabled={performing === 'rebuild_stats'}
                          className="w-full bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                          {performing === 'rebuild_stats' ? '⏳ Reconstruyendo...' : 'Reconstruir'}
                        </button>
                      </div>
                    </div>

                    {/* Limpiar logs */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="text-center">
                        <div className="text-3xl mb-2">📋</div>
                        <h4 className="font-medium text-gray-900 mb-2">
                          Limpiar Logs
                        </h4>
                        <p className="text-sm text-gray-600 mb-4">
                          Eliminar logs antiguos (30+ días)
                        </p>
                        <button
                          onClick={() => performMaintenanceAction('cleanup_logs', { days: 30 })}
                          disabled={performing === 'cleanup_logs'}
                          className="w-full bg-yellow-600 text-white px-3 py-2 rounded-md hover:bg-yellow-700 transition-colors disabled:opacity-50"
                        >
                          {performing === 'cleanup_logs' ? '⏳ Limpiando...' : 'Limpiar Logs'}
                        </button>
                      </div>
                    </div>

                    {/* Crear backup */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="text-center">
                        <div className="text-3xl mb-2">💾</div>
                        <h4 className="font-medium text-gray-900 mb-2">
                          Crear Backup
                        </h4>
                        <p className="text-sm text-gray-600 mb-4">
                          Respaldar datos del sistema
                        </p>
                        <button
                          onClick={() => performMaintenanceAction('backup_data')}
                          disabled={performing === 'backup_data'}
                          className="w-full bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          {performing === 'backup_data' ? '⏳ Creando...' : 'Crear Backup'}
                        </button>
                      </div>
                    </div>

                    {/* Probar conexiones */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="text-center">
                        <div className="text-3xl mb-2">🔌</div>
                        <h4 className="font-medium text-gray-900 mb-2">
                          Test Conexiones
                        </h4>
                        <p className="text-sm text-gray-600 mb-4">
                          Verificar conectividad del sistema
                        </p>
                        <button
                          onClick={() => performMaintenanceAction('test_connections')}
                          disabled={performing === 'test_connections'}
                          className="w-full bg-purple-600 text-white px-3 py-2 rounded-md hover:bg-purple-700 transition-colors disabled:opacity-50"
                        >
                          {performing === 'test_connections' ? '⏳ Probando...' : 'Probar'}
                        </button>
                      </div>
                    </div>

                    {/* Optimizar almacenamiento */}
                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="text-center">
                        <div className="text-3xl mb-2">⚡</div>
                        <h4 className="font-medium text-gray-900 mb-2">
                          Optimizar Storage
                        </h4>
                        <p className="text-sm text-gray-600 mb-4">
                          Optimizar almacenamiento
                        </p>
                        <button
                          onClick={() => performMaintenanceAction('optimize_storage')}
                          disabled={performing === 'optimize_storage'}
                          className="w-full bg-indigo-600 text-white px-3 py-2 rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
                        >
                          {performing === 'optimize_storage' ? '⏳ Optimizando...' : 'Optimizar'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Últimas operaciones */}
                {maintenance && maintenance.last_operations.length > 0 && (
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-4">
                      Últimas Operaciones
                    </h4>
                    <div className="bg-gray-50 rounded-lg overflow-hidden">
                      <ul className="divide-y divide-gray-200">
                        {maintenance.last_operations.map((operation) => (
                          <li key={operation.id} className="px-4 py-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <span className={`text-sm ${operation.success ? 'text-green-600' : 'text-red-600'}`}>
                                  {operation.success ? '✅' : '❌'}
                                </span>
                                <span className="ml-2 text-sm font-medium text-gray-900">
                                  {operation.action}
                                </span>
                              </div>
                              <span className="text-sm text-gray-500">
                                {formatDate(operation.timestamp)}
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab de Logs */}
            {activeTab === 'logs' && logs && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">
                  Logs de Errores Recientes
                </h3>

                {logs.errors && logs.errors.length > 0 ? (
                  <div className="bg-gray-50 rounded-lg overflow-hidden">
                    <ul className="divide-y divide-gray-200">
                      {logs.errors.map((log: any, index: number) => (
                        <li key={index} className="px-4 py-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center">
                                <span className="text-red-500 text-sm font-medium">
                                  ❌ {log.level?.toUpperCase() || 'ERROR'}
                                </span>
                                <span className="ml-2 text-sm text-gray-500">
                                  {log.category || 'general'}
                                </span>
                              </div>
                              <p className="mt-1 text-sm text-gray-900">
                                {log.message}
                              </p>
                              {log.details && (
                                <pre className="mt-2 text-xs text-gray-600 bg-gray-100 p-2 rounded overflow-x-auto">
                                  {JSON.stringify(log.details, null, 2)}
                                </pre>
                              )}
                            </div>
                            <span className="text-sm text-gray-500 ml-4">
                              {formatDate(log.timestamp)}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">✅</div>
                    <p>No hay errores recientes</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}