/**
 * Gestión de Comunicados y Avisos
 * ACA Chile Frontend
 */

import { 
  Megaphone, 
  Plus,
  Search,
  Bell
} from 'lucide-react';

export default function AdminNews() {
  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Comunicados</h1>
          <p className="text-gray-600 mt-2">
            Publica anuncios y avisos importantes para los socios
          </p>
        </div>

        {/* Actions Bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar comunicados..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
          <button
            className="ml-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Nuevo Comunicado
          </button>
        </div>

        {/* Empty State */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-center py-12">
            <div className="relative inline-block">
              <Megaphone className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <Bell className="h-6 w-6 text-red-500 absolute -top-1 -right-1 animate-bounce" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay comunicados publicados
            </h3>
            <p className="text-gray-600 mb-6">
              Crea comunicados para mantener informados a todos los socios
            </p>
            <button
              className="inline-flex items-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              Crear Primer Comunicado
            </button>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">💡 Tip</h4>
            <p className="text-sm text-blue-700">
              Los comunicados se envían automáticamente por email a todos los socios activos
            </p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-900 mb-2">📱 Notificaciones</h4>
            <p className="text-sm text-green-700">
              Los socios recibirán una notificación push si tienen la app instalada
            </p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h4 className="font-semibold text-purple-900 mb-2">⏰ Programar</h4>
            <p className="text-sm text-purple-700">
              Puedes programar comunicados para que se publiquen automáticamente
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
