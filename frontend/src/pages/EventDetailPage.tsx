import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  CheckCircle,
  AlertCircle,
  UserPlus,
  X,
  Info
} from 'lucide-react';
import { Evento, EventInscription } from '../../../shared';
import { eventService } from '../services/eventService';
import { useAuth } from '../contexts/AuthContext';

interface InscriptionStatus {
  isInscribed: boolean;
  inscriptionData?: EventInscription;
  canInscribe: boolean;
  message?: string;
}

const EventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [evento, setEvento] = useState<Evento | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inscriptionStatus, setInscriptionStatus] = useState<InscriptionStatus>({
    isInscribed: false,
    canInscribe: false
  });
  const [inscribing, setInscribing] = useState(false);
  const [showInscriptionModal, setShowInscriptionModal] = useState(false);
  const [inscriptionNotes, setInscriptionNotes] = useState('');

  useEffect(() => {
    if (id && id !== undefined) {
      const eventId = parseInt(id);
      if (!isNaN(eventId)) {
        loadEventDetail(eventId);
      } else {
        setError('ID de evento inválido');
        setLoading(false);
      }
    } else {
      setError('ID de evento no encontrado');
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (evento && user) {
      checkInscriptionStatus();
    }
  }, [evento, user]);

  const loadEventDetail = async (eventId: number) => {
    try {
      setLoading(true);
      const response = await eventService.getEvento(eventId);
      
      if (response.success && response.data) {
        setEvento(response.data);
      } else {
        setError(response.error || 'Evento no encontrado');
      }
    } catch (err) {
      setError('Error cargando el evento');
      console.error('Error loading event:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkInscriptionStatus = async () => {
    if (!evento || !user) return;

    try {
      // Verificar si el usuario ya está inscrito
      const inscripciones = await eventService.getMyInscripciones();
      
      if (inscripciones.success && inscripciones.data) {
        const existingInscription = inscripciones.data.find(
          (insc: EventInscription) => insc.eventId === evento.id && insc.status !== 'cancelled'
        );

        if (existingInscription) {
          setInscriptionStatus({
            isInscribed: true,
            inscriptionData: existingInscription,
            canInscribe: false,
            message: getStatusMessage(existingInscription.status)
          });
          return;
        }
      } else if (!inscripciones.success) {
        console.error('Error fetching inscriptions:', inscripciones.error);
        // No bloquear el flujo, continuar con verificación de capacidad
      }

      // Verificar si puede inscribirse
      const canInscribe = checkCanInscribe(evento);
      setInscriptionStatus({
        isInscribed: false,
        canInscribe: canInscribe.can,
        message: canInscribe.message
      });

    } catch (error) {
      console.error('Error checking inscription status:', error);
      // En caso de error, permitir intentar inscribirse
      const canInscribe = checkCanInscribe(evento);
      setInscriptionStatus({
        isInscribed: false,
        canInscribe: canInscribe.can,
        message: canInscribe.message
      });
    }
  };

  const checkCanInscribe = (evento: Evento): { can: boolean; message?: string } => {
    // Verificar si las inscripciones están abiertas
    if (!evento.registrationOpen) {
      return { can: false, message: 'Las inscripciones están cerradas' };
    }

    // Verificar si el evento ya pasó
    const eventDate = new Date(evento.date);
    const now = new Date();
    if (eventDate < now) {
      return { can: false, message: 'Este evento ya pasó' };
    }

    // Verificar cupos
    if (evento.maxParticipants && evento.currentParticipants >= evento.maxParticipants) {
      return { can: true, message: 'Se agregará a la lista de espera' };
    }

    return { can: true };
  };

  const getStatusMessage = (status: EventInscription['status']): string => {
    switch (status) {
      case 'confirmed':
        return 'Inscripción confirmada';
      case 'pending':
        return 'Inscripción pendiente de confirmación';
      case 'waitlist':
        return 'En lista de espera';
      case 'cancelled':
        return 'Inscripción cancelada';
      default:
        return '';
    }
  };

  const handleInscription = async () => {
    if (!evento || !user) return;

    setInscribing(true);
    try {
      const response = await eventService.inscribirseEvento(evento.id, inscriptionNotes);
      
      if (response.success) {
        // Recargar estado de inscripción
        await checkInscriptionStatus();
        setShowInscriptionModal(false);
        setInscriptionNotes('');
        
        // Mostrar mensaje de éxito
        alert(response.message || 'Inscripción exitosa!');
      } else {
        // Manejo específico de errores conocidos
        if (response.error?.includes('ya está inscrito') || response.error?.includes('already registered')) {
          // Si ya está inscrito, recargar el estado en lugar de mostrar error
          await checkInscriptionStatus();
          setShowInscriptionModal(false);
          alert('Ya estás inscrito en este evento');
        } else {
          alert(response.error || 'Error en la inscripción');
        }
      }
    } catch (error) {
      alert('Error procesando la inscripción');
      console.error('Inscription error:', error);
    } finally {
      setInscribing(false);
    }
  };

  const handleCancelInscription = async () => {
    if (!inscriptionStatus.inscriptionData) return;

    const confirmed = window.confirm(
      '¿Estás seguro de que deseas cancelar tu inscripción? Esta acción no se puede deshacer.'
    );

    if (!confirmed) return;

    setInscribing(true);
    try {
      const response = await eventService.cancelarInscripcion(inscriptionStatus.inscriptionData.id);
      
      if (response.success) {
        await checkInscriptionStatus();
        alert('Inscripción cancelada exitosamente');
      } else {
        alert(response.error || 'Error cancelando la inscripción');
      }
    } catch (error) {
      alert('Error cancelando la inscripción');
      console.error('Cancellation error:', error);
    } finally {
      setInscribing(false);
    }
  };

  const formatPrice = (price?: number) => {
    if (!price || price === 0) return 'Gratis';
    return `$${price.toLocaleString('es-CL')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: EventInscription['status']) => {
    switch (status) {
      case 'confirmed':
        return 'text-green-600 bg-green-50';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      case 'waitlist':
        return 'text-orange-600 bg-orange-50';
      case 'cancelled':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando evento...</p>
        </div>
      </div>
    );
  }

  if (error || !evento) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/eventos')}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Volver a Eventos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header con imagen */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
          <div className="relative h-64 md:h-80">
            <img
              src={evento.image}
              alt={evento.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-end">
              <div className="p-6 text-white">
                <h1 className="text-3xl md:text-4xl font-bold mb-2">{evento.title}</h1>
                <div className="flex items-center space-x-4 text-sm">
                  <span className="bg-red-600 px-3 py-1 rounded-full capitalize">
                    {evento.type}
                  </span>
                  <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full">
                    {formatPrice(evento.price)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Información principal */}
          <div className="md:col-span-2 space-y-6">
            {/* Detalles básicos */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Info className="w-5 h-5 mr-2 text-red-600" />
                Información del Evento
              </h2>
              
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center text-gray-600">
                  <Calendar className="w-5 h-5 mr-3 text-red-600" />
                  <span>{formatDate(evento.date)}</span>
                </div>
                
                {evento.time && (
                  <div className="flex items-center text-gray-600">
                    <Clock className="w-5 h-5 mr-3 text-red-600" />
                    <span>{evento.time} hrs</span>
                  </div>
                )}
                
                <div className="flex items-center text-gray-600">
                  <MapPin className="w-5 h-5 mr-3 text-red-600" />
                  <span>{evento.location}</span>
                </div>
                
                <div className="flex items-center text-gray-600">
                  <Users className="w-5 h-5 mr-3 text-red-600" />
                  <span>
                    {evento.currentParticipants} participantes
                    {evento.maxParticipants && ` / ${evento.maxParticipants} máximo`}
                  </span>
                </div>
              </div>

              <div className="prose max-w-none">
                <h3 className="text-lg font-semibold mb-2">Descripción</h3>
                <div className="text-gray-700 whitespace-pre-line">
                  {evento.description}
                </div>
              </div>
            </div>

            {/* Requisitos */}
            {evento.requirements && evento.requirements.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-3">Requisitos</h3>
                <ul className="space-y-2">
                  {evento.requirements.map((req, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{req}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Tags */}
            {evento.tags && evento.tags.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {evento.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar de inscripción */}
          <div className="space-y-6">
            {/* Estado de inscripción */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Inscripción</h3>
              
              {user ? (
                <div className="space-y-4">
                  {inscriptionStatus.isInscribed ? (
                    // Usuario ya inscrito
                    <div>
                      <div className={`px-4 py-3 rounded-lg border ${getStatusColor(inscriptionStatus.inscriptionData?.status || 'confirmed')}`}>
                        <div className="flex items-center">
                          <CheckCircle className="w-5 h-5 mr-2" />
                          <span className="font-medium">{inscriptionStatus.message}</span>
                        </div>
                      </div>
                      
                      {inscriptionStatus.inscriptionData?.status === 'confirmed' && (
                        <button
                          onClick={handleCancelInscription}
                          disabled={inscribing}
                          className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                          {inscribing ? 'Cancelando...' : 'Cancelar Inscripción'}
                        </button>
                      )}
                    </div>
                  ) : (
                    // Usuario no inscrito
                    <div>
                      {inscriptionStatus.canInscribe ? (
                        <button
                          onClick={() => setShowInscriptionModal(true)}
                          className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center"
                        >
                          <UserPlus className="w-5 h-5 mr-2" />
                          Inscribirse
                        </button>
                      ) : (
                        <div className="bg-gray-100 text-gray-600 px-4 py-3 rounded-lg text-center">
                          {inscriptionStatus.message}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-gray-600 mb-4">Inicia sesión para inscribirte</p>
                  <button
                    onClick={() => navigate('/auth')}
                    className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Iniciar Sesión
                  </button>
                </div>
              )}
            </div>

            {/* Información de contacto */}
            {evento.contactInfo && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Contacto</h3>
                <div className="space-y-2 text-sm">
                  {evento.contactInfo.email && (
                    <div>
                      <span className="font-medium">Email:</span>{' '}
                      <a
                        href={`mailto:${evento.contactInfo.email}`}
                        className="text-red-600 hover:underline"
                      >
                        {evento.contactInfo.email}
                      </a>
                    </div>
                  )}
                  
                  {evento.contactInfo.phone && (
                    <div>
                      <span className="font-medium">Teléfono:</span>{' '}
                      <a
                        href={`tel:${evento.contactInfo.phone}`}
                        className="text-red-600 hover:underline"
                      >
                        {evento.contactInfo.phone}
                      </a>
                    </div>
                  )}
                  
                  {evento.contactInfo.website && (
                    <div>
                      <span className="font-medium">Sitio web:</span>{' '}
                      <a
                        href={evento.contactInfo.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-red-600 hover:underline"
                      >
                        Visitar sitio
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de inscripción */}
      {showInscriptionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Confirmar Inscripción</h3>
              <button
                onClick={() => setShowInscriptionModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-gray-600 mb-3">
                Te inscribirás en: <strong>{evento.title}</strong>
              </p>
              
              {inscriptionStatus.message && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <p className="text-yellow-800 text-sm">
                    <AlertCircle className="w-4 h-4 inline mr-1" />
                    {inscriptionStatus.message}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comentarios adicionales (opcional)
                </label>
                <textarea
                  value={inscriptionNotes}
                  onChange={(e) => setInscriptionNotes(e.target.value)}
                  placeholder="¿Algo especial que debamos saber?"
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowInscriptionModal(false)}
                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleInscription}
                disabled={inscribing}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {inscribing ? 'Inscribiendo...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetailPage;