import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  Calendar, 
  CreditCard,
  CheckCircle,
  XCircle,
  AlertCircle,
  User
} from 'lucide-react';
import { sociosService, Socio, Cuota } from '../services/sociosService';

const MESES = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];

export default function PerfilSocio() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [socio, setSocio] = useState<Socio | null>(null);
  const [cuotas, setCuotas] = useState<Cuota[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('[PerfilSocio] Component mounted, id:', id);
    if (id) {
      loadSocioData(parseInt(id));
    } else {
      console.error('[PerfilSocio] No ID provided');
      setError('No se especificó ID de socio');
      setLoading(false);
    }
  }, [id]);

  const loadSocioData = async (socioId: number) => {
    try {
      console.log('[PerfilSocio] Loading socio data for ID:', socioId);
      setLoading(true);
      setError(null);

      // Cargar datos del socio
      const socioResponse = await sociosService.getSocio(socioId);
      console.log('[PerfilSocio] Socio response:', socioResponse);
      
      if (!socioResponse.success || !socioResponse.data) {
        throw new Error(socioResponse.error || 'No se pudo cargar el socio');
      }

      setSocio(socioResponse.data);
      console.log('[PerfilSocio] Socio data loaded:', socioResponse.data);

      // Cargar cuotas del último año
      const añoActual = new Date().getFullYear();
      console.log('[PerfilSocio] Loading cuotas for year:', añoActual);
      const cuotasResponse = await sociosService.getCuotas({ 
        año: añoActual,
        socioId: socioId
      });
      console.log('[PerfilSocio] Cuotas response:', cuotasResponse);

      if (cuotasResponse.success && cuotasResponse.data) {
        setCuotas(cuotasResponse.data.cuotas || []);
        console.log('[PerfilSocio] Cuotas loaded:', cuotasResponse.data.cuotas?.length || 0);
      }

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMsg);
      console.error('[PerfilSocio] Error loading data:', err);
    } finally {
      console.log('[PerfilSocio] Loading complete, setting loading to false');
      setLoading(false);
    }
  };

  const esCuotaVencida = (cuota: Cuota): boolean => {
    const fechaVencimiento = new Date(cuota.año, cuota.mes - 1, 5);
    const hoy = new Date();
    return hoy > fechaVencimiento;
  };

  const getEstadoCuota = (mes: number): 'pagada' | 'vencida' | 'pendiente' | 'sin-generar' => {
    const cuota = cuotas.find(c => c.mes === mes);
    
    if (!cuota) return 'sin-generar';
    if (cuota.pagado) return 'pagada';
    if (esCuotaVencida(cuota)) return 'vencida';
    return 'pendiente';
  };

  const getCuotaMes = (mes: number): Cuota | undefined => {
    return cuotas.find(c => c.mes === mes);
  };

  console.log('[PerfilSocio] Render - loading:', loading, 'error:', error, 'socio:', socio);

  if (loading) {
    console.log('[PerfilSocio] Rendering loading state');
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (error || !socio) {
    console.log('[PerfilSocio] Rendering error state');
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Error al cargar perfil</h2>
            <p className="text-gray-600 mb-6">{error || 'Socio no encontrado'}</p>
            <button
              onClick={() => navigate('/panel-admin/users')}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Volver a Gestión de Socios
            </button>
          </div>
        </div>
      </div>
    );
  }

  console.log('[PerfilSocio] Rendering main content');
  const cuotasVencidas = cuotas.filter(c => esCuotaVencida(c) && !c.pagado);
  const cuotasPagadas = cuotas.filter(c => c.pagado);

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header con botón de regreso */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/panel-admin/users')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            Volver a Gestión de Socios
          </button>
        </div>

        {/* Tarjeta principal del perfil */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
          {/* Header con foto y datos básicos */}
          <div className="bg-gradient-to-r from-red-600 to-red-700 px-8 py-12">
            <div className="flex items-center gap-6">
              {socio.fotoUrl ? (
                <img
                  src={socio.fotoUrl}
                  alt={socio.nombreCompleto}
                  className="h-24 w-24 rounded-full object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="h-24 w-24 rounded-full bg-white flex items-center justify-center border-4 border-white shadow-lg">
                  <User className="h-12 w-12 text-red-600" />
                </div>
              )}
              <div className="flex-1 text-white">
                <h1 className="text-3xl font-bold mb-2">{socio.nombreCompleto}</h1>
                <div className="flex items-center gap-4 text-red-100">
                  <span className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {socio.email}
                  </span>
                  {socio.telefono && (
                    <span className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {socio.telefono}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Información detallada */}
          <div className="px-8 py-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">RUT</p>
                <p className="text-lg font-semibold text-gray-900">{socio.rut || 'No registrado'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Cuota Mensual</p>
                <p className="text-lg font-semibold text-gray-900">
                  ${socio.valorCuota.toLocaleString('es-CL')}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Fecha de Ingreso</p>
                <p className="text-lg font-semibold text-gray-900">
                  {socio.fechaIngreso 
                    ? new Date(socio.fechaIngreso).toLocaleDateString('es-CL', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })
                    : 'No registrada'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Estadísticas de cuotas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Cuotas Pagadas</p>
                <p className="text-3xl font-bold text-green-600">{cuotasPagadas.length}</p>
              </div>
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Cuotas Vencidas</p>
                <p className="text-3xl font-bold text-red-600">{cuotasVencidas.length}</p>
              </div>
              <XCircle className="h-12 w-12 text-red-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Estado</p>
                <p className={`text-2xl font-bold ${
                  cuotasVencidas.length === 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {cuotasVencidas.length === 0 ? 'Al día' : 'Con atrasos'}
                </p>
              </div>
              {cuotasVencidas.length === 0 ? (
                <CheckCircle className="h-12 w-12 text-green-500" />
              ) : (
                <AlertCircle className="h-12 w-12 text-red-500" />
              )}
            </div>
          </div>
        </div>

        {/* Estado de cuotas del año */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Calendar className="h-6 w-6" />
            Estado de Cuotas {new Date().getFullYear()}
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {MESES.map((nombreMes, index) => {
              const mes = index + 1;
              const estado = getEstadoCuota(mes);
              const cuota = getCuotaMes(mes);

              return (
                <div
                  key={mes}
                  className={`
                    relative p-4 rounded-lg border-2 transition-all
                    ${estado === 'pagada' ? 'bg-green-50 border-green-500' : ''}
                    ${estado === 'vencida' ? 'bg-red-50 border-red-500' : ''}
                    ${estado === 'pendiente' ? 'bg-blue-50 border-blue-500' : ''}
                    ${estado === 'sin-generar' ? 'bg-gray-50 border-gray-300' : ''}
                  `}
                >
                  <div className="text-center">
                    <p className="text-xs font-medium text-gray-600 mb-1">
                      {nombreMes}
                    </p>
                    <div className="flex justify-center mb-2">
                      {estado === 'pagada' && (
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      )}
                      {estado === 'vencida' && (
                        <XCircle className="h-6 w-6 text-red-600" />
                      )}
                      {estado === 'pendiente' && (
                        <CreditCard className="h-6 w-6 text-blue-600" />
                      )}
                      {estado === 'sin-generar' && (
                        <Calendar className="h-6 w-6 text-gray-400" />
                      )}
                    </div>
                    <p className={`text-xs font-semibold ${
                      estado === 'pagada' ? 'text-green-700' :
                      estado === 'vencida' ? 'text-red-700' :
                      estado === 'pendiente' ? 'text-blue-700' :
                      'text-gray-500'
                    }`}>
                      {estado === 'pagada' && 'Pagada'}
                      {estado === 'vencida' && 'Vencida'}
                      {estado === 'pendiente' && 'Pendiente'}
                      {estado === 'sin-generar' && 'N/A'}
                    </p>
                    {cuota && cuota.fechaPago && (
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(cuota.fechaPago).toLocaleDateString('es-CL', { 
                          day: 'numeric', 
                          month: 'short' 
                        })}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Leyenda */}
          <div className="mt-6 flex flex-wrap gap-4 justify-center text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-gray-600">Pagada</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <span className="text-gray-600">Vencida</span>
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-blue-600" />
              <span className="text-gray-600">Pendiente</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">No generada</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
