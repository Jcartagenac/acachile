/**
 * Componente de barra de búsqueda global con sugerencias
 * ACA Chile Frontend
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Clock, TrendingUp } from 'lucide-react';
import { searchService } from '../services/searchService';

interface SearchBarProps {
  placeholder?: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  placeholder = "Buscar eventos, noticias...",
  size = 'medium',
  className = ''
}) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce para las sugerencias
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length > 1) {
        loadSuggestions();
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Cerrar sugerencias cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadSuggestions = async () => {
    try {
      setLoading(true);
      const response = await searchService.getSuggestions(query);
      
      if (response.success && response.data) {
        setSuggestions(response.data);
        setShowSuggestions(true);
      }
    } catch (err) {
      console.error('Error cargando sugerencias:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (searchQuery: string = query) => {
    if (searchQuery.trim()) {
      navigate(`/buscar?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowSuggestions(false);
      setQuery('');
    }
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

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 ${iconSizeClasses[size]}`} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length > 1 && setShowSuggestions(true)}
          placeholder={placeholder}
          className={`
            w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg 
            focus:ring-2 focus:ring-red-500 focus:border-transparent 
            bg-white shadow-sm transition-all
            ${sizeClasses[size]}
          `}
        />
        
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
          </div>
        )}
      </div>

      {/* Panel de sugerencias */}
      {showSuggestions && (suggestions.length > 0 || query.length > 1) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-80 overflow-y-auto">
          {suggestions.length > 0 && (
            <>
              <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase border-b border-gray-100">
                Sugerencias
              </div>
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center transition-colors"
                >
                  <Search className="h-4 w-4 text-gray-400 mr-3" />
                  <span className="text-gray-900">{suggestion}</span>
                </button>
              ))}
            </>
          )}

          {/* Sugerencias populares cuando no hay resultados */}
          {suggestions.length === 0 && query.length > 1 && (
            <div className="p-4">
              <div className="flex items-center text-sm text-gray-500 mb-3">
                <TrendingUp className="h-4 w-4 mr-2" />
                <span>Búsquedas populares</span>
              </div>
              <div className="space-y-2">
                {['eventos gratis', 'talleres', 'conferencias', 'networking'].map((popular) => (
                  <button
                    key={popular}
                    onClick={() => handleSuggestionClick(popular)}
                    className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded transition-colors"
                  >
                    {popular}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Mensaje cuando no hay resultados */}
          {suggestions.length === 0 && query.length > 1 && (
            <div className="px-4 py-8 text-center text-gray-500">
              <Search className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm">No se encontraron sugerencias</p>
              <p className="text-xs mt-1">Presiona Enter para buscar</p>
            </div>
          )}

          {/* Búsquedas recientes */}
          <RecentSearches onSearchClick={handleSuggestionClick} />
        </div>
      )}
    </div>
  );
};

// Componente para mostrar búsquedas recientes
const RecentSearches: React.FC<{ onSearchClick: (search: string) => void }> = ({ onSearchClick }) => {
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    // Cargar búsquedas recientes del localStorage
    const recent = localStorage.getItem('recentSearches');
    if (recent) {
      try {
        setRecentSearches(JSON.parse(recent));
      } catch (err) {
        console.error('Error parsing recent searches:', err);
      }
    }
  }, []);

  if (recentSearches.length === 0) return null;

  return (
    <>
      <div className="border-t border-gray-100">
        <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
          Búsquedas recientes
        </div>
        {recentSearches.slice(0, 3).map((search, index) => (
          <button
            key={index}
            onClick={() => onSearchClick(search)}
            className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center transition-colors"
          >
            <Clock className="h-4 w-4 text-gray-400 mr-3" />
            <span className="text-gray-700">{search}</span>
          </button>
        ))}
      </div>
    </>
  );
};

export default SearchBar;