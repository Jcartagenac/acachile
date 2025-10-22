import React, { useState, useEffect, useRef } from 'react';
import { normalizeAddress } from '../../../shared/utils/validators';

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
  const [isNormalizing, setIsNormalizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
    setError(null);

    // Limpiar timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Normalizar en vivo cada caracter (sin delay)
    if (newValue.trim().length > 0) {
      setIsNormalizing(true);
      // Ejecutar normalización inmediatamente
      setTimeout(async () => {
        try {
          console.log('🔄 Normalizando dirección en vivo:', newValue);
          const normalized = await normalizeAddress(newValue);
          console.log('✅ Dirección normalizada:', normalized);
          if (normalized !== newValue) {
            setInputValue(normalized);
            onChange(normalized);
            if (onNormalizedChange) {
              onNormalizedChange(normalized);
            }
          }
        } catch (err) {
          console.error('❌ Error normalizing address:', err);
          setError('Error al normalizar dirección');
        } finally {
          setIsNormalizing(false);
        }
      }, 100); // Pequeño delay para evitar llamadas excesivas
    }
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
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        placeholder={placeholder}
        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className} ${error ? 'border-red-500' : ''}`}
        disabled={disabled || isNormalizing}
      />
      {isNormalizing && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
        </div>
      )}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};