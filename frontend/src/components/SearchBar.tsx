/**
 * Componente de barra de búsqueda global con sugerencias
 * ACA Chile Frontend
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Clock, TrendingUp, Calendar, Newspaper, UserCircle, Loader2, FileText } from 'lucide-react';
import { searchService as searchApi } from '../services/searchService';

interface SearchBarProps {
  placeholder?: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
  style?: React.CSSProperties;
}

interface PreviewResult {
  id: number | string;
  title: string;
  description?: string;
  date?: string;
  url: string;
  type?: string;
  relevance?: number;
}

const RECENT_SEARCHES_KEY = 'recentSearches';

import { logger } from '../utils/logger';

const SearchBar: React.FC<SearchBarProps> = ({ 
  placeholder = "Buscar eventos, noticias...",
  size = 'medium',
  className = '',
  style
}) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [previewResults, setPreviewResults] = useState<PreviewResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setRecentSearches(parsed.slice(0, 5));
        }
      }
    } catch (error) {
      logger.search.error('Error cargando búsquedas recientes', error);
    }
  }, []);

  const saveRecentSearch = useCallback((searchTerm: string) => {
    if (typeof window === 'undefined') return;

    const normalized = searchTerm.trim();
    if (!normalized) return;

    setRecentSearches((prev) => {
      const next = [normalized, ...prev.filter((item) => item.toLowerCase() !== normalized.toLowerCase())].slice(0, 5);
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
      } catch (error) {
        logger.search.error('Error guardando búsquedas recientes', error);
      }
      return next;
    });
  }, []);

  const mapToPreviewResult = useCallback((raw: any): PreviewResult | null => {
    if (!raw) return null;

    const title: string | undefined = raw.title || raw.name || raw.fullName;
    if (!title) return null;

    const rawUrl: string | undefined =
      typeof raw.url === 'string'
        ? raw.url
        : typeof raw.slug === 'string'
          ? raw.slug
          : raw.type === 'evento'
            ? `/eventos/${raw.id}`
            : raw.type === 'noticia'
              ? `/noticias/${raw.id}`
              : raw.type === 'usuario'
                ? `/socios/${raw.id}`
                : undefined;

    if (!rawUrl) return null;

    const normalizedUrl = rawUrl.startsWith('http') || rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`;
    const metadata = (raw.metadata && typeof raw.metadata === 'object') ? raw.metadata : {};

    return {
      id: raw.id ?? normalizedUrl,
      title,
      description:
        raw.description ||
        raw.excerpt ||
        raw.summary ||
        raw.location ||
        metadata.pageLabel ||
        metadata.city ||
        metadata.region ||
        '',
      date: raw.date || raw.publishedAt || raw.createdAt || '',
      url: normalizedUrl,
      type: raw.type || raw.category,
      relevance: typeof raw.relevance === 'number' ? raw.relevance : undefined
    };
  }, []);

  const fetchSuggestions = useCallback(
    async (searchTerm: string) => {
      const normalized = searchTerm.trim();
      if (normalized.length < 2) return;

      const requestId = ++requestIdRef.current;

      try {
        logger.search.debug('Cargando sugerencias', { query: normalized });
        setIsLoading(true);

        const [suggestionsRes, resultsRes] = await Promise.all([
          searchApi.getSuggestions(normalized, 6),
          searchApi.search({ query: normalized, type: 'all', limit: 5 })
        ]);

        if (requestIdRef.current !== requestId) {
          return;
        }

        if (suggestionsRes.success && Array.isArray(suggestionsRes.data)) {
          setSuggestions(suggestionsRes.data);
        } else {
          setSuggestions([]);
          if (suggestionsRes.error) {
            logger.search.warn('Sugerencias no disponibles', { error: suggestionsRes.error });
          }
        }

        if (resultsRes.success && resultsRes.data) {
          const combined = Array.isArray(resultsRes.data.combined)
            ? resultsRes.data.combined
            : [
                ...(Array.isArray(resultsRes.data.eventos) ? resultsRes.data.eventos : []),
                ...(Array.isArray(resultsRes.data.noticias) ? resultsRes.data.noticias : []),
                ...(Array.isArray(resultsRes.data.usuarios) ? resultsRes.data.usuarios : []),
                ...(Array.isArray(resultsRes.data.secciones) ? resultsRes.data.secciones : [])
              ];

          const preview = combined
            .map(mapToPreviewResult)
            .filter((item): item is PreviewResult => item !== null)
            .slice(0, 5);

          setPreviewResults(preview);
        } else {
          setPreviewResults([]);
          if (resultsRes.error) {
            logger.search.warn('No se pudieron cargar resultados de vista previa', { error: resultsRes.error });
          }
        }

        setShowSuggestions(true);
      } catch (error) {
        if (requestIdRef.current !== requestId) {
          return;
        }

        logger.search.error('Error cargando sugerencias', error);
        setSuggestions([]);
        setPreviewResults([]);
        setShowSuggestions(true);
      } finally {
        if (requestIdRef.current === requestId) {
          setIsLoading(false);
        }
      }
    },
    [mapToPreviewResult]
  );

  // Debounce para las sugerencias
  useEffect(() => {
    const timer = setTimeout(() => {
      const normalized = query.trim();
      if (normalized.length > 1) {
        fetchSuggestions(normalized);
      } else {
        setSuggestions([]);
        setPreviewResults([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, fetchSuggestions]);

  const highlightMatch = useCallback(
    (text: string): React.ReactNode => {
      const normalizedQuery = query.trim();
      if (!normalizedQuery) return text;

      const lowerText = text.toLowerCase();
      const lowerQuery = normalizedQuery.toLowerCase();
      const startIndex = lowerText.indexOf(lowerQuery);

      if (startIndex === -1) return text;

      const endIndex = startIndex + lowerQuery.length;

      return (
        <>
          {text.slice(0, startIndex)}
          <span className="font-semibold text-red-600">{text.slice(startIndex, endIndex)}</span>
          {text.slice(endIndex)}
        </>
      );
    },
    [query]
  );

  const getResultIcon = useCallback((type?: string) => {
    switch (type) {
      case 'evento':
        return <Calendar className="h-4 w-4 text-red-500" />;
      case 'noticia':
        return <Newspaper className="h-4 w-4 text-blue-500" />;
      case 'usuario':
        return <UserCircle className="h-4 w-4 text-amber-500" />;
      case 'section':
        return <FileText className="h-4 w-4 text-emerald-500" />;
      default:
        return <Search className="h-4 w-4 text-gray-400" />;
    }
  }, []);

  const handleResultClick = useCallback(
    (result: PreviewResult) => {
      if (!result.url) return;

      const normalizedQuery = query.trim();
      saveRecentSearch(normalizedQuery || result.title);

      setShowSuggestions(false);
      setPreviewResults([]);
      setSuggestions([]);
      setQuery('');
      inputRef.current?.blur();

      navigate(result.url);
    },
    [navigate, query, saveRecentSearch]
  );

  // Cerrar sugerencias cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (searchQuery: string = query) => {
    const normalized = searchQuery.trim();

    if (!normalized) {
      logger.search.warn('Búsqueda vacía ignorada');
      return;
    }

    logger.search.info('Ejecutando búsqueda', { 
      query: normalized,
      source: 'SearchBar' 
    });

    saveRecentSearch(normalized);
    navigate(`/buscar?q=${encodeURIComponent(normalized)}`);
    setShowSuggestions(false);
    setPreviewResults([]);
    setSuggestions([]);
    setQuery('');
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    handleSearch(suggestion);
  };

  // Clases CSS basadas en el tamaño
  const sizeClasses = {
    small: 'h-8 text-sm',
    medium: 'h-10 text-base',
    large: 'h-12 text-lg'
  };

  const iconSizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-5 w-5',
    large: 'h-6 w-6'
  };

  type SizeKey = 'small' | 'medium' | 'large';
  const sizeKey = size as SizeKey;

  const isExpanded = isFocused || showSuggestions || query.trim().length > 0;

  const widthSettings: Record<SizeKey, { base: string; expanded: string }> = {
    small: { base: '100%', expanded: '100%' },
    medium: { base: 'min(100%, 22rem)', expanded: 'min(100%, 38rem)' },
    large: { base: 'min(100%, 24rem)', expanded: 'min(100%, 44rem)' }
  };

  const appliedStyle: React.CSSProperties = {
    width: widthSettings[sizeKey][isExpanded ? 'expanded' : 'base'],
    transition: 'width 0.3s ease, transform 0.3s ease',
    ...style
  };

  return (
    <div
      ref={searchRef}
      className={`
        relative transition-all duration-300 ease-in-out
        ${className}
      `}
      style={appliedStyle}
    >
      <div className="relative">
        <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 ${iconSizeClasses[sizeKey]}`} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            setIsFocused(true);
            if (query.trim().length > 1) {
              setShowSuggestions(true);
            }
          }}
          onBlur={() => {
            window.setTimeout(() => {
              if (!searchRef.current) {
                setIsFocused(false);
                return;
              }
              if (!searchRef.current.contains(document.activeElement)) {
                setIsFocused(false);
              }
            }, 120);
          }}
          placeholder={placeholder}
          className={`
            w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg 
            focus:ring-2 focus:ring-red-500 focus:border-transparent 
            bg-white shadow-sm transition-all
            ${sizeClasses[size]}
          `}
        />
        
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-600">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        )}
      </div>

      {/* Panel de sugerencias */}
      {showSuggestions && query.trim().length > 1 && (
        <div className="absolute top-full left-0 mt-2 w-full max-w-screen-sm lg:min-w-[28rem] lg:w-[36rem] lg:max-w-2xl bg-white rounded-2xl shadow-xl border border-gray-200 z-50 overflow-hidden">
          <div className="max-h-96 overflow-y-auto">
            {suggestions.length > 0 && (
              <div className="py-2">
                <div className="px-4 pb-2 text-xs font-semibold text-gray-500 uppercase">
                  Sugerencias
                </div>
                {suggestions.map((suggestion, index) => (
                  <button
                    key={`${suggestion}-${index}`}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-start gap-3 transition-colors"
                  >
                    <Search className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-900 text-sm whitespace-normal leading-5">
                      {highlightMatch(suggestion)}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {previewResults.length > 0 && (
              <div className="py-2 border-t border-gray-100">
                <div className="px-4 pb-2 text-xs font-semibold text-gray-500 uppercase">
                  Resultados destacados
                </div>
                {previewResults.map((result) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleResultClick(result)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5">{getResultIcon(result.type)}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-gray-500 font-semibold">
                          <span>{result.type || 'Recurso'}</span>
                          {result.date && (
                            <>
                              <span className="text-gray-300">•</span>
                              <span>{new Date(result.date).toLocaleDateString('es-CL')}</span>
                            </>
                          )}
                        </div>
                        <div className="text-sm font-semibold text-gray-900 mt-1">
                          {result.title}
                        </div>
                        {result.description && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {result.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {suggestions.length === 0 && previewResults.length === 0 && !isLoading && (
              <div className="px-6 py-8 text-center text-gray-500">
                <Search className="h-8 w-8 text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-medium">No encontramos coincidencias para "{query.trim()}"</p>
                <p className="text-xs mt-2">Presiona Enter para buscar en todo el sitio</p>
              </div>
            )}

            {suggestions.length === 0 && previewResults.length === 0 && !isLoading && (
              <div className="border-t border-gray-100 px-4 py-4">
                <div className="flex items-center text-sm text-gray-500 mb-3">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  <span>Búsquedas populares</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {['calendario de eventos', 'quiénes somos', 'noticias ACA', 'directorio de socios'].map((popular) => (
                    <button
                      key={popular}
                      onClick={() => handleSuggestionClick(popular)}
                      className="text-left text-sm text-gray-700 px-3 py-2 rounded-lg border border-gray-200 hover:border-red-200 hover:bg-red-50 transition-colors"
                    >
                      {popular}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <RecentSearches searches={recentSearches} onSearchClick={handleSuggestionClick} />
          </div>
        </div>
      )}
    </div>
  );
};

// Componente para mostrar búsquedas recientes
const RecentSearches: React.FC<{ searches: string[]; onSearchClick: (search: string) => void }> = ({ searches, onSearchClick }) => {
  if (!searches || searches.length === 0) return null;

  return (
    <div className="border-t border-gray-100">
      <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
        Búsquedas recientes
      </div>
      {searches.slice(0, 5).map((search, index) => (
        <button
          key={`${search}-${index}`}
          onClick={() => onSearchClick(search)}
          className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center transition-colors"
        >
          <Clock className="h-4 w-4 text-gray-400 mr-3" />
          <span className="text-gray-700 text-sm">{search}</span>
        </button>
      ))}
    </div>
  );
};

export default SearchBar;
