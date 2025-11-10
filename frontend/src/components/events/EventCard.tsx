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
          <span className="px-2 py-1 text-xs rounded-lg bg-yellow-50/90 backdrop-blur-medium border border-yellow-200/50 text-yellow-700 shadow-soft-xs">
            Borrador
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2 py-1 text-xs rounded-lg bg-red-50/90 backdrop-blur-medium border border-red-200/50 text-red-700 shadow-soft-xs">
            Cancelado
          </span>
        );
      case 'completed':
        return (
          <span className="px-2 py-1 text-xs rounded-lg bg-green-50/90 backdrop-blur-medium border border-green-200/50 text-green-700 shadow-soft-xs">
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
      // Si el evento es público, redirigir a la página de detalle donde está el formulario público
      if (evento.isPublic) {
        window.location.href = `/eventos/${evento.id}`;
        return;
      }
      // Si el evento no es público, redirigir al login
      window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
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
        className="block p-4 bg-white/60 backdrop-blur-soft border border-white/30 rounded-2xl shadow-soft-sm hover:shadow-soft-md transition-all duration-300 hover:scale-105 group"
      >
        <div className="flex items-center space-x-4">
          <img
            src={evento.image}
            alt={evento.title}
            className="w-16 h-16 object-cover rounded-xl shadow-soft-xs"
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate text-neutral-700 group-hover:text-primary-600 transition-colors">
              {evento.title}
            </h3>
            <div className="flex items-center text-sm mt-1 text-neutral-600">
              <Calendar className="w-4 h-4 mr-1" />
              {formatDate(evento.date)}
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-neutral-400 group-hover:text-primary-500 transition-colors" />
        </div>
      </Link>
    );
  }

  if (variant === 'featured') {
    return (
      <div className="bg-white/70 backdrop-blur-soft border border-white/40 rounded-2xl p-8 shadow-soft-lg hover:shadow-soft-xl transition-all duration-300 hover:scale-105 relative overflow-hidden group">
        {/* Featured Badge */}
        <div className="absolute top-4 right-4 flex items-center space-x-1 px-3 py-1 rounded-full bg-gradient-to-r from-pastel-yellow-200 to-pastel-yellow-300 text-pastel-yellow-800 shadow-soft-xs">
          <Star className="w-4 h-4" />
          <span className="text-xs font-semibold">Destacado</span>
        </div>
        {/* Image */}
        <div className="relative overflow-hidden rounded-xl mb-6 shadow-soft-sm">
          <img
            src={evento.image}
            alt={evento.title}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
          
          {/* Type Badge */}
          <div className="absolute top-4 left-4">
            <span 
              className="px-3 py-1 rounded-full text-sm font-medium text-white backdrop-blur-medium shadow-soft-xs"
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
            <h3 className="text-xl font-bold hover:text-primary-600 transition-colors text-neutral-700">
              {evento.title}
            </h3>
          </Link>

          <p className="text-sm leading-relaxed line-clamp-2 text-neutral-600">
            {evento.description}
          </p>

          <div className="grid grid-cols-2 gap-4 text-sm text-neutral-600">
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
          {showActions && (
            <div className="flex space-x-3 pt-4">
              {canRegister && (
                <button
                  onClick={handleInscripcion}
                  className="flex-1 py-3 rounded-xl text-white font-medium bg-gradient-to-r from-primary-600 to-primary-500 shadow-soft-lg hover:shadow-soft-xl transition-all duration-300 hover:scale-105"
                >
                  {!isAuthenticated && !evento.isPublic ? 'Inicia sesión para inscribirte' : 'Inscribirse'}
                </button>
              )}

              {isInscribed && isAuthenticated && (
                <span className="flex-1 py-3 px-4 rounded-xl text-center font-medium bg-green-50/80 backdrop-blur-medium border border-green-200/50 text-green-700 shadow-soft-xs">
                  Inscrito ✓
                </span>
              )}

              <Link
                to={`/eventos/${evento.id}`}
                className="px-6 py-3 rounded-xl font-medium bg-white/60 backdrop-blur-medium border border-white/30 text-neutral-700 shadow-soft-sm hover:shadow-soft-md transition-all duration-300 hover:scale-105"
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
    <div className="bg-white/60 backdrop-blur-soft border border-white/30 rounded-2xl p-6 shadow-soft-md hover:shadow-soft-lg transition-all duration-300 hover:scale-105 group">
      {/* Image */}
      <div className="relative overflow-hidden rounded-xl mb-6 shadow-soft-sm">
        <img
          src={evento.image}
          alt={evento.title}
          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Type Badge */}
        <div className="absolute top-4 left-4">
          <span 
            className="px-3 py-1 rounded-full text-sm font-medium text-white flex items-center space-x-1 backdrop-blur-medium shadow-soft-xs"
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
            <span className="px-2 py-1 rounded-lg text-xs font-medium bg-blue-500/90 backdrop-blur-medium text-white shadow-soft-xs">
              Mi evento
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="space-y-4">
        <Link to={`/eventos/${evento.id}`}>
          <h3 className="text-xl font-bold hover:text-primary-600 transition-colors text-neutral-700">
            {evento.title}
          </h3>
        </Link>

        <p className="text-sm leading-relaxed line-clamp-3 text-neutral-600">
          {evento.description}
        </p>

        {/* Event Meta */}
        <div className="space-y-2 text-sm text-neutral-600">
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
              <span className="font-semibold text-green-600">
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
                    className="flex-1 py-3 rounded-xl text-white font-medium bg-gradient-to-r from-primary-600 to-primary-500 shadow-soft-lg hover:shadow-soft-xl transition-all duration-300 hover:scale-105"
                  >
                    Inscribirse
                  </button>
                )}

                {isInscribed && (
                  <span className="flex-1 py-3 px-4 rounded-xl text-center font-medium bg-green-50/80 backdrop-blur-medium border border-green-200/50 text-green-700 shadow-soft-xs">
                    Inscrito ✓
                  </span>
                )}

                {isFull && !isInscribed && (
                  <span className="flex-1 py-3 px-4 rounded-xl text-center font-medium bg-red-50/80 backdrop-blur-medium border border-red-200/50 text-red-700 shadow-soft-xs">
                    Completo
                  </span>
                )}
              </>
            ) : (
              <>
                {canRegister && (
                  <button
                    onClick={handleInscripcion}
                    className="flex-1 py-3 rounded-xl text-white font-medium bg-gradient-to-r from-primary-600 to-primary-500 shadow-soft-lg hover:shadow-soft-xl transition-all duration-300 hover:scale-105"
                  >
                    {evento.isPublic ? 'Inscribirse' : 'Inicia sesión para inscribirte'}
                  </button>
                )}
              </>
            )}

            <Link
              to={`/eventos/${evento.id}`}
              className="px-6 py-3 rounded-xl font-medium bg-white/60 backdrop-blur-medium border border-white/30 text-neutral-700 shadow-soft-sm hover:shadow-soft-md transition-all duration-300 hover:scale-105"
            >
              Ver Más
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};