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
  cuotasVencidas: number;
  cuotasPagadasVencidas: number;
  mesesPagadosUltimoAño: number;
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

      console.log('[AdminCuotas] Respuesta socios completa:', JSON.stringify(sociosResponse, null, 2));
      console.log('[AdminCuotas] Respuesta cuotas completa:', JSON.stringify(cuotasResponse, null, 2));

      if (sociosResponse.success && sociosResponse.data) {
        // Verificar la estructura de la respuesta
        const sociosList = sociosResponse.data.socios || [];
        
        if (!Array.isArray(sociosList)) {
          console.error('[AdminCuotas] sociosList no es un array:', sociosList);
          setError('Error: La respuesta del servidor no tiene el formato esperado');
          return;
        }

        const cuotasList = cuotasResponse.data?.cuotas || [];
        
        const sociosConEstado = procesarEstadoSocios(sociosList, cuotasList);
        setSocios(sociosConEstado);
        console.log('[AdminCuotas] Socios procesados:', sociosConEstado.length);
      } else {
        setError(sociosResponse.error || 'Error al cargar socios');
        console.error('[AdminCuotas] Error en respuesta de socios:', sociosResponse);
      }

      if (cuotasResponse.success && cuotasResponse.data) {
        const cuotasList = cuotasResponse.data.cuotas || [];
        setCuotas(cuotasList);
        console.log('[AdminCuotas] Cuotas cargadas:', cuotasList.length);
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
    const hoy = new Date();
    const añoActualCalendario = hoy.getFullYear();
    const inicioUltimoAño = new Date(añoActualCalendario - 1, 0, 1);
    
    return sociosList.map(socio => {
      const cuotasSocio = cuotasList.filter(c => c.usuarioId === socio.id);
      
      // Calcular cuotas vencidas (pasado el día 5 del mes)
      const cuotasVencidas = cuotasSocio.filter(c => {
        const fechaVencimiento = new Date(c.año, c.mes - 1, 5);
        return hoy > fechaVencimiento;
      });
      
      const cuotasPagadasVencidas = cuotasVencidas.filter(c => c.pagado).length;
      const totalCuotasVencidas = cuotasVencidas.length;
      const cuotasVencidasSinPagar = totalCuotasVencidas - cuotasPagadasVencidas;
      
      // Meses pagados en el último año calendario (últimos 12 meses)
      const mesesPagadosUltimoAño = cuotasSocio.filter(c => {
        if (!c.pagado || !c.fechaPago) return false;
        const fechaPago = new Date(c.fechaPago);
        return fechaPago >= inicioUltimoAño;
      }).length;
      
      // Calcular total de meses pagados
      const mesesPagados = cuotasSocio.filter(c => c.pagado).length;
      
      const cuotasPagadas = cuotasSocio.filter(c => c.pagado && c.fechaPago);
      let ultimoPago: string | undefined = undefined;
      
      if (cuotasPagadas.length > 0) {
        const sorted = cuotasPagadas.sort((a, b) => 
          new Date(b.fechaPago!).getTime() - new Date(a.fechaPago!).getTime()
        );
        ultimoPago = sorted[0]?.fechaPago || undefined;
      }

      // Determinar estado basado en cuotas vencidas sin pagar
      let estadoPago: 'al-dia' | 'atrasado' | 'sin-pagos' = 'sin-pagos';
      if (mesesPagados > 0 || cuotasVencidasSinPagar === 0) {
        estadoPago = cuotasVencidasSinPagar === 0 ? 'al-dia' : 'atrasado';
      }

      return {
        ...socio,
        mesesPagados,
        mesesAtrasados: cuotasVencidasSinPagar,
        cuotasVencidas: totalCuotasVencidas,
        cuotasPagadasVencidas,
        mesesPagadosUltimoAño,
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

    // Filtrar solo cuotas del año 2025
    const cuotas2025 = cuotas.filter(c => c.año === 2025);
    const totalRecaudado = cuotas2025.filter(c => c.pagado).reduce((sum, c) => sum + c.valor, 0);
    const totalPendiente = cuotas2025.filter(c => !c.pagado).reduce((sum, c) => sum + c.valor, 0);

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
              {Array.from({ length: 16 }, (_, i) => añoActual - 10 + i).map(año => (
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
                <p className="text-sm text-gray-600">Recaudado 2025</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${(stats.totalRecaudado / 1000).toFixed(0)}K
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Pendiente 2025: ${(stats.totalPendiente / 1000).toFixed(0)}K
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
                      {/* Cuotas pagadas/vencidas */}
                      <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium text-gray-900">
                          {socio.cuotasPagadasVencidas}/{socio.cuotasVencidas}
                        </p>
                        <p className="text-xs text-gray-500">
                          {socio.ultimoPago ? (
                            `Último: ${new Date(socio.ultimoPago).toLocaleDateString('es-CL', { month: 'short', year: 'numeric' })}`
                          ) : (
                            'Sin pagos'
                          )}
                        </p>
                      </div>

                      {/* Badge de estado con información relevante */}
                      <div className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-2 ${
                        socio.mesesAtrasados === 0
                          ? 'bg-green-100 text-green-800'
                          : socio.mesesAtrasados <= 2
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {socio.mesesAtrasados === 0 ? (
                          <span className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            {socio.mesesPagadosUltimoAño} {socio.mesesPagadosUltimoAño === 1 ? 'mes' : 'meses'}
                          </span>
                        ) : socio.mesesAtrasados <= 2 ? (
                          <span className="flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {socio.mesesAtrasados} {socio.mesesAtrasados === 1 ? 'mes' : 'meses'}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {socio.mesesAtrasados} {socio.mesesAtrasados === 1 ? 'mes' : 'meses'}
                          </span>
                        )}
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

function SocioDetailModal({ socio, cuotas: initialCuotas, año: añoInicial, mesActual, onClose, onUpdate }: SocioDetailModalProps) {
  const [añoSeleccionado, setAñoSeleccionado] = useState(añoInicial);
  const [cuotas, setCuotas] = useState<Cuota[]>(initialCuotas);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [cuotaToToggle, setCuotaToToggle] = useState<Cuota | null>(null);
  const [showCreateCuotaModal, setShowCreateCuotaModal] = useState(false);
  const [mesToCreate, setMesToCreate] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [cuotaToDelete, setCuotaToDelete] = useState<Cuota | null>(null);
  const [fechaPago, setFechaPago] = useState<string>(new Date().toISOString().substring(0, 10));

  // Función para verificar si una cuota está vencida (después del día 5)
  const esCuotaVencida = (cuota: Cuota): boolean => {
    if (cuota.pagado) return false;
    
    const fechaVencimiento = new Date(cuota.año, cuota.mes - 1, 5);
    const hoy = new Date();
    
    return hoy > fechaVencimiento;
  };

  // Función para generar cuotas futuras automáticamente (hasta 12 meses adelante)
  const generarCuotasFuturas = async () => {
    try {
      const hoy = new Date();
      const cuotasExistentes = new Set(cuotas.map(c => `${c.año}-${c.mes}`));
      
      // Generar hasta 12 meses adelante
      for (let i = 0; i < 12; i++) {
        const fecha = new Date(hoy.getFullYear(), hoy.getMonth() + i, 1);
        const año = fecha.getFullYear();
        const mes = fecha.getMonth() + 1;
        const clave = `${año}-${mes}`;
        
        // Si no existe la cuota, crearla
        if (!cuotasExistentes.has(clave)) {
          console.log(`[Auto-generar] Creando cuota para ${mes}/${año}`);
          await sociosService.crearCuotaIndividual(
            socio.id,
            año,
            mes,
            socio.valorCuota
          );
        }
      }
    } catch (err) {
      console.error('[Auto-generar] Error generando cuotas futuras:', err);
    }
  };

  // Cargar cuotas cuando cambia el año
  useEffect(() => {
    const loadCuotasAño = async () => {
      try {
        setLoading(true);
        const response = await sociosService.getCuotas({ 
          año: añoSeleccionado, 
          socioId: socio.id 
        });
        
        if (response.success && response.data) {
          setCuotas(response.data.cuotas || []);
          
          // Auto-generar cuotas futuras si estamos en el año actual
          const añoActual = new Date().getFullYear();
          if (añoSeleccionado === añoActual) {
            await generarCuotasFuturas();
            
            // Recargar después de generar
            const reloadResponse = await sociosService.getCuotas({ 
              año: añoSeleccionado, 
              socioId: socio.id 
            });
            
            if (reloadResponse.success && reloadResponse.data) {
              setCuotas(reloadResponse.data.cuotas || []);
            }
          }
        }
      } catch (err) {
        console.error('Error cargando cuotas:', err);
      } finally {
        setLoading(false);
      }
    };

    loadCuotasAño();
  }, [añoSeleccionado, socio.id]);

  const handleTogglePago = async (mes: number) => {
    const cuota = getCuotaMes(mes);
    
    // Si existe la cuota, mostrar modal de confirmación para marcar/desmarcar
    if (cuota) {
      setCuotaToToggle(cuota);
      setShowConfirmModal(true);
    } else {
      // Si no existe la cuota, mostrar modal de confirmación para crearla
      setMesToCreate(mes);
      setShowCreateCuotaModal(true);
    }
  };

  const confirmCreateCuota = async () => {
    if (mesToCreate === null) return;

    try {
      setLoading(true);
      setError(null);
      setShowCreateCuotaModal(false);
      
      console.log('[SocioDetailModal] Creando cuota individual para mes:', mesToCreate, 'año:', añoSeleccionado, 'socio:', socio.id);
      
      // Crear la cuota para este socio específico
      const crearResponse = await sociosService.crearCuotaIndividual(
        socio.id,
        añoSeleccionado, 
        mesToCreate,
        socio.valorCuota
      );
      
      console.log('[SocioDetailModal] Respuesta crear cuota:', crearResponse);
      
      if (!crearResponse.success) {
        setError(crearResponse.error || 'Error al crear cuota');
        return;
      }
      
      // Obtener el ID de la cuota recién creada
      const nuevaCuotaId = crearResponse.data?.cuota?.id;
      
      if (!nuevaCuotaId) {
        setError('No se pudo obtener el ID de la cuota creada');
        return;
      }
      
      console.log('[SocioDetailModal] Marcando cuota como pagada:', nuevaCuotaId);
      
      const fechaPagoISO = new Date(fechaPago).toISOString();
      
      const marcarResponse = await sociosService.marcarCuotaPagada(nuevaCuotaId, {
        metodoPago: 'transferencia',
        fechaPago: fechaPagoISO
      });
      
      console.log('[SocioDetailModal] Respuesta marcar pagado:', marcarResponse);
      
      if (!marcarResponse.success) {
        setError(marcarResponse.error || 'Error al marcar como pagado');
        return;
      }
      
      // Recargar cuotas para mostrar el estado actualizado
      const finalResponse = await sociosService.getCuotas({ 
        año: añoSeleccionado, 
        socioId: socio.id 
      });
      
      if (finalResponse.success && finalResponse.data) {
        setCuotas(finalResponse.data.cuotas || []);
      }
      
      onUpdate();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      setError(`Error al crear cuota: ${errorMsg}`);
      console.error('[SocioDetailModal] Error excepción:', err);
    } finally {
      setLoading(false);
      setMesToCreate(null);
    }
  };

  const confirmTogglePago = async () => {
    if (!cuotaToToggle) return;

    try {
      setLoading(true);
      setError(null);
      setShowConfirmModal(false);

      console.log('[SocioDetailModal] Marcando cuota:', cuotaToToggle);

      if (!cuotaToToggle.pagado) {
        // Marcar como pagado con la fecha seleccionada
        const fechaPagoISO = new Date(fechaPago).toISOString();
        
        const response = await sociosService.marcarCuotaPagada(cuotaToToggle.id, {
          metodoPago: 'transferencia',
          fechaPago: fechaPagoISO
        });

        console.log('[SocioDetailModal] Respuesta marcar pagado:', response);

        if (response.success) {
          // Recargar cuotas para mostrar el cambio
          const cuotasResponse = await sociosService.getCuotas({ 
            año: añoSeleccionado, 
            socioId: socio.id 
          });
          
          if (cuotasResponse.success && cuotasResponse.data) {
            setCuotas(cuotasResponse.data.cuotas || []);
          }
          
          onUpdate();
        } else {
          setError(response.error || 'Error al marcar como pagado');
        }
      } else {
        // Desmarcar pago - llamar al API directamente
        console.log('[SocioDetailModal] Desmarcando pago...');
        
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/admin/cuotas/${cuotaToToggle.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : '',
          },
          body: JSON.stringify({
            pagado: false,
            fechaPago: null,
            metodoPago: null
          }),
        });

        console.log('[SocioDetailModal] Respuesta desmarcar:', response.status);

        if (response.ok) {
          // Recargar cuotas para mostrar el cambio
          const cuotasResponse = await sociosService.getCuotas({ 
            año: añoSeleccionado, 
            socioId: socio.id 
          });
          
          if (cuotasResponse.success && cuotasResponse.data) {
            setCuotas(cuotasResponse.data.cuotas || []);
          }
          
          onUpdate();
        } else {
          const errorText = await response.text();
          console.error('[SocioDetailModal] Error al desmarcar:', errorText);
          
          try {
            const errorData = JSON.parse(errorText);
            setError(errorData.error || 'Error al desmarcar pago');
          } catch {
            setError(`Error al desmarcar pago: ${errorText}`);
          }
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      setError(`Error al actualizar el pago: ${errorMsg}`);
      console.error('[SocioDetailModal] Error:', err);
    } finally {
      setLoading(false);
      setCuotaToToggle(null);
    }
  };

  const handleDeleteCuota = (cuota: Cuota) => {
    setCuotaToDelete(cuota);
    setShowDeleteModal(true);
  };

  const confirmDeleteCuota = async () => {
    if (!cuotaToDelete) return;

    try {
      setLoading(true);
      setError(null);
      setShowDeleteModal(false);

      console.log('[SocioDetailModal] Eliminando cuota:', cuotaToDelete.id);
      console.log('[SocioDetailModal] Cuota completa:', cuotaToDelete);

      const response = await sociosService.eliminarCuota(cuotaToDelete.id);

      console.log('[SocioDetailModal] Respuesta eliminar:', response);

      if (response.success) {
        console.log('[SocioDetailModal] Cuota eliminada exitosamente, recargando...');
        
        // Recargar cuotas del modal
        const cuotasResponse = await sociosService.getCuotas({ 
          año: añoSeleccionado, 
          socioId: socio.id 
        });
        
        console.log('[SocioDetailModal] Cuotas recargadas:', cuotasResponse);
        
        if (cuotasResponse.success && cuotasResponse.data) {
          setCuotas(cuotasResponse.data.cuotas || []);
          console.log('[SocioDetailModal] Cuotas actualizadas en modal:', cuotasResponse.data.cuotas?.length);
        }
        
        // Recargar lista principal
        console.log('[SocioDetailModal] Llamando onUpdate para recargar lista principal...');
        onUpdate();
      } else {
        console.error('[SocioDetailModal] Error al eliminar:', response.error);
        setError(response.error || 'Error al eliminar cuota');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      setError(`Error al eliminar cuota: ${errorMsg}`);
      console.error('[SocioDetailModal] Error excepción:', err);
    } finally {
      setLoading(false);
      setCuotaToDelete(null);
    }
  };

  const getCuotaMes = (mes: number) => cuotas.find(c => c.mes === mes);
  const esAtrasado = (mes: number) => añoSeleccionado === new Date().getFullYear() && mes < mesActual;

  // Determinar si un mes es válido (desde fecha de ingreso hacia adelante)
  const esMesValido = (mes: number): boolean => {
    if (!socio.fechaIngreso) return true; // Si no hay fecha de ingreso, todos son válidos
    
    const fechaIngreso = new Date(socio.fechaIngreso);
    const añoIngreso = fechaIngreso.getFullYear();
    const mesIngreso = fechaIngreso.getMonth() + 1; // getMonth() es 0-indexed
    
    // Si el año seleccionado es anterior al año de ingreso, no es válido
    if (añoSeleccionado < añoIngreso) return false;
    
    // Si es el mismo año de ingreso, solo son válidos los meses desde el mes de ingreso
    if (añoSeleccionado === añoIngreso) {
      return mes >= mesIngreso;
    }
    
    // Para años posteriores, todos los meses son válidos
    return true;
  };

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
            <div className="flex items-center gap-3">
              {/* Selector de año */}
              <select
                value={añoSeleccionado}
                onChange={(e) => setAñoSeleccionado(Number(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                {Array.from({ length: 16 }, (_, i) => new Date().getFullYear() - 10 + i).map(año => (
                  <option key={año} value={año}>{año}</option>
                ))}
              </select>
              
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
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
                {cuotas.filter(c => c.pagado).length} / {cuotas.length}
              </p>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Meses Vencidos</p>
              <p className="text-xl font-bold text-red-700">
                {cuotas.filter(c => esCuotaVencida(c)).length}
              </p>
            </div>
          </div>

          {/* Información sobre cuotas automáticas */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-800">
                Las cuotas se generan automáticamente hasta 12 meses adelante
              </p>
              <p className="text-xs text-blue-700 mt-1">
                Las cuotas vencen el día 5 de cada mes. Los meses vencidos aparecen en rojo.
              </p>
            </div>
          </div>

          {/* Grid de meses */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {MESES.map((nombreMes, index) => {
              const mes = index + 1;
              const cuota = getCuotaMes(mes);
              const atrasado = esAtrasado(mes) && (!cuota || !cuota.pagado);
              const mesValido = esMesValido(mes);

              return (
                <div
                  key={mes}
                  className={`p-4 rounded-lg border-2 transition-all relative group ${
                    !mesValido
                      ? 'border-gray-200 bg-gray-100 opacity-40'
                      : !cuota
                      ? 'border-blue-300 bg-blue-50'
                      : cuota.pagado
                      ? 'border-green-500 bg-green-50'
                      : atrasado
                      ? 'border-red-500 bg-red-50'
                      : 'border-gray-300 bg-white'
                  }`}
                >
                  {/* Botón eliminar (solo si hay cuota y no está pagada) */}
                  {cuota && !cuota.pagado && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCuota(cuota);
                      }}
                      disabled={loading}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                      title="Eliminar cuota"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}

                  {/* Contenido principal - clickeable */}
                  <button
                    onClick={() => handleTogglePago(mes)}
                    disabled={loading || !mesValido}
                    className="w-full text-left"
                    title={
                      !mesValido 
                        ? 'Mes no disponible - Anterior a fecha de ingreso del socio' 
                        : !cuota 
                        ? 'Click para marcar como pagado (creará la cuota automáticamente)' 
                        : cuota.pagado 
                        ? 'Click para desmarcar como pagado' 
                        : 'Click para marcar como pagado'
                    }
                  >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">
                      {nombreMes}
                    </span>
                    {!mesValido ? (
                      <div className="h-5 w-5" /> 
                    ) : !cuota ? (
                      <Clock className="h-5 w-5 text-blue-500" />
                    ) : cuota.pagado ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : atrasado ? (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    ) : (
                      <Clock className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  {cuota ? (
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
                  ) : mesValido ? (
                    <div className="text-xs">
                      <span className="text-blue-600">
                        Sin generar
                      </span>
                    </div>
                  ) : (
                    <div className="text-xs">
                        <span className="text-gray-400">
                        No disponible
                      </span>
                    </div>
                  )}
                </button>
              </div>
              );
            })}
          </div>          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Instrucciones */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 <strong>Tip:</strong> Haz clic en cualquier mes disponible para marcar como pagado/no pagado.
              Los meses sin cuota se crearán automáticamente al marcarlos como pagados.
              Los meses en gris no están disponibles (anteriores a la fecha de ingreso del socio).
            </p>
          </div>
        </div>
      </div>

      {/* Modal de confirmación */}
      {showConfirmModal && cuotaToToggle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {cuotaToToggle.pagado ? 'Desmarcar Pago' : 'Marcar como Pagado'}
            </h3>
            
            <p className="text-sm text-gray-600 mb-4">
              {cuotaToToggle.pagado ? (
                <>¿Estás seguro de desmarcar como pagado el mes de <strong>{MESES[cuotaToToggle.mes - 1]}</strong>?</>
              ) : (
                <>¿Deseas marcar como pagado el mes de <strong>{MESES[cuotaToToggle.mes - 1]}</strong>?</>
              )}
            </p>

            {/* Selector de fecha solo cuando se marca como pagado */}
            {!cuotaToToggle.pagado && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha de Pago
                </label>
                <input
                  type="date"
                  value={fechaPago}
                  onChange={(e) => setFechaPago(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Por defecto es hoy, pero puedes cambiarla si el pago fue en otra fecha
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setCuotaToToggle(null);
                }}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmTogglePago}
                disabled={loading}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 flex items-center gap-2 ${
                  cuotaToToggle.pagado 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    {cuotaToToggle.pagado ? 'Desmarcar' : 'Marcar como Pagado'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación para crear cuota */}
      {showCreateCuotaModal && mesToCreate !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Crear y Marcar Cuota como Pagada
                </h3>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              Vas a crear la cuota de <strong>{MESES[mesToCreate - 1]} {añoSeleccionado}</strong> y marcarla como pagada.
            </p>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
              <p className="text-xs text-yellow-800">
                ⚠️ <strong>Importante:</strong> Una vez creada, la cuota quedará registrada en el sistema.
                {new Date().getFullYear() === añoSeleccionado && mesToCreate < (new Date().getMonth() + 1) && (
                  <span className="block mt-1">Este mes ya pasó, por lo que la cuota aparecerá como atrasada si no la marcas como pagada ahora.</span>
                )}
              </p>
            </div>

            {/* Selector de fecha de pago */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fecha de Pago
              </label>
              <input
                type="date"
                value={fechaPago}
                onChange={(e) => setFechaPago(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Por defecto es hoy, pero puedes cambiarla si el pago fue en otra fecha
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCreateCuotaModal(false);
                  setMesToCreate(null);
                }}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmCreateCuota}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    Crear y Marcar como Pagada
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación para eliminar cuota */}
      {showDeleteModal && cuotaToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  Eliminar Cuota
                </h3>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              ¿Estás seguro de eliminar la cuota de <strong>{MESES[cuotaToDelete.mes - 1]} {cuotaToDelete.año}</strong>?
            </p>

            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
              <p className="text-xs text-red-800">
                ⚠️ <strong>Advertencia:</strong> Esta acción no se puede deshacer. 
                Solo puedes eliminar cuotas que no estén marcadas como pagadas.
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setCuotaToDelete(null);
                }}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeleteCuota}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Eliminando...
                  </>
                ) : (
                  <>
                    <X className="h-4 w-4" />
                    Eliminar Cuota
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
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
