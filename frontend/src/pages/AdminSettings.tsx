import React, { useEffect, useState } from 'react';
import { adminService, type SystemConfig } from '../services/adminService';
import { authService } from '../services/authService';

export default function AdminSettings() {
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('site');

  useEffect(() => {
    if (!authService.isAdmin()) {
      setError('Acceso denegado. Se requieren permisos de administrador.');
      setLoading(false);
      return;
    }

    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const configData = await adminService.getSystemConfig();
      setConfig(configData);
      setError(null);
    } catch (err) {
      console.error('Error cargando configuración:', err);
      setError('Error cargando la configuración del sistema');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!config) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      
      await adminService.updateSystemConfig(config);
      setSuccess('Configuración guardada exitosamente');
      
      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error guardando configuración:', err);
      setError('Error guardando la configuración');
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (section: keyof SystemConfig, key: string, value: any) => {
    if (!config) return;
    
    setConfig({
      ...config,
      [section]: {
        ...config[section],
        [key]: value
      }
    });
  };

  const tabs = [
    { id: 'site', name: 'Sitio', icon: '🌐' },
    { id: 'features', name: 'Funciones', icon: '⚡' },
    { id: 'limits', name: 'Límites', icon: '📊' },
    { id: 'security', name: 'Seguridad', icon: '🔒' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando configuración...</p>
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

  if (!config) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Configuración del Sistema
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Gestionar configuraciones y ajustes del sistema
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={loadConfig}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
              >
                🔄 Recargar
              </button>
              <button
                onClick={handleSaveConfig}
                disabled={saving}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {saving ? '💾 Guardando...' : '💾 Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mensajes */}
      {success && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            ✅ {success}
          </div>
        </div>
      )}

      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            ⚠️ {error}
          </div>
        </div>
      )}

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
            {/* Tab de Sitio */}
            {activeTab === 'site' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">
                  Configuración del Sitio
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre del sitio
                    </label>
                    <input
                      type="text"
                      value={config.site.name}
                      onChange={(e) => updateConfig('site', 'name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tema
                    </label>
                    <select
                      value={config.site.theme}
                      onChange={(e) => updateConfig('site', 'theme', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="light">Claro</option>
                      <option value="dark">Oscuro</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descripción del sitio
                    </label>
                    <textarea
                      value={config.site.description}
                      onChange={(e) => updateConfig('site', 'description', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={config.site.maintenance_mode}
                        onChange={(e) => updateConfig('site', 'maintenance_mode', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 block text-sm text-gray-700">
                        Modo de mantenimiento
                      </label>
                    </div>
                    {config.site.maintenance_mode && (
                      <div className="mt-2">
                        <textarea
                          value={config.site.maintenance_message}
                          onChange={(e) => updateConfig('site', 'maintenance_message', e.target.value)}
                          placeholder="Mensaje de mantenimiento..."
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Tab de Funciones */}
            {activeTab === 'features' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">
                  Funciones del Sistema
                </h3>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Registro de usuarios
                      </label>
                      <p className="text-sm text-gray-500">
                        Permitir que nuevos usuarios se registren
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.features.user_registration}
                      onChange={(e) => updateConfig('features', 'user_registration', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Inscripción a eventos
                      </label>
                      <p className="text-sm text-gray-500">
                        Permitir inscripciones a eventos
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.features.event_registration}
                      onChange={(e) => updateConfig('features', 'event_registration', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Comentarios habilitados
                      </label>
                      <p className="text-sm text-gray-500">
                        Permitir comentarios en noticias y eventos
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.features.comments_enabled}
                      onChange={(e) => updateConfig('features', 'comments_enabled', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Noticias públicas
                      </label>
                      <p className="text-sm text-gray-500">
                        Mostrar noticias a usuarios no registrados
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.features.news_public}
                      onChange={(e) => updateConfig('features', 'news_public', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Búsqueda habilitada
                      </label>
                      <p className="text-sm text-gray-500">
                        Permitir búsqueda de contenido
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.features.search_enabled}
                      onChange={(e) => updateConfig('features', 'search_enabled', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Notificaciones habilitadas
                      </label>
                      <p className="text-sm text-gray-500">
                        Enviar notificaciones a usuarios
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.features.notifications_enabled}
                      onChange={(e) => updateConfig('features', 'notifications_enabled', e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Tab de Límites */}
            {activeTab === 'limits' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">
                  Límites del Sistema
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Máximo eventos por página
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={config.limits.max_events_per_page}
                      onChange={(e) => updateConfig('limits', 'max_events_per_page', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Máximo noticias por página
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={config.limits.max_news_per_page}
                      onChange={(e) => updateConfig('limits', 'max_news_per_page', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Máximo comentarios por item
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      value={config.limits.max_comments_per_item}
                      onChange={(e) => updateConfig('limits', 'max_comments_per_item', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tamaño máximo de archivos (MB)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={config.limits.max_file_size_mb}
                      onChange={(e) => updateConfig('limits', 'max_file_size_mb', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tamaño máximo de imágenes (MB)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={config.limits.max_image_size_mb}
                      onChange={(e) => updateConfig('limits', 'max_image_size_mb', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Tab de Seguridad */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">
                  Configuración de Seguridad
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Máximo intentos de login
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={config.security.max_login_attempts}
                      onChange={(e) => updateConfig('security', 'max_login_attempts', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Timeout de sesión (horas)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="168"
                      value={config.security.session_timeout_hours}
                      onChange={(e) => updateConfig('security', 'session_timeout_hours', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Longitud mínima de contraseña
                    </label>
                    <input
                      type="number"
                      min="4"
                      max="20"
                      value={config.security.min_password_length}
                      onChange={(e) => updateConfig('security', 'min_password_length', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2 space-y-4">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={config.security.require_email_verification}
                        onChange={(e) => updateConfig('security', 'require_email_verification', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 block text-sm text-gray-700">
                        Requerir verificación de email
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={config.security.allow_password_reset}
                        onChange={(e) => updateConfig('security', 'allow_password_reset', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 block text-sm text-gray-700">
                        Permitir recuperación de contraseña
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}