import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Container } from '../components/layout/Container';
import { EventList } from '../components/events';
import { useEvents } from '../contexts/EventContext';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock,
  DollarSign,
  Tag,
  Phone,
  Mail,
  Globe,
  CheckCircle,
  XCircle
} from 'lucide-react';

export const EventsPage: React.FC = () => {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#e8ecf4' }}>
      <Container>
        <div className="py-8">
          <EventList />
        </div>
      </Container>
    </div>
  );
};

export const EventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { currentEvent, fetchEvento, isLoading, error, isUserInscribed, inscribirseEvento } = useEvents();

  useEffect(() => {
    if (id) {
      fetchEvento(parseInt(id));
    }
  }, [id, fetchEvento]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'campeonato':
        return '#EF4444';
      case 'taller':
        return '#3B82F6';
      case 'encuentro':
        return '#10B981';
      case 'torneo':
        return '#F59E0B';
      default:
        return '#6B7280';
    }
  };

  const handleInscripcion = async () => {
    if (!currentEvent) return;
    
    try {
      await inscribirseEvento(currentEvent.id);
    } catch (error) {
      console.error('Error al inscribirse:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#e8ecf4' }}>
        <div 
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ 
            backgroundColor: '#e8ecf4',
            boxShadow: '8px 8px 16px #bec8d7, -8px -8px 16px #ffffff'
          }}
        >
          <div className="w-8 h-8 border-3 border-red-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (error || !currentEvent) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#e8ecf4' }}>
        <Container>
          <div 
            className="rounded-2xl p-8 text-center max-w-md mx-auto"
            style={{ 
              backgroundColor: '#FEE2E2',
              color: '#DC2626',
              border: '1px solid #FECACA'
            }}
          >
            <XCircle className="w-16 h-16 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Evento no encontrado</h2>
            <p className="mb-4">{error || 'El evento que buscas no existe o ha sido eliminado.'}</p>
          </div>
        </Container>
      </div>
    );
  }

  const isInscribed = isUserInscribed(currentEvent.id);
  const isFull = currentEvent.maxParticipants && currentEvent.currentParticipants >= currentEvent.maxParticipants;
  const canRegister = currentEvent.registrationOpen && !isInscribed && !isFull;

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#e8ecf4' }}>
      <Container>
        <div className="py-8">
          {/* Hero Section */}
          <div 
            className="rounded-3xl overflow-hidden mb-8"
            style={{ 
              backgroundColor: '#e8ecf4',
              boxShadow: '20px 20px 40px #bec8d7, -20px -20px 40px #ffffff'
            }}
          >
            <div className="relative">
              <img
                src={currentEvent.image}
                alt={currentEvent.title}
                className="w-full h-96 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
              
              {/* Type Badge */}
              <div className="absolute top-6 left-6">
                <span 
                  className="px-4 py-2 rounded-full text-white font-medium flex items-center space-x-2"
                  style={{ backgroundColor: getEventTypeColor(currentEvent.type) }}
                >
                  <Tag className="w-4 h-4" />
                  <span>{currentEvent.type.charAt(0).toUpperCase() + currentEvent.type.slice(1)}</span>
                </span>
              </div>

              {/* Title Overlay */}
              <div className="absolute bottom-6 left-6 right-6">
                <h1 className="text-4xl font-bold text-white mb-4">
                  {currentEvent.title}
                </h1>
                
                <div className="flex flex-wrap gap-4 text-white/90">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5" />
                    <span>{formatDate(currentEvent.date)}</span>
                  </div>
                  
                  {currentEvent.time && (
                    <div className="flex items-center space-x-2">
                      <Clock className="w-5 h-5" />
                      <span>{currentEvent.time}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-5 h-5" />
                    <span>{currentEvent.location}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Description */}
              <div 
                className="rounded-3xl p-8"
                style={{ 
                  backgroundColor: '#e8ecf4',
                  boxShadow: '15px 15px 30px #bec8d7, -15px -15px 30px #ffffff'
                }}
              >
                <h2 className="text-2xl font-bold mb-6" style={{ color: '#374151' }}>
                  Descripción del Evento
                </h2>
                <div 
                  className="prose prose-lg max-w-none"
                  style={{ color: '#4B5563' }}
                >
                  {currentEvent.description.split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-4">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>

              {/* Requirements */}
              {currentEvent.requirements && currentEvent.requirements.length > 0 && (
                <div 
                  className="rounded-3xl p-8"
                  style={{ 
                    backgroundColor: '#e8ecf4',
                    boxShadow: '15px 15px 30px #bec8d7, -15px -15px 30px #ffffff'
                  }}
                >
                  <h2 className="text-2xl font-bold mb-6" style={{ color: '#374151' }}>
                    Requisitos
                  </h2>
                  <ul className="space-y-3">
                    {currentEvent.requirements.map((requirement, index) => (
                      <li key={index} className="flex items-start space-x-3">
                        <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: '#10B981' }} />
                        <span style={{ color: '#4B5563' }}>{requirement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Registration Card */}
              <div 
                className="rounded-3xl p-8"
                style={{ 
                  backgroundColor: '#e8ecf4',
                  boxShadow: '15px 15px 30px #bec8d7, -15px -15px 30px #ffffff'
                }}
              >
                <h3 className="text-xl font-bold mb-6" style={{ color: '#374151' }}>
                  Información de Inscripción
                </h3>

                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between">
                    <span style={{ color: '#6B7280' }}>Participantes:</span>
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4" style={{ color: '#6B7280' }} />
                      <span style={{ color: '#374151' }}>
                        {currentEvent.currentParticipants}
                        {currentEvent.maxParticipants && `/${currentEvent.maxParticipants}`}
                      </span>
                    </div>
                  </div>

                  {currentEvent.price && currentEvent.price > 0 && (
                    <div className="flex items-center justify-between">
                      <span style={{ color: '#6B7280' }}>Precio:</span>
                      <div className="flex items-center space-x-2">
                        <DollarSign className="w-4 h-4" style={{ color: '#059669' }} />
                        <span className="font-semibold" style={{ color: '#059669' }}>
                          ${currentEvent.price.toLocaleString('es-CL')}
                        </span>
                      </div>
                    </div>
                  )}

                  {currentEvent.price === 0 && (
                    <div className="flex items-center justify-between">
                      <span style={{ color: '#6B7280' }}>Precio:</span>
                      <span className="font-semibold" style={{ color: '#059669' }}>
                        Gratuito
                      </span>
                    </div>
                  )}
                </div>

                {/* Registration Status */}
                {isInscribed && (
                  <div 
                    className="w-full py-4 px-6 rounded-xl text-center font-medium mb-4"
                    style={{ 
                      backgroundColor: '#D1FAE5', 
                      color: '#065F46',
                      boxShadow: 'inset 4px 4px 8px #bec8d7, inset -4px -4px 8px #ffffff'
                    }}
                  >
                    <CheckCircle className="w-5 h-5 inline-block mr-2" />
                    Ya estás inscrito
                  </div>
                )}

                {canRegister && (
                  <button
                    onClick={handleInscripcion}
                    className="w-full py-4 px-6 rounded-xl text-white font-medium transition-all duration-300 hover:scale-105"
                    style={{ 
                      background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                      boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)'
                    }}
                  >
                    Inscribirse Ahora
                  </button>
                )}

                {isFull && !isInscribed && (
                  <div 
                    className="w-full py-4 px-6 rounded-xl text-center font-medium"
                    style={{ 
                      backgroundColor: '#FEE2E2', 
                      color: '#DC2626',
                      boxShadow: 'inset 4px 4px 8px #bec8d7, inset -4px -4px 8px #ffffff'
                    }}
                  >
                    Evento Completo
                  </div>
                )}

                {!currentEvent.registrationOpen && (
                  <div 
                    className="w-full py-4 px-6 rounded-xl text-center font-medium"
                    style={{ 
                      backgroundColor: '#FEF3C7', 
                      color: '#92400E',
                      boxShadow: 'inset 4px 4px 8px #bec8d7, inset -4px -4px 8px #ffffff'
                    }}
                  >
                    Inscripciones Cerradas
                  </div>
                )}
              </div>

              {/* Contact Info */}
              {currentEvent.contactInfo && (
                <div 
                  className="rounded-3xl p-8"
                  style={{ 
                    backgroundColor: '#e8ecf4',
                    boxShadow: '15px 15px 30px #bec8d7, -15px -15px 30px #ffffff'
                  }}
                >
                  <h3 className="text-xl font-bold mb-6" style={{ color: '#374151' }}>
                    Contacto
                  </h3>
                  
                  <div className="space-y-4">
                    {currentEvent.contactInfo.email && (
                      <div className="flex items-center space-x-3">
                        <Mail className="w-5 h-5" style={{ color: '#6B7280' }} />
                        <a 
                          href={`mailto:${currentEvent.contactInfo.email}`}
                          className="hover:underline"
                          style={{ color: '#3B82F6' }}
                        >
                          {currentEvent.contactInfo.email}
                        </a>
                      </div>
                    )}

                    {currentEvent.contactInfo.phone && (
                      <div className="flex items-center space-x-3">
                        <Phone className="w-5 h-5" style={{ color: '#6B7280' }} />
                        <a 
                          href={`tel:${currentEvent.contactInfo.phone}`}
                          className="hover:underline"
                          style={{ color: '#3B82F6' }}
                        >
                          {currentEvent.contactInfo.phone}
                        </a>
                      </div>
                    )}

                    {currentEvent.contactInfo.website && (
                      <div className="flex items-center space-x-3">
                        <Globe className="w-5 h-5" style={{ color: '#6B7280' }} />
                        <a 
                          href={currentEvent.contactInfo.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                          style={{ color: '#3B82F6' }}
                        >
                          Sitio Web
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tags */}
              {currentEvent.tags && currentEvent.tags.length > 0 && (
                <div 
                  className="rounded-3xl p-8"
                  style={{ 
                    backgroundColor: '#e8ecf4',
                    boxShadow: '15px 15px 30px #bec8d7, -15px -15px 30px #ffffff'
                  }}
                >
                  <h3 className="text-xl font-bold mb-6" style={{ color: '#374151' }}>
                    Etiquetas
                  </h3>
                  
                  <div className="flex flex-wrap gap-2">
                    {currentEvent.tags.map((tag, index) => (
                      <span 
                        key={index}
                        className="px-3 py-1 rounded-full text-sm font-medium"
                        style={{ 
                          backgroundColor: '#F3F4F6',
                          color: '#374151',
                          boxShadow: 'inset 2px 2px 4px #bec8d7, inset -2px -2px 4px #ffffff'
                        }}
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
};