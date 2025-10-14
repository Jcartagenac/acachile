import React, { useEffect, useState } from 'react';
import { Search, Plus, Grid, List } from 'lucide-react';
import { EventCard } from './EventCard';
import { useEvents } from '../../contexts/EventContext';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';

type ViewMode = 'grid' | 'list';
type SortOption = 'date' | 'title' | 'participants';

export const EventList: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('published');
  const [sortBy, setSortBy] = useState<SortOption>('date');


  const {
    eventos,
    isLoading,
    error,
    pagination,
    fetchEventos,
    setFilters,
    clearError,
  } = useEvents();

  const { isAuthenticated } = useAuth();

  // Aplicar filtros cuando cambien
  useEffect(() => {
    const filters = {
      search: searchTerm,
      type: typeFilter,
      status: statusFilter,
    };
    setFilters(filters);
  }, [searchTerm, typeFilter, statusFilter, setFilters]);

  // Cargar eventos al montar el componente
  useEffect(() => {
    fetchEventos(1);
  }, [fetchEventos]);

  // Ordenar eventos
  const sortedEventos = React.useMemo(() => {
    const sorted = [...eventos];
    switch (sortBy) {
      case 'date':
        return sorted.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      case 'title':
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      case 'participants':
        return sorted.sort((a, b) => b.currentParticipants - a.currentParticipants);
      default:
        return sorted;
    }
  }, [eventos, sortBy]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchEventos(1);
  };

  const handleLoadMore = () => {
    if (pagination.page < pagination.pages) {
      fetchEventos(pagination.page + 1);
    }
  };

  if (error) {
    return (
      <div 
        className="rounded-2xl p-8 text-center"
        style={{ 
          backgroundColor: '#FEE2E2',
          color: '#DC2626',
          border: '1px solid #FECACA'
        }}
      >
        <h3 className="text-lg font-semibold mb-2">Error al cargar eventos</h3>
        <p className="mb-4">{error}</p>
        <button
          onClick={() => {
            clearError();
            fetchEventos(1);
          }}
          className="px-6 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: '#374151' }}>
            Eventos ACA Chile
          </h1>
          <p className="text-lg mt-2" style={{ color: '#6B7280' }}>
            Descubre y participa en nuestros eventos de asadores
          </p>
        </div>

        {isAuthenticated && (
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
        )}
      </div>

      {/* Search and Filters */}
      <div 
        className="rounded-3xl p-6"
        style={{ 
          backgroundColor: '#e8ecf4',
          boxShadow: '15px 15px 30px #bec8d7, -15px -15px 30px #ffffff'
        }}
      >
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="relative">
            <div 
              className="flex items-center px-4 py-3 rounded-xl"
              style={{ 
                backgroundColor: '#e8ecf4',
                boxShadow: 'inset 6px 6px 12px #bec8d7, inset -6px -6px 12px #ffffff'
              }}
            >
              <Search className="w-5 h-5 mr-3" style={{ color: '#6B7280' }} />
              <input
                type="text"
                placeholder="Buscar eventos por nombre, ubicación..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 bg-transparent outline-none"
                style={{ color: '#374151' }}
              />
              <button
                type="submit"
                className="ml-3 px-4 py-2 rounded-lg text-white font-medium transition-all duration-300"
                style={{ 
                  background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'
                }}
              >
                Buscar
              </button>
            </div>
          </div>
        </form>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-wrap gap-4">
            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 rounded-xl border-none outline-none"
              style={{ 
                backgroundColor: '#e8ecf4',
                boxShadow: 'inset 4px 4px 8px #bec8d7, inset -4px -4px 8px #ffffff',
                color: '#374151'
              }}
            >
              <option value="">Todos los tipos</option>
              <option value="campeonato">Campeonatos</option>
              <option value="taller">Talleres</option>
              <option value="encuentro">Encuentros</option>
              <option value="torneo">Torneos</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 rounded-xl border-none outline-none"
              style={{ 
                backgroundColor: '#e8ecf4',
                boxShadow: 'inset 4px 4px 8px #bec8d7, inset -4px -4px 8px #ffffff',
                color: '#374151'
              }}
            >
              <option value="">Todos los estados</option>
              <option value="published">Publicados</option>
              <option value="draft">Borradores</option>
              <option value="completed">Completados</option>
              <option value="cancelled">Cancelados</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-4 py-2 rounded-xl border-none outline-none"
              style={{ 
                backgroundColor: '#e8ecf4',
                boxShadow: 'inset 4px 4px 8px #bec8d7, inset -4px -4px 8px #ffffff',
                color: '#374151'
              }}
            >
              <option value="date">Ordenar por fecha</option>
              <option value="title">Ordenar por título</option>
              <option value="participants">Ordenar por participantes</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div 
            className="flex rounded-xl overflow-hidden"
            style={{ 
              backgroundColor: '#e8ecf4',
              boxShadow: 'inset 4px 4px 8px #bec8d7, inset -4px -4px 8px #ffffff'
            }}
          >
            <button
              onClick={() => setViewMode('grid')}
              className={`p-3 transition-all duration-300 ${
                viewMode === 'grid' 
                  ? 'bg-white shadow-neuro-outset' 
                  : 'hover:bg-white/50'
              }`}
              style={{ color: '#374151' }}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-3 transition-all duration-300 ${
                viewMode === 'list' 
                  ? 'bg-white shadow-neuro-outset' 
                  : 'hover:bg-white/50'
              }`}
              style={{ color: '#374151' }}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Results Count */}
        <div className="mt-4 text-sm" style={{ color: '#6B7280' }}>
          {pagination.total > 0 ? (
            <>Mostrando {eventos.length} de {pagination.total} eventos</>
          ) : (
            'No se encontraron eventos'
          )}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && eventos.length === 0 && (
        <div className="flex justify-center py-12">
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
      )}

      {/* Events Grid/List */}
      {sortedEventos.length > 0 && (
        <div className={`${
          viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8' 
            : 'space-y-6'
        }`}>
          {sortedEventos.map((evento) => (
            <EventCard
              key={evento.id}
              evento={evento}
              variant={viewMode === 'list' ? 'compact' : 'default'}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && sortedEventos.length === 0 && (
        <div 
          className="text-center py-16 rounded-3xl"
          style={{ 
            backgroundColor: '#e8ecf4',
            boxShadow: '15px 15px 30px #bec8d7, -15px -15px 30px #ffffff'
          }}
        >
          <div className="text-6xl mb-4">🎯</div>
          <h3 className="text-xl font-semibold mb-2" style={{ color: '#374151' }}>
            No se encontraron eventos
          </h3>
          <p className="mb-6" style={{ color: '#6B7280' }}>
            Intenta cambiar los filtros o crear un nuevo evento
          </p>
          
          {isAuthenticated && (
            <Link
              to="/eventos/nuevo"
              className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl text-white font-medium transition-all duration-300 hover:scale-105"
              style={{ 
                background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)'
              }}
            >
              <Plus className="w-5 h-5" />
              <span>Crear Primer Evento</span>
            </Link>
          )}
        </div>
      )}

      {/* Load More Button */}
      {pagination.page < pagination.pages && (
        <div className="text-center">
          <button
            onClick={handleLoadMore}
            disabled={isLoading}
            className="px-8 py-4 rounded-xl font-medium transition-all duration-300 hover:scale-105 disabled:opacity-50"
            style={{ 
              color: '#374151',
              boxShadow: '10px 10px 20px #bec8d7, -10px -10px 20px #ffffff'
            }}
          >
            {isLoading ? 'Cargando...' : 'Cargar más eventos'}
          </button>
        </div>
      )}
    </div>
  );
};