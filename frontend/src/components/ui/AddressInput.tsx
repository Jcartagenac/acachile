import React, { useState, useEffect, useRef } from 'react';

interface AddressInputProps {
  value: string;
  onChange: (value: string) => void;
  onNormalizedChange?: (normalized: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const AddressInput: React.FC<AddressInputProps> = ({
  value,
  onChange,
  onNormalizedChange,
  placeholder = "Ingresa tu dirección",
  className = "",
  disabled = false
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const autocompleteService = useRef<any>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<any>();

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const fetchSuggestions = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      console.log('🔍 Fetching places suggestions for:', `"${query}"`);
      const res = await fetch(`/api/places/autocomplete?input=${encodeURIComponent(query)}`);
      const json = await res.json();
      if (json && json.predictions) {
        const mapped = (json.predictions || []).map((p: any) => ({
          description: p.description,
          place_id: p.place_id,
          structured_formatting: p.structured_formatting
        }));
        setSuggestions(mapped);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
      }
    } catch (error) {
      console.error('❌ Error fetching suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Test function to check if Google Maps is working
  const testGoogleMaps = () => {
    console.log('🧪 Testing Google Maps API...');
    console.log('Google object exists:', typeof google !== 'undefined');
    if (typeof google !== 'undefined') {
      console.log('Google Maps exists:', !!google.maps);
      console.log('Google Places exists:', !!google.maps.places);
      console.log('AutocompleteService available:', !!google.maps.places.AutocompleteService);
    }
  };

  useEffect(() => {
    // Test Google Maps on component mount
    testGoogleMaps();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    console.log('🔄 Address input change:', `"${newValue}"`);
    setInputValue(newValue);
    onChange(newValue);
    setSelectedIndex(-1);

    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Fetch suggestions after user stops typing
    if (newValue.trim().length >= 3) {
      timeoutRef.current = setTimeout(() => {
        fetchSuggestions(newValue);
      }, 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: any) => {
    console.log('🎯 Selected suggestion:', `"${suggestion.description}"`);
    console.log('🏷️ Full suggestion object:', suggestion);
    setInputValue(suggestion.description);
    onChange(suggestion.description);
    // If we have a place_id, try to fetch detailed place info (formatted address, geometry)
    const placeId = (suggestion as any).place_id;
    if (placeId) {
      (async () => {
        try {
          const res = await fetch(`/api/places/details?place_id=${encodeURIComponent(placeId)}`);
          const json = await res.json();
          if (json && json.success && json.result) {
            const formatted = json.result.formatted_address || suggestion.description;
            if (onNormalizedChange) onNormalizedChange(formatted);
            console.log('📌 Place details fetched:', json.result.geometry || {});
          } else {
            if (onNormalizedChange) onNormalizedChange(suggestion.description);
          }
        } catch (err) {
          console.error('❌ Error fetching place details:', err);
          if (onNormalizedChange) onNormalizedChange(suggestion.description);
        }
      })();
    } else {
      if (onNormalizedChange) {
        onNormalizedChange(suggestion.description);
      }
    }
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleBlur = () => {
    // Delay hiding suggestions to allow clicks
    setTimeout(() => {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }, 150);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`}
        disabled={disabled}
        autoComplete="off"
      />

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.place_id}
              className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${
                index === selectedIndex ? 'bg-blue-50' : ''
              }`}
              onClick={() => handleSuggestionClick(suggestion)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className="flex items-center">
                <div className="flex-shrink-0 mr-3">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <span className="text-gray-700">{suggestion.description}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};