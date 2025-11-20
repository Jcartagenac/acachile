/**
 * Gestión de Contenido (Eventos y Noticias)
 * ACA Chile Frontend
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Newspaper,
  Home,
  Users2,
  Mail,
  Plus,
  Search,
  Trash2,
  Eye,
  Edit,
  Users,
  Upload,
  Archive,
  ArchiveRestore
} from 'lucide-react';
import { useEvents } from '../contexts/EventContext';
import type { SitePageKey } from '@shared/siteSections';

export default function AdminContent() {
  type ContentTab = 'inicio' | 'quienes' | 'contacto' | 'eventos' | 'postulantes' | 'noticias' | 'imagenes';
  const [activeTab, setActiveTab] = useState<ContentTab>('eventos');
  const [searchTerm, setSearchTerm] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const { eventos, fetchEventos, deleteEvento, isLoading, setFilters } = useEvents();
  const AdminHomeEditor = React.lazy(() => import('../components/admin/AdminHomeEditor'));
  const ImageUploader = React.lazy(() => import('../components/admin/ImageUploader'));
  // IMPORTANTE: Este AdminPostulantes es para inscripciones a EVENTOS (no para postulaciones a socios ACA)
  const AdminPostulantes = React.lazy(() => import('../components/admin/AdminPostulantes'));
  const AdminNews = React.lazy(() => import('../components/admin/AdminNews'));

  const resolvePageKey = (tab: ContentTab): SitePageKey | null => {
    switch (tab) {
      case 'inicio':
        return 'home';
      case 'quienes':
        return 'about';
      case 'contacto':
        return 'contact';
      default:
        return null;
    }
  };

  const tabs: Array<{
    id: ContentTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { id: 'inicio', label: 'Inicio', icon: Home },
    { id: 'quienes', label: 'Quiénes Somos', icon: Users2 },
    { id: 'contacto', label: 'Contacto', icon: Mail },
    { id: 'imagenes', label: 'Subir Imagen', icon: Upload },
    { id: 'eventos', label: 'Eventos', icon: Calendar },
    { id: 'postulantes', label: 'Postulantes', icon: Users },
    { id: 'noticias', label: 'Noticias Editoriales', icon: Newspaper }
  ];

  useEffect(() => {
    if (activeTab === 'eventos') {
      // Para admins, mostrar todos los eventos sin filtro de status
      setFilters({ status: undefined, includeArchived: showArchived });
    }
  }, [activeTab, showArchived, setFilters]);

  useEffect(() => {
    if (activeTab === 'eventos') {
      fetchEventos(1);
    }
  }, [activeTab, fetchEventos]);

  const filteredEventos = eventos.filter(evento => {
    // Solo filtrar por búsqueda local, el API ya filtra archivados
    return evento.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evento.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evento.location.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleDeleteEvento = async (id: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este evento?')) {
      await deleteEvento(id);
      // Recargar eventos después de eliminar
      fetchEventos(1);
    }
  };

  const handleArchiveEvento = async (id: number) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/eventos/${id}/archive`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        alert('Evento archivado exitosamente');
        fetchEventos(1);
      } else {
        alert('Error archivando evento: ' + data.error);
      }
    } catch (error) {
      console.error('Error archiving evento:', error);
      alert('Error archivando evento');
    }
  };

  const handleUnarchiveEvento = async (id: number) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/eventos/${id}/unarchive`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        alert('Evento desarchivado exitosamente');
        fetchEventos(1);
      } else {
        alert('Error desarchivando evento: ' + data.error);
      }
    } catch (error) {
      console.error('Error unarchiving evento:', error);
      alert('Error desarchivando evento');
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
      case 'archived':
        return 'bg-gray-100 text-gray-800';
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
      case 'archived':
        return 'Archivado';
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
            Administra portada, secciones institucionales, eventos y noticias de ACA Chile
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    isActive
                      ? 'border-red-600 text-red-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center">
                    <Icon className="h-5 w-5 mr-2" />
                    {tab.label}
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content based on active tab */}
        {(() => {
          const pageKey = resolvePageKey(activeTab);
          if (!pageKey) return null;
          return (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-semibold">
                {activeTab === 'inicio' && 'Editor de Inicio'}
                {activeTab === 'quienes' && 'Editor de Quiénes Somos'}
                {activeTab === 'contacto' && 'Editor de Contacto'}
              </h2>
              <p className="text-gray-600 mt-2">
                Gestiona las secciones que se muestran públicamente en esta página usando el editor modular.
              </p>
            </div>
            <div>
              {/* AdminHomeEditor component lazy loaded to avoid bundle size */}
              <React.Suspense fallback={<div>Cargando editor...</div>}>
                <AdminHomeEditor key={pageKey} initialPage={pageKey} />
              </React.Suspense>
            </div>
          </div>
          );
        })()}

        {activeTab === 'eventos' && (
          <div>
            {/* Actions Bar */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4 flex-1">
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
                <label className="flex items-center gap-2 text-sm text-gray-600 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={showArchived}
                    onChange={(e) => setShowArchived(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  Mostrar archivados
                </label>
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
                              <Link
                                to={`/eventos/${evento.id}/editar`}
                                className="text-green-600 hover:text-green-900 p-1"
                                title="Editar evento"
                              >
                                <Edit className="h-4 w-4" />
                              </Link>
                              {evento.status === 'archived' ? (
                                <button
                                  onClick={() => handleUnarchiveEvento(evento.id)}
                                  className="text-purple-600 hover:text-purple-900 p-1"
                                  title="Desarchivar evento"
                                >
                                  <ArchiveRestore className="h-4 w-4" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleArchiveEvento(evento.id)}
                                  className="text-orange-600 hover:text-orange-900 p-1"
                                  title="Archivar evento"
                                >
                                  <Archive className="h-4 w-4" />
                                </button>
                              )}
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

        {activeTab === 'imagenes' && (
          <div>
            <React.Suspense fallback={<div>Cargando gestor de imágenes...</div>}>
              <ImageUploader />
            </React.Suspense>
          </div>
        )}

        {activeTab === 'postulantes' && (
          <div>
            <React.Suspense fallback={
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">Cargando postulantes de eventos...</p>
              </div>
            }>
              <AdminPostulantes />
            </React.Suspense>
          </div>
        )}

        {activeTab === 'noticias' && (
          <div>
            <React.Suspense fallback={
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">Cargando noticias...</p>
              </div>
            }>
              <AdminNews />
            </React.Suspense>
          </div>
        )}
      </div>
    </div>
  );
}
