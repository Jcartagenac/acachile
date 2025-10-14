/**
 * Página de resultados de búsqueda
 * ACA Chile Frontend
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { searchService, AdvancedSearchFilters, SearchResult } from '../services/searchService';
import { 
  Search,
  Filter,
  Calendar,
  MapPin,
  Clock,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const SearchResultsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // Paginación
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  // Filtros de búsqueda
  const [filters, setFilters] = useState<AdvancedSearchFilters>({
    query: searchParams.get('q') || '',
    tipo: (searchParams.get('tipo') as 'eventos' | 'noticias') || undefined,
    fechaDesde: searchParams.get('fechaDesde') || '',
    fechaHasta: searchParams.get('fechaHasta') || '',
    categoria: searchParams.get('categoria') || '',
    ubicacion: searchParams.get('ubicacion') || '',
    estado: searchParams.get('estado') || '',
    ordenarPor: (searchParams.get('ordenarPor') as 'fecha' | 'relevancia' | 'titulo') || 'relevancia',
    orden: (searchParams.get('orden') as 'asc' | 'desc') || 'desc',
    page: parseInt(searchParams.get('page') || '1'),
    limit: parseInt(searchParams.get('limit') || '20')
  });

  // Cargar resultados cuando cambien los parámetros
  useEffect(() => {
    if (filters.query) {
      performSearch();
    }
  }, [filters]);

  const performSearch = async () => {
    if (!filters.query?.trim()) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await searchService.advancedSearch(filters);
      
      if (response.success && response.data) {
        setResults(response.data.results);
        setPagination(response.data.pagination);
      } else {
        setError(response.error || 'Error en la búsqueda');
      }
    } catch (err) {
      setError('Error realizando la búsqueda');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateSearchParams = (newFilters: AdvancedSearchFilters) => {
    const params = new URLSearchParams();
    
    if (newFilters.query) params.set('q', newFilters.query);
    if (newFilters.tipo) params.set('tipo', newFilters.tipo);
    if (newFilters.fechaDesde) params.set('fechaDesde', newFilters.fechaDesde);
    if (newFilters.fechaHasta) params.set('fechaHasta', newFilters.fechaHasta);
    if (newFilters.categoria) params.set('categoria', newFilters.categoria);
    if (newFilters.ubicacion) params.set('ubicacion', newFilters.ubicacion);
    if (newFilters.estado) params.set('estado', newFilters.estado);
    if (newFilters.ordenarPor) params.set('ordenarPor', newFilters.ordenarPor);
    if (newFilters.orden) params.set('orden', newFilters.orden);
    if (newFilters.page && newFilters.page > 1) params.set('page', newFilters.page.toString());
    if (newFilters.limit && newFilters.limit !== 20) params.set('limit', newFilters.limit.toString());
    
    setSearchParams(params);
  };

  const handleFilterChange = (key: keyof AdvancedSearchFilters, value: any) => {
    const newFilters = { ...filters, [key]: value, page: 1 };
    setFilters(newFilters);
    updateSearchParams(newFilters);
  };

  const handlePageChange = (page: number) => {
    const newFilters = { ...filters, page };
    setFilters(newFilters);
    updateSearchParams(newFilters);
  };

  const clearFilters = () => {
    const newFilters: AdvancedSearchFilters = {
      query: filters.query,
      ordenarPor: 'relevancia',
      orden: 'desc',
      page: 1,
      limit: 20
    };
    setFilters(newFilters);
    updateSearchParams(newFilters);
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'evento':
        return <Calendar className="h-5 w-5 text-red-600" />;
      case 'noticia':
        return <Clock className="h-5 w-5 text-blue-600" />;
      default:
        return <Search className="h-5 w-5 text-gray-600" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header con búsqueda */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">
              Resultados de búsqueda
            </h1>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <Filter className="h-4 w-4" />
              <span>Filtros</span>
            </button>
          </div>

          {/* Barra de búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={filters.query}
              onChange={(e) => handleFilterChange('query', e.target.value)}
              placeholder="Buscar eventos, noticias, usuarios..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>

          {/* Información de resultados */}
          {!loading && results.length > 0 && (
            <div className="mt-4 text-sm text-gray-600">
              Mostrando {((pagination.page - 1) * pagination.limit) + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} resultados para "<strong>{filters.query}</strong>"
            </div>
          )}
        </div>

        {/* Panel de filtros */}
        {showFilters && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Filtros de búsqueda</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {/* Tipo */}
              <select
                value={filters.tipo || ''}
                onChange={(e) => handleFilterChange('tipo', e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="">Todos los tipos</option>
                <option value="eventos">Eventos</option>
                <option value="noticias">Noticias</option>
              </select>

              {/* Fecha desde */}
              <input
                type="date"
                value={filters.fechaDesde || ''}
                onChange={(e) => handleFilterChange('fechaDesde', e.target.value)}
                placeholder="Fecha desde"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />

              {/* Fecha hasta */}
              <input
                type="date"
                value={filters.fechaHasta || ''}
                onChange={(e) => handleFilterChange('fechaHasta', e.target.value)}
                placeholder="Fecha hasta"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />

              {/* Ubicación */}
              <input
                type="text"
                value={filters.ubicacion || ''}
                onChange={(e) => handleFilterChange('ubicacion', e.target.value)}
                placeholder="Ubicación"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {/* Categoría */}
              <input
                type="text"
                value={filters.categoria || ''}
                onChange={(e) => handleFilterChange('categoria', e.target.value)}
                placeholder="Categoría"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />

              {/* Ordenar por */}
              <select
                value={filters.ordenarPor || 'relevancia'}
                onChange={(e) => handleFilterChange('ordenarPor', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="relevancia">Relevancia</option>
                <option value="fecha">Fecha</option>
                <option value="titulo">Título</option>
              </select>

              {/* Orden */}
              <select
                value={filters.orden || 'desc'}
                onChange={(e) => handleFilterChange('orden', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="desc">Descendente</option>
                <option value="asc">Ascendente</option>
              </select>
            </div>

            <div className="flex justify-end">
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 underline"
              >
                Limpiar filtros
              </button>
            </div>
          </div>
        )}

        {/* Estado de carga */}
        {loading && (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Buscando...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="text-red-600 text-center">
              <p className="font-semibold">Error en la búsqueda</p>
              <p className="mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Resultados */}
        {!loading && !error && (
          <>
            {results.length > 0 ? (
              <div className="space-y-4 mb-6">
                {results.map((result, index) => (
                  <div key={`${result.type}-${result.id}-${index}`} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          {getResultIcon(result.type)}
                          <span className="text-sm font-medium text-gray-600 capitalize">
                            {result.type}
                          </span>
                          <span className="text-sm text-gray-400">•</span>
                          <span className="text-sm text-gray-500">
                            {formatDate(result.date)}
                          </span>
                        </div>

                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          <Link 
                            to={result.url}
                            className="hover:text-red-600 transition-colors"
                          >
                            {result.title}
                          </Link>
                        </h3>

                        <p className="text-gray-600 line-clamp-3">
                          {result.description}
                        </p>

                        <div className="mt-3 flex items-center text-sm text-gray-500">
                          <MapPin className="h-4 w-4 mr-1" />
                          <span className="mr-4">Ver detalles</span>
                          <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                            Relevancia: {Math.round(result.relevance * 100)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filters.query && (
              <div className="bg-white rounded-lg shadow-md p-8 text-center">
                <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No se encontraron resultados
                </h3>
                <p className="text-gray-600 mb-4">
                  No pudimos encontrar resultados para "{filters.query}".
                </p>
                <div className="text-sm text-gray-500">
                  <p>Sugerencias:</p>
                  <ul className="mt-2 space-y-1">
                    <li>• Verifica la ortografía</li>
                    <li>• Usa términos más generales</li>
                    <li>• Prueba con sinónimos</li>
                    <li>• Reduce los filtros aplicados</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Paginación */}
            {pagination.pages > 1 && (
              <div className="bg-white rounded-lg shadow-md p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Página {pagination.page} de {pagination.pages}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page <= 1}
                      className="flex items-center px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Anterior
                    </button>

                    {/* Números de página */}
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                        const page = Math.max(1, pagination.page - 2) + i;
                        if (page > pagination.pages) return null;
                        
                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`px-3 py-2 text-sm rounded-lg ${
                              page === pagination.page
                                ? 'bg-red-600 text-white'
                                : 'border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page >= pagination.pages}
                      className="flex items-center px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Siguiente
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SearchResultsPage;