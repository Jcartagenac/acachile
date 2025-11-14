import { useState, useEffect } from 'react';
import { Download, Users, Loader2, RefreshCw, Calendar, Mail, Phone, Hash } from 'lucide-react';

interface Participante {
  id: number;
  nombre: string;
  apellido: string;
  rut: string;
  email: string;
  edad: number;
  telefono: string;
  created_at: string;
}

const AdminParticipantes: React.FC = () => {
  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadParticipantes = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/participantes', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setParticipantes(data.participantes);
      } else {
        setError(data.error || 'Error al cargar participantes');
      }
    } catch (err) {
      console.error('Error al cargar participantes:', err);
      setError('Error al cargar participantes');
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = async () => {
    setExporting(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/participantes/export-csv', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `participantes_sorteo_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Error al exportar CSV');
      }
    } catch (err) {
      console.error('Error al exportar CSV:', err);
      alert('Error al exportar CSV');
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    loadParticipantes();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="bg-primary-100 rounded-lg p-3">
              <Users className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Participantes del Sorteo
              </h1>
              <p className="text-sm text-gray-600">
                {participantes.length} {participantes.length === 1 ? 'participante registrado' : 'participantes registrados'}
              </p>
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={loadParticipantes}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Actualizar</span>
            </button>
            <button
              onClick={exportCSV}
              disabled={exporting || participantes.length === 0}
              className="flex items-center space-x-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {exporting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Exportando...</span>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  <span>Exportar CSV</span>
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        )}
      </div>

      {/* Tabla de participantes */}
      {participantes.length === 0 ? (
        <div className="bg-white rounded-lg shadow-lg p-12 text-center">
          <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No hay participantes registrados
          </h3>
          <p className="text-gray-600">
            Los participantes aparecerán aquí cuando se registren a través de la página de participación
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center space-x-1">
                      <Hash className="h-4 w-4" />
                      <span>ID</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre Completo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    RUT
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center space-x-1">
                      <Mail className="h-4 w-4" />
                      <span>Email</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Edad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center space-x-1">
                      <Phone className="h-4 w-4" />
                      <span>Teléfono</span>
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>Registro</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {participantes.map((participante) => (
                  <tr key={participante.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{participante.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {participante.nombre} {participante.apellido}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">
                      {participante.rut}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <a href={`mailto:${participante.email}`} className="text-primary-600 hover:text-primary-700">
                        {participante.email}
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {participante.edad} años
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <a href={`tel:${participante.telefono}`} className="text-primary-600 hover:text-primary-700">
                        {participante.telefono}
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(participante.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stats */}
      {participantes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Participantes</p>
                <p className="text-3xl font-bold text-gray-900">{participantes.length}</p>
              </div>
              <Users className="h-12 w-12 text-primary-600 opacity-20" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Edad Promedio</p>
                <p className="text-3xl font-bold text-gray-900">
                  {Math.round(participantes.reduce((acc, p) => acc + p.edad, 0) / participantes.length)} años
                </p>
              </div>
              <Calendar className="h-12 w-12 text-primary-600 opacity-20" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Último Registro</p>
                <p className="text-lg font-bold text-gray-900">
                  {participantes[0] ? formatDate(participantes[0].created_at) : '-'}
                </p>
              </div>
              <Calendar className="h-12 w-12 text-primary-600 opacity-20" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminParticipantes;
