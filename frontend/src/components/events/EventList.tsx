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
      <div className="bg-red-50/80 backdrop-blur-soft border border-red-200/50 rounded-2xl p-8 text-center shadow-soft-lg">
        <h3 className="text-lg font-semibold mb-2 text-red-700">Error al cargar eventos</h3>
        <p className="mb-4 text-red-600">{error}</p>
        <button
          onClick={() => {
            clearError();
            fetchEventos(1);
          }}
          className="px-6 py-2 rounded-xl bg-gradient-to-r from-red-600 to-red-500 text-white shadow-soft-sm hover:shadow-soft-md transition-all duration-300 hover:scale-105"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
            Eventos ACA Chile
          </h1>
          <p className="text-lg text-neutral-600">
            Descubre y participa en nuestros eventos de asadores
          </p>
        </div>

        {isAuthenticated && (
          <Link
            to="/eventos/crear"
            className="flex items-center space-x-2 px-6 py-3 rounded-xl text-white font-medium bg-gradient-to-r from-primary-600 to-primary-500 shadow-soft-lg hover:shadow-soft-xl transition-all duration-300 hover:scale-105 group"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
            <span>Crear Evento</span>
          </Link>
        )}
      </div>

      {/* Search and Filters */}
      <div className="bg-white/60 backdrop-blur-soft border border-white/30 rounded-2xl p-6 shadow-soft-lg">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="relative">
            <div className="flex items-center bg-white/70 backdrop-blur-medium border border-white/40 rounded-xl px-4 py-3 shadow-soft-xs hover:shadow-soft-sm transition-shadow duration-300">
              <Search className="w-5 h-5 mr-3 text-neutral-500" />
              <input
                type="text"
                placeholder="Buscar eventos por nombre, ubicación..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 bg-transparent outline-none text-neutral-700 placeholder-neutral-500"
              />
              <button
                type="submit"
                className="ml-3 px-4 py-2 rounded-lg text-white font-medium bg-gradient-to-r from-primary-600 to-primary-500 shadow-soft-sm hover:shadow-soft-md transition-all duration-300 hover:scale-105"
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
              className="px-4 py-2 rounded-xl bg-white/50 backdrop-blur-medium border border-white/30 outline-none text-neutral-700 shadow-soft-xs hover:shadow-soft-sm transition-shadow duration-300"
            >
              <option value="">Todos los tipos</option>
              <option value="campeonato">Campeonatos</option>
              <option value="taller">Talleres</option>
              <option value="encuentro">Encuentros</option>
              <option value="competencia">Competencias</option>
              <option value="masterclass">Masterclass</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 rounded-xl bg-white/50 backdrop-blur-medium border border-white/30 outline-none text-neutral-700 shadow-soft-xs hover:shadow-soft-sm transition-shadow duration-300"
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
              className="px-4 py-2 rounded-xl bg-white/50 backdrop-blur-medium border border-white/30 outline-none text-neutral-700 shadow-soft-xs hover:shadow-soft-sm transition-shadow duration-300"
            >
              <option value="date">Ordenar por fecha</option>
              <option value="title">Ordenar por título</option>
              <option value="participants">Ordenar por participantes</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex bg-white/40 backdrop-blur-medium border border-white/30 rounded-xl overflow-hidden shadow-soft-xs">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-3 transition-all duration-300 ${
                viewMode === 'grid' 
                  ? 'bg-white/80 shadow-soft-sm text-primary-600' 
                  : 'hover:bg-white/60 text-neutral-600'
              }`}
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-3 transition-all duration-300 ${
                viewMode === 'list' 
                  ? 'bg-white/80 shadow-soft-sm text-primary-600' 
                  : 'hover:bg-white/60 text-neutral-600'
              }`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Results Count */}
        <div className="mt-4 text-sm text-neutral-600">
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
          <div className="w-16 h-16 rounded-full bg-white/60 backdrop-blur-soft border border-white/30 shadow-soft-lg flex items-center justify-center">
            <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
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
        <div className="text-center py-16 bg-white/60 backdrop-blur-soft border border-white/30 rounded-2xl shadow-soft-lg">
          <div className="text-6xl mb-4">🎯</div>
          <h3 className="text-xl font-semibold mb-2 text-neutral-700">
            No se encontraron eventos
          </h3>
          <p className="mb-6 text-neutral-600">
            Intenta cambiar los filtros o crear un nuevo evento
          </p>
          
          {isAuthenticated && (
            <Link
              to="/eventos/nuevo"
              className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl text-white font-medium bg-gradient-to-r from-primary-600 to-primary-500 shadow-soft-lg hover:shadow-soft-xl transition-all duration-300 hover:scale-105 group"
            >
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
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
            className="px-8 py-4 rounded-xl font-medium bg-white/60 backdrop-blur-soft border border-white/30 text-neutral-700 shadow-soft-lg hover:shadow-soft-xl transition-all duration-300 hover:scale-105 disabled:opacity-50"
          >
            {isLoading ? 'Cargando...' : 'Cargar más eventos'}
          </button>
        </div>
      )}
    </div>
  );
};