/**
 * Módulo de cuotas para el perfil del usuario
 * ACA Chile Frontend
 */

import React, { useState, useEffect } from 'react';
import { sociosService, Cuota } from '../../services/sociosService';
import { useAuth } from '../../contexts/AuthContext';
import { 
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Upload,
  AlertCircle,
  Loader2,
  X,
  Eye,
  CreditCard
} from 'lucide-react';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const CuotasModule: React.FC = () => {
  const { user } = useAuth();
  const [añoActual] = useState(new Date().getFullYear());
  const [añoSeleccionado, setAñoSeleccionado] = useState(añoActual);
  const [cuotas, setCuotas] = useState<Cuota[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPagarModal, setShowPagarModal] = useState(false);
  const [selectedCuota, setSelectedCuota] = useState<Cuota | null>(null);

  useEffect(() => {
    loadMisCuotas();
  }, [añoSeleccionado, user]);

  const loadMisCuotas = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      const response = await sociosService.getCuotas({
        año: añoSeleccionado,
        socioId: user.id
      });

      if (response.success && response.data) {
        setCuotas(response.data.cuotas);
      } else {
        setError(response.error || 'Error al cargar cuotas');
      }
    } catch (err) {
      setError('Error al cargar cuotas');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getCuotaByMes = (mes: number): Cuota | undefined => {
    return cuotas.find(c => c.mes === mes);
  };

  const getEstadisticas = () => {
    const totalCuotas = cuotas.length;
    const pagadas = cuotas.filter(c => c.pagado).length;
    const pendientes = totalCuotas - pagadas;
    const totalPagado = cuotas.filter(c => c.pagado).reduce((sum, c) => sum + c.valor, 0);
    const totalDeuda = cuotas.filter(c => !c.pagado).reduce((sum, c) => sum + c.valor, 0);

    return { totalCuotas, pagadas, pendientes, totalPagado, totalDeuda };
  };

  const stats = getEstadisticas();

  if (loading) {
    return (
      <div className="bg-white/60 backdrop-blur-soft border border-white/30 rounded-2xl shadow-soft-lg p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin mr-2" />
          <span className="text-neutral-600">Cargando tus cuotas...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/60 backdrop-blur-soft border border-white/30 rounded-2xl shadow-soft-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-neutral-900 mb-2">Mis Cuotas</h2>
            <p className="text-neutral-600">Estado de tus cuotas mensuales</p>
          </div>
          
          <select
            value={añoSeleccionado}
            onChange={(e) => setAñoSeleccionado(parseInt(e.target.value))}
            className="px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            {[añoActual - 1, añoActual, añoActual + 1].map(año => (
              <option key={año} value={año}>{año}</option>
            ))}
          </select>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 font-medium">Pagadas</p>
                <p className="text-3xl font-bold text-green-800">{stats.pagadas}</p>
              </div>
              <CheckCircle className="h-10 w-10 text-green-500" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-700 font-medium">Pendientes</p>
                <p className="text-3xl font-bold text-red-800">{stats.pendientes}</p>
              </div>
              <XCircle className="h-10 w-10 text-red-500" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 font-medium">Pagado</p>
                <p className="text-xl font-bold text-blue-800">
                  ${stats.totalPagado.toLocaleString('es-CL')}
                </p>
              </div>
              <DollarSign className="h-10 w-10 text-blue-500" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-700 font-medium">Deuda</p>
                <p className="text-xl font-bold text-orange-800">
                  ${stats.totalDeuda.toLocaleString('es-CL')}
                </p>
              </div>
              <Clock className="h-10 w-10 text-orange-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Calendario de cuotas */}
      <div className="bg-white/60 backdrop-blur-soft border border-white/30 rounded-2xl shadow-soft-lg p-6">
        <h3 className="text-xl font-semibold text-neutral-900 mb-6">Calendario {añoSeleccionado}</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {MESES.map((mes, index) => {
            const cuota = getCuotaByMes(index + 1);
            const mesActual = new Date().getMonth();
            const esProximo = index === mesActual && añoSeleccionado === añoActual;

            return (
              <div
                key={mes}
                className={`relative border-2 rounded-xl p-4 transition-all ${
                  cuota?.pagado
                    ? 'bg-green-50 border-green-300 hover:border-green-400'
                    : cuota
                    ? 'bg-red-50 border-red-300 hover:border-red-400'
                    : 'bg-gray-50 border-gray-200'
                } ${esProximo ? 'ring-2 ring-primary-400' : ''}`}
              >
                {esProximo && (
                  <div className="absolute -top-2 -right-2 bg-primary-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    Actual
                  </div>
                )}

                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-neutral-900">{mes}</h4>
                    <p className="text-sm text-neutral-600">{añoSeleccionado}</p>
                  </div>
                  <div>
                    {cuota ? (
                      cuota.pagado ? (
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      ) : (
                        <XCircle className="h-6 w-6 text-red-600" />
                      )
                    ) : (
                      <Clock className="h-6 w-6 text-gray-400" />
                    )}
                  </div>
                </div>

                {cuota ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-neutral-600">Valor:</span>
                      <span className="font-bold text-neutral-900">
                        ${cuota.valor.toLocaleString('es-CL')}
                      </span>
                    </div>

                    {cuota.pagado && cuota.fechaPago && (
                      <div className="text-xs text-green-700">
                        Pagado el {new Date(cuota.fechaPago).toLocaleDateString('es-CL')}
                      </div>
                    )}

                    {!cuota.pagado ? (
                      <button
                        onClick={() => {
                          setSelectedCuota(cuota);
                          setShowPagarModal(true);
                        }}
                        className="w-full mt-2 flex items-center justify-center px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Pagar
                      </button>
                    ) : (
                      cuota.comprobanteUrl && (
                        <button
                          onClick={() => {
                            setSelectedCuota(cuota);
                            setShowPagarModal(true);
                          }}
                          className="w-full mt-2 flex items-center justify-center px-3 py-2 bg-neutral-100 text-neutral-700 rounded-lg hover:bg-neutral-200 transition-colors text-sm"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Comprobante
                        </button>
                      )
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-neutral-500 text-center py-2">
                    No generada
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal de pago */}
      {showPagarModal && selectedCuota && (
        <PagarCuotaModal
          cuota={selectedCuota}
          onClose={() => {
            setShowPagarModal(false);
            setSelectedCuota(null);
          }}
          onPagado={() => {
            setShowPagarModal(false);
            setSelectedCuota(null);
            loadMisCuotas();
          }}
        />
      )}
    </div>
  );
};

// Modal para pagar cuota
function PagarCuotaModal({ cuota, onClose, onPagado }: {
  cuota: Cuota;
  onClose: () => void;
  onPagado: () => void;
}) {
  const [comprobante, setComprobante] = useState<File | null>(null);
  const [comprobantePreview, setComprobantePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleComprobanteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setComprobante(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setComprobantePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubirComprobante = async () => {
    if (!comprobante) {
      setError('Debes seleccionar un comprobante');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await sociosService.subirComprobante(comprobante, cuota.id);

      if (!response.success) {
        throw new Error(response.error || 'Error al subir comprobante');
      }

      setSuccess(true);
      setTimeout(() => {
        onPagado();
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  // Si la cuota ya está pagada, solo mostrar el comprobante
  if (cuota.pagado && cuota.comprobanteUrl) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-neutral-900">Comprobante de Pago</h2>
              <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600">
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-center mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  <span className="font-semibold text-green-800">Cuota Pagada</span>
                </div>
                <p className="text-sm text-green-700">
                  {MESES[cuota.mes - 1]} {cuota.año} - ${cuota.valor.toLocaleString('es-CL')}
                </p>
                {cuota.fechaPago && (
                  <p className="text-sm text-green-600 mt-1">
                    Pagado el {new Date(cuota.fechaPago).toLocaleDateString('es-CL', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Comprobante
                </label>
                <div className="border-2 border-neutral-200 rounded-xl overflow-hidden">
                  <img
                    src={cuota.comprobanteUrl}
                    alt="Comprobante de pago"
                    className="w-full h-auto"
                  />
                </div>
                <a
                  href={cuota.comprobanteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center text-primary-600 hover:text-primary-700"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Ver en tamaño completo
                </a>
              </div>
            </div>

            <div className="flex justify-end pt-6 border-t mt-6">
              <button
                onClick={onClose}
                className="px-6 py-2 bg-neutral-600 text-white rounded-lg hover:bg-neutral-700"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-neutral-900">Pagar Cuota</h2>
            <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600">
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

          {success ? (
            <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded mb-4">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                <div>
                  <p className="text-green-700 font-medium">¡Comprobante enviado!</p>
                  <p className="text-green-600 text-sm mt-1">
                    Tu pago está en revisión. Te notificaremos cuando sea confirmado.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Información de la cuota */}
              <div className="bg-neutral-50 rounded-xl p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-neutral-600">Período</p>
                    <p className="font-semibold">{MESES[cuota.mes - 1]} {cuota.año}</p>
                  </div>
                  <div>
                    <p className="text-sm text-neutral-600">Valor</p>
                    <p className="font-semibold text-xl">${cuota.valor.toLocaleString('es-CL')}</p>
                  </div>
                </div>
              </div>

              {/* Instrucciones de pago */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Instrucciones de Pago</h4>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Realiza la transferencia a la cuenta de ACA Chile</li>
                  <li>Toma una foto o screenshot del comprobante</li>
                  <li>Sube el comprobante aquí</li>
                  <li>Espera la confirmación del pago</li>
                </ol>
              </div>

              {/* Upload de comprobante */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Comprobante de Pago <span className="text-red-500">*</span>
                </label>
                
                {comprobantePreview ? (
                  <div className="relative">
                    <img
                      src={comprobantePreview}
                      alt="Preview comprobante"
                      className="w-full h-48 object-cover rounded-xl border-2 border-neutral-200"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setComprobante(null);
                        setComprobantePreview(null);
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-neutral-300 rounded-xl cursor-pointer hover:bg-neutral-50 transition-colors">
                    <div className="flex flex-col items-center">
                      <Upload className="h-12 w-12 text-neutral-400 mb-3" />
                      <p className="text-sm text-neutral-600 font-medium">Subir Comprobante</p>
                      <p className="text-xs text-neutral-500 mt-1">PNG, JPG hasta 5MB</p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleComprobanteChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center justify-end space-x-4 pt-6 border-t mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-neutral-300 rounded-lg text-neutral-700 hover:bg-neutral-50"
            >
              {success ? 'Cerrar' : 'Cancelar'}
            </button>
            {!success && (
              <button
                onClick={handleSubirComprobante}
                disabled={loading || !comprobante}
                className="flex items-center px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload className="h-5 w-5 mr-2" />
                    Enviar Comprobante
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
