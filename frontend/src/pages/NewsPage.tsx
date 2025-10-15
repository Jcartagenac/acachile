/**
 * Página de Noticias/Blog
 * ACA Chile Frontend
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { newsService, NewsArticle, NewsCategory } from '../services/newsService';
import { searchService } from '../services/searchService';
import { Eye, Calendar, User, Search } from 'lucide-react';

const NewsPage: React.FC = () => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [categories, setCategories] = useState<NewsCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtros y paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFeaturedOnly, setShowFeaturedOnly] = useState(false);

  // Estado de búsqueda
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const articlesPerPage = 12;

  // Cargar noticias y categorías
  useEffect(() => {
    loadNews();
    loadCategories();
  }, [currentPage, selectedCategory, showFeaturedOnly]);

  // Búsqueda con debounce
  useEffect(() => {
    if (searchQuery.length >= 2) {
      const timeoutId = setTimeout(() => {
        getSuggestions();
      }, 300);
      return () => clearTimeout(timeoutId);
    } else {
      setSearchSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchQuery]);

  const loadNews = async () => {
    try {
      setLoading(true);
      const response = await newsService.getNews({
        page: currentPage,
        limit: articlesPerPage,
        category: selectedCategory || undefined,
        featured: showFeaturedOnly
      });

      if (response.success && response.data) {
        setArticles(response.data);
        setTotalPages(response.pagination.pages);
      } else {
        setError(response.error || 'Error cargando noticias');
      }
    } catch (err) {
      setError('Error cargando noticias');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await newsService.getCategories();
      if (response.success && response.data) {
        setCategories(response.data);
      }
    } catch (err) {
      console.error('Error cargando categorías:', err);
    }
  };

  const getSuggestions = async () => {
    try {
      const response = await searchService.getSuggestions(searchQuery);
      if (response.success && response.data) {
        setSearchSuggestions(response.data);
        setShowSuggestions(true);
      }
    } catch (err) {
      console.error('Error obteniendo sugerencias:', err);
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      // Redirigir a página de resultados de búsqueda
      window.location.href = `/busqueda?q=${encodeURIComponent(searchQuery)}&type=noticias`;
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    handleSearch();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const clearFilters = () => {
    setSelectedCategory('');
    setShowFeaturedOnly(false);
    setCurrentPage(1);
  };

  if (loading && articles.length === 0) {
    return (
      <div className="min-h-screen bg-soft-gradient-light py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-soft-pulse">
            {/* Header skeleton */}
            <div className="text-center mb-16">
              <div className="h-12 bg-white/60 backdrop-blur-soft rounded-2xl shadow-soft-sm w-64 mx-auto mb-8"></div>
              <div className="h-16 bg-white/40 backdrop-blur-soft rounded-2xl shadow-soft-sm w-96 mx-auto mb-4"></div>
              <div className="h-6 bg-white/40 backdrop-blur-soft rounded-xl shadow-soft-sm w-80 mx-auto"></div>
            </div>
            
            {/* Search bar skeleton */}
            <div className="bg-white/60 backdrop-blur-soft rounded-3xl shadow-soft-lg p-8 mb-12">
              <div className="h-14 bg-white/80 rounded-2xl shadow-soft-inset-sm"></div>
            </div>
            
            {/* Cards skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white/60 backdrop-blur-soft rounded-3xl shadow-soft-lg overflow-hidden">
                  <div className="h-48 bg-white/80 shadow-soft-inset-sm"></div>
                  <div className="p-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="h-6 bg-white/80 rounded-xl shadow-soft-inset-sm w-20"></div>
                      <div className="h-6 bg-white/80 rounded-xl shadow-soft-inset-sm w-16"></div>
                    </div>
                    <div className="h-6 bg-white/80 rounded-xl shadow-soft-inset-sm w-3/4"></div>
                    <div className="h-4 bg-white/80 rounded-lg shadow-soft-inset-sm w-full"></div>
                    <div className="h-4 bg-white/80 rounded-lg shadow-soft-inset-sm w-2/3"></div>
                    <div className="flex justify-between items-center pt-2">
                      <div className="flex space-x-2">
                        <div className="h-6 bg-white/80 rounded-lg shadow-soft-inset-sm w-16"></div>
                        <div className="h-6 bg-white/80 rounded-lg shadow-soft-inset-sm w-16"></div>
                      </div>
                      <div className="h-6 bg-white/80 rounded-lg shadow-soft-inset-sm w-12"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-soft-gradient-light py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header - Soft UI 2.0 */}
        <div className="text-center mb-16 animate-slide-up">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/80 backdrop-blur-soft rounded-full shadow-soft-sm border border-white/40 mb-8">
            <span className="text-2xl">📰</span>
            <span className="text-primary-600 font-semibold text-sm tracking-wide uppercase">Blog & Noticias</span>
          </div>
          
          <h1 className="text-5xl font-bold text-neutral-900 mb-6 lg:text-6xl">
            Noticias <span className="bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">ACA Chile</span>
          </h1>
          <p className="text-xl text-neutral-600 font-light max-w-3xl mx-auto leading-relaxed">
            Mantente al día con las últimas noticias, técnicas y eventos del mundo del asado
          </p>
        </div>

        {/* Barra de búsqueda y filtros - Soft UI 2.0 */}
        <div className="bg-white/60 backdrop-blur-soft rounded-3xl shadow-soft-lg border border-white/30 p-8 mb-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Búsqueda */}
            <div className="relative md:col-span-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar noticias..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-12 pr-4 py-4 bg-white/80 backdrop-blur-soft rounded-2xl shadow-soft-inset-sm border border-white/40 focus:outline-none focus:shadow-soft-inset-md focus:border-primary-300 transition-all duration-300 text-neutral-700 placeholder-neutral-400"
                />
                <Search className="absolute left-4 top-4 h-5 w-5 text-neutral-400" />
                <button
                  onClick={handleSearch}
                  className="absolute right-3 top-3 p-2 bg-primary-500/10 hover:bg-primary-500/20 rounded-xl text-primary-600 hover:text-primary-700 transition-all duration-200"
                >
                  <Search className="h-4 w-4" />
                </button>
              </div>
              
              {/* Sugerencias */}
              {showSuggestions && searchSuggestions.length > 0 && (
                <div className="absolute z-10 w-full bg-white/95 backdrop-blur-soft border border-white/40 rounded-2xl shadow-soft-lg mt-2 max-h-60 overflow-y-auto">
                  {searchSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full text-left px-4 py-3 hover:bg-primary-50/50 text-neutral-700 hover:text-primary-700 transition-colors duration-200 border-b border-neutral-100/50 last:border-b-0 first:rounded-t-2xl last:rounded-b-2xl"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Filtro por categoría */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-4 bg-white/80 backdrop-blur-soft rounded-2xl shadow-soft-inset-sm border border-white/40 focus:outline-none focus:shadow-soft-inset-md focus:border-primary-300 transition-all duration-300 text-neutral-700"
            >
              <option value="">Todas las categorías</option>
              {categories.map((category) => (
                <option key={category.id} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </select>

            {/* Filtros adicionales */}
            <div className="flex gap-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showFeaturedOnly}
                  onChange={(e) => setShowFeaturedOnly(e.target.checked)}
                  className="w-5 h-5 rounded-lg border-0 bg-white/80 shadow-soft-inset-xs checked:shadow-soft-inset-sm checked:bg-primary-500 focus:outline-none transition-all duration-200 text-white"
                />
                <span className="ml-3 text-sm text-neutral-700 font-medium">Destacadas</span>
              </label>
              
              {(selectedCategory || showFeaturedOnly) && (
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 bg-primary-500/10 hover:bg-primary-500/20 text-primary-600 hover:text-primary-700 rounded-xl font-medium text-sm transition-all duration-200"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Error - Soft UI 2.0 */}
        {error && (
          <div className="bg-red-50/80 backdrop-blur-soft border border-red-200/50 rounded-2xl p-6 mb-8 shadow-soft-sm">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Grid de noticias */}
        {articles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {articles.map((article) => (
              <div key={article.id} className="group bg-white/60 backdrop-blur-soft rounded-3xl shadow-soft-lg hover:shadow-soft-xl overflow-hidden border border-white/30 transition-all duration-500 transform hover:-translate-y-2">
                {/* Imagen destacada */}
                {article.featured_image && (
                  <Link to={`/noticias/${article.slug}`}>
                    <div className="h-48 overflow-hidden relative">
                      <img
                        src={article.featured_image}
                        alt={article.title}
                        className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-neutral-900/30 via-transparent to-transparent"></div>
                    </div>
                  </Link>
                )}

                <div className="p-6">
                  {/* Categoría y fecha */}
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className="inline-block px-3 py-2 rounded-xl text-xs font-semibold text-white shadow-soft-sm"
                      style={{ backgroundColor: article.category.color }}
                    >
                      {article.category.name}
                    </span>
                    {article.is_featured && (
                      <span className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-white text-xs font-semibold px-3 py-2 rounded-xl shadow-soft-sm">
                        ⭐ Destacada
                      </span>
                    )}
                  </div>

                  {/* Título */}
                  <Link to={`/noticias/${article.slug}`}>
                    <h3 className="text-xl font-bold text-neutral-800 mb-3 group-hover:text-primary-600 transition-colors duration-300 line-clamp-2">
                      {article.title}
                    </h3>
                  </Link>

                  {/* Excerpt */}
                  <p className="text-neutral-600 mb-6 line-clamp-3 font-light leading-relaxed">
                    {article.excerpt}
                  </p>

                  {/* Meta información */}
                  <div className="flex items-center justify-between text-sm text-neutral-500">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center bg-neutral-100/50 px-2 py-1 rounded-lg">
                        <Calendar className="h-4 w-4 mr-2 text-neutral-400" />
                        <span className="font-medium">{formatDate(article.published_at)}</span>
                      </div>
                      <div className="flex items-center bg-neutral-100/50 px-2 py-1 rounded-lg">
                        <User className="h-4 w-4 mr-2 text-neutral-400" />
                        <span className="font-medium">{article.author_name}</span>
                      </div>
                    </div>
                    <div className="flex items-center bg-primary-50/50 px-2 py-1 rounded-lg text-primary-600">
                      <Eye className="h-4 w-4 mr-2" />
                      <span className="font-semibold">{article.view_count}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          !loading && (
            <div className="text-center py-16">
              <div className="bg-white/60 backdrop-blur-soft rounded-3xl p-12 shadow-soft-lg border border-white/30 max-w-md mx-auto">
                <div className="w-20 h-20 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-4xl">📰</span>
                </div>
                <h3 className="text-xl font-bold text-neutral-800 mb-3">No se encontraron noticias</h3>
                <p className="text-neutral-600 mb-6">
                  {(selectedCategory || showFeaturedOnly) 
                    ? 'Prueba ajustando los filtros o busca algo diferente.' 
                    : 'Actualmente no hay noticias disponibles.'}
                </p>
                {(selectedCategory || showFeaturedOnly) && (
                  <button
                    onClick={clearFilters}
                    className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-soft-sm hover:shadow-soft-md"
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>
            </div>
          )
        )}

        {/* Paginación - Soft UI 2.0 */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center space-x-3 mt-16">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-6 py-3 text-sm font-semibold text-neutral-600 bg-white/60 backdrop-blur-soft border border-white/30 rounded-xl hover:bg-white/80 hover:shadow-soft-md disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-soft-sm"
            >
              ← Anterior
            </button>
            
            <div className="flex space-x-2">
              {[...Array(Math.min(5, totalPages))].map((_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-12 h-12 text-sm font-semibold rounded-xl transition-all duration-300 ${
                      currentPage === pageNum
                        ? 'text-white bg-primary-500 shadow-soft-colored-red transform scale-110'
                        : 'text-neutral-600 bg-white/60 backdrop-blur-soft border border-white/30 hover:bg-white/80 hover:shadow-soft-md shadow-soft-sm'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-6 py-3 text-sm font-semibold text-neutral-600 bg-white/60 backdrop-blur-soft border border-white/30 rounded-xl hover:bg-white/80 hover:shadow-soft-md disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-soft-sm"
            >
              Siguiente →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsPage;