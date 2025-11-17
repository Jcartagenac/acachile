import { useState, useEffect } from 'react';
import { Trash2, RefreshCw, AlertTriangle, Calendar, Clock } from 'lucide-react';
import type { NewsArticle } from '../../services/newsService';

export default function AdminTrash() {
  const [deletedNews, setDeletedNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDeletedNews();
  }, []);

  const loadDeletedNews = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/noticias');
      const data = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        // Filtrar solo noticias eliminadas (con deleted_at)
        const deleted = data.data.filter((n: NewsArticle) => n.deleted_at);
        setDeletedNews(deleted);
      }
    } catch (err) {
      console.error('Error loading deleted news:', err);
      setError('Error al cargar la papelera');
    } finally {
      setLoading(false);
    }
  };

  const getDaysUntilPermanentDelete = (deletedAt: string) => {
    const deletedDate = new Date(deletedAt);
    const permanentDeleteDate = new Date(deletedDate);
    permanentDeleteDate.setDate(permanentDeleteDate.getDate() + 30);
    
    const now = new Date();
    const daysRemaining = Math.ceil((permanentDeleteDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      daysRemaining: Math.max(0, daysRemaining),
      permanentDeleteDate: permanentDeleteDate.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    };
  };

  const handleRestore = async (article: NewsArticle) => {
    if (!confirm(`¿Restaurar la noticia "${article.title}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/noticias/${article.slug}/restore`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al restaurar la noticia');
      }

      alert('Noticia restaurada correctamente');
      loadDeletedNews();
    } catch (err) {
      console.error('Error restoring news:', err);
      alert(`Error: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    }
  };

  const handlePermanentDelete = async (article: NewsArticle) => {
    if (!confirm(`⚠️ ADVERTENCIA: ¿Estás seguro de que quieres eliminar PERMANENTEMENTE la noticia "${article.title}"?\n\nEsta acción NO se puede deshacer.`)) {
      return;
    }

    if (!confirm(`Última confirmación: ¿Realmente quieres eliminar "${article.title}" de forma permanente?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/noticias/${article.slug}/permanent`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al eliminar permanentemente la noticia');
      }

      alert('Noticia eliminada permanentemente');
      loadDeletedNews();
    } catch (err) {
      console.error('Error permanently deleting news:', err);
      alert(`Error: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    }
  };

  const handleEmptyTrash = async () => {
    if (deletedNews.length === 0) {
      alert('La papelera ya está vacía');
      return;
    }

    if (!confirm(`⚠️ ADVERTENCIA: ¿Estás seguro de que quieres vaciar TODA la papelera?\n\nSe eliminarán permanentemente ${deletedNews.length} noticias.\n\nEsta acción NO se puede deshacer.`)) {
      return;
    }

    if (!confirm(`Última confirmación: ¿Realmente quieres eliminar ${deletedNews.length} noticias de forma permanente?`)) {
      return;
    }

    try {
      const deletePromises = deletedNews.map(article =>
        fetch(`/api/noticias/${article.slug}/permanent`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        })
      );

      await Promise.all(deletePromises);
      alert('Papelera vaciada correctamente');
      loadDeletedNews();
    } catch (err) {
      console.error('Error emptying trash:', err);
      alert('Error al vaciar la papelera');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Papelera de Noticias</h2>
          <p className="text-sm text-gray-600 mt-1">
            Las noticias eliminadas se conservan durante 30 días antes de borrarse permanentemente
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={loadDeletedNews}
            className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </button>
          {deletedNews.length > 0 && (
            <button
              onClick={handleEmptyTrash}
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Vaciar Papelera
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {deletedNews.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Trash2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            La papelera está vacía
          </h3>
          <p className="text-gray-600">
            Las noticias eliminadas aparecerán aquí y podrán ser restauradas durante 30 días.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
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
                    Eliminada
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Días Restantes
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {deletedNews.map((article) => {
                  const { daysRemaining, permanentDeleteDate } = getDaysUntilPermanentDelete(article.deleted_at!);
                  const isExpiringSoon = daysRemaining <= 7;
                  
                  return (
                    <tr key={article.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-start">
                          {article.featured_image && (
                            <img
                              src={article.featured_image}
                              alt={article.title}
                              className="h-12 w-12 rounded object-cover mr-3 flex-shrink-0"
                            />
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {article.title}
                            </div>
                            <div className="text-sm text-gray-500">
                              {article.excerpt?.substring(0, 100)}...
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className="inline-block px-2 py-1 rounded-full text-xs font-medium text-white"
                          style={{ backgroundColor: article.category.color }}
                        >
                          {article.category.name}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(article.deleted_at!).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Clock className={`h-4 w-4 mr-1 ${isExpiringSoon ? 'text-red-500' : 'text-gray-500'}`} />
                          <span className={`text-sm ${isExpiringSoon ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                            {daysRemaining} {daysRemaining === 1 ? 'día' : 'días'}
                          </span>
                        </div>
                        {isExpiringSoon && (
                          <div className="flex items-center mt-1 text-xs text-red-600">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Se eliminará el {permanentDeleteDate}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleRestore(article)}
                            className="inline-flex items-center px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                          >
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Restaurar
                          </button>
                          <button
                            onClick={() => handlePermanentDelete(article)}
                            className="inline-flex items-center px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {deletedNews.length > 0 && (
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">Información importante:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Las noticias en la papelera se eliminarán automáticamente después de 30 días</li>
                <li>Puedes restaurar cualquier noticia antes de que se elimine permanentemente</li>
                <li>Una vez eliminada permanentemente, no se puede recuperar</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
