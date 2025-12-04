/**
 * Página de gestión de cuotas anuales
 * ACA Chile Frontend - Versión Compacta y Escalable
 */

import { useState, useEffect } from 'react';
import { sociosService, Socio, Cuota } from '../services/sociosService';
import { buildAuthHeaders } from '../utils/authToken';
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
  FileDown,
  Upload
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
  const [showImportarModal, setShowImportarModal] = useState(false);
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

      const [sociosResponse, cuotasResponse] = await Promise.all([
        sociosService.getSocios({ estado: 'activo', limit: 500 }),
        sociosService.getCuotas({ año: añoSeleccionado, limit: 1000 })
      ]);

      if (sociosResponse.success && sociosResponse.data) {
        const sociosList = sociosResponse.data.socios || [];

        if (!Array.isArray(sociosList)) {
          setError('Error: La respuesta del servidor no tiene el formato esperado');
          return;
        }

        const cuotasList = cuotasResponse.data?.cuotas || [];
        const sociosConEstado = procesarEstadoSocios(sociosList, cuotasList);
        setSocios(sociosConEstado);
      } else {
        setError(sociosResponse.error || 'Error al cargar socios');
      }

      if (cuotasResponse.success && cuotasResponse.data) {
        const cuotasList = cuotasResponse.data.cuotas || [];
        setCuotas(cuotasList);
      }

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      setError(`Error al cargar datos: ${errorMsg}`);
      console.error('[AdminCuotas] Error crítico:', err);
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
      
      // 🔍 Debug especial para Juan Cristian Acevedo Valdenegro (RUT: 12679495-9)
      if (socio.rut === '12679495-9') {
        console.log('🔍 [DEBUG JUAN ACEVEDO - AdminCuotas] Socio encontrado:', {
          id: socio.id,
          nombre: socio.nombreCompleto,
          rut: socio.rut
        });
        console.log('🔍 [DEBUG JUAN ACEVEDO - AdminCuotas] Total cuotas en la lista general:', cuotasList.length);
        console.log('🔍 [DEBUG JUAN ACEVEDO - AdminCuotas] Cuotas filtradas para este socio:', cuotasSocio.length);
        console.log('🔍 [DEBUG JUAN ACEVEDO - AdminCuotas] Año seleccionado en el filtro:', añoSeleccionado);
        console.log('🔍 [DEBUG JUAN ACEVEDO - AdminCuotas] DETALLE DE CADA CUOTA:');
        cuotasSocio.forEach(c => {
          console.log(`  📅 Mes ${c.mes}/${c.año}: pagado=${c.pagado}, valor=${c.valor}, id=${c.id}`);
        });
        const cuotasPagadas = cuotasSocio.filter(c => c.pagado);
        const cuotasPendientes = cuotasSocio.filter(c => !c.pagado);
        console.log('🔍 [DEBUG JUAN ACEVEDO - AdminCuotas] Resumen:', {
          totalCuotas: cuotasSocio.length,
          pagadas: cuotasPagadas.length,
          pendientes: cuotasPendientes.length,
          mesesPagados: cuotasPagadas.map(c => c.mes).join(', '),
          mesesPendientes: cuotasPendientes.map(c => c.mes).join(', ')
        });
      }

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
      
      // 🔍 Debug especial para Juan Cristian Acevedo Valdenegro (RUT: 12679495-9)
      if (socio.rut === '12679495-9') {
        console.log('🔍 [DEBUG JUAN ACEVEDO - AdminCuotas] Estadísticas calculadas:', {
          mesesPagados,
          mesesAtrasados: cuotasVencidasSinPagar,
          cuotasVencidas: totalCuotasVencidas,
          cuotasPagadasVencidas,
          mesesPagadosUltimoAño,
          ultimoPago,
          estadoPago
        });
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



  const exportarAExcel = async () => {
    try {
      if (sociosFiltrados.length === 0) {
        setError('No hay datos para exportar');
        return;
      }

      // Cargar librería dinámicamente solo cuando se necesita
      const XLSX = await import('xlsx');
      const datosExcel = sociosFiltrados.map(socio => ({
        'Nombre': socio.nombreCompleto,
        'Email': socio.email,
        'RUT': socio.rut || 'N/A',
        'Estado': socio.estadoPago === 'al-dia' ? 'Al día' :
          socio.estadoPago === 'atrasado' ? 'Atrasado' : 'Sin pagos',
        'Meses Pagados': socio.mesesPagados,
        'Meses Atrasados': socio.mesesAtrasados,
        'Cuotas Vencidas': socio.cuotasVencidas,
        'Cuotas Pagadas (Vencidas)': socio.cuotasPagadasVencidas,
        'Último Pago': socio.ultimoPago
          ? new Date(socio.ultimoPago).toLocaleDateString('es-CL')
          : 'Sin pagos',
        'Teléfono': socio.telefono || 'N/A',
        'Ciudad': socio.ciudad || 'N/A'
      }));

      // Crear workbook y worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(datosExcel);

      // Ajustar ancho de columnas
      const colWidths = [
        { wch: 30 }, // Nombre
        { wch: 35 }, // Email
        { wch: 12 }, // RUT
        { wch: 12 }, // Estado
        { wch: 12 }, // Meses Pagados
        { wch: 14 }, // Meses Atrasados
        { wch: 14 }, // Cuotas Vencidas
        { wch: 20 }, // Cuotas Pagadas
        { wch: 15 }, // Último Pago
        { wch: 15 }, // Teléfono
        { wch: 20 }, // Ciudad
      ];
      ws['!cols'] = colWidths;

      // Agregar worksheet al workbook
      XLSX.utils.book_append_sheet(wb, ws, `Cuotas ${añoSeleccionado}`);

      // Generar archivo y descargar
      const fileName = `cuotas_${añoSeleccionado}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);

      if (import.meta.env.MODE === 'development') {
        if (import.meta.env.MODE === 'development') {
          console.log(`[AdminCuotas] Excel exportado: ${fileName}`);
        }
      }
    } catch (error) {
      if (import.meta.env.MODE === 'development') {
        console.error('[AdminCuotas] Error exportando a Excel:', error);
      }
      setError('Error al exportar a Excel');
    }
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
              onClick={() => setShowImportarModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              Importar Pagos CSV
            </button>
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
              onClick={exportarAExcel}
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
                      <div className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-2 ${socio.mesesAtrasados === 0
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

      {/* Modal de importar pagos CSV */}
      {showImportarModal && (
        <ImportarPagosCSVModal
          onClose={() => setShowImportarModal(false)}
          onImport={loadData}
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
          if (import.meta.env.MODE === 'development') {
            console.log(`[Auto-generar] Creando cuota para ${mes}/${año}`);
          }
          await sociosService.crearCuotaIndividual(
            socio.id,
            año,
            mes,
            socio.valorCuota
          );
        }
      }
    } catch (err) {
      if (import.meta.env.MODE === 'development') {
        console.error('[Auto-generar] Error generando cuotas futuras:', err);
      }
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
        if (import.meta.env.MODE === 'development') {
          console.error('Error cargando cuotas:', err);
        }
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

      // Crear la cuota para este socio específico
      const crearResponse = await sociosService.crearCuotaIndividual(
        socio.id,
        añoSeleccionado,
        mesToCreate,
        socio.valorCuota
      );

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

      const fechaPagoISO = new Date(fechaPago).toISOString();

      const marcarResponse = await sociosService.marcarCuotaPagada(nuevaCuotaId, {
        metodoPago: 'transferencia',
        fechaPago: fechaPagoISO
      });

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
      if (import.meta.env.MODE === 'development') {
        console.error('[SocioDetailModal] Error excepción:', err);
      }
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

      if (import.meta.env.MODE === 'development') {

        console.log('[SocioDetailModal] Marcando cuota:', cuotaToToggle);

      }

      if (!cuotaToToggle.pagado) {
        // Marcar como pagado con la fecha seleccionada
        const fechaPagoISO = new Date(fechaPago).toISOString();

        const response = await sociosService.marcarCuotaPagada(cuotaToToggle.id, {
          metodoPago: 'transferencia',
          fechaPago: fechaPagoISO
        });

        if (import.meta.env.MODE === 'development') {

          console.log('[SocioDetailModal] Respuesta marcar pagado:', response);

        }

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
        if (import.meta.env.MODE === 'development') {
          console.log('[SocioDetailModal] Desmarcando pago...');
        }

        const response = await fetch(`/api/admin/cuotas/${cuotaToToggle.id}`, {
          method: 'PUT',
          headers: {
            ...buildAuthHeaders(),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            pagado: false,
            fechaPago: null,
            metodoPago: null
          }),
        });

        if (import.meta.env.MODE === 'development') {

          console.log('[SocioDetailModal] Respuesta desmarcar:', response.status);

        }

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
          if (import.meta.env.MODE === 'development') {
            console.error('[SocioDetailModal] Error al desmarcar:', errorText);
          }

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
      if (import.meta.env.MODE === 'development') {
        console.error('[SocioDetailModal] Error:', err);
      }
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

      if (import.meta.env.MODE === 'development') {

        console.log('[SocioDetailModal] Eliminando cuota:', cuotaToDelete.id);

      }
      if (import.meta.env.MODE === 'development') {
        console.log('[SocioDetailModal] Cuota completa:', cuotaToDelete);
      }

      const response = await sociosService.eliminarCuota(cuotaToDelete.id);

      if (import.meta.env.MODE === 'development') {

        console.log('[SocioDetailModal] Respuesta eliminar:', response);

      }

      if (response.success) {
        if (import.meta.env.MODE === 'development') {
          console.log('[SocioDetailModal] Cuota eliminada exitosamente, recargando...');
        }

        // Recargar cuotas del modal
        const cuotasResponse = await sociosService.getCuotas({
          año: añoSeleccionado,
          socioId: socio.id
        });

        if (import.meta.env.MODE === 'development') {

          console.log('[SocioDetailModal] Cuotas recargadas:', cuotasResponse);

        }

        if (cuotasResponse.success && cuotasResponse.data) {
          setCuotas(cuotasResponse.data.cuotas || []);
          if (import.meta.env.MODE === 'development') {
            console.log('[SocioDetailModal] Cuotas actualizadas en modal:', cuotasResponse.data.cuotas?.length);
          }
        }

        // Recargar lista principal
        if (import.meta.env.MODE === 'development') {
          console.log('[SocioDetailModal] Llamando onUpdate para recargar lista principal...');
        }
        onUpdate();
      } else {
        if (import.meta.env.MODE === 'development') {
          console.error('[SocioDetailModal] Error al eliminar:', response.error);
        }
        setError(response.error || 'Error al eliminar cuota');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      setError(`Error al eliminar cuota: ${errorMsg}`);
      if (import.meta.env.MODE === 'development') {
        console.error('[SocioDetailModal] Error excepción:', err);
      }
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
                  className={`p-4 rounded-lg border-2 transition-all relative group ${!mesValido
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
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 flex items-center gap-2 ${cuotaToToggle.pagado
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
      if (import.meta.env.MODE === 'development') {
        console.error(err);
      }
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

// Modal para importar pagos desde CSV
function ImportarPagosCSVModal({
  onClose,
  onImport,
}: {
  onClose: () => void;
  onImport: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<{
    success: number;
    errors: string[];
    total: number;
    cuotasCreadas?: number;
    cuotasActualizadas?: number;
  } | null>(null);

  const generateTemplate = () => {
    const currentYear = new Date().getFullYear();
    const monthNames = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    
    // Generar headers para 36 meses (año actual + 2 años completos)
    const headers = ['rut'];
    for (let year = currentYear; year <= currentYear + 2; year++) {
      for (const month of monthNames) {
        headers.push(`${month}_${year}`);
      }
    }
    headers.push('proximo_pago');
    
    // Ejemplos con el nuevo formato
    const exampleRow1 = ['12345678-9'];
    for (let i = 0; i < 36; i++) {
      exampleRow1.push(i < 2 ? 'si' : ''); // Solo primeros 2 meses pagados
    }
    exampleRow1.push(`${currentYear}-03-05`);
    
    const exampleRow2 = ['98765432-1'];
    for (let i = 0; i < 36; i++) {
      if (i === 0) exampleRow2.push(`${currentYear}-01-15`);
      else if (i === 1) exampleRow2.push(`${currentYear}-02-10`);
      else if (i === 2) exampleRow2.push('si');
      else exampleRow2.push('');
    }
    exampleRow2.push(`${currentYear}-04-05`);
    
    const exampleRow3 = ['11111111-1'];
    for (let i = 0; i < 36; i++) {
      exampleRow3.push('');
    }
    exampleRow3.push(`${currentYear}-01-05`);

    const csvContent = [
      headers.join(','),
      exampleRow1.join(','),
      exampleRow2.join(','),
      exampleRow3.join(',')
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `plantilla_pagos_${currentYear}_${currentYear + 2}.csv`;
    link.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        setError('Por favor selecciona un archivo CSV válido');
        return;
      }
      setFile(selectedFile);
      setError('');
      setResults(null);
    }
  };

  const parseCSV = (text: string): string[][] => {
    const lines = text.split('\n').filter(line => line.trim());
    return lines.map(line => {
      const values: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());
      return values;
    });
  };

  const handleImport = async () => {
    if (!file) {
      setError('Por favor selecciona un archivo CSV');
      return;
    }

    setLoading(true);
    setError('');
    setResults(null);

    try {
      const text = await file.text();
      const rows = parseCSV(text);
      
      if (rows.length < 2) {
        throw new Error('El archivo CSV está vacío o no tiene datos');
      }

      const headersRow = rows[0];
      if (!headersRow) {
        throw new Error('El archivo CSV no tiene encabezados');
      }

      const headers = headersRow.map(h => h.toLowerCase());
      const rutIndex = headers.indexOf('rut');
      const proximoPagoIndex = headers.indexOf('proximo_pago');
      
      if (rutIndex === -1) {
        throw new Error('El CSV debe tener una columna "rut"');
      }

      const meses = [
        'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
        'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
      ];
      
      // Construir mapa de columnas mes_año → índice de columna
      const mesAñoMap: { [key: string]: number } = {};
      const currentYear = new Date().getFullYear();
      
      // Buscar todas las columnas que tengan formato mes_año
      for (let colIdx = 0; colIdx < headers.length; colIdx++) {
        const header = headers[colIdx];
        const match = header.match(/^(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)_(\d{4})$/);
        if (match) {
          const mes = match[1];
          const año = match[2];
          mesAñoMap[`${mes}_${año}`] = colIdx;
        }
      }

      console.log('[CSV IMPORT] Headers:', headers);
      console.log('[CSV IMPORT] Mapa mes_año encontrado:', mesAñoMap);
      console.log('[CSV IMPORT] Total columnas mes_año:', Object.keys(mesAñoMap).length);

      let successCount = 0;
      let cuotasCreadas = 0;
      let cuotasActualizadas = 0;
      const errorMessages: string[] = [];

      // Procesar cada fila (excepto headers)
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row) continue;

        const rut = row[rutIndex]?.trim();

        if (!rut) {
          errorMessages.push(`Fila ${i + 1}: RUT vacío`);
          continue;
        }

        try {
          // Obtener usuario por RUT (búsqueda exacta con límite alto)
          const response = await fetch(`/api/admin/socios?search=${encodeURIComponent(rut)}&limit=1000`, {
            headers: buildAuthHeaders()
          });
          if (!response.ok) throw new Error('Error al buscar usuario');
          
          const result = await response.json();
          const usuario = result.data?.socios?.find((s: any) => s.rut === rut);
          
          if (!usuario) {
            errorMessages.push(`Fila ${i + 1}: Usuario con RUT ${rut} no encontrado`);
            continue;
          }

          let cuotasProcesadasUsuario = 0;

          console.log(`[CSV IMPORT] Procesando usuario:`, {
            rut,
            id: usuario.id,
            nombre: usuario.nombreCompleto || `${usuario.nombre} ${usuario.apellido}`,
            role: usuario.role,
            valorCuota: usuario.valorCuota
          });
          
          // Log especial para el usuario de prueba
          if (rut === '12865793-2') {
            console.log(`[CSV IMPORT] ⭐⭐⭐ USUARIO DE PRUEBA 12865793-2 con ID: ${usuario.id}`);
          }

          // Procesar cada columna mes_año encontrada
          for (const [mesAñoKey, colIdx] of Object.entries(mesAñoMap)) {
            const valor = row[colIdx]?.trim().toLowerCase();
            if (!valor || valor === '') continue;

            console.log(`[CSV IMPORT] ${rut} - Columna ${mesAñoKey}: valor="${valor}"`);

            let fechaPago = '';
            let shouldPay = false;

            // Extraer mes y año del header
            const [mesNombre, añoStr] = mesAñoKey.split('_');
            const año = parseInt(añoStr, 10);
            const mesIdx = meses.indexOf(mesNombre);
            if (mesIdx === -1) continue;
            const mes = mesIdx + 1;

            // Determinar si es fecha o "si"
            if (valor === 'si') {
              shouldPay = true;
              fechaPago = `${año}-${String(mes).padStart(2, '0')}-01`;
            } else if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
              shouldPay = true;
              fechaPago = valor;
            }

            console.log(`[CSV IMPORT] ${rut} - ${mesAñoKey}: shouldPay=${shouldPay}, fechaPago=${fechaPago}`);

            if (!shouldPay) continue;

            // Verificar si ya existe la cuota
            const cuotasResponse = await fetch(
              `/api/admin/cuotas?usuarioId=${usuario.id}&año=${año}`,
              {
                headers: buildAuthHeaders()
              }
            );
            
            if (!cuotasResponse.ok) {
              errorMessages.push(`Fila ${i + 1}: Error al obtener cuotas para ${rut}`);
              continue;
            }

            const cuotasData = await cuotasResponse.json();
            
            if (rut === '12865793-2') {
              console.log(`[CSV IMPORT] ⭐ Usuario 12865793-2 - Cuotas existentes para año ${año}:`, cuotasData.data?.cuotas);
            }
            
            const cuotaExistente = cuotasData.data?.cuotas?.find(
              (c: any) => c.año === año && c.mes === mes
            );

            if (cuotaExistente) {
              // Actualizar si no está pagada
              if (!cuotaExistente.pagado) {
                console.log(`[CSV IMPORT] Actualizando cuota existente ${cuotaExistente.id} para ${rut} - ${mesAñoKey}`);
                const updateResponse = await fetch(`/api/admin/cuotas/${cuotaExistente.id}`, {
                  method: 'PUT',
                  headers: buildAuthHeaders(undefined, 'application/json'),
                  body: JSON.stringify({
                    pagado: true,
                    fechaPago: fechaPago,
                    metodoPago: 'importacion_csv'
                  })
                });
                if (updateResponse.ok) {
                  console.log(`[CSV IMPORT] Cuota ${cuotaExistente.id} actualizada como pagada`);
                  cuotasActualizadas++;
                  cuotasProcesadasUsuario++;
                } else {
                  console.error(`[CSV IMPORT] Error actualizando cuota ${cuotaExistente.id}:`, await updateResponse.text());
                }
              } else {
                console.log(`[CSV IMPORT] Cuota ${cuotaExistente.id} ya está pagada, se omite`);
              }
            } else {
              // Crear nueva cuota (primero crear, luego marcar como pagada)
              if (rut === '12865793-2') {
                console.log(`[CSV IMPORT] ⭐ Creando cuota para 12865793-2:`, {
                  usuarioId: usuario.id,
                  año,
                  mes,
                  valor: usuario.valorCuota || 6500
                });
              }
              
              const createResponse = await fetch(`/api/admin/cuotas`, {
                method: 'POST',
                headers: buildAuthHeaders(undefined, 'application/json'),
                body: JSON.stringify({
                  usuarioId: usuario.id,
                  año,
                  mes,
                  valor: usuario.valorCuota || 6500
                })
              });
              
              if (createResponse.ok) {
                const createData = await createResponse.json();
                console.log(`[CSV IMPORT] Response de creación:`, createData);
                
                if (rut === '12865793-2') {
                  console.log(`[CSV IMPORT] ⭐ Cuota creada para 12865793-2:`, createData);
                }
                const nuevaCuotaId = createData.data?.cuota?.id;
                
                if (!nuevaCuotaId) {
                  console.error('[CSV IMPORT] No se obtuvo ID de cuota creada. Estructura de respuesta:', createData);
                  errorMessages.push(`Fila ${i + 1} (${rut}): No se obtuvo ID de cuota para ${mesAñoKey}`);
                  continue;
                }
                
                console.log(`[CSV IMPORT] ✅ Cuota creada ID: ${nuevaCuotaId} para ${rut} - ${mesAñoKey}`);
                
                // Ahora marcar como pagada
                const updateResponse = await fetch(`/api/admin/cuotas/${nuevaCuotaId}`, {
                  method: 'PUT',
                  headers: buildAuthHeaders(undefined, 'application/json'),
                  body: JSON.stringify({
                    pagado: true,
                    fechaPago: fechaPago,
                    metodoPago: 'importacion_csv'
                  })
                });
                
                if (updateResponse.ok) {
                  console.log(`[CSV IMPORT] ✅ Cuota ${nuevaCuotaId} marcada como pagada`);
                  cuotasCreadas++;
                  cuotasProcesadasUsuario++;
                } else {
                  const errorText = await updateResponse.text();
                  console.error(`[CSV IMPORT] ❌ Error marcando cuota ${nuevaCuotaId} como pagada:`, errorText);
                  errorMessages.push(`Fila ${i + 1} (${rut}): Error al marcar cuota ${mesAñoKey} como pagada`);
                }
              } else {
                const errorText = await createResponse.text();
                console.error(`[CSV IMPORT] ❌ Error creando cuota para ${rut} - ${mesAñoKey}:`, errorText);
                errorMessages.push(`Fila ${i + 1} (${rut}): Error creando cuota ${mesAñoKey}`);
              }
            }
          }

          if (cuotasProcesadasUsuario > 0) {
            successCount++;
          }

          // Manejar próximo pago si existe
          if (proximoPagoIndex !== -1) {
            const proximoPago = row[proximoPagoIndex]?.trim();
            if (proximoPago && /^\d{4}-\d{2}-\d{2}$/.test(proximoPago)) {
              const fechaProxima = new Date(proximoPago);
              const añoProximo = fechaProxima.getFullYear();
              
              // Si el próximo pago es en el futuro, crear cuotas futuras
              if (añoProximo > currentYear) {
                const mesesFuturos = Math.ceil((fechaProxima.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 30));
                
                for (let m = 1; m <= Math.min(mesesFuturos, 12); m++) {
                  const mesCrear = ((new Date().getMonth() + m) % 12) + 1;
                  const añoCrear = new Date().getMonth() + m > 12 ? añoProximo : currentYear;
                  
                  const cuotaFutura = await fetch(
                    `/api/admin/cuotas?usuarioId=${usuario.id}&año=${añoCrear}`,
                    {
                      headers: buildAuthHeaders()
                    }
                  );
                  const cuotaFuturaData = await cuotaFutura.json();
                  
                  const existe = cuotaFuturaData.data?.cuotas?.find(
                    (c: any) => c.año === añoCrear && c.mes === mesCrear
                  );
                  
                  if (!existe) {
                    await fetch(`/api/admin/cuotas`, {
                      method: 'POST',
                      headers: buildAuthHeaders(undefined, 'application/json'),
                      body: JSON.stringify({
                        usuarioId: usuario.id,
                        año: añoCrear,
                        mes: mesCrear,
                        valor: usuario.valorCuota || 6500
                      })
                    });
                  }
                }
              }
            }
          }
        } catch (err) {
          errorMessages.push(
            `Fila ${i + 1} (${rut}): ${err instanceof Error ? err.message : 'Error desconocido'}`
          );
        }
      }

      console.log('[CSV IMPORT] ==========================================');
      console.log('[CSV IMPORT] RESUMEN FINAL DE IMPORTACIÓN');
      console.log('[CSV IMPORT] ==========================================');
      console.log('[CSV IMPORT] Total filas procesadas:', rows.length - 1);
      console.log('[CSV IMPORT] Usuarios exitosos:', successCount);
      console.log('[CSV IMPORT] Cuotas CREADAS:', cuotasCreadas);
      console.log('[CSV IMPORT] Cuotas ACTUALIZADAS:', cuotasActualizadas);
      console.log('[CSV IMPORT] Total errores:', errorMessages.length);
      console.log('[CSV IMPORT] ==========================================');
      
      if (errorMessages.length > 0) {
        console.error('[CSV IMPORT] Lista de errores:', errorMessages);
      }

      setResults({
        success: successCount,
        errors: errorMessages,
        total: rows.length - 1,
        cuotasCreadas,
        cuotasActualizadas
      });

      if (cuotasCreadas > 0 || cuotasActualizadas > 0) {
        console.log('[CSV IMPORT] ✅ Llamando onImport() para recargar datos...');
        onImport();
      } else {
        console.warn('[CSV IMPORT] ⚠️ No se procesaron cuotas, no se recarga la vista');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar el archivo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Upload className="h-6 w-6 text-blue-600" />
              Importar Pagos desde CSV
            </h3>
            <button
              onClick={onClose}
              disabled={loading}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-blue-900 mb-2">Formato del CSV:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• <strong>rut</strong>: RUT del socio (ej: 12345678-9)</li>
                <li>• <strong>enero-diciembre</strong>: "si" o fecha "YYYY-MM-DD" si pagó ese mes</li>
                <li>• <strong>proximo_pago</strong>: Fecha del próximo pago esperado (YYYY-MM-DD)</li>
              </ul>
            </div>

            <button
              onClick={generateTemplate}
              className="w-full px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 flex items-center justify-center gap-2"
            >
              <FileDown className="h-4 w-4" />
              Descargar Plantilla CSV de Ejemplo
            </button>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seleccionar archivo CSV
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={loading}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
            />
            {file && (
              <p className="mt-2 text-sm text-gray-600">
                Archivo seleccionado: <span className="font-medium">{file.name}</span>
              </p>
            )}
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {results && (
            <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">Resultados de la Importación:</h4>
              <div className="space-y-2 text-sm">
                <p className="text-gray-700">
                  <strong>Total filas procesadas:</strong> {results.total}
                </p>
                <p className="text-green-700">
                  <strong>Usuarios con cuotas procesadas:</strong> {results.success}
                </p>
                <p className="text-blue-700">
                  <strong>Cuotas creadas:</strong> {results.cuotasCreadas || 0}
                </p>
                <p className="text-blue-700">
                  <strong>Cuotas actualizadas:</strong> {results.cuotasActualizadas || 0}
                </p>
                {results.errors.length > 0 && (
                  <div>
                    <p className="text-red-700 font-medium mb-1">
                      Errores ({results.errors.length}):
                    </p>
                    <div className="max-h-40 overflow-y-auto bg-white rounded border border-red-200 p-2">
                      {results.errors.map((err, idx) => (
                        <p key={idx} className="text-xs text-red-600 mb-1">
                          {err}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50"
            >
              {results ? 'Cerrar' : 'Cancelar'}
            </button>
            {!results && (
              <button
                onClick={handleImport}
                disabled={loading || !file}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    Importar Pagos
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
