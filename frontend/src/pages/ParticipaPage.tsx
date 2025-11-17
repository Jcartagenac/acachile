import React, { useState } from 'react';
import { CheckCircle, Gift, QrCode, Loader2 } from 'lucide-react';

const ParticipaPage: React.FC = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    rut: '',
    email: '',
    edad: '',
    telefono: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatRut = (value: string) => {
    // Eliminar todo excepto números y K
    const clean = value.replace(/[^0-9kK]/g, '');
    
    if (clean.length === 0) return '';
    
    // Separar cuerpo y dígito verificador
    const body = clean.slice(0, -1);
    const dv = clean.slice(-1).toUpperCase();
    
    if (body.length === 0) return dv;
    
    // Formatear cuerpo con puntos
    const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    
    return `${formattedBody}-${dv}`;
  };

  const handleRutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatRut(e.target.value);
    setFormData({ ...formData, rut: formatted });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/participantes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setFormData({
          nombre: '',
          apellido: '',
          rut: '',
          email: '',
          edad: '',
          telefono: ''
        });
      } else {
        // Mostrar error detallado en consola para debugging
        console.error('Error detallado:', data);
        const errorMessage = data.details 
          ? `${data.error}: ${data.details}` 
          : (data.error || 'Error al registrar participación');
        setError(errorMessage);
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Error al procesar el registro. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-orange-50 to-primary-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center">
          <div className="mb-6 flex justify-center">
            <div className="bg-green-100 rounded-full p-4">
              <CheckCircle className="h-16 w-16 text-green-600" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            ¡Registro Exitoso!
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Ya estás participando en el sorteo. ¡Mucha suerte!
          </p>
          <button
            onClick={() => setSuccess(false)}
            className="w-full px-6 py-3 bg-gradient-to-r from-primary-600 to-orange-600 text-white font-semibold rounded-xl hover:from-primary-700 hover:to-orange-700 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            Registrar otra persona
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-orange-50 to-primary-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 mb-6 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-r from-primary-600 to-orange-600 rounded-full p-4">
              <Gift className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Participa en el Sorteo
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Completa tus datos y participa por los premios que están bajo este QR al finalizar el evento
          </p>
          <div className="flex justify-center items-center space-x-2 text-primary-600">
            <QrCode className="h-6 w-6" />
            <span className="font-semibold">Escanea el QR para ver los premios</span>
          </div>
        </div>

        {/* Formulario */}
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-red-700 text-center">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nombre */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  placeholder="Ej: Juan"
                />
              </div>

              {/* Apellido */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Apellido <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.apellido}
                  onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  placeholder="Ej: Pérez"
                />
              </div>
            </div>

            {/* RUT */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                RUT <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.rut}
                onChange={handleRutChange}
                required
                maxLength={12}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="Ej: 12.345.678-9"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                placeholder="correo@ejemplo.com"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Edad */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Edad <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.edad}
                  onChange={(e) => setFormData({ ...formData, edad: e.target.value })}
                  required
                  min="18"
                  max="120"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  placeholder="Ej: 25"
                />
              </div>

              {/* Teléfono */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Teléfono <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  placeholder="Ej: +56912345678"
                />
              </div>
            </div>

            {/* Botón Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-4 bg-gradient-to-r from-primary-600 to-orange-600 text-white font-bold text-lg rounded-xl hover:from-primary-700 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Registrando...</span>
                </>
              ) : (
                <>
                  <Gift className="h-5 w-5" />
                  <span>Participar en el Sorteo</span>
                </>
              )}
            </button>

            <p className="text-sm text-gray-500 text-center">
              * Todos los campos son obligatorios
            </p>
          </form>
        </div>

        {/* Footer informativo */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>
            Al participar, aceptas compartir tus datos para el sorteo.<br />
            Los ganadores serán contactados por email o teléfono.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ParticipaPage;
