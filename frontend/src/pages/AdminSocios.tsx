/**
 * Página de gestión de socios
 * ACA Chile Frontend
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate, useLocation, useParams } from 'react-router-dom';
import { sociosService, Socio, CreateSocioData } from '../services/sociosService';
import { adminService } from '../services/adminService';
import { AddressInput } from '../components/ui/AddressInput';
import {
  Users,
  UserPlus,
  Search,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Upload,
  FileUp,
  Download,
  X
} from 'lucide-react';

export default function AdminSocios() {
  const [socios, setSocios] = useState<Socio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<string>('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingSocio, setEditingSocio] = useState<Socio | null>(null);
  const [selectedSocio, setSelectedSocio] = useState<Socio | null>(null);
  const [isEditLoading, setIsEditLoading] = useState(false);
  const [roleOptions, setRoleOptions] = useState<Array<{ key: string; label: string; description?: string; priority?: number }>>([
    { key: 'usuario', label: 'Usuario', description: 'Acceso básico', priority: 100 },
    { key: 'director', label: 'Director', description: 'Gestión avanzada', priority: 60 },
    { key: 'director_editor', label: 'Director Editor', description: 'Editar contenidos', priority: 80 },
    { key: 'admin', label: 'Administrador', description: 'Acceso total', priority: 40 }
  ]);
  
  // Nuevos estados para paginación y selección masiva
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [selectedSocios, setSelectedSocios] = useState<Set<number>>(new Set());
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { socioId } = useParams<{ socioId?: string }>();
  
  // Ref para mantener el foco en el input de búsqueda
  const searchInputRef = useRef<HTMLInputElement>(null);

  const isCreateRoute = location.pathname.endsWith('/createuser');
  const isEditRoute = location.pathname.endsWith('/edituser');

  // Definir loadSocios sin dependencias que cambien frecuentemente
  const loadSocios = useCallback(async () => {
    try {
      // Guardar posición del cursor antes de cargar
      const activeElement = document.activeElement;
      const cursorPosition = activeElement instanceof HTMLInputElement ? activeElement.selectionStart : null;
      
      console.log('🔍 [AdminSocios] loadSocios called with:', { searchTerm, estadoFilter });
      setLoading(true);
      // Leer los valores actuales directamente del estado
      const response = await sociosService.getSocios({
        search: searchTerm || undefined,
        estado: estadoFilter || undefined,
        limit: 10000, // Cargar todos los socios (límite alto para evitar paginación del servidor)
      });
      console.log('🔍 [AdminSocios] Response received:', response.data?.socios?.length || 0, 'socios');

      if (response.success && response.data) {
        // Usar una actualización por lotes para evitar múltiples re-renders
        setSocios(response.data.socios);
        // Solo resetear a página 1 si estamos en una página que no existe
        setCurrentPage(prev => {
          const newTotalPages = Math.ceil(response.data.socios.length / itemsPerPage);
          return prev > newTotalPages ? 1 : prev;
        });
        
        // Restaurar foco y posición del cursor después de la actualización
        setTimeout(() => {
          if (searchInputRef.current && activeElement === searchInputRef.current) {
            searchInputRef.current.focus();
            if (cursorPosition !== null) {
              searchInputRef.current.setSelectionRange(cursorPosition, cursorPosition);
            }
          }
        }, 0);
      } else {
        setError(response.error || 'Error al cargar socios');
      }
    } catch (err) {
      setError('Error al cargar socios');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, estadoFilter, itemsPerPage]); // Incluir searchTerm y estadoFilter para que capture los valores actuales

  // Debounce para búsqueda: espera 300ms después del último carácter
  useEffect(() => {
    console.log('🔍 [AdminSocios] Search changed:', { searchTerm, estadoFilter });
    const timer = setTimeout(() => {
      console.log('🔍 [AdminSocios] Executing search after debounce');
      loadSocios();
    }, 300); // 300ms de delay para dar tiempo al usuario de escribir

    return () => {
      console.log('🔍 [AdminSocios] Clearing debounce timer');
      clearTimeout(timer);
    };
  }, [searchTerm, estadoFilter, loadSocios]); // Incluir loadSocios en dependencias

  useEffect(() => {
    let cancelled = false;

    const loadRoleCatalog = async () => {
      try {
        const catalog = await adminService.getRoleCatalog();
        if (!catalog || cancelled) return;

        const mapped = catalog
          .filter((r) => typeof r.key === 'string')
          .map((r) => ({ key: r.key, label: r.label ?? r.key, description: r.description, priority: r.priority }));

        if (mapped.length === 0) return;

        setRoleOptions((current) => {
          const existing = new Set(current.map((c) => c.key));
          const merged = [...current];
          mapped.forEach((opt) => {
            if (existing.has(opt.key)) {
              const idx = merged.findIndex((m) => m.key === opt.key);
              if (idx !== -1) merged[idx] = opt;
            } else {
              merged.push(opt);
            }
          });

          return merged.sort((a, b) => (b.priority ?? 100) - (a.priority ?? 100));
        });
      } catch (err) {
        console.warn('[AdminSocios] No se pudo obtener catálogo de roles, usando defaults.', err);
      }
    };

    loadRoleCatalog();

    return () => { cancelled = true; };
  }, []);

  const closeCreateModal = useCallback(() => {
    navigate('/panel-admin/users', { replace: true });
  }, [navigate]);

  const closeEditModal = useCallback(() => {
    navigate('/panel-admin/users', { replace: true });
  }, [navigate]);

  const openCreateModalRoute = useCallback(() => {
    navigate('/panel-admin/users/createuser');
  }, [navigate]);

  const openEditModalRoute = useCallback((id: number) => {
    navigate(`/panel-admin/users/${id}/edituser`);
  }, [navigate]);

  useEffect(() => {
    if (!isEditRoute) {
      setEditingSocio(null);
      setIsEditLoading(false);
      return;
    }

    if (!socioId) {
      setEditingSocio(null);
      return;
    }

    const socioIdNumber = Number(socioId);
    if (Number.isNaN(socioIdNumber)) {
      setEditingSocio(null);
      return;
    }

    const existingSocio = socios.find((socio) => socio.id === socioIdNumber);
    if (existingSocio) {
      setEditingSocio(existingSocio);
      setIsEditLoading(false);
      return;
    }

    let cancelled = false;
    setIsEditLoading(true);

    sociosService.getSocio(socioIdNumber).then((response) => {
      if (cancelled) return;

      if (response.success && response.data) {
        setEditingSocio(response.data);
      } else {
        // If fetching the socio failed (500 or similar), we still open the edit modal
        // with a minimal fallback object so the admin can at least set the role.
        console.warn('[AdminSocios] getSocio failed, opening fallback edit modal:', response.error);
        setError(response.error || 'No se pudo cargar la información del socio. Usando datos mínimos.');

        const fallback: Socio = {
          id: socioIdNumber,
          nombre: '',
          apellido: '',
          email: '',
          telefono: '',
          rut: '',
          direccion: '',
          ciudad: '',
          valorCuota: 6500,
          estadoSocio: 'activo',
          fechaIngreso: new Date().toISOString().split('T')[0],
          listaNegra: false,
          motivoListaNegra: '',
          fotoUrl: undefined,
          estadisticasCuotas: undefined,
          // attach a role if available
          role: roleOptions[0]?.key || 'usuario',
        } as any;

        setEditingSocio(fallback);
      }

      setIsEditLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [isEditRoute, socioId, socios, closeEditModal]);

  // Calcular paginación
  const totalPages = Math.ceil(socios.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSocios = socios.slice(startIndex, endIndex);

  // Funciones de selección masiva
  const toggleSelectAll = () => {
    if (selectedSocios.size === paginatedSocios.length) {
      setSelectedSocios(new Set());
    } else {
      setSelectedSocios(new Set(paginatedSocios.map(s => s.id)));
    }
  };

  const toggleSelectSocio = (id: number) => {
    const newSelected = new Set(selectedSocios);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedSocios(newSelected);
  };

  const isAllSelected = paginatedSocios.length > 0 && selectedSocios.size === paginatedSocios.length;
  const isSomeSelected = selectedSocios.size > 0 && selectedSocios.size < paginatedSocios.length;

  const handleDeleteSocio = async (socio: Socio) => {
    if (!window.confirm(`¿Estás seguro de eliminar a ${socio.nombreCompleto}? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      const response = await sociosService.deleteSocio(socio.id);
      
      if (response.success) {
        await loadSocios();
      } else {
        alert(response.error || 'Error al eliminar socio');
      }
    } catch (err) {
      console.error('Error eliminando socio:', err);
      alert('Error al eliminar socio');
    }
  };

  const getEstadoBadgeColor = (estado: string) => {
    switch (estado) {
      case 'activo':
        return 'bg-green-100 text-green-800';
      case 'suspendido':
        return 'bg-blue-100 text-blue-800';
      case 'postumo':
        return 'bg-gray-100 text-gray-800';
      case 'expulsado':
        return 'bg-red-100 text-red-800';
      case 'honorario':
      case 'renunciado':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-red-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando socios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Socios</h1>
            <p className="text-gray-600">Administra los socios de ACA Chile</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <Link
              to="/panel-admin/postulantes"
              className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Gestionar postulantes
            </Link>
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FileUp className="h-5 w-5 mr-2" />
              Importar CSV
            </button>
            
            <button
              onClick={openCreateModalRoute}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <UserPlus className="h-5 w-5 mr-2" />
              Agregar Socio
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
              <p className="text-red-700">{error}</p>
              <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Buscar por nombre, email o RUT..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            <select
              value={estadoFilter}
              onChange={(e) => setEstadoFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="">Todos los estados</option>
              <option value="activo">Activos</option>
              <option value="suspendido">Suspendidos</option>
              <option value="expulsado">Expulsados</option>
              <option value="postumo">Póstumos</option>
            </select>

            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value={20}>20 por página</option>
              <option value={50}>50 por página</option>
              <option value={100}>100 por página</option>
            </select>

            <div className="flex items-center justify-end text-sm text-gray-600">
              Total: <span className="ml-2 font-semibold text-gray-900">{socios.length} socios</span>
            </div>
          </div>
        </div>

        {/* Barra de acciones masivas */}
        {selectedSocios.size > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-blue-900 font-medium">
                {selectedSocios.size} socio(s) seleccionado(s)
              </span>
              <button
                onClick={() => setSelectedSocios(new Set())}
                className="text-blue-600 hover:text-blue-800 text-sm underline"
              >
                Limpiar selección
              </button>
            </div>
            <button
              onClick={() => setShowBulkEditModal(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Edit className="h-5 w-5 mr-2" />
              Editar Seleccionados
            </button>
          </div>
        )}

        {/* Lista de socios */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isSomeSelected;
                    }}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Socio
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contacto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cuota
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estadísticas
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedSocios.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                    <p>No se encontraron socios</p>
                  </td>
                </tr>
              ) : (
                paginatedSocios.map((socio) => (
                  <tr key={socio.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedSocios.has(socio.id)}
                        onChange={() => toggleSelectSocio(socio.id)}
                        className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {socio.fotoUrl ? (
                            <img
                              src={socio.fotoUrl}
                              alt={socio.nombreCompleto}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                              <span className="text-red-600 font-semibold">
                                {socio.nombre.charAt(0)}{socio.apellido.charAt(0)}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <Link 
                            to={`/panel-admin/users/${socio.id}`}
                            className="text-sm font-medium text-gray-900 hover:text-red-600 hover:underline cursor-pointer transition-colors block"
                          >
                            {socio.nombreCompleto}
                          </Link>
                          {socio.rut && (
                            <div className="text-sm text-gray-500">
                              RUT: {socio.rut}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{socio.email}</div>
                      {socio.telefono && (
                        <div className="text-sm text-gray-500">{socio.telefono}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ${socio.valorCuota.toLocaleString('es-CL')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getEstadoBadgeColor(socio.estadoSocio)}`}>
                        {socio.estadoSocio}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {socio.estadisticasCuotas && (
                        <div>
                          <div className="flex items-center">
                            <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                            {socio.estadisticasCuotas.cuotasPagadas} pagadas
                          </div>
                          <div className="flex items-center">
                            <XCircle className="h-4 w-4 text-red-500 mr-1" />
                            {socio.estadisticasCuotas.cuotasPendientes} pendientes
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => setSelectedSocio(socio)}
                        className="text-red-600 hover:text-red-900 mr-3"
                        title="Ver detalle"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingSocio(socio);
                          openEditModalRoute(socio.id);
                        }}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                        title="Editar socio"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteSocio(socio)}
                        className="text-red-600 hover:text-red-900"
                        title="Eliminar socio"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>

          {/* Controles de paginación */}
          {totalPages > 1 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Mostrando <span className="font-medium">{startIndex + 1}</span> a{' '}
                <span className="font-medium">{Math.min(endIndex, socios.length)}</span> de{' '}
                <span className="font-medium">{socios.length}</span> socios
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Primera
                </button>
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <span className="px-4 py-1 text-sm text-gray-700">
                  Página {currentPage} de {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Siguiente
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Última
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Importar CSV */}
      {showImportModal && (
        <ImportCSVModal
          onClose={() => setShowImportModal(false)}
          onImportComplete={() => {
            setShowImportModal(false);
            loadSocios();
          }}
        />
      )}

      {/* Modal Crear Socio */}
      {isCreateRoute && (
        <CreateSocioModal
          onClose={closeCreateModal}
          onSocioCreated={() => {
            loadSocios();
            closeCreateModal();
          }}
          roleOptions={roleOptions}
        />
      )}

      {/* Modal Editar Socio */}
      {isEditRoute && isEditLoading && !editingSocio && (
        <ModalLoading message="Cargando información del socio..." onClose={closeEditModal} />
      )}

      {isEditRoute && editingSocio && (
        <EditSocioModal
          socio={editingSocio}
          onClose={() => {
            setEditingSocio(null);
            closeEditModal();
          }}
          onSocioUpdated={() => {
            loadSocios();
            setEditingSocio(null);
            closeEditModal();
          }}
          roleOptions={roleOptions}
        />
      )}

      {/* Modal Detalle Socio */}
      {selectedSocio && (
        <SocioDetailModal
          socio={selectedSocio}
          onClose={() => setSelectedSocio(null)}
        />
      )}

      {/* Modal Edición Masiva */}
      {showBulkEditModal && (
        <BulkEditModal
          selectedIds={Array.from(selectedSocios)}
          onClose={() => setShowBulkEditModal(false)}
          onComplete={() => {
            setShowBulkEditModal(false);
            setSelectedSocios(new Set());
            loadSocios();
          }}
        />
      )}
    </div>
  );
}

function ModalLoading({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm text-center">
        <Loader2 className="h-8 w-8 text-red-600 animate-spin mx-auto mb-4" />
        <p className="text-sm text-gray-600 mb-4">{message}</p>
        <button
          type="button"
          onClick={onClose}
          className="w-full inline-flex justify-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

// Modal para importar socios desde CSV
function ImportCSVModal({ onClose, onImportComplete }: {
  onClose: () => void;
  onImportComplete: () => void;
}) {
  const PROTECTED_ADMIN_EMAILS = new Set([
    'jcartagenac@gmail.com',
    'paulina.sandoval.g@gmail.com',
  ]);

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string[][]>([]);
  const [results, setResults] = useState<{
    created: number;
    updated: number;
    rejected: number;
    errors: Array<{ row: number; error: string }>;
    protectedAdmins: Array<{ id: number; email: string; nombreCompleto: string }>;
  } | null>(null);

  const parseCsvLine = (line: string): string[] => {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    values.push(current.trim());
    return values.map((value) => value.replace(/^"|"$/g, '').trim());
  };

  const parseCsvText = (text: string): string[][] =>
    text
      .split(/\r?\n/)
      .filter((line) => line.trim().length > 0)
      .map(parseCsvLine);

  const normalizeHeader = (header: string): string => {
    const normalized = header.trim().toLowerCase();
    const aliases: Record<string, string> = {
      correo: 'email',
      situacion: 'estado_socio',
    };

    return aliases[normalized] || normalized;
  };

  const normalizeEmail = (value?: string) => (value || '').trim().toLowerCase();

  const normalizeText = (value?: string) =>
    (value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();

  const extractRutKey = (rut?: string | null) => {
    const digits = String(rut || '').replace(/\D/g, '');
    return digits.slice(0, 6);
  };

  const normalizeStatus = (status?: string) => {
    const normalized = normalizeText(status);
    if (!normalized) return 'activo';

    const map: Record<string, 'activo' | 'suspendido' | 'expulsado' | 'postumo'> = {
      activo: 'activo',
      suspendido: 'suspendido',
      suspendida: 'suspendido',
      expulsado: 'expulsado',
      expulsada: 'expulsado',
      postumo: 'postumo',
      postuma: 'postumo',
    };

    return map[normalized] || null;
  };

  const splitFullName = (fullName: string) => {
    const parts = fullName.split(/\s+/).filter(Boolean);

    if (parts.length <= 1) {
      return {
        nombre: fullName.trim(),
        apellido: '',
      };
    }

    if (parts.length === 2) {
      return {
        nombre: parts[0],
        apellido: parts[1],
      };
    }

    const firstNameParts = parts.length >= 4 ? parts.slice(0, 2) : parts.slice(0, 1);
    const lastNameParts = parts.slice(firstNameParts.length);

    return {
      nombre: firstNameParts.join(' '),
      apellido: lastNameParts.join(' '),
    };
  };

  const generatePasswordFromRut = (rut: string) => {
    const digits = rut.replace(/\D/g, '');
    if (digits.length < 6) {
      throw new Error(`El RUT "${rut}" no permite generar una clave inicial de 6 dígitos`);
    }
    return digits.slice(0, 6);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      setError('Por favor selecciona un archivo CSV válido');
      return;
    }

    try {
      const text = await selectedFile.text();
      const rows = parseCsvText(text).slice(0, 6);
      setPreview(rows);
      setFile(selectedFile);
      setError(null);
      setResults(null);
    } catch {
      setError('No pudimos leer el archivo CSV');
    }
  };

  const downloadTemplate = () => {
    const template = `situacion,numero_socio,nombre,rut,email,telefono,direccion,ciudad,comuna,region,fecha_nacimiento,red_social
activo,1001,Juan Pérez,12.345.678-9,juan.perez@email.com,+56912345678,"Av. Libertador 123, Depto 45",Santiago,Las Condes,Metropolitana,1985-03-15,https://instagram.com/juanperez
suspendido,1002,María González,98.765.432-1,maria.gonzalez@email.com,+56987654321,Calle Principal 456,Valparaíso,Valparaíso,Valparaíso,1990-07-20,
postumo,1003,Pedro Silva,11.222.333-4,pedro.silva@email.com,,,,,,,`;

    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'plantilla_socios_aca.csv';
    link.click();
  };

  const handleImport = async () => {
    if (!file) {
      setError('Por favor selecciona un archivo');
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const text = await file.text();
      const rows = parseCsvText(text);

      if (rows.length < 2) {
        throw new Error('El archivo está vacío o no tiene datos');
      }

      const rawHeaders = rows[0] || [];
      const headers = rawHeaders.map(normalizeHeader);
      const requiredHeaders = ['nombre', 'rut', 'email'];
      const missingHeaders = requiredHeaders.filter((header) => !headers.includes(header));

      if (missingHeaders.length > 0) {
        throw new Error(`Faltan columnas requeridas: ${missingHeaders.join(', ')}`);
      }

      const existingResponse = await sociosService.getSocios({ page: 1, limit: 1000 });
      if (!existingResponse.success || !existingResponse.data) {
        throw new Error(existingResponse.error || 'No pudimos validar la compatibilidad con los socios existentes');
      }

      const existingSocios = existingResponse.data.socios || [];
      const protectedAdmins = existingSocios
        .filter((socio) => PROTECTED_ADMIN_EMAILS.has(normalizeEmail(socio.email)) && socio.role === 'admin')
        .map((socio) => ({
          id: socio.id,
          email: socio.email,
          nombreCompleto: socio.nombreCompleto,
          rut: socio.rut,
          role: socio.role,
        }));

      if (protectedAdmins.length !== 2) {
        throw new Error('No se pudo validar a los dos administradores protegidos antes de importar');
      }

      const protectedIds = new Set(protectedAdmins.map((admin) => admin.id));
      const protectedKeys = new Set(protectedAdmins.map((admin) => extractRutKey(admin.rut)));
      const protectedEmails = new Set(protectedAdmins.map((admin) => normalizeEmail(admin.email)));

      const duplicateExistingKeys = new Map<string, Array<{ id: number; nombreCompleto: string }>>();
      const existingByRutKey = new Map<string, Socio>();

      for (const socio of existingSocios) {
        if (protectedIds.has(socio.id)) continue;

        const key = extractRutKey(socio.rut);
        if (!key) {
          throw new Error(`Compatibilidad bloqueada: el socio ${socio.nombreCompleto} (ID ${socio.id}) no tiene un RUT válido para generar la clave de 6 dígitos`);
        }

        const already = existingByRutKey.get(key);
        if (already) {
          duplicateExistingKeys.set(key, [already, socio].map((item) => ({ id: item.id, nombreCompleto: item.nombreCompleto })));
        } else {
          existingByRutKey.set(key, socio);
        }
      }

      if (duplicateExistingKeys.size > 0) {
        const [conflictKey, conflictRows] = duplicateExistingKeys.entries().next().value;
        throw new Error(`Compatibilidad bloqueada: ya existen múltiples socios con la clave única ${conflictKey} (${conflictRows.map((row) => `${row.nombreCompleto} [ID ${row.id}]`).join(', ')})`);
      }

      const errors: Array<{ row: number; error: string }> = [];
      const seenCsvKeys = new Map<string, number>();
      let created = 0;
      let updated = 0;
      let rejected = 0;

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i] || [];
        const rowNumber = i + 1;

        if (row.every((cell) => !cell.trim())) {
          continue;
        }

        const socioData: Record<string, string> = {};
        headers.forEach((header, index) => {
          socioData[header] = (row[index] || '').trim();
        });

        const fullName = socioData.nombre?.trim();
        const email = normalizeEmail(socioData.email);
        const rut = socioData.rut?.trim();
        const rutKey = extractRutKey(rut);
        const estadoSocio = normalizeStatus(socioData.estado_socio);

        if (!fullName || !email || !rut) {
          errors.push({ row: rowNumber, error: 'Faltan campos obligatorios: nombre, rut o email' });
          rejected++;
          continue;
        }

        if (rutKey.length < 6) {
          errors.push({ row: rowNumber, error: `El RUT "${rut}" no permite obtener una clave única válida de 6 dígitos` });
          rejected++;
          continue;
        }

        if (!estadoSocio) {
          errors.push({ row: rowNumber, error: `Estado de socio inválido en situacion: "${socioData.estado_socio}"` });
          rejected++;
          continue;
        }

        const duplicatedCsvRow = seenCsvKeys.get(rutKey);
        if (duplicatedCsvRow) {
          errors.push({ row: rowNumber, error: `Clave única duplicada en el CSV (${rutKey}). Ya apareció en la fila ${duplicatedCsvRow}` });
          rejected++;
          continue;
        }
        seenCsvKeys.set(rutKey, rowNumber);

        if (protectedKeys.has(rutKey) || protectedEmails.has(email)) {
          const matchedAdmin = protectedAdmins.find((admin) => protectedEmails.has(email) ? normalizeEmail(admin.email) === email : extractRutKey(admin.rut) === rutKey);
          errors.push({
            row: rowNumber,
            error: `Registro protegido: coincide con el administrador ${matchedAdmin?.nombreCompleto || 'protegido'} (ID ${matchedAdmin?.id || 'desconocido'}) y no será modificado`
          });
          rejected++;
          continue;
        }

        const { nombre, apellido } = splitFullName(fullName);
        const existingSocio = existingByRutKey.get(rutKey);

        const payload: CreateSocioData & Record<string, unknown> = {
          nombre,
          apellido,
          email,
          numeroSocio: socioData.numero_socio || undefined,
          telefono: socioData.telefono || undefined,
          rut,
          direccion: socioData.direccion || undefined,
          ciudad: socioData.ciudad || undefined,
          comuna: socioData.comuna || undefined,
          region: socioData.region || undefined,
          fechaNacimiento: socioData.fecha_nacimiento || undefined,
          redSocial: socioData.red_social || undefined,
          estadoSocio,
        };

        try {
          const initialPassword = generatePasswordFromRut(rut);

          if (existingSocio) {
            const updatePayload = Object.fromEntries(
              Object.entries(payload).filter(([, value]) => value !== undefined && value !== '')
            );
            const updateResponse = await sociosService.updateSocio(existingSocio.id, {
              ...updatePayload,
              password: initialPassword,
            } as Partial<Socio> & { password: string });
            if (!updateResponse.success) {
              throw new Error(updateResponse.error || 'Error al actualizar socio');
            }
            updated++;
          } else {
            const createResponse = await sociosService.createSocio({
              ...payload,
              password: initialPassword,
              fechaIngreso: new Date().toISOString().split('T')[0],
            });
            if (!createResponse.success) {
              throw new Error(createResponse.error || 'Error al crear socio');
            }
            created++;
          }
        } catch (importError) {
          errors.push({
            row: rowNumber,
            error: importError instanceof Error ? importError.message : 'Error al procesar fila',
          });
          rejected++;
        }
      }

      const postImportCheck = await sociosService.getSocios({ page: 1, limit: 1000 });
      if (!postImportCheck.success || !postImportCheck.data) {
        throw new Error('La importación terminó, pero falló la verificación final de administradores protegidos');
      }

      const finalProtectedAdmins = postImportCheck.data.socios.filter(
        (socio) => PROTECTED_ADMIN_EMAILS.has(normalizeEmail(socio.email)) && socio.role === 'admin'
      );

      if (finalProtectedAdmins.length !== 2) {
        throw new Error('La verificación final falló: Juan Cartagena y Paulina Sandoval deben seguir existiendo como administradores');
      }

      setResults({
        created,
        updated,
        rejected,
        errors,
        protectedAdmins: finalProtectedAdmins.map(({ id, email, nombreCompleto }) => ({ id, email, nombreCompleto })),
      });

      if (created > 0 || updated > 0) {
        setTimeout(() => {
          onImportComplete();
        }, 1500);
      }
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : 'Error al importar archivo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Importar Socios desde CSV</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="mb-6 bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-blue-400 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">Instrucciones:</h3>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>El archivo debe ser formato CSV (separado por comas)</li>
                  <li>Compatible con columnas de origen: <code className="bg-blue-100 px-1 rounded">situacion, numero_socio, nombre, rut, correo/email, telefono</code></li>
                  <li>Campos <strong>obligatorios</strong>: <code className="bg-blue-100 px-1 rounded">nombre, rut, email</code></li>
                  <li>Campos <strong>opcionales</strong>: <code className="bg-blue-100 px-1 rounded">telefono, direccion, ciudad, comuna, region, fecha_nacimiento, red_social</code></li>
                  <li>Mapeo automático: <code className="bg-blue-100 px-1 rounded">situacion → estado_socio</code>, <code className="bg-blue-100 px-1 rounded">correo → email</code></li>
                  <li><strong>Clave única:</strong> se usan solo los primeros 6 dígitos numéricos del RUT</li>
                  <li>Si la clave única ya existe → se actualiza el socio</li>
                  <li>Si la clave única no existe → se crea un nuevo socio</li>
                  <li>Estados permitidos: <code className="bg-blue-100 px-1 rounded">activo, suspendido, expulsado, postumo</code></li>
                  <li>Los administradores protegidos (Juan Cartagena y Paulina Sandoval) se excluyen automáticamente de cualquier actualización</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <button
              onClick={downloadTemplate}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="h-5 w-5 mr-2" />
              Descargar Plantilla CSV
            </button>
          </div>

          <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4 rounded">
            <div className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-sm font-medium text-green-900 block mb-1">
                  Modo de Importación: Upsert por clave RUT-6
                </span>
                <p className="text-xs text-green-800">
                  Antes de importar se valida compatibilidad con los socios existentes y se identifican los dos administradores protegidos.
                  <br />• Si un registro coincide con Juan Cartagena o Paulina Sandoval → se rechaza
                  <br />• Si la clave de 6 dígitos ya existe → se actualiza el socio no protegido
                  <br />• Si no existe → se crea un nuevo socio
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4 rounded">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          )}

          {results && (
            <div className="mb-6 space-y-4">
              <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                  <div className="text-green-700">
                    <p className="font-semibold">Importación completada</p>
                    <p className="text-sm mt-1">
                      {results.created} creados, {results.updated} actualizados, {results.rejected} rechazados
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded p-4">
                <h4 className="font-semibold text-slate-900 mb-2">Administradores protegidos verificados</h4>
                <ul className="text-sm text-slate-700 space-y-1">
                  {results.protectedAdmins.map((admin) => (
                    <li key={admin.id}>• ID {admin.id} — {admin.nombreCompleto} — {admin.email}</li>
                  ))}
                </ul>
              </div>

              {results.errors.length > 0 && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
                  <h4 className="font-semibold text-red-900 mb-2">Rechazos ({results.errors.length})</h4>
                  <ul className="text-sm text-red-800 space-y-1 max-h-56 overflow-y-auto">
                    {results.errors.map((err, idx) => (
                      <li key={idx}><strong>Fila {err.row}:</strong> {err.error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seleccionar archivo CSV
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-red-50 file:text-red-700
                hover:file:bg-red-100
                cursor-pointer"
            />
          </div>

          {preview.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Vista previa (primeras 5 filas):</h3>
              <div className="overflow-x-auto border rounded-lg">
                <table className="min-w-full divide-y divide-gray-200 text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      {preview[0]?.map((header: string, idx: number) => (
                        <th key={idx} className="px-3 py-2 text-left font-medium text-gray-500">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {preview.slice(1).map((row, rowIdx) => (
                      <tr key={rowIdx}>
                        {row.map((cell: string, cellIdx: number) => (
                          <td key={cellIdx} className="px-3 py-2 text-gray-700">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end space-x-4 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleImport}
              disabled={!file || loading}
              className="flex items-center px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <Upload className="h-5 w-5 mr-2" />
                  Importar Socios
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Modal para crear socio
function CreateSocioModal({ onClose, onSocioCreated, roleOptions }: {
  onClose: () => void;
  onSocioCreated: () => void;
  roleOptions: Array<{ key: string; label: string; description?: string; priority?: number }>;
}) {
  const [formData, setFormData] = useState<CreateSocioData>({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    rut: '',
    direccion: '',
    valorCuota: 6500,
    estadoSocio: 'activo',
    fechaIngreso: new Date().toISOString().substring(0, 10),
    listaNegra: false,
    motivoListaNegra: '',
    password: '',
    // role will be appended dynamically when submitting
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [foto, setFoto] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Crear socio
      // Include role if available
      const payload: any = { ...formData };
      if (formData && (formData as any).role) payload.role = (formData as any).role;

      const response = await sociosService.createSocio(payload);

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Error al crear socio');
      }

      // Si hay foto, subirla
      if (foto && response.data.id) {
        await sociosService.subirFotoSocio(foto, response.data.id);
      }

      onSocioCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Agregar Nuevo Socio</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4 rounded">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Foto */}
            <div>
              <div className="block text-sm font-medium text-gray-700 mb-2">
                Foto del Socio
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  {fotoPreview ? (
                    <img
                      src={fotoPreview}
                      alt="Preview"
                      className="h-20 w-20 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center">
                      <Upload className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                </div>
                <label htmlFor="foto-input" className="cursor-pointer bg-white px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <span className="text-sm text-gray-700">Seleccionar foto</span>
                  <input
                    id="foto-input"
                    type="file"
                    accept="image/*"
                    onChange={handleFotoChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Nombre y Apellido */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="nombre-input" className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  id="nombre-input"
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="apellido-input" className="block text-sm font-medium text-gray-700 mb-2">
                  Apellido <span className="text-red-500">*</span>
                </label>
                <input
                  id="apellido-input"
                  type="text"
                  required
                  value={formData.apellido}
                  onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Email y Teléfono */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="email-input" className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  id="email-input"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="telefono-input" className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono <span className="text-red-500">*</span>
                </label>
                <input
                  id="telefono-input"
                  type="tel"
                  required
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  placeholder="+56912345678"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* RUT */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                RUT <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.rut}
                onChange={(e) => setFormData({ ...formData, rut: e.target.value })}
                placeholder="12.345.678-9"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            {/* Dirección */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dirección <span className="text-red-500">*</span>
              </label>
              <AddressInput
                value={formData.direccion}
                onChange={(value) => setFormData({ ...formData, direccion: value })}
                placeholder="Ingresa tu dirección completa"
                className="mt-1"
              />
            </div>

            {/* Valor Cuota */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor Cuota Mensual (CLP)
              </label>
              <input
                type="number"
                value={formData.valorCuota}
                onChange={(e) => setFormData({ ...formData, valorCuota: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
              <p className="mt-1 text-sm text-gray-500">Por defecto: $6.500 CLP</p>
            </div>

            {/* Estado del Socio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado del Socio
              </label>
              <select
                value={formData.estadoSocio}
                onChange={(e) => setFormData({ ...formData, estadoSocio: e.target.value as 'activo' | 'suspendido' | 'postumo' | 'expulsado' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="activo">Activo</option>
                <option value="suspendido">Suspendido</option>
                <option value="postumo">Póstumo</option>
                <option value="expulsado">Expulsado</option>
              </select>
            </div>

            {/* Fecha de Ingreso */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Ingreso
              </label>
              <input
                type="date"
                value={formData.fechaIngreso}
                onChange={(e) => setFormData({ ...formData, fechaIngreso: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            {/* Lista Negra */}
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.listaNegra}
                  onChange={(e) => setFormData({ ...formData, listaNegra: e.target.checked })}
                  className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">Lista Negra (Prohibición permanente)</span>
              </label>
              {formData.listaNegra && (
                <div className="mt-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Motivo de la Lista Negra
                  </label>
                  <textarea
                    value={formData.motivoListaNegra}
                    onChange={(e) => setFormData({ ...formData, motivoListaNegra: e.target.value })}
                    rows={3}
                    placeholder="Explique el motivo de la prohibición permanente..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contraseña <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
              <p className="mt-1 text-sm text-gray-500">Mínimo 6 caracteres</p>
            </div>

            {/* Rol */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Rol</label>
              <select
                value={(formData as any).role || roleOptions[0]?.key}
                onChange={(e) => setFormData({ ...formData, role: e.target.value } as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent mb-2"
              >
                {roleOptions.map((opt) => (
                  <option key={opt.key} value={opt.key}>{opt.label}</option>
                ))}
              </select>
              {roleOptions.find((r) => r.key === ((formData as any).role || roleOptions[0]?.key))?.description && (
                <p className="text-xs text-gray-500">
                  {roleOptions.find((r) => r.key === ((formData as any).role || roleOptions[0]?.key))?.description}
                </p>
              )}
            </div>

            {/* Botones */}
            <div className="flex items-center justify-end space-x-4 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-5 w-5 mr-2" />
                    Crear Socio
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Modal para editar socio
function EditSocioModal({ socio, onClose, onSocioUpdated, roleOptions }: {
  socio: Socio;
  onClose: () => void;
  onSocioUpdated: () => void;
  roleOptions: Array<{ key: string; label: string; description?: string; priority?: number }>;
}) {
  const [formData, setFormData] = useState({
    nombre: socio.nombre,
    apellido: socio.apellido,
    email: socio.email,
    telefono: socio.telefono || '',
    rut: socio.rut || '',
    direccion: socio.direccion || '',
    ciudad: socio.ciudad || '',
    valorCuota: socio.valorCuota,
    estadoSocio: socio.estadoSocio,
    fechaIngreso: socio.fechaIngreso,
    listaNegra: socio.listaNegra,
    motivoListaNegra: socio.motivoListaNegra || '',
    role: (socio as any).role || roleOptions[0]?.key || 'usuario'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [foto, setFoto] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(socio.fotoUrl || null);

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Actualizar socio
      const response = await sociosService.updateSocio(socio.id, formData);

      if (!response.success) {
        throw new Error(response.error || 'Error al actualizar socio');
      }

      // Si hay foto nueva, subirla
      if (foto) {
        await sociosService.subirFotoSocio(foto, socio.id);
      }

      onSocioUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Editar Socio</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4 rounded">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Foto */}
            <div>
              <div className="block text-sm font-medium text-gray-700 mb-2">
                Foto del Socio
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  {fotoPreview ? (
                    <img
                      src={fotoPreview}
                      alt="Preview"
                      className="h-20 w-20 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center">
                      <Upload className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                </div>
                <label htmlFor="edit-foto-input" className="cursor-pointer bg-white px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <span className="text-sm text-gray-700">Cambiar foto</span>
                  <input
                    id="edit-foto-input"
                    type="file"
                    accept="image/*"
                    onChange={handleFotoChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Nombre y Apellido */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="edit-nombre-input" className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  id="edit-nombre-input"
                  type="text"
                  required
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="edit-apellido-input" className="block text-sm font-medium text-gray-700 mb-2">
                  Apellido <span className="text-red-500">*</span>
                </label>
                <input
                  id="edit-apellido-input"
                  type="text"
                  required
                  value={formData.apellido}
                  onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Email y Teléfono */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="edit-email-input" className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  id="edit-email-input"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="edit-telefono-input" className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono
                </label>
                <input
                  id="edit-telefono-input"
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  placeholder="+56912345678"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* RUT y Ciudad */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  RUT
                </label>
                <input
                  type="text"
                  value={formData.rut}
                  onChange={(e) => setFormData({ ...formData, rut: e.target.value })}
                  placeholder="12.345.678-9"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ciudad
                </label>
                <input
                  type="text"
                  value={formData.ciudad}
                  onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                  placeholder="Santiago, Valparaíso, etc."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Rol */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rol
              </label>
              <select
                value={(formData as any).role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                {roleOptions.map((opt) => (
                  <option key={opt.key} value={opt.key}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Dirección */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dirección
              </label>
              <AddressInput
                value={formData.direccion}
                onChange={(value) => setFormData({ ...formData, direccion: value })}
                placeholder="Ingresa tu dirección completa"
                className="mt-1"
              />
            </div>

            {/* Valor Cuota y Estado */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor Cuota Mensual (CLP)
                </label>
                <input
                  type="number"
                  value={formData.valorCuota}
                  onChange={(e) => setFormData({ ...formData, valorCuota: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado del Socio
                </label>
                <select
                  value={formData.estadoSocio}
                  onChange={(e) => setFormData({ ...formData, estadoSocio: e.target.value as 'activo' | 'suspendido' | 'postumo' | 'expulsado' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="activo">Activo</option>
                  <option value="suspendido">Suspendido</option>
                  <option value="postumo">Póstumo</option>
                  <option value="expulsado">Expulsado</option>
                </select>
              </div>
            </div>

            {/* Fecha de Ingreso */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Ingreso
              </label>
              <input
                type="date"
                value={formData.fechaIngreso}
                onChange={(e) => setFormData({ ...formData, fechaIngreso: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            {/* Lista Negra */}
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.listaNegra}
                  onChange={(e) => setFormData({ ...formData, listaNegra: e.target.checked })}
                  className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">Lista Negra (Prohibición permanente)</span>
              </label>
              {formData.listaNegra && (
                <div className="mt-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Motivo de la Lista Negra
                  </label>
                  <textarea
                    value={formData.motivoListaNegra}
                    onChange={(e) => setFormData({ ...formData, motivoListaNegra: e.target.value })}
                    rows={3}
                    placeholder="Explique el motivo de la prohibición permanente..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>

            {/* Botones */}
            <div className="flex items-center justify-end space-x-4 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  <>
                    <Edit className="h-5 w-5 mr-2" />
                    Actualizar Socio
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Modal para ver detalle de socio
function SocioDetailModal({ socio, onClose }: {
  socio: Socio;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Detalle del Socio</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Foto y nombre */}
            <div className="flex items-center space-x-4">
              {socio.fotoUrl ? (
                <img
                  src={socio.fotoUrl}
                  alt={socio.nombreCompleto}
                  className="h-20 w-20 rounded-full object-cover"
                />
              ) : (
                <div className="h-20 w-20 rounded-full bg-red-100 flex items-center justify-center">
                  <span className="text-red-600 font-semibold text-2xl">
                    {socio.nombre.charAt(0)}{socio.apellido.charAt(0)}
                  </span>
                </div>
              )}
              <div>
                <h3 className="text-xl font-semibold">{socio.nombreCompleto}</h3>
                <p className="text-gray-600">{socio.email}</p>
              </div>
            </div>

            {/* Información */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <p className="text-sm font-medium text-gray-500">RUT</p>
                <p className="text-gray-900">{socio.rut || 'No especificado'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Teléfono</p>
                <p className="text-gray-900">{socio.telefono || 'No especificado'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Dirección</p>
                <p className="text-gray-900">{socio.direccion || 'No especificada'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Valor Cuota</p>
                <p className="text-gray-900">${socio.valorCuota.toLocaleString('es-CL')}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Estado</p>
                <p className="text-gray-900 capitalize">{socio.estadoSocio}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Fecha Ingreso</p>
                <p className="text-gray-900">
                  {new Date(socio.fechaIngreso).toLocaleDateString('es-CL')}
                </p>
              </div>
            </div>

            {/* Estadísticas de cuotas */}
            {socio.estadisticasCuotas && (
              <div className="pt-4 border-t">
                <h4 className="font-semibold text-gray-900 mb-3">Estadísticas de Cuotas</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Cuotas Pagadas</p>
                    <p className="text-2xl font-bold text-green-600">
                      {socio.estadisticasCuotas.cuotasPagadas}
                    </p>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600">Cuotas Pendientes</p>
                    <p className="text-2xl font-bold text-red-600">
                      {socio.estadisticasCuotas.cuotasPendientes}
                    </p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg col-span-2">
                    <p className="text-sm text-gray-600">Deuda Total</p>
                    <p className="text-2xl font-bold text-blue-600">
                      ${socio.estadisticasCuotas.totalDeuda.toLocaleString('es-CL')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Botón cerrar */}
            <div className="flex justify-end pt-4 border-t">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Modal para edición masiva
function BulkEditModal({ selectedIds, onClose, onComplete }: {
  selectedIds: number[];
  onClose: () => void;
  onComplete: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    valorCuota: '' as string | number,
    estadoSocio: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar que al menos un campo esté seleccionado
    if (!formData.valorCuota && !formData.estadoSocio) {
      setError('Debes seleccionar al menos un campo para actualizar');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const updates: any = {};
      if (formData.valorCuota) updates.valorCuota = Number(formData.valorCuota);
      if (formData.estadoSocio) updates.estadoSocio = formData.estadoSocio;

      // Actualizar cada socio seleccionado
      const promises = selectedIds.map(id =>
        sociosService.updateSocio(id, updates)
      );

      const results = await Promise.all(promises);
      const failed = results.filter(r => !r.success);

      if (failed.length > 0) {
        setError(`${failed.length} socio(s) no pudieron ser actualizados`);
      } else {
        onComplete();
      }
    } catch (err) {
      setError('Error al actualizar los socios');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Edición Masiva</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="mb-4 bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
            <p className="text-sm text-blue-900">
              <strong>{selectedIds.length} socio(s) seleccionado(s)</strong>
              <br />
              Los cambios se aplicarán a todos los socios seleccionados.
              Solo se actualizarán los campos que completes.
            </p>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4 rounded">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Valor Cuota */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor Cuota Mensual (CLP)
              </label>
              <input
                type="number"
                value={formData.valorCuota}
                onChange={(e) => setFormData({ ...formData, valorCuota: e.target.value })}
                placeholder="Dejar vacío para no modificar"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            {/* Estado del Socio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado del Socio
              </label>
              <select
                value={formData.estadoSocio}
                onChange={(e) => setFormData({ ...formData, estadoSocio: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="">No modificar</option>
                <option value="activo">Activo</option>
                <option value="suspendido">Suspendido</option>
                <option value="postumo">Póstumo</option>
                <option value="expulsado">Expulsado</option>
              </select>
            </div>

            {/* Botones */}
            <div className="flex items-center justify-end space-x-4 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  <>
                    <Edit className="h-5 w-5 mr-2" />
                    Aplicar Cambios
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
