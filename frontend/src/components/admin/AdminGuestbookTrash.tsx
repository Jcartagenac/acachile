import { useState, useEffect } from 'react';
import { Trash2, RefreshCw, RotateCcw, X, Loader2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface GuestbookEntry {
  id: number;
  name: string;
  email: string;
  title: string;
  message: string;
  image_url: string | null;
  created_at: string;
  deleted_at: string;
}

export default function AdminGuestbookTrash() {
  const { token, isAdmin } = useAuth();
  const [entries, setEntries] = useState<GuestbookEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAdmin()) {
      loadDeletedEntries();
    }
  }, [isAdmin]);

  const loadDeletedEntries = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/guestbook?includeDeleted=true&limit=100', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        // Filtrar solo las eliminadas
        const deleted = (data.data || []).filter((e: GuestbookEntry) => e.deleted_at);
        setEntries(deleted);
      }
    } catch (error) {
      console.error('Error loading deleted entries:', error);
      alert('Error al cargar las entradas eliminadas');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (id: number) => {
    if (!confirm('¿Estás seguro de restaurar esta entrada?')) {
      return;
    }

    try {
      const response = await fetch(`/api/guestbook/${id}/restore`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al restaurar');
      }

      alert('Entrada restaurada correctamente');
      loadDeletedEntries();
    } catch (error) {
      console.error('Error restoring entry:', error);
      alert(error instanceof Error ? error.message : 'Error al restaurar la entrada');
    }
  };

  const handlePermanentDelete = async (id: number) => {
    if (!confirm('⚠️ ADVERTENCIA: Esta acción eliminará la entrada permanentemente y NO se podrá recuperar.\n\n¿Estás seguro de continuar?')) {
      return;
    }

    try {
      const response = await fetch(`/api/guestbook/${id}/permanent`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al eliminar');
      }

      alert('Entrada eliminada permanentemente');
      loadDeletedEntries();
    } catch (error) {
      console.error('Error deleting entry:', error);
      alert(error instanceof Error ? error.message : 'Error al eliminar la entrada');
    }
  };

  const getDaysRemaining = (deletedAt: string) => {
    const deleted = new Date(deletedAt);
    const expiry = new Date(deleted.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 días
    const now = new Date();
    const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
    return Math.max(0, daysLeft);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isAdmin()) {
    return (
      <div className="p-8 text-center">
        <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Acceso Denegado</h2>
        <p className="text-gray-600">No tienes permisos para acceder a esta sección.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trash2 className="h-8 w-8 text-red-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Papelera - Libro de Visitas</h1>
              <p className="text-gray-600 mt-1">
                Las entradas eliminadas se mantienen 30 días antes de ser eliminadas permanentemente
              </p>
            </div>
          </div>
          <button
            onClick={loadDeletedEntries}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            Recargar
          </button>
        </div>
        
        <div className="mt-4 bg-white rounded-lg shadow-md p-4">
          <div className="text-sm text-gray-600">Entradas en Papelera</div>
          <div className="text-2xl font-bold text-gray-900">{entries.length}</div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-12 w-12 text-red-600 animate-spin" />
        </div>
      )}

      {/* Empty State */}
      {!loading && entries.length === 0 && (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <Trash2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            La papelera está vacía
          </h3>
          <p className="text-gray-600">
            No hay entradas eliminadas del libro de visitas
          </p>
        </div>
      )}

      {/* Entries List */}
      {!loading && entries.length > 0 && (
        <div className="space-y-4">
          {entries.map((entry) => {
            const daysLeft = getDaysRemaining(entry.deleted_at);
            const isExpiringSoon = daysLeft <= 7;

            return (
              <div key={entry.id} className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">
                        {entry.title}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        isExpiringSoon 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {daysLeft} {daysLeft === 1 ? 'día' : 'días'} restantes
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-1">
                      <span className="font-medium">{entry.name}</span>
                      <span>{entry.email}</span>
                    </div>
                    
                    <div className="text-sm text-gray-500">
                      Creado: {formatDate(entry.created_at)}
                    </div>
                    <div className="text-sm text-red-600">
                      Eliminado: {formatDate(entry.deleted_at)}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRestore(entry.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      title="Restaurar"
                    >
                      <RotateCcw className="h-5 w-5" />
                      Restaurar
                    </button>
                    <button
                      onClick={() => handlePermanentDelete(entry.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      title="Eliminar permanentemente"
                    >
                      <X className="h-5 w-5" />
                      Eliminar
                    </button>
                  </div>
                </div>

                {entry.image_url && (
                  <img 
                    src={entry.image_url} 
                    alt={entry.title}
                    className="w-full max-w-md h-48 object-cover rounded-lg mb-4 opacity-50"
                  />
                )}

                <p className="text-gray-700 whitespace-pre-wrap opacity-75">
                  {entry.message}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
