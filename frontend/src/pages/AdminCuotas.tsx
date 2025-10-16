/**
 * Página de gestión de cuotas anuales
 * ACA Chile Frontend - Versión Compacta y Escalable
 */

import { useState, useEffect } from 'react';
import { sociosService, Socio, Cuota } from '../services/sociosService';
import { 
  Calendar,
  CheckCircle,
  Clock,
  RefreshCw,
  AlertCircle,
  Loader2,
  X,
  Search,
  User,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  FileDown
} from 'lucide-react';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

interface SocioConEstado extends Socio {
  mesesPagados: number;
  mesesAtrasados: number;
  ultimoPago?: string;
  estadoPago: 'al-dia' | 'atrasado' | 'sin-pagos';
}

export default function AdminCuotas() {
  const [añoActual] = useState(new Date().getFullYear());
  const [mesActual] = useState(new Date().getMonth() + 1);
  const [añoSeleccionado, setAñoSeleccionado] = useState(añoActual);
  const [socios, setSocios] = useState<SocioConEstado[]>([]);
  const [cuotas, setCuotas] = useState<Cuota[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showGenerarModal, setShowGenerarModal] = useState(false);
  const [selectedSocio, setSelectedSocio] = useState<SocioConEstado | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'al-dia' | 'atrasado'>('todos');

  useEffect(() => {
    loadData();
  }, [añoSeleccionado]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('[AdminCuotas] Cargando datos...');

      const [sociosResponse, cuotasResponse] = await Promise.all([
        sociosService.getSocios({ estado: 'activo' }),
        sociosService.getCuotas({ año: añoSeleccionado })
      ]);

      console.log('[AdminCuotas] Respuesta socios:', sociosResponse);
      console.log('[AdminCuotas] Respuesta cuotas:', cuotasResponse);

      if (sociosResponse.success && sociosResponse.data) {
        const sociosConEstado = procesarEstadoSocios(
          sociosResponse.data.socios,
          cuotasResponse.data?.cuotas || []
        );
        setSocios(sociosConEstado);
        console.log('[AdminCuotas] Socios procesados:', sociosConEstado.length);
      } else {
        setError(sociosResponse.error || 'Error al cargar socios');
      }

      if (cuotasResponse.success && cuotasResponse.data) {
        setCuotas(cuotasResponse.data.cuotas);
        console.log('[AdminCuotas] Cuotas cargadas:', cuotasResponse.data.cuotas.length);
      } else {
        console.warn('[AdminCuotas] Error al cargar cuotas:', cuotasResponse.error);
      }

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      setError(`Error al cargar datos: ${errorMsg}`);
      console.error('[AdminCuotas] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const procesarEstadoSocios = (sociosList: Socio[], cuotasList: Cuota[]): SocioConEstado[] => {
    return sociosList.map(socio => {
      const cuotasSocio = cuotasList.filter(c => c.usuarioId === socio.id);
      const mesesPagados = cuotasSocio.filter(c => c.pagado).length;
      
      const mesesEsperados = añoSeleccionado < añoActual ? 12 : mesActual;
      const mesesAtrasados = Math.max(0, mesesEsperados - mesesPagados);
      
      const cuotasPagadas = cuotasSocio.filter(c => c.pagado && c.fechaPago);
      let ultimoPago: string | undefined = undefined;
      
      if (cuotasPagadas.length > 0) {
        const sorted = cuotasPagadas.sort((a, b) => 
          new Date(b.fechaPago!).getTime() - new Date(a.fechaPago!).getTime()
        );
        ultimoPago = sorted[0]?.fechaPago || undefined;
      }

      let estadoPago: 'al-dia' | 'atrasado' | 'sin-pagos' = 'sin-pagos';
      if (mesesPagados > 0) {
        estadoPago = mesesAtrasados === 0 ? 'al-dia' : 'atrasado';
      }

      return {
        ...socio,
        mesesPagados,
        mesesAtrasados,
        ultimoPago,
        estadoPago
      };
    });
  };

  const sociosFiltrados = socios.filter(socio => {
    const matchSearch = socio.nombreCompleto.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       socio.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       socio.rut?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchEstado = filtroEstado === 'todos' || socio.estadoPago === filtroEstado;
    
    return matchSearch && matchEstado;
  });

  const getEstadisticas = () => {
    const totalSocios = socios.length;
    const sociosAlDia = socios.filter(s => s.estadoPago === 'al-dia').length;
    const sociosAtrasados = socios.filter(s => s.estadoPago === 'atrasado').length;
    const sociosSinPagos = socios.filter(s => s.estadoPago === 'sin-pagos').length;
    
    const totalRecaudado = cuotas.filter(c => c.pagado).reduce((sum, c) => sum + c.valor, 0);
    const totalPendiente = cuotas.filter(c => !c.pagado).reduce((sum, c) => sum + c.valor, 0);

    return { 
      totalSocios, 
      sociosAlDia, 
      sociosAtrasados, 
      sociosSinPagos,
      totalRecaudado,
      totalPendiente
    };
  };

  const stats = getEstadisticas();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-red-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando cuotas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Cuotas</h1>
          <p className="mt-1 text-sm text-gray-500">
            Administra los pagos de cuotas mensuales de los socios
          </p>
        </div>

        {/* Controles superiores */}
        <div className="mb-6 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-4">
            <select
              value={añoSeleccionado}
              onChange={(e) => setAñoSeleccionado(Number(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              {Array.from({ length: 5 }, (_, i) => añoActual - 2 + i).map(año => (
                <option key={año} value={año}>{año}</option>
              ))}
            </select>

            <button
              onClick={loadData}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Recargar datos"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowGenerarModal(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
            >
              <Calendar className="h-4 w-4" />
              Generar Cuotas {añoSeleccionado}
            </button>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Socios</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalSocios}</p>
              </div>
              <User className="h-10 w-10 text-gray-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Al Día</p>
                <p className="text-2xl font-bold text-green-700">{stats.sociosAlDia}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.totalSocios > 0 ? ((stats.sociosAlDia / stats.totalSocios) * 100).toFixed(0) : 0}%
                </p>
              </div>
              <CheckCircle className="h-10 w-10 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Atrasados</p>
                <p className="text-2xl font-bold text-red-700">{stats.sociosAtrasados}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.totalSocios > 0 ? ((stats.sociosAtrasados / stats.totalSocios) * 100).toFixed(0) : 0}%
                </p>
              </div>
              <AlertTriangle className="h-10 w-10 text-red-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Recaudado</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${(stats.totalRecaudado / 1000).toFixed(0)}K
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Pendiente: ${(stats.totalPendiente / 1000).toFixed(0)}K
                </p>
              </div>
              <TrendingUp className="h-10 w-10 text-green-500" />
            </div>
          </div>
        </div>

        {/* Filtros y búsqueda */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
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
            </div>

            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value as 'todos' | 'al-dia' | 'atrasado')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="todos">Todos los estados</option>
              <option value="al-dia">Al día</option>
              <option value="atrasado">Atrasados</option>
            </select>

            <button
              onClick={() => {/* TODO: Exportar a Excel */}}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <FileDown className="h-4 w-4" />
              Exportar
            </button>
          </div>
        </div>

        {/* Lista compacta de socios */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-200">
            {sociosFiltrados.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <User className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                {socios.length === 0 ? (
                  <>
                    <p className="font-medium mb-2">No hay socios registrados</p>
                    <p className="text-sm">Agrega socios desde la sección "Gestión de Socios"</p>
                  </>
                ) : (
                  <>
                    <p className="font-medium mb-2">No se encontraron socios</p>
                    <p className="text-sm">Intenta con otros términos de búsqueda o filtros</p>
                  </>
                )}
              </div>
            ) : (
              sociosFiltrados.map((socio) => (
                <div
                  key={socio.id}
                  className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => setSelectedSocio(socio)}
                >
                  <div className="flex items-center justify-between">
                    {/* Info del socio */}
                    <div className="flex items-center gap-4 flex-1">
                      {socio.fotoUrl ? (
                        <img
                          src={socio.fotoUrl}
                          alt={socio.nombreCompleto}
                          className="h-12 w-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                          <span className="text-red-600 font-semibold">
                            {socio.nombre.charAt(0)}{socio.apellido.charAt(0)}
                          </span>
                        </div>
                      )}

                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900">
                          {socio.nombreCompleto}
                        </h3>
                        <p className="text-xs text-gray-500">{socio.email}</p>
                      </div>
                    </div>

                    {/* Estado de pagos */}
                    <div className="flex items-center gap-6">
                      {/* Meses pagados */}
                      <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium text-gray-900">
                          {socio.mesesPagados}/12 meses
                        </p>
                        <p className="text-xs text-gray-500">
                          {socio.ultimoPago ? (
                            `Último: ${new Date(socio.ultimoPago).toLocaleDateString('es-CL', { month: 'short', year: 'numeric' })}`
                          ) : (
                            'Sin pagos'
                          )}
                        </p>
                      </div>

                      {/* Badge de estado */}
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        socio.estadoPago === 'al-dia'
                          ? 'bg-green-100 text-green-800'
                          : socio.estadoPago === 'atrasado'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {socio.estadoPago === 'al-dia' && (
                          <span className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Al día
                          </span>
                        )}
                        {socio.estadoPago === 'atrasado' && (
                          <span className="flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {socio.mesesAtrasados} {socio.mesesAtrasados === 1 ? 'mes' : 'meses'}
                          </span>
                        )}
                        {socio.estadoPago === 'sin-pagos' && 'Sin pagos'}
                      </div>

                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
      </div>

      {/* Modal de detalle de socio */}
      {selectedSocio && (
        <SocioDetailModal
          socio={selectedSocio}
          cuotas={cuotas.filter(c => c.usuarioId === selectedSocio.id)}
          año={añoSeleccionado}
          mesActual={mesActual}
          onClose={() => setSelectedSocio(null)}
          onUpdate={loadData}
        />
      )}

      {/* Modal de generar cuotas */}
      {showGenerarModal && (
        <GenerarCuotasModal
          año={añoSeleccionado}
          onClose={() => setShowGenerarModal(false)}
          onGenerate={loadData}
        />
      )}
    </div>
  );
}

// Modal de detalle de socio con gestión de pagos
interface SocioDetailModalProps {
  socio: SocioConEstado;
  cuotas: Cuota[];
  año: number;
  mesActual: number;
  onClose: () => void;
  onUpdate: () => void;
}

function SocioDetailModal({ socio, cuotas, año, mesActual, onClose, onUpdate }: SocioDetailModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTogglePago = async (cuota: Cuota) => {
    try {
      setLoading(true);
      setError(null);

      if (!cuota.pagado) {
        // Marcar como pagado
        const response = await sociosService.marcarCuotaPagada(cuota.id, {
          metodoPago: 'transferencia'
        });

        if (response.success) {
          onUpdate();
        } else {
          setError(response.error || 'Error al marcar como pagado');
        }
      } else {
        // Desmarcar pago - llamar al API directamente
        const response = await fetch(`/api/admin/cuotas/${cuota.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            pagado: false,
            fechaPago: null,
            metodoPago: null
          }),
        });

        if (response.ok) {
          onUpdate();
        } else {
          setError('Error al desmarcar pago');
        }
      }
    } catch (err) {
      setError('Error al actualizar el pago');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getCuotaMes = (mes: number) => cuotas.find(c => c.mes === mes);
  const esAtrasado = (mes: number) => año === new Date().getFullYear() && mes < mesActual;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {socio.fotoUrl ? (
                <img
                  src={socio.fotoUrl}
                  alt={socio.nombreCompleto}
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
                  <span className="text-red-600 text-xl font-semibold">
                    {socio.nombre.charAt(0)}{socio.apellido.charAt(0)}
                  </span>
                </div>
              )}
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{socio.nombreCompleto}</h2>
                <p className="text-sm text-gray-500">{socio.email}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Resumen */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Cuota Mensual</p>
              <p className="text-xl font-bold text-gray-900">
                ${socio.valorCuota.toLocaleString('es-CL')}
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Meses Pagados</p>
              <p className="text-xl font-bold text-green-700">
                {socio.mesesPagados} / 12
              </p>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Meses Pendientes</p>
              <p className="text-xl font-bold text-red-700">
                {12 - socio.mesesPagados}
              </p>
            </div>
          </div>

          {/* Grid de meses */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {MESES.map((nombreMes, index) => {
              const mes = index + 1;
              const cuota = getCuotaMes(mes);
              const atrasado = esAtrasado(mes) && (!cuota || !cuota.pagado);

              return (
                <button
                  key={mes}
                  onClick={() => cuota && handleTogglePago(cuota)}
                  disabled={loading || !cuota}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    !cuota
                      ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
                      : cuota.pagado
                      ? 'border-green-500 bg-green-50 hover:bg-green-100'
                      : atrasado
                      ? 'border-red-500 bg-red-50 hover:bg-red-100'
                      : 'border-gray-300 bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">
                      {nombreMes}
                    </span>
                    {cuota && (
                      cuota.pagado ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : atrasado ? (
                        <AlertCircle className="h-5 w-5 text-red-600" />
                      ) : (
                        <Clock className="h-5 w-5 text-gray-400" />
                      )
                    )}
                  </div>
                  {cuota && (
                    <div className="text-xs">
                      {cuota.pagado ? (
                        <span className="text-green-700">
                          {cuota.fechaPago ? new Date(cuota.fechaPago).toLocaleDateString('es-CL') : 'Pagado'}
                        </span>
                      ) : (
                        <span className={atrasado ? 'text-red-700 font-medium' : 'text-gray-500'}>
                          {atrasado ? 'Atrasado' : 'Pendiente'}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Instrucciones */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 <strong>Tip:</strong> Haz clic en un mes para marcar como pagado/no pagado.
              Los meses anteriores al actual se marcan automáticamente como atrasados si no están pagados.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Modal para generar cuotas
interface GenerarCuotasModalProps {
  año: number;
  onClose: () => void;
  onGenerate: () => void;
}

function GenerarCuotasModal({ año, onClose, onGenerate }: GenerarCuotasModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setError(null);

      // Generar cuotas para todos los meses del año
      const promises = [];
      for (let mes = 1; mes <= 12; mes++) {
        promises.push(sociosService.generarCuotas(año, mes, false));
      }

      const results = await Promise.all(promises);
      const hasError = results.some(r => !r.success);

      if (hasError) {
        setError('Error al generar algunas cuotas');
      } else {
        onGenerate();
        onClose();
      }
    } catch (err) {
      setError('Error al generar cuotas');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Generar Cuotas {año}
          </h3>

          <p className="text-sm text-gray-600 mb-6">
            Se generarán 12 cuotas mensuales para todos los socios activos. 
            Si ya existen cuotas para algunos meses, no se duplicarán.
          </p>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4" />
                  Generar Cuotas
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
