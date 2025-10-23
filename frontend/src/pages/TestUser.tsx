import React, { useState } from 'react';
import { normalizeRut, normalizePhone, formatRut } from '@shared/utils/validators';
import { AddressInput } from '../components/ui/AddressInput';

export default function TestUser() {
  const [formData, setFormData] = useState({
    rut: '',
    telefono: '',
    direccion: ''
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const handleRutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    console.log('🔄 RUT onChange - Input value:', `"${value}"`);

    // Limpiar errores previos
    if (validationErrors.rut) {
      setValidationErrors(prev => ({ ...prev, rut: '' }));
    }

    // Permitir números, K/k, puntos y guiones
    const allowedChars = value.replace(/[^0-9kK.\-]/g, '');
    console.log('🔤 RUT allowed chars:', `"${allowedChars}"`);

    // Formatear en tiempo real mientras escribe (sin validar)
    let formattedValue = allowedChars;
    if (allowedChars.trim()) {
      try {
        // Limpiar para formateo
        const cleanValue = allowedChars.replace(/[^0-9kK]/g, '').toUpperCase();
        console.log('🧹 RUT cleaned for formatting:', `"${cleanValue}"`);

        // Siempre formatear, sin validar hasta el blur
        formattedValue = formatRut(cleanValue);
        console.log('📝 RUT formatted:', `"${formattedValue}"`);
      } catch (err) {
        console.error('❌ Error formatting RUT live:', err);
        // Si hay error, mantener el valor limpio
        formattedValue = allowedChars;
      }
    }

    console.log('💾 RUT final value:', `"${formattedValue}"`);
    setFormData({ ...formData, rut: formattedValue });

    // Mantener el foco en el input después de actualizar el estado
    setTimeout(() => {
      const input = e.target as HTMLInputElement;
      const len = formattedValue.length;
      input.setSelectionRange(len, len);
    }, 0);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    console.log('🔄 Phone onChange - Input value:', `"${value}"`);

    // Limpiar errores previos
    if (validationErrors.telefono) {
      setValidationErrors(prev => ({ ...prev, telefono: '' }));
    }

    // Permitir números y +
    const allowedChars = value.replace(/[^0-9+]/g, '');
    console.log('🔤 Phone allowed chars:', `"${allowedChars}"`);

    // Formatear en tiempo real mientras escribe
    let formattedValue = allowedChars;
    if (allowedChars.trim()) {
      try {
        // Limpiar para validación (quitar +56 si existe)
        const cleanValue = allowedChars.replace(/^\+?56/, '');
        console.log('🧹 Phone cleaned for validation:', `"${cleanValue}"`);

        if (cleanValue.length >= 9) {
          // Tiene número completo, normalizar
          formattedValue = normalizePhone(cleanValue);
          console.log('✅ Phone normalized complete:', `"${formattedValue}"`);
        } else if (cleanValue.length >= 1) {
          // Formateo parcial
          formattedValue = `+56${cleanValue}`;
          console.log('📝 Phone formatted partial:', `"${formattedValue}"`);
        }
      } catch (err) {
        console.error('❌ Error formatting phone live:', err);
        // Si hay error, mantener el valor limpio
        formattedValue = allowedChars;
      }
    }

    console.log('💾 Phone final value:', `"${formattedValue}"`);
    setFormData({ ...formData, telefono: formattedValue });

    // Mantener el foco en el input después de actualizar el estado
    setTimeout(() => {
      const input = e.target as HTMLInputElement;
      const len = formattedValue.length;
      input.setSelectionRange(len, len);
    }, 0);
  };

  const handleRutBlur = () => {
    // Validar completamente al perder foco
    if (formData.rut.trim()) {
      try {
        console.log('🔍 Validando RUT al perder foco:', formData.rut);
        const normalizedRut = normalizeRut(formData.rut);
        console.log('✅ RUT normalizado final:', normalizedRut);
        setFormData(prev => ({ ...prev, rut: normalizedRut }));
        setValidationErrors(prev => ({ ...prev, rut: '' }));
      } catch (err) {
        console.error('❌ Error validando RUT final:', err);
        setValidationErrors(prev => ({
          ...prev,
          rut: err instanceof Error ? err.message : 'RUT inválido'
        }));
        // Si es inválido, limpiar el campo
        setFormData(prev => ({ ...prev, rut: '' }));
      }
    }
  };

  const handlePhoneBlur = () => {
    // Validar completamente al perder foco
    if (formData.telefono.trim()) {
      try {
        console.log('🔍 Validando teléfono al perder foco:', formData.telefono);
        const normalizedPhone = normalizePhone(formData.telefono);
        console.log('✅ Teléfono normalizado final:', normalizedPhone);
        setFormData(prev => ({ ...prev, telefono: normalizedPhone }));
        setValidationErrors(prev => ({ ...prev, telefono: '' }));
      } catch (err) {
        console.error('❌ Error validando teléfono final:', err);
        setValidationErrors(prev => ({
          ...prev,
          telefono: err instanceof Error ? err.message : 'Teléfono inválido'
        }));
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Test Live Normalization
        </h1>

        <div className="space-y-6">
          {/* RUT Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              RUT (Live Normalization)
            </label>
            <input
              type="text"
              value={formData.rut}
              onChange={handleRutChange}
              onBlur={handleRutBlur}
              placeholder="Type 123456789"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                validationErrors.rut ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {validationErrors.rut && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.rut}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Should format to: 12.345.678-9 (type 123456789)
            </p>
          </div>

          {/* Phone Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Teléfono (Live Normalization)
            </label>
            <input
              type="text"
              value={formData.telefono}
              onChange={handlePhoneChange}
              onBlur={handlePhoneBlur}
              placeholder="Type 912345678"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                validationErrors.telefono ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {validationErrors.telefono && (
              <p className="mt-1 text-sm text-red-600">{validationErrors.telefono}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Should format to: +56912345678
            </p>
          </div>

          {/* Address Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dirección (Google Maps Normalization)
            </label>
            <AddressInput
              value={formData.direccion}
              onChange={(value) => setFormData({ ...formData, direccion: value })}
              placeholder="Type an address"
            />
            <p className="mt-1 text-xs text-gray-500">
              Type 3+ characters to see Google Maps suggestions (e.g., "Providencia")
            </p>
          </div>

          {/* Current Values Display */}
          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Current Values:</h3>
            <div className="text-xs text-gray-600 space-y-1">
              <div><strong>RUT:</strong> "{formData.rut}"</div>
              <div><strong>Teléfono:</strong> "{formData.telefono}"</div>
              <div><strong>Dirección:</strong> "{formData.direccion}"</div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 p-4 rounded-md">
            <h3 className="text-sm font-medium text-blue-700 mb-2">Test Instructions:</h3>
            <ul className="text-xs text-blue-600 space-y-1">
              <li>• Type <code>123456789</code> in RUT field</li>
              <li>• Type <code>912345678</code> in phone field</li>
              <li>• Type any address in address field</li>
              <li>• Check browser console (F12) for logs</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}