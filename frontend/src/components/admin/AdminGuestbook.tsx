import { useState, useEffect } from 'react';
import { BookOpen, Edit2, Trash2, RefreshCw, AlertTriangle, Loader2, ExternalLink } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface GuestbookEntry {
  id: number;
  name: string;
  email: string;
  social_network: string;
  social_handle: string | null;
  title: string;
  message: string;
  image_url: string | null;
  status: string;
  created_at: string;
  deleted_at: string | null;
}

export default function AdminGuestbook() {
  const { token, isAdmin } = useAuth();
  const [entries, setEntries] = useState<GuestbookEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<GuestbookEntry>>({});

  useEffect(() => {
    if (isAdmin()) {
      loadEntries();
    }
  }, [isAdmin]);

  const loadEntries = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/guestbook?limit=100', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setEntries(data.data || []);
      }
    } catch (error) {
      console.error('Error loading entries:', error);
      alert('Error al cargar las entradas');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (entry: GuestbookEntry) => {
    setEditingId(entry.id);
    setEditForm({
      name: entry.name,
      title: entry.title,
      message: entry.message,
      social_network: entry.social_network,
      social_handle: entry.social_handle || '',
    });
  };

  const handleSaveEdit = async (id: number) => {
    try {
      const response = await fetch(`/api/guestbook/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al actualizar');
      }

      alert('Entrada actualizada correctamente');
      setEditingId(null);
      loadEntries();
    } catch (error) {
      console.error('Error updating entry:', error);
      alert(error instanceof Error ? error.message : 'Error al actualizar la entrada');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de mover esta entrada a la papelera?')) {
      return;
    }

    try {
      const response = await fetch(`/api/guestbook/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al eliminar');
      }

      alert('Entrada movida a la papelera');
      loadEntries();
    } catch (error) {
      console.error('Error deleting entry:', error);
      alert(error instanceof Error ? error.message : 'Error al eliminar la entrada');
    }
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
            <BookOpen className="h-8 w-8 text-red-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Libro de Visitas</h1>
              <p className="text-gray-600 mt-1">Gestiona las entradas del libro de visitas</p>
            </div>
          </div>
          <button
            onClick={loadEntries}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            Recargar
          </button>
        </div>
        
        <div className="mt-4 flex gap-4">
          <div className="bg-white rounded-lg shadow-md p-4 flex-1">
            <div className="text-sm text-gray-600">Total de Entradas</div>
            <div className="text-2xl font-bold text-gray-900">{entries.length}</div>
          </div>
          <a
            href="/visitas"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white rounded-lg shadow-md p-4 flex items-center gap-2 hover:shadow-lg transition-shadow"
          >
            <ExternalLink className="h-5 w-5 text-gray-600" />
            <span className="text-sm text-gray-600">Ver página pública</span>
          </a>
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
          <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No hay entradas aún
          </h3>
          <p className="text-gray-600">
            Las entradas del libro de visitas aparecerán aquí
          </p>
        </div>
      )}

      {/* Entries List */}
      {!loading && entries.length > 0 && (
        <div className="space-y-4">
          {entries.map((entry) => (
            <div key={entry.id} className="bg-white rounded-lg shadow-md p-6">
              {editingId === entry.id ? (
                /* Edit Mode */
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre
                    </label>
                    <input
                      type="text"
                      value={editForm.name || ''}
                      onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Título
                    </label>
                    <input
                      type="text"
                      value={editForm.title || ''}
                      onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mensaje
                    </label>
                    <textarea
                      value={editForm.message || ''}
                      onChange={(e) => setEditForm({...editForm, message: e.target.value})}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => handleSaveEdit(entry.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Guardar Cambios
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                /* View Mode */
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-1">
                        {entry.title}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="font-medium">{entry.name}</span>
                        <span>{entry.email}</span>
                        {entry.social_network !== 'none' && entry.social_handle && (
                          <span className="flex items-center gap-1">
                            {entry.social_network}: @{entry.social_handle}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {formatDate(entry.created_at)}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(entry)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Mover a papelera"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  {entry.image_url && (
                    <img 
                      src={entry.image_url} 
                      alt={entry.title}
                      className="w-full max-w-md h-48 object-cover rounded-lg mb-4"
                    />
                  )}

                  <p className="text-gray-700 whitespace-pre-wrap">
                    {entry.message}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
