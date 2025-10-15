import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Tag, 
  Clock,
  ChevronRight,
  Star
} from 'lucide-react';
import { Evento } from '@shared/index';
import { useEvents } from '../../contexts/EventContext';
import { useAuth } from '../../contexts/AuthContext';

interface EventCardProps {
  evento: Evento;
  showActions?: boolean;
  variant?: 'default' | 'featured' | 'compact';
}

export const EventCard: React.FC<EventCardProps> = ({ 
  evento, 
  showActions = true,
  variant = 'default' 
}) => {
  const { isUserInscribed, inscribirseEvento } = useEvents();
  const { isAuthenticated, user } = useAuth();

  const isInscribed = isUserInscribed(evento.id);
  const isOwner = user?.id === evento.organizerId;
  const isFull = evento.maxParticipants && evento.currentParticipants >= evento.maxParticipants;
  const canRegister = evento.registrationOpen && !isInscribed && !isFull && evento.status === 'published';

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'campeonato':
        return '#EF4444'; // Red
      case 'taller':
        return '#3B82F6'; // Blue
      case 'encuentro':
        return '#10B981'; // Green
      case 'torneo':
        return '#F59E0B'; // Amber
      default:
        return '#6B7280'; // Gray
    }
  };

  const getStatusBadge = () => {
    switch (evento.status) {
      case 'draft':
        return (
          <span className="px-2 py-1 text-xs rounded-lg" style={{ 
            backgroundColor: '#FEF3C7', 
            color: '#92400E' 
          }}>
            Borrador
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2 py-1 text-xs rounded-lg" style={{ 
            backgroundColor: '#FEE2E2', 
            color: '#DC2626' 
          }}>
            Cancelado
          </span>
        );
      case 'completed':
        return (
          <span className="px-2 py-1 text-xs rounded-lg" style={{ 
            backgroundColor: '#D1FAE5', 
            color: '#065F46' 
          }}>
            Completado
          </span>
        );
      default:
        return null;
    }
  };

  const handleInscripcion = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      // TODO: Abrir modal de login
      return;
    }

    try {
      await inscribirseEvento(evento.id);
    } catch (error) {
      console.error('Error al inscribirse:', error);
    }
  };

  if (variant === 'compact') {
    return (
      <Link
        to={`/eventos/${evento.id}`}
        className="block p-4 rounded-2xl transition-all duration-300 hover:scale-105"
        style={{ 
          backgroundColor: '#e8ecf4',
          boxShadow: '8px 8px 16px #bec8d7, -8px -8px 16px #ffffff'
        }}
      >
        <div className="flex items-center space-x-4">
          <img
            src={evento.image}
            alt={evento.title}
            className="w-16 h-16 object-cover rounded-xl"
            style={{ boxShadow: 'inset 2px 2px 4px #bec8d7, inset -2px -2px 4px #ffffff' }}
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate" style={{ color: '#374151' }}>
              {evento.title}
            </h3>
            <div className="flex items-center text-sm mt-1" style={{ color: '#6B7280' }}>
              <Calendar className="w-4 h-4 mr-1" />
              {formatDate(evento.date)}
            </div>
          </div>
          <ChevronRight className="w-5 h-5" style={{ color: '#9CA3AF' }} />
        </div>
      </Link>
    );
  }

  if (variant === 'featured') {
    return (
      <div 
        className="rounded-3xl p-8 transition-all duration-300 hover:scale-105 relative overflow-hidden"
        style={{ 
          backgroundColor: '#e8ecf4',
          boxShadow: '20px 20px 40px #bec8d7, -20px -20px 40px #ffffff'
        }}
      >
        {/* Featured Badge */}
        <div className="absolute top-4 right-4 flex items-center space-x-1 px-3 py-1 rounded-full"
             style={{ backgroundColor: '#FEF3C7', color: '#92400E' }}>
          <Star className="w-4 h-4" />
          <span className="text-xs font-semibold">Destacado</span>
        </div>

        {/* Image */}
        <div className="relative overflow-hidden rounded-2xl mb-6">
          <img
            src={evento.image}
            alt={evento.title}
            className="w-full h-48 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
          
          {/* Type Badge */}
          <div className="absolute top-4 left-4">
            <span 
              className="px-3 py-1 rounded-full text-sm font-medium text-white"
              style={{ backgroundColor: getEventTypeColor(evento.type) }}
            >
              {evento.type?.charAt(0)?.toUpperCase() + evento.type?.slice(1) || 'Evento'}
            </span>
          </div>

          {/* Status Badge */}
          {getStatusBadge() && (
            <div className="absolute top-4 right-4">
              {getStatusBadge()}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="space-y-4">
          <Link to={`/eventos/${evento.id}`}>
            <h3 className="text-xl font-bold hover:underline" style={{ color: '#374151' }}>
              {evento.title}
            </h3>
          </Link>

          <p className="text-sm leading-relaxed line-clamp-2" style={{ color: '#4B5563' }}>
            {evento.description}
          </p>

          <div className="grid grid-cols-2 gap-4 text-sm" style={{ color: '#6B7280' }}>
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(evento.date)}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4" />
              <span className="truncate">{evento.location}</span>
            </div>

            {evento.time && (
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>{evento.time}</span>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>
                {evento.currentParticipants}
                {evento.maxParticipants && `/${evento.maxParticipants}`}
              </span>
            </div>
          </div>

          {/* Actions */}
          {showActions && isAuthenticated && (
            <div className="flex space-x-3 pt-4">
              {canRegister && (
                <button
                  onClick={handleInscripcion}
                  className="flex-1 py-3 rounded-xl text-white font-medium transition-all duration-300 hover:scale-105"
                  style={{ 
                    background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                    boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)'
                  }}
                >
                  Inscribirse
                </button>
              )}

              {isInscribed && (
                <span className="flex-1 py-3 px-4 rounded-xl text-center font-medium"
                      style={{ 
                        backgroundColor: '#D1FAE5', 
                        color: '#065F46',
                        boxShadow: 'inset 4px 4px 8px #bec8d7, inset -4px -4px 8px #ffffff'
                      }}>
                  Inscrito ✓
                </span>
              )}

              <Link
                to={`/eventos/${evento.id}`}
                className="px-6 py-3 rounded-xl font-medium transition-all duration-300"
                style={{ 
                  color: '#374151',
                  boxShadow: 'inset 5px 5px 10px #bec8d7, inset -5px -5px 10px #ffffff'
                }}
              >
                Ver Detalles
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div 
      className="rounded-3xl p-6 transition-all duration-300 hover:scale-105"
      style={{ 
        backgroundColor: '#e8ecf4',
        boxShadow: '15px 15px 30px #bec8d7, -15px -15px 30px #ffffff'
      }}
    >
      {/* Image */}
      <div className="relative overflow-hidden rounded-2xl mb-6">
        <img
          src={evento.image}
          alt={evento.title}
          className="w-full h-48 object-cover"
        />
        
        {/* Type Badge */}
        <div className="absolute top-4 left-4">
          <span 
            className="px-3 py-1 rounded-full text-sm font-medium text-white flex items-center space-x-1"
            style={{ backgroundColor: getEventTypeColor(evento.type) }}
          >
            <Tag className="w-3 h-3" />
            <span>{evento.type?.charAt(0)?.toUpperCase() + evento.type?.slice(1) || 'Evento'}</span>
          </span>
        </div>

        {/* Status Badge */}
        {getStatusBadge() && (
          <div className="absolute top-4 right-4">
            {getStatusBadge()}
          </div>
        )}

        {/* Owner Badge */}
        {isOwner && (
          <div className="absolute bottom-4 right-4">
            <span className="px-2 py-1 rounded-lg text-xs font-medium"
                  style={{ backgroundColor: 'rgba(59, 130, 246, 0.9)', color: 'white' }}>
              Mi evento
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="space-y-4">
        <Link to={`/eventos/${evento.id}`}>
          <h3 className="text-xl font-bold hover:underline" style={{ color: '#374151' }}>
            {evento.title}
          </h3>
        </Link>

        <p className="text-sm leading-relaxed line-clamp-3" style={{ color: '#4B5563' }}>
          {evento.description}
        </p>

        {/* Event Meta */}
        <div className="space-y-2 text-sm" style={{ color: '#6B7280' }}>
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(evento.date)}</span>
            {evento.time && (
              <>
                <span>•</span>
                <Clock className="w-4 h-4" />
                <span>{evento.time}</span>
              </>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4" />
            <span className="truncate">{evento.location}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>
                {evento.currentParticipants}
                {evento.maxParticipants && `/${evento.maxParticipants}`} participantes
              </span>
            </div>

            {evento.price && evento.price > 0 && (
              <span className="font-semibold" style={{ color: '#059669' }}>
                ${evento.price.toLocaleString('es-CL')}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex space-x-3 pt-2">
            {isAuthenticated ? (
              <>
                {canRegister && (
                  <button
                    onClick={handleInscripcion}
                    className="flex-1 py-3 rounded-xl text-white font-medium transition-all duration-300 hover:scale-105"
                    style={{ 
                      background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                      boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)'
                    }}
                  >
                    Inscribirse
                  </button>
                )}

                {isInscribed && (
                  <span className="flex-1 py-3 px-4 rounded-xl text-center font-medium"
                        style={{ 
                          backgroundColor: '#D1FAE5', 
                          color: '#065F46',
                          boxShadow: 'inset 4px 4px 8px #bec8d7, inset -4px -4px 8px #ffffff'
                        }}>
                    Inscrito ✓
                  </span>
                )}

                {isFull && !isInscribed && (
                  <span className="flex-1 py-3 px-4 rounded-xl text-center font-medium"
                        style={{ 
                          backgroundColor: '#FEE2E2', 
                          color: '#DC2626',
                          boxShadow: 'inset 4px 4px 8px #bec8d7, inset -4px -4px 8px #ffffff'
                        }}>
                    Completo
                  </span>
                )}
              </>
            ) : (
              <button
                onClick={() => {
                  // TODO: Abrir modal de login
                }}
                className="flex-1 py-3 rounded-xl text-white font-medium transition-all duration-300 hover:scale-105"
                style={{ 
                  background: 'linear-gradient(135deg, #6B7280 0%, #4B5563 100%)',
                  boxShadow: '0 4px 15px rgba(107, 114, 128, 0.3)'
                }}
              >
                Inicia sesión para inscribirte
              </button>
            )}

            <Link
              to={`/eventos/${evento.id}`}
              className="px-6 py-3 rounded-xl font-medium transition-all duration-300 hover:scale-105"
              style={{ 
                color: '#374151',
                boxShadow: 'inset 5px 5px 10px #bec8d7, inset -5px -5px 10px #ffffff'
              }}
            >
              Ver Más
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};