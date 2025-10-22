import React, { useState } from 'react';
import { normalizeRut, normalizePhone } from '@shared/utils/validators';
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
    console.log('🔄 RUT onChange - Input value:', value);

    // Limpiar errores previos
    if (validationErrors.rut) {
      setValidationErrors(prev => ({ ...prev, rut: '' }));
    }

    // Formatear en tiempo real mientras escribe
    let formattedValue = value;
    if (value.trim()) {
      try {
        // Normalizar completamente en vivo
        const cleanValue = value.replace(/[^0-9kK]/g, '');
        console.log('🧹 RUT cleaned value:', cleanValue);

        if (cleanValue.length >= 8) {
          formattedValue = normalizeRut(cleanValue);
          console.log('✅ RUT normalized live:', formattedValue);
        } else {
          // Formateo básico mientras escribe
          formattedValue = cleanValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
          if (cleanValue.length > 7) {
            const body = cleanValue.slice(0, -1);
            const dv = cleanValue.slice(-1);
            formattedValue = `${body.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}-${dv}`;
          }
          console.log('📝 RUT formatted basic:', formattedValue);
        }
      } catch (err) {
        console.error('❌ Error formatting RUT live:', err);
        // Si hay error, mantener el valor limpio
        formattedValue = value.replace(/[^0-9kK.\-]/g, '');
      }
    }

    console.log('💾 RUT setting formData to:', formattedValue);
    setFormData({ ...formData, rut: formattedValue });
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    console.log('🔄 Phone onChange - Input value:', value);

    // Limpiar errores previos
    if (validationErrors.telefono) {
      setValidationErrors(prev => ({ ...prev, telefono: '' }));
    }

    // Formatear en tiempo real mientras escribe
    let formattedValue = value;
    if (value.trim()) {
      try {
        // Normalizar completamente en vivo
        const cleanValue = value.replace(/[^0-9]/g, '');
        console.log('🧹 Phone cleaned value:', cleanValue);

        if (cleanValue.length >= 9) {
          formattedValue = normalizePhone(cleanValue);
          console.log('✅ Phone normalized live:', formattedValue);
        } else if (cleanValue.length >= 8) {
          // Formateo básico mientras escribe
          formattedValue = `+56${cleanValue}`;
          console.log('📝 Phone formatted basic:', formattedValue);
        } else {
          formattedValue = cleanValue;
        }
      } catch (err) {
        console.error('❌ Error formatting phone live:', err);
        // Si hay error, mantener el valor limpio
        formattedValue = value.replace(/[^0-9+]/g, '');
      }
    }

    console.log('💾 Phone setting formData to:', formattedValue);
    setFormData({ ...formData, telefono: formattedValue });
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
              Should format to: 12.345.678-9
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
              Should normalize with Google Maps API
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