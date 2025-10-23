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
    let cancelled = false;

    async function loadGoogleMaps() {
      // If already present, just init
      if (typeof (window as any).google !== 'undefined' && (window as any).google.maps && (window as any).google.maps.places) {
        console.log('✅ Google Maps already loaded');
        autocompleteService.current = new (window as any).google.maps.places.AutocompleteService();
        return;
      }

      try {
        // Fetch public config to get the API key
        const res = await fetch('/api/config/public');
        const json = await res.json();
        const key = json?.data?.googleMapsKey;

        if (!key) {
          console.warn('⚠️ Google Maps API key not available from /api/config/public');
          return;
        }

        // Create script tag to load Google Maps JS with Places
        const scriptId = 'google-maps-js';
        if (!document.getElementById(scriptId)) {
          const script = document.createElement('script');
          script.id = scriptId;
          script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places&language=es&region=CL`;
          script.async = true;
          script.defer = true;
          document.head.appendChild(script);

          await new Promise<void>((resolve, reject) => {
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load Google Maps script'));
          });
        } else {
          // Wait until google is defined
          await new Promise<void>((resolve, reject) => {
            const start = Date.now();
            const check = () => {
              if ((window as any).google && (window as any).google.maps && (window as any).google.maps.places) {
                resolve();
              } else if (Date.now() - start > 10000) {
                reject(new Error('Timed out waiting for Google Maps'));
              } else {
                setTimeout(check, 200);
              }
            };
            check();
          });
        }

        if (cancelled) return;

        if ((window as any).google && (window as any).google.maps && (window as any).google.maps.places) {
          console.log('✅ Google Maps API loaded, initializing AutocompleteService');
          autocompleteService.current = new (window as any).google.maps.places.AutocompleteService();
        }
      } catch (err) {
        console.error('❌ Error loading Google Maps API:', err);
      }
    }

    loadGoogleMaps();

    return () => { cancelled = true; };
  }, []);

  const fetchSuggestions = async (query: string) => {
    if (!autocompleteService.current || query.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      console.log('🔍 Fetching places suggestions for:', `"${query}"`);
      // Prefer client-side AutocompleteService if available
      if (autocompleteService.current) {
        const request = { input: query, componentRestrictions: { country: 'cl' }, types: ['address'] };
        try {
          autocompleteService.current.getPlacePredictions(request, (predictions, status) => {
            console.log('📊 Google Places response status:', status);
            console.log('📋 Predictions received:', predictions);
            if (status === (window as any).google.maps.places.PlacesServiceStatus.OK && predictions) {
              setSuggestions(predictions);
              setShowSuggestions(true);
            } else {
              console.warn('⚠️ Google Places client failed:', status);
              setSuggestions([]);
            }
            setIsLoading(false);
          });
        } catch (err) {
          console.error('❌ AutocompleteService error:', err);
          setIsLoading(false);
          setSuggestions([]);
        }
        return;
      }

      // Fallback to server-side Places Autocomplete
      try {
        const res = await fetch(`/api/places/autocomplete?input=${encodeURIComponent(query)}`);
        const json = await res.json();
        if (json && json.predictions) {
          // Map predictions to a shape similar to google.maps.places.AutocompletePrediction
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
      } catch (err) {
        console.error('❌ Server-side autocomplete error:', err);
        setSuggestions([]);
      }
      setIsLoading(false);
    } catch (error) {
      console.error('❌ Error fetching suggestions:', error);
      setSuggestions([]);
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

  const handleSuggestionClick = (suggestion: google.maps.places.AutocompletePrediction) => {
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