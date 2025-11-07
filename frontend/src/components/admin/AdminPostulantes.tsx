/**
 * AdminPostulantes - Vista de inscripciones/postulantes por evento
 * ACA Chile Frontend
 */

import React, { useState, useEffect } from 'react';
import { Users, Search, Download, Mail, Phone, Calendar, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { useEvents } from '../../contexts/EventContext';
import { Evento } from '@shared/index';

interface Inscripcion {
  id: string;
  eventoId: number;
  userId?: number;
  nombre?: string;
  apellido?: string;
  email?: string;
  telefono?: string;
  tipo: 'autenticada' | 'publica';
  status: 'confirmed' | 'waitlist' | 'cancelled';
  createdAt: string;
}

export default function AdminPostulantes() {
  const { eventos, fetchEventos } = useEvents();
  const [selectedEvento, setSelectedEvento] = useState<number | null>(null);
  const [inscripciones, setInscripciones] = useState<Inscripcion[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchEventos(1);
  }, []);

  useEffect(() => {
    if (selectedEvento) {
      fetchInscripciones(selectedEvento);
    }
  }, [selectedEvento]);

  const fetchInscripciones = async (eventoId: number) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/eventos/${eventoId}/inscripciones`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();

      console.log('Response from API:', data);

      if (data.success) {
        setInscripciones(data.data || []);
      } else {
        console.error('Error fetching inscripciones:', data.error);
        setInscripciones([]);
      }
    } catch (error) {
      console.error('Error fetching inscripciones:', error);
      setInscripciones([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleRowExpand = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const filteredInscripciones = inscripciones.filter(insc => {
    const searchLower = searchTerm.toLowerCase();
    const nombre = insc.nombre || '';
    const apellido = insc.apellido || '';
    const email = insc.email || '';
    const telefono = insc.telefono || '';
    
    return (
      nombre.toLowerCase().includes(searchLower) ||
      apellido.toLowerCase().includes(searchLower) ||
      email.toLowerCase().includes(searchLower) ||
      telefono.includes(searchLower)
    );
  });

  const exportToCSV = () => {
    if (filteredInscripciones.length === 0) return;

    const headers = ['Nombre', 'Apellido', 'Email', 'Teléfono', 'Tipo', 'Estado', 'Fecha'];
    const rows = filteredInscripciones.map(insc => [
      insc.nombre || '',
      insc.apellido || '',
      insc.email || '',
      insc.telefono || '',
      insc.tipo,
      insc.status,
      new Date(insc.createdAt).toLocaleDateString('es-CL')
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `postulantes_evento_${selectedEvento}_${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Confirmado</span>;
      case 'waitlist':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Lista de espera</span>;
      case 'cancelled':
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">Cancelado</span>;
      default:
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  const getTipoBadge = (tipo: string) => {
    return tipo === 'publica' 
      ? <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Pública</span>
      : <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">Usuario</span>;
  };

  const eventoSeleccionado = eventos.find(e => e.id === selectedEvento);

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Postulantes e Inscripciones</h2>
        <p className="text-gray-600">
          Visualiza y gestiona las inscripciones de los eventos
        </p>
      </div>

      {/* Selector de Evento */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Filter className="inline h-4 w-4 mr-2" />
          Seleccionar Evento
        </label>
        <select
          value={selectedEvento || ''}
          onChange={(e) => setSelectedEvento(Number(e.target.value))}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
        >
          <option value="">-- Selecciona un evento --</option>
          {eventos.map(evento => (
            <option key={evento.id} value={evento.id}>
              {evento.title} - {new Date(evento.date).toLocaleDateString('es-CL')}
            </option>
          ))}
        </select>
      </div>

      {/* Contenido Principal */}
      {selectedEvento ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Info del Evento */}
          {eventoSeleccionado && (
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{eventoSeleccionado.title}</h3>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                    <span className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(eventoSeleccionado.date).toLocaleDateString('es-CL')}
                    </span>
                    <span className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      {filteredInscripciones.length} inscrito{filteredInscripciones.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                {filteredInscripciones.length > 0 && (
                  <button
                    onClick={exportToCSV}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Exportar CSV
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Barra de búsqueda */}
          {inscripciones.length > 0 && (
            <div className="p-6 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, email o teléfono..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>
          )}

          {/* Lista de Inscripciones */}
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Cargando inscripciones...</p>
            </div>
          ) : filteredInscripciones.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'No se encontraron postulantes' : 'No hay inscripciones'}
              </h3>
              <p className="text-gray-600">
                {searchTerm
                  ? 'Intenta con otros términos de búsqueda'
                  : 'Aún no hay personas inscritas en este evento'
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Postulante
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contacto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredInscripciones.map((insc) => (
                    <React.Fragment key={insc.id}>
                      <tr className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {insc.nombre} {insc.apellido}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {insc.email && (
                              <div className="flex items-center mb-1">
                                <Mail className="h-3 w-3 mr-1 text-gray-400" />
                                {insc.email}
                              </div>
                            )}
                            {insc.telefono && (
                              <div className="flex items-center">
                                <Phone className="h-3 w-3 mr-1 text-gray-400" />
                                {insc.telefono}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getTipoBadge(insc.tipo)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(insc.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(insc.createdAt).toLocaleDateString('es-CL', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => toggleRowExpand(insc.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            {expandedRows.has(insc.id) ? (
                              <ChevronUp className="h-5 w-5" />
                            ) : (
                              <ChevronDown className="h-5 w-5" />
                            )}
                          </button>
                        </td>
                      </tr>
                      {expandedRows.has(insc.id) && (
                        <tr>
                          <td colSpan={6} className="px-6 py-4 bg-gray-50">
                            <div className="text-sm space-y-2">
                              <div><strong>ID:</strong> {insc.id}</div>
                              {insc.userId && <div><strong>User ID:</strong> {insc.userId}</div>}
                              <div><strong>Creado:</strong> {new Date(insc.createdAt).toLocaleString('es-CL')}</div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Selecciona un evento
          </h3>
          <p className="text-gray-600">
            Elige un evento del selector para ver sus inscripciones
          </p>
        </div>
      )}
    </div>
  );
}
