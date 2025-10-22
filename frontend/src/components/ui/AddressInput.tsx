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
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Initialize Google Places Autocomplete service
  useEffect(() => {
    // Check if Google Maps is loaded
    const checkGoogleMaps = () => {
      if (typeof google !== 'undefined' && google.maps && google.maps.places) {
        console.log('✅ Google Maps API loaded, initializing AutocompleteService');
        autocompleteService.current = new google.maps.places.AutocompleteService();
      } else {
        console.log('⏳ Waiting for Google Maps API to load...');
        // Retry after a short delay
        setTimeout(checkGoogleMaps, 500);
      }
    };

    checkGoogleMaps();
  }, []);

  const fetchSuggestions = async (query: string) => {
    if (!autocompleteService.current || query.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const request = {
        input: query,
        componentRestrictions: { country: 'cl' },
        types: ['address']
      };

      console.log('🔍 Fetching Google Places suggestions for:', `"${query}"`);
      console.log('📡 Request:', request);

      autocompleteService.current.getPlacePredictions(request, (predictions, status) => {
        console.log('📊 Google Places response status:', status);
        console.log('📋 Predictions received:', predictions);

        if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
          console.log('✅ Found suggestions:', predictions.length);
          console.log('📝 First suggestion:', predictions[0]?.description);
          setSuggestions(predictions);
          setShowSuggestions(true);
        } else {
          console.warn('⚠️ Google Places failed:', status);
          if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
            console.log('📭 No results found for query');
          } else if (status === google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT) {
            console.error('🚫 Query limit exceeded');
          } else if (status === google.maps.places.PlacesServiceStatus.REQUEST_DENIED) {
            console.error('🚫 Request denied - check API key');
          }
          setSuggestions([]);
        }
        setIsLoading(false);
      });
    } catch (error) {
      console.error('❌ Error fetching suggestions:', error);
      setSuggestions([]);
      setIsLoading(false);
    }
  };

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

  const handleSuggestionClick = (suggestion: google.maps.places.AutocompletePrediction) => {
    console.log('🎯 Selected suggestion:', `"${suggestion.description}"`);
    console.log('🏷️ Full suggestion object:', suggestion);
    setInputValue(suggestion.description);
    onChange(suggestion.description);
    if (onNormalizedChange) {
      onNormalizedChange(suggestion.description);
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
                <span className="text-gray-700">{suggestion.description}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};