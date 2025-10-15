import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container } from '../components/layout/Container';
import { useEvents } from '../contexts/EventContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  Calendar, 
  MapPin, 
  Users, 
  DollarSign,
  Edit,
  Trash2,
  Eye,
  Plus
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const MyEventsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { eventos, fetchEventos, deleteEvento, isLoading, canUserEditEvent } = useEvents();

  // Redireccionar si no hay usuario logueado
  React.useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user) {
      fetchEventos();
    }
  }, [user, fetchEventos]);

  // Filtrar eventos del usuario
  const myEvents = eventos.filter(evento => canUserEditEvent(evento));

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CL', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'campeonato': return '#EF4444';
      case 'taller': return '#3B82F6';
      case 'encuentro': return '#10B981';
      case 'torneo': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const handleDeleteEvent = async (eventId: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este evento?')) {
      try {
        await deleteEvento(eventId);
      } catch (error) {
        console.error('Error al eliminar evento:', error);
      }
    }
  };

  if (!user) {
    return null;
  }

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

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#e8ecf4' }}>
      <Container>
        <div className="py-8">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold" style={{ color: '#374151' }}>
                Mis Eventos
              </h1>
              <p className="text-lg mt-2" style={{ color: '#6B7280' }}>
                Gestiona los eventos que has creado
              </p>
            </div>

            <Link
              to="/eventos/crear"
              className="flex items-center space-x-2 px-6 py-3 rounded-xl text-white font-medium transition-all duration-300 hover:scale-105"
              style={{ 
                background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)'
              }}
            >
              <Plus className="w-5 h-5" />
              <span>Crear Evento</span>
            </Link>
          </div>

          {/* Eventos */}
          {myEvents.length === 0 ? (
            <div 
              className="rounded-3xl p-12 text-center"
              style={{ 
                backgroundColor: '#e8ecf4',
                boxShadow: '20px 20px 40px #bec8d7, -20px -20px 40px #ffffff'
              }}
            >
              <div 
                className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center"
                style={{ 
                  backgroundColor: '#e8ecf4',
                  boxShadow: 'inset 8px 8px 16px #bec8d7, inset -8px -8px 16px #ffffff'
                }}
              >
                <Calendar className="w-8 h-8" style={{ color: '#9CA3AF' }} />
              </div>
              
              <h3 className="text-xl font-semibold mb-4" style={{ color: '#374151' }}>
                No has creado eventos aún
              </h3>
              <p className="text-base mb-6" style={{ color: '#6B7280' }}>
                ¡Comparte tu pasión por el asado creando tu primer evento!
              </p>
              
              <Link
                to="/eventos/crear"
                className="inline-flex items-center space-x-2 px-8 py-4 rounded-xl text-white font-medium transition-all duration-300 hover:scale-105"
                style={{ 
                  background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                  boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)'
                }}
              >
                <Plus className="w-5 h-5" />
                <span>Crear Mi Primer Evento</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myEvents.map((evento) => (
                <div
                  key={evento.id}
                  className="rounded-3xl overflow-hidden transition-all duration-300 hover:scale-105"
                  style={{ 
                    backgroundColor: '#e8ecf4',
                    boxShadow: '15px 15px 30px #bec8d7, -15px -15px 30px #ffffff'
                  }}
                >
                  {/* Imagen */}
                  <div className="relative">
                    <img
                      src={evento.image}
                      alt={evento.title}
                      className="w-full h-48 object-cover"
                    />
                    
                    {/* Badge de tipo */}
                    <div className="absolute top-4 left-4">
                      <span 
                        className="px-3 py-1 rounded-full text-white text-sm font-medium"
                        style={{ backgroundColor: getEventTypeColor(evento.type) }}
                      >
                        {evento.type?.charAt(0)?.toUpperCase() + evento.type?.slice(1) || 'Evento'}
                      </span>
                    </div>

                    {/* Estado */}
                    <div className="absolute top-4 right-4">
                      <span 
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          evento.status === 'published' 
                            ? 'bg-green-100 text-green-800'
                            : evento.status === 'draft'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {evento.status === 'published' ? 'Publicado' : 
                         evento.status === 'draft' ? 'Borrador' : 'Cancelado'}
                      </span>
                    </div>
                  </div>

                  {/* Contenido */}
                  <div className="p-6">
                    <h3 className="text-lg font-bold mb-3 line-clamp-2" style={{ color: '#374151' }}>
                      {evento.title}
                    </h3>

                    <div className="space-y-2 text-sm mb-4" style={{ color: '#6B7280' }}>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(evento.date)}</span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4" />
                        <span className="truncate">{evento.location}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Users className="w-4 h-4" />
                          <span>
                            {evento.currentParticipants}/{evento.maxParticipants || '∞'} participantes
                          </span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <DollarSign className="w-4 h-4" />
                          <span>
                            {evento.price === 0 ? 'Gratuito' : `$${evento.price?.toLocaleString('es-CL')}`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: '#D1D5DB' }}>
                      <Link
                        to={`/eventos/${evento.id}`}
                        className="flex items-center space-x-1 px-4 py-2 rounded-xl transition-all duration-300"
                        style={{ 
                          backgroundColor: '#e8ecf4',
                          boxShadow: '6px 6px 12px #bec8d7, -6px -6px 12px #ffffff',
                          color: '#6B7280'
                        }}
                      >
                        <Eye className="w-4 h-4" />
                        <span>Ver</span>
                      </Link>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => navigate(`/eventos/editar/${evento.id}`)}
                          className="flex items-center space-x-1 px-4 py-2 rounded-xl transition-all duration-300 hover:scale-105"
                          style={{ 
                            backgroundColor: '#DBEAFE',
                            color: '#2563EB',
                            border: '1px solid #BFDBFE'
                          }}
                        >
                          <Edit className="w-4 h-4" />
                          <span>Editar</span>
                        </button>

                        <button
                          onClick={() => handleDeleteEvent(evento.id)}
                          className="flex items-center space-x-1 px-4 py-2 rounded-xl transition-all duration-300 hover:scale-105"
                          style={{ 
                            backgroundColor: '#FEE2E2',
                            color: '#DC2626',
                            border: '1px solid #FECACA'
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Eliminar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Container>
    </div>
  );
};