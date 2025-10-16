/**
 * Página de gestión de cuotas anuales
 * ACA Chile Frontend
 */

import React, { useState, useEffect } from 'react';
import { sociosService, Socio, Cuota } from '../services/sociosService';
import { 
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Download,
  Upload,
  RefreshCw,
  AlertCircle,
  Loader2,
  X,
  Eye,
  Check
} from 'lucide-react';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function AdminCuotas() {
  const [añoActual] = useState(new Date().getFullYear());
  const [añoSeleccionado, setAñoSeleccionado] = useState(añoActual);
  const [socios, setSocios] = useState<Socio[]>([]);
  const [cuotas, setCuotas] = useState<Cuota[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showGenerarModal, setShowGenerarModal] = useState(false);
  const [showMarcarPagoModal, setShowMarcarPagoModal] = useState(false);
  const [selectedCuota, setSelectedCuota] = useState<Cuota | null>(null);

  useEffect(() => {
    loadData();
  }, [añoSeleccionado]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Cargar socios y cuotas en paralelo
      const [sociosResponse, cuotasResponse] = await Promise.all([
        sociosService.getSocios({ estado: 'activo' }),
        sociosService.getCuotas({ año: añoSeleccionado })
      ]);

      if (sociosResponse.success && sociosResponse.data) {
        setSocios(sociosResponse.data.socios);
      }

      if (cuotasResponse.success && cuotasResponse.data) {
        setCuotas(cuotasResponse.data.cuotas);
      }

    } catch (err) {
      setError('Error al cargar datos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getCuotaBySocioAndMes = (socioId: number, mes: number): Cuota | undefined => {
    return cuotas.find(c => c.usuarioId === socioId && c.mes === mes);
  };

  const getEstadisticasCuotas = () => {
    const totalCuotas = cuotas.length;
    const pagadas = cuotas.filter(c => c.pagado).length;
    const pendientes = totalCuotas - pagadas;
    const totalRecaudado = cuotas.filter(c => c.pagado).reduce((sum, c) => sum + c.valor, 0);
    const totalPendiente = cuotas.filter(c => !c.pagado).reduce((sum, c) => sum + c.valor, 0);

    return { totalCuotas, pagadas, pendientes, totalRecaudado, totalPendiente };
  };

  const stats = getEstadisticasCuotas();

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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestión de Cuotas</h1>
            <p className="text-gray-600">Administra las cuotas mensuales de los socios</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <select
              value={añoSeleccionado}
              onChange={(e) => setAñoSeleccionado(parseInt(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              {[añoActual - 1, añoActual, añoActual + 1].map(año => (
                <option key={año} value={año}>{año}</option>
              ))}
            </select>

            <button
              onClick={() => setShowGenerarModal(true)}
              className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <RefreshCw className="h-5 w-5 mr-2" />
              Generar Cuotas
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

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Cuotas</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalCuotas}</p>
              </div>
              <Calendar className="h-8 w-8 text-gray-400" />
            </div>
          </div>

          <div className="bg-green-50 rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600">Pagadas</p>
                <p className="text-2xl font-bold text-green-700">{stats.pagadas}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-red-50 rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600">Pendientes</p>
                <p className="text-2xl font-bold text-red-700">{stats.pendientes}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600">Recaudado</p>
                <p className="text-lg font-bold text-blue-700">
                  ${stats.totalRecaudado.toLocaleString('es-CL')}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-orange-50 rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600">Por Cobrar</p>
                <p className="text-lg font-bold text-orange-700">
                  ${stats.totalPendiente.toLocaleString('es-CL')}
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Tabla de cuotas */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                    Socio
                  </th>
                  {MESES.map((mes, index) => (
                    <th key={mes} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {mes.substring(0, 3)}
                    </th>
                  ))}
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {socios.length === 0 ? (
                  <tr>
                    <td colSpan={14} className="px-6 py-12 text-center text-gray-500">
                      No hay socios activos
                    </td>
                  </tr>
                ) : (
                  socios.map((socio) => {
                    const cuotasSocio = cuotas.filter(c => c.usuarioId === socio.id);
                    const pagadasSocio = cuotasSocio.filter(c => c.pagado).length;
                    const totalSocio = cuotasSocio.filter(c => c.pagado).reduce((sum, c) => sum + c.valor, 0);

                    return (
                      <tr key={socio.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap sticky left-0 bg-white z-10">
                          <div className="flex items-center">
                            {socio.fotoUrl ? (
                              <img
                                src={socio.fotoUrl}
                                alt={socio.nombreCompleto}
                                className="h-8 w-8 rounded-full object-cover mr-3"
                              />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center mr-3">
                                <span className="text-red-600 text-xs font-semibold">
                                  {socio.nombre.charAt(0)}{socio.apellido.charAt(0)}
                                </span>
                              </div>
                            )}
                            <div className="text-sm font-medium text-gray-900">
                              {socio.nombreCompleto}
                            </div>
                          </div>
                        </td>
                        {MESES.map((_, index) => {
                          const cuota = getCuotaBySocioAndMes(socio.id, index + 1);
                          const mes = index + 1;
                          return (
                            <td key={`${socio.id}-mes-${mes}`} className="px-4 py-4 text-center">
                              {cuota ? (
                                <button
                                  onClick={() => {
                                    setSelectedCuota(cuota);
                                    setShowMarcarPagoModal(true);
                                  }}
                                  className={`inline-flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
                                    cuota.pagado
                                      ? 'bg-green-100 text-green-600 hover:bg-green-200'
                                      : 'bg-red-100 text-red-600 hover:bg-red-200'
                                  }`}
                                  title={cuota.pagado ? 'Pagado' : 'Pendiente'}
                                >
                                  {cuota.pagado ? (
                                    <CheckCircle className="h-5 w-5" />
                                  ) : (
                                    <XCircle className="h-5 w-5" />
                                  )}
                                </button>
                              ) : (
                                <span className="text-gray-300">-</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="text-sm font-medium text-gray-900">
                            {pagadasSocio}/12
                          </div>
                          <div className="text-xs text-gray-500">
                            ${totalSocio.toLocaleString('es-CL')}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Generar Cuotas */}
      {showGenerarModal && (
        <GenerarCuotasModal
          añoSeleccionado={añoSeleccionado}
          onClose={() => setShowGenerarModal(false)}
          onGenerated={() => {
            setShowGenerarModal(false);
            loadData();
          }}
        />
      )}

      {/* Modal Marcar Pago */}
      {showMarcarPagoModal && selectedCuota && (
        <MarcarPagoModal
          cuota={selectedCuota}
          onClose={() => {
            setShowMarcarPagoModal(false);
            setSelectedCuota(null);
          }}
          onMarked={() => {
            setShowMarcarPagoModal(false);
            setSelectedCuota(null);
            loadData();
          }}
        />
      )}
    </div>
  );
}

// Modal para generar cuotas masivamente
function GenerarCuotasModal({ añoSeleccionado, onClose, onGenerated }: {
  añoSeleccionado: number;
  onClose: () => void;
  onGenerated: () => void;
}) {
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [sobreescribir, setSobreescribir] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<any>(null);

  const handleGenerar = async () => {
    setLoading(true);
    setError(null);
    setResultado(null);

    try {
      const response = await sociosService.generarCuotas(añoSeleccionado, mes, sobreescribir);

      if (!response.success) {
        throw new Error(response.error || 'Error al generar cuotas');
      }

      setResultado(response.data);
      setTimeout(() => {
        onGenerated();
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Generar Cuotas</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4 rounded">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          )}

          {resultado ? (
            <div className="mb-4 bg-green-50 border-l-4 border-green-400 p-4 rounded">
              <div className="flex items-center mb-2">
                <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                <p className="text-green-700 font-medium">¡Cuotas generadas exitosamente!</p>
              </div>
              <div className="text-sm text-green-600 space-y-1">
                <p>Total socios: {resultado.totalSocios}</p>
                <p>Cuotas generadas: {resultado.generadas}</p>
                <p>Mes: {MESES[mes - 1]} {añoSeleccionado}</p>
                <p>Valor cuota: ${resultado.valorCuota?.toLocaleString('es-CL')}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label htmlFor="mes-select" className="block text-sm font-medium text-gray-700 mb-2">
                  Mes
                </label>
                <select
                  id="mes-select"
                  value={mes}
                  onChange={(e) => setMes(parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  {MESES.map((mesNombre, index) => {
                    const mesValue = index + 1;
                    return (
                      <option key={`mes-${mesValue}`} value={mesValue}>
                        {mesNombre} {añoSeleccionado}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="sobreescribir"
                  checked={sobreescribir}
                  onChange={(e) => setSobreescribir(e.target.checked)}
                  className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                />
                <label htmlFor="sobreescribir" className="ml-2 block text-sm text-gray-700">
                  Sobreescribir cuotas existentes
                </label>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700">
                  Se generará una cuota de $6.500 (valor por defecto) para cada socio activo en {MESES[mes - 1]} {añoSeleccionado}.
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end space-x-4 pt-6 border-t mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              {resultado ? 'Cerrar' : 'Cancelar'}
            </button>
            {!resultado && (
              <button
                onClick={handleGenerar}
                disabled={loading}
                className="flex items-center px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-5 w-5 mr-2" />
                    Generar
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

// Modal para marcar cuota como pagada
function MarcarPagoModal({ cuota, onClose, onMarked }: {
  cuota: Cuota;
  onClose: () => void;
  onMarked: () => void;
}) {
  const [metodoPago, setMetodoPago] = useState<'transferencia' | 'efectivo' | 'tarjeta'>('transferencia');
  const [notas, setNotas] = useState('');
  const [comprobante, setComprobante] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMarcarPagado = async () => {
    if (cuota.pagado) {
      // Si ya está pagada, solo cerrar
      onClose();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let comprobanteUrl: string | undefined;

      // Si hay comprobante, subirlo primero
      if (comprobante) {
        const uploadResponse = await sociosService.subirComprobante(comprobante, cuota.id);
        if (!uploadResponse.success) {
          throw new Error('Error al subir comprobante');
        }
        comprobanteUrl = uploadResponse.data?.url;
      }

      // Marcar cuota como pagada
      const response = await sociosService.marcarCuotaPagada(cuota.id, {
        metodoPago,
        comprobanteUrl,
        notas: notas || undefined
      });

      if (!response.success) {
        throw new Error(response.error || 'Error al marcar cuota como pagada');
      }

      onMarked();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              {cuota.pagado ? 'Detalle de Pago' : 'Marcar Cuota como Pagada'}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4 rounded">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {/* Información de la cuota */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Socio</p>
                  <p className="font-medium">{cuota.socio?.nombreCompleto}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Período</p>
                  <p className="font-medium">{MESES[cuota.mes - 1]} {cuota.año}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Valor</p>
                  <p className="font-medium text-lg">${cuota.valor.toLocaleString('es-CL')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Estado</p>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    cuota.pagado ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {cuota.pagado ? 'Pagado' : 'Pendiente'}
                  </span>
                </div>
              </div>
            </div>

            {cuota.pagado ? (
              // Mostrar información del pago
              <>
                <div>
                  <div className="block text-sm font-medium text-gray-700 mb-2">
                    Método de Pago
                  </div>
                  <p className="text-gray-900 capitalize">{cuota.metodoPago || 'No especificado'}</p>
                </div>

                {cuota.fechaPago && (
                  <div>
                    <div className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de Pago
                    </div>
                    <p className="text-gray-900">
                      {new Date(cuota.fechaPago).toLocaleDateString('es-CL', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                )}

                {cuota.comprobanteUrl && (
                  <div>
                    <div className="block text-sm font-medium text-gray-700 mb-2">
                      Comprobante
                    </div>
                    <a
                      href={cuota.comprobanteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-red-600 hover:text-red-700"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Ver comprobante
                    </a>
                  </div>
                )}

                {cuota.notas && (
                  <div>
                    <div className="block text-sm font-medium text-gray-700 mb-2">
                      Notas
                    </div>
                    <p className="text-gray-900">{cuota.notas}</p>
                  </div>
                )}
              </>
            ) : (
              // Formulario para marcar como pagado
              <>
                <div>
                  <label htmlFor="metodo-pago-select" className="block text-sm font-medium text-gray-700 mb-2">
                    Método de Pago <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="metodo-pago-select"
                    value={metodoPago}
                    onChange={(e) => setMetodoPago(e.target.value as any)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="transferencia">Transferencia</option>
                    <option value="efectivo">Efectivo</option>
                    <option value="tarjeta">Tarjeta</option>
                  </select>
                </div>

                <div>
                  <div className="block text-sm font-medium text-gray-700 mb-2">
                    Comprobante de Pago
                  </div>
                  <label htmlFor="comprobante-input" className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                    {comprobante ? (
                      <div className="flex flex-col items-center">
                        <CheckCircle className="h-8 w-8 text-green-500 mb-2" />
                        <p className="text-sm text-gray-600">{comprobante.name}</p>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setComprobante(null);
                          }}
                          className="mt-2 text-xs text-red-600 hover:text-red-700"
                        >
                          Eliminar
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <Upload className="h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600">Subir imagen del comprobante</p>
                        <p className="text-xs text-gray-500 mt-1">PNG, JPG hasta 5MB</p>
                      </div>
                    )}
                    <input
                      id="comprobante-input"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setComprobante(e.target.files?.[0] || null)}
                      className="hidden"
                    />
                  </label>
                </div>

                <div>
                  <label htmlFor="notas-textarea" className="block text-sm font-medium text-gray-700 mb-2">
                    Notas (Opcional)
                  </label>
                  <textarea
                    id="notas-textarea"
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    rows={3}
                    placeholder="Agregar comentarios sobre el pago..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
              </>
            )}
          </div>

          <div className="flex items-center justify-end space-x-4 pt-6 border-t mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              {cuota.pagado ? 'Cerrar' : 'Cancelar'}
            </button>
            {!cuota.pagado && (
              <button
                onClick={handleMarcarPagado}
                disabled={loading}
                className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Check className="h-5 w-5 mr-2" />
                    Marcar como Pagado
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
