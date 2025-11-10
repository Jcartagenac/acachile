import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Trash2, Edit, Eye, Calendar, User } from 'lucide-react';
import type { NewsArticle } from '../../services/newsService';

export default function AdminNews() {
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/noticias?limit=100');
      const data = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        console.log('[AdminNews] Loaded news articles:', data.data.length);
        console.log('[AdminNews] First article structure:', data.data[0]);
        setNews(data.data);
      } else {
        throw new Error('Error al cargar noticias');
      }
    } catch (err) {
      console.error('Error loading news:', err);
      setError('Error al cargar las noticias');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (slugOrId: string | number) => {
    console.log('[AdminNews] handleDelete called with:', slugOrId, 'type:', typeof slugOrId);
    
    if (!slugOrId) {
      alert('Error: No se puede eliminar la noticia sin identificador');
      console.error('[AdminNews] Slug/ID is undefined or empty');
      return;
    }

    if (!window.confirm('¿Estás seguro de que quieres eliminar esta noticia?')) {
      return;
    }

    try {
      console.log('[AdminNews] Deleting noticia with slug/id:', slugOrId);
      const response = await fetch(`/api/noticias/${slugOrId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('[AdminNews] Delete response status:', response.status);
      const data = await response.json();
      console.log('[AdminNews] Delete response data:', data);

      if (!response.ok || !data.success) {
        throw new Error(data.error || `Error ${response.status}: ${response.statusText}`);
      }

      alert('Noticia eliminada correctamente');
      // Recargar lista
      loadNews();
    } catch (err) {
      console.error('[AdminNews] Error deleting news:', err);
      alert(`Error al eliminar la noticia: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    }
  };

  const filteredNews = news.filter(article =>
    article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    article.excerpt?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (typeof article.category === 'object' ? article.category.name : article.category)?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCategoryColor = (category?: { name: string; color: string } | string) => {
    const categoryName = typeof category === 'object' ? category.name.toLowerCase() : category?.toLowerCase() || 'general';
    if (typeof category === 'object' && category.color) {
      return `bg-${category.color}-100 text-${category.color}-800`;
    }
    const colors: Record<string, string> = {
      'eventos': 'bg-blue-100 text-blue-800',
      'competencias': 'bg-purple-100 text-purple-800',
      'educacion': 'bg-green-100 text-green-800',
      'comunidad': 'bg-yellow-100 text-yellow-800',
      'internacional': 'bg-red-100 text-red-800',
      'general': 'bg-gray-100 text-gray-800'
    };
    return colors[categoryName] || 'bg-gray-100 text-gray-800';
  };

  const getCategoryName = (category?: { name: string } | string) => {
    return typeof category === 'object' ? category.name : category || 'General';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Noticias</h2>
          <p className="text-gray-600">Administra las noticias editoriales del sitio</p>
        </div>
        
        <Link
          to="/noticias/crear"
          className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <Plus className="h-5 w-5 mr-2" />
          Nueva Noticia
        </Link>
      </div>

      {/* Barra de búsqueda */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Buscar noticias..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>
      </div>

      {/* Lista de noticias */}
      {filteredNews.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-600 mb-4">
            {searchTerm ? 'No se encontraron noticias que coincidan con tu búsqueda' : 'No hay noticias publicadas aún'}
          </p>
          {!searchTerm && (
            <Link
              to="/noticias/crear"
              className="inline-flex items-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              Crear Primera Noticia
            </Link>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Noticia
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoría
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Autor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredNews.map((article) => (
                <tr key={article.slug} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {article.featured_image && (
                        <img
                          src={article.featured_image}
                          alt={article.title}
                          className="h-12 w-12 rounded-lg object-cover mr-3"
                        />
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900 line-clamp-1">
                          {article.title}
                        </div>
                        {article.excerpt && (
                          <div className="text-sm text-gray-500 line-clamp-1">
                            {article.excerpt}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {article.category && (
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(article.category)}`}>
                        {getCategoryName(article.category)}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {formatDate(article.created_at)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-1" />
                      ACA Chile
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <Link
                        to={`/noticias/${article.slug}`}
                        className="text-blue-600 hover:text-blue-900"
                        title="Ver"
                      >
                        <Eye className="h-5 w-5" />
                      </Link>
                      <Link
                        to={`/noticias/${article.slug}/editar`}
                        className="text-green-600 hover:text-green-900"
                        title="Editar"
                      >
                        <Edit className="h-5 w-5" />
                      </Link>
                      <button
                        onClick={() => {
                          console.log('[AdminNews] Delete button clicked for article:', {
                            id: article.id,
                            slug: article.slug,
                            title: article.title
                          });
                          handleDelete(article.slug || article.id);
                        }}
                        className="text-red-600 hover:text-red-900"
                        title="Eliminar"
                      >
                        <Trash2 className="h-5 w-5" />
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
  );
}
