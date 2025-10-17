/**
 * Gestión de Contenido (Eventos y Noticias)
 * ACA Chile Frontend
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Newspaper,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Users
} from 'lucide-react';
import { useEvents } from '../contexts/EventContext';
import { Evento } from '@shared/index';

export default function AdminContent() {
  const [activeTab, setActiveTab] = useState<'eventos' | 'noticias'>('eventos');
  const [searchTerm, setSearchTerm] = useState('');
  const { eventos, fetchEventos, deleteEvento, isLoading } = useEvents();

  useEffect(() => {
    if (activeTab === 'eventos') {
      // Cargar todos los eventos sin filtro de status para admins
      fetchEventos(1);
    }
  }, [activeTab, fetchEventos]);

  const filteredEventos = eventos.filter(evento =>
    evento.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    evento.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    evento.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteEvento = async (id: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este evento?')) {
      await deleteEvento(id);
      // Recargar eventos después de eliminar
      fetchEventos(1);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'published':
        return 'Publicado';
      case 'draft':
        return 'Borrador';
      case 'cancelled':
        return 'Cancelado';
      case 'completed':
        return 'Completado';
      default:
        return status;
    }
  };

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
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
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
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {isLoading ? (
                <div className="p-6 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                  <p className="text-gray-600 mt-2">Cargando eventos...</p>
                </div>
              ) : filteredEventos.length === 0 ? (
                <div className="p-6 text-center py-12">
                  <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {searchTerm ? 'No se encontraron eventos' : 'No hay eventos creados'}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {searchTerm
                      ? 'Intenta con otros términos de búsqueda'
                      : 'Comienza creando tu primer evento para la comunidad'
                    }
                  </p>
                  {!searchTerm && (
                    <Link
                      to="/eventos/crear"
                      className="inline-flex items-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Crear Primer Evento
                    </Link>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Evento
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fecha
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ubicación
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estado
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Inscripciones
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredEventos.map((evento) => (
                        <tr key={evento.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                {evento.image ? (
                                  <img
                                    className="h-10 w-10 rounded-lg object-cover"
                                    src={evento.image}
                                    alt={evento.title}
                                  />
                                ) : (
                                  <div className="h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center">
                                    <Calendar className="h-6 w-6 text-gray-400" />
                                  </div>
                                )}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {evento.title}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {evento.type}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {new Date(evento.date).toLocaleDateString('es-ES')}
                            </div>
                            <div className="text-sm text-gray-500">
                              {evento.time}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {evento.location}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(evento.status)}`}>
                              {getStatusText(evento.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex items-center">
                              <Users className="h-4 w-4 mr-1 text-gray-400" />
                              {evento.currentParticipants || 0}
                              {evento.maxParticipants && (
                                <span className="text-gray-500">
                                  /{evento.maxParticipants}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              <Link
                                to={`/eventos/${evento.id}`}
                                className="text-blue-600 hover:text-blue-900 p-1"
                                title="Ver evento"
                              >
                                <Eye className="h-4 w-4" />
                              </Link>
                              <button
                                onClick={() => handleDeleteEvento(evento.id)}
                                className="text-red-600 hover:text-red-900 p-1"
                                title="Eliminar evento"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
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
