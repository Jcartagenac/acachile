/**
 * Gestión de Contenido (Eventos y Noticias)
 * ACA Chile Frontend
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  Newspaper,
  Plus,
  Search
} from 'lucide-react';

export default function AdminContent() {
  const [activeTab, setActiveTab] = useState<'eventos' | 'noticias'>('eventos');

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Contenido</h1>
          <p className="text-gray-600 mt-2">
            Administra eventos y noticias editoriales de ACA Chile
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('eventos')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'eventos'
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Eventos
              </div>
            </button>
            <button
              onClick={() => setActiveTab('noticias')}
              className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'noticias'
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <Newspaper className="h-5 w-5 mr-2" />
                Noticias Editoriales
              </div>
            </button>
          </nav>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'eventos' && (
          <div>
            {/* Actions Bar */}
            <div className="flex items-center justify-between mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar eventos..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <Link
                to="/eventos/crear"
                className="ml-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
              >
                <Plus className="h-5 w-5 mr-2" />
                Crear Evento
              </Link>
            </div>

            {/* Events List */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No hay eventos creados
                </h3>
                <p className="text-gray-600 mb-6">
                  Comienza creando tu primer evento para la comunidad
                </p>
                <Link
                  to="/eventos/crear"
                  className="inline-flex items-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Crear Primer Evento
                </Link>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'noticias' && (
          <div>
            {/* Actions Bar */}
            <div className="flex items-center justify-between mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar noticias..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <button
                className="ml-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
              >
                <Plus className="h-5 w-5 mr-2" />
                Crear Noticia
              </button>
            </div>

            {/* News List */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="text-center py-12">
                <Newspaper className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No hay noticias publicadas
                </h3>
                <p className="text-gray-600 mb-6">
                  Crea noticias editoriales para mantener informada a la comunidad
                </p>
                <button
                  className="inline-flex items-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Crear Primera Noticia
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
