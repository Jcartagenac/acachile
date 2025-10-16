/**
 * Página de gestión de socios
 * ACA Chile Frontend
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { sociosService, Socio, CreateSocioData } from '../services/sociosService';
import { 
  Users,
  UserPlus,
  Search,
  Edit,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Upload,
  X
} from 'lucide-react';

export default function AdminSocios() {
  const [socios, setSocios] = useState<Socio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFilter, setEstadoFilter] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSocio, setSelectedSocio] = useState<Socio | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>('Componente inicializado');

  console.log('[AdminSocios] Componente renderizado');
  console.log('[AdminSocios] showCreateModal =', showCreateModal);

  // Test inmediato
  useEffect(() => {
    console.log('[AdminSocios] useEffect ejecutado - componente montado');
    setDebugInfo('Componente montado - useEffect ejecutado');
  }, []);

  useEffect(() => {
    loadSocios();
  }, [searchTerm, estadoFilter]);

  useEffect(() => {
    console.log('[AdminSocios] showCreateModal cambió a:', showCreateModal);
  }, [showCreateModal]);

  const loadSocios = async () => {
    try {
      setLoading(true);
      const response = await sociosService.getSocios({
        search: searchTerm || undefined,
        estado: estadoFilter || undefined,
      });

      if (response.success && response.data) {
        setSocios(response.data.socios);
      } else {
        setError(response.error || 'Error al cargar socios');
      }
    } catch (err) {
      setError('Error al cargar socios');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getEstadoBadgeColor = (estado: string) => {
    switch (estado) {
      case 'activo':
        return 'bg-green-100 text-green-800';
      case 'inactivo':
        return 'bg-gray-100 text-gray-800';
      case 'suspendido':
        return 'bg-red-100 text-red-800';
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
        {/* DEBUG INFO */}
        <div className="mb-4 p-4 bg-yellow-100 border-2 border-yellow-500 rounded">
          <p className="font-bold text-yellow-900">🔍 DEBUG MODE ACTIVO</p>
          <p className="text-sm text-yellow-800">showCreateModal: {String(showCreateModal)}</p>
          <p className="text-sm text-yellow-800">debugInfo: {debugInfo}</p>
          <p className="text-sm text-yellow-800">Timestamp: {new Date().toLocaleTimeString()}</p>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Socios</h1>
            <p className="text-gray-600">Administra los socios de ACA Chile</p>
          </div>
          
          <div className="flex flex-col gap-2">
            {/* Botón de prueba simple */}
            <button
              onClick={() => alert('TEST: Este botón funciona!')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              🧪 TEST - Click aquí
            </button>
            
            {/* Botón original */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('[AdminSocios] ============ CLICK EN BOTÓN ============');
                console.log('[AdminSocios] Event:', e);
                console.log('[AdminSocios] showCreateModal ANTES:', showCreateModal);
                alert('¡Botón clickeado! Abriendo modal...');
                setShowCreateModal(true);
                console.log('[AdminSocios] setShowCreateModal(true) llamado');
                console.log('[AdminSocios] showCreateModal DESPUÉS (puede no cambiar inmediatamente)');
              }}
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
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
              <option value="inactivo">Inactivos</option>
              <option value="suspendido">Suspendidos</option>
            </select>

            <div className="flex items-center justify-end text-sm text-gray-600">
              Total: <span className="ml-2 font-semibold text-gray-900">{socios.length} socios</span>
            </div>
          </div>
        </div>

        {/* Lista de socios */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
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
              {socios.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                    <p>No se encontraron socios</p>
                  </td>
                </tr>
              ) : (
                socios.map((socio) => (
                  <tr key={socio.id} className="hover:bg-gray-50">
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
                            to={`/admin/socios/${socio.id}`}
                            className="text-sm font-medium text-gray-900 hover:text-red-600 cursor-pointer transition-colors"
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
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => {/* TODO: editar socio */}}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Crear Socio */}
      {showCreateModal && (
        <>
          {console.log('[AdminSocios] Renderizando CreateSocioModal')}
          <CreateSocioModal
            onClose={() => setShowCreateModal(false)}
            onSocioCreated={() => {
              setShowCreateModal(false);
              loadSocios();
            }}
          />
        </>
      )}

      {/* Modal Detalle Socio */}
      {selectedSocio && (
        <SocioDetailModal
          socio={selectedSocio}
          onClose={() => setSelectedSocio(null)}
        />
      )}
    </div>
  );
}

// Modal para crear socio
function CreateSocioModal({ onClose, onSocioCreated }: {
  onClose: () => void;
  onSocioCreated: () => void;
}) {
  console.log('[CreateSocioModal] Componente montado');
  
  const [formData, setFormData] = useState<CreateSocioData>({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    rut: '',
    direccion: '',
    valorCuota: 6500,
    password: '',
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
      const response = await sociosService.createSocio(formData);

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
              <textarea
                required
                value={formData.direccion}
                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
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
