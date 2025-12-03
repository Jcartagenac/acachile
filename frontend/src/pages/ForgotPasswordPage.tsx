import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, ArrowLeft, CheckCircle, AlertCircle, Fingerprint } from 'lucide-react';

// Esquema de validación
const forgotPasswordSchema = z.object({
  rut: z
    .string()
    .min(1, 'El RUT es requerido')
    .regex(/^[0-9]+[-]?[0-9kK]{1}$/, 'RUT inválido (formato: 12345678-9)'),
});

type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;

// Función para normalizar RUT
const normalizeRut = (rut: string): string => {
  // Remover puntos, espacios y guiones
  const cleaned = rut.replace(/[.\s-]/g, '');
  
  // Si está vacío, retornar
  if (!cleaned) return '';
  
  // Separar cuerpo y dígito verificador
  const body = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1).toUpperCase();
  
  // Retornar en formato 12345678-9
  return `${body}-${dv}`;
};

const ForgotPasswordPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [resetToken, setResetToken] = useState(''); // Para desarrollo
  const [userEmail, setUserEmail] = useState(''); // Email del usuario encontrado
  const [showConfirmation, setShowConfirmation] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue
  } = useForm<ForgotPasswordData>({
    resolver: zodResolver(forgotPasswordSchema)
  });

  const rut = watch('rut');

  const rut = watch('rut');

  // Normalizar RUT mientras el usuario escribe
  const handleRutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const normalized = normalizeRut(value);
    setValue('rut', normalized);
  };

  // Buscar usuario por RUT
  const handleFindUser = async (data: ForgotPasswordData) => {
    setIsLoading(true);
    setError('');

    try {
      // Buscar usuario por RUT
      const response = await fetch(`/api/auth/find-user-by-rut`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rut: data.rut }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'No se encontró un usuario con ese RUT');
      }

      // Mostrar email y confirmación
      setUserEmail(result.data.email);
      setShowConfirmation(true);

    } catch (err: any) {
      console.error('Error buscando usuario:', err);
      setError(err.message || 'Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  // Enviar email de recuperación
  const handleSendReset = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rut }),
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('La respuesta del servidor no es JSON. Por favor, contacta al administrador.');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Error al procesar la solicitud');
      }

      setIsSubmitted(true);
      
      // En desarrollo, mostrar el token
      if (result.resetToken) {
        setResetToken(result.resetToken);
      }

    } catch (err: any) {
      console.error('Error en forgot password:', err);
      setError(err.message || 'Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = showConfirmation ? handleSendReset : handleFindUser;

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Revisa tu Email
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Se ha enviado un enlace de recuperación al email <strong>{userEmail}</strong> asociado 
              al RUT <strong>{rut}</strong>.
            </p>
          </div>

          {/* Solo en desarrollo */}
          {resetToken && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="text-sm font-medium text-yellow-800 mb-2">
                🔧 Modo Desarrollo - Token de Reset:
              </h3>
              <code className="text-xs bg-yellow-100 p-2 rounded block break-all">
                {resetToken}
              </code>
              <Link 
                to={`/reset-password?token=${resetToken}`}
                className="mt-2 inline-block text-sm text-yellow-700 underline"
              >
                Ir directamente al reset de contraseña
              </Link>
            </div>
          )}

          <div className="space-y-4">
            <Link
              to="/auth"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all duration-200"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <Link 
            to="/auth"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver
          </Link>
          
          <div className="text-center">
            <Mail className="mx-auto h-12 w-12 text-orange-600" />
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              ¿Olvidaste tu contraseña?
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Ingresa tu RUT y confirma tu email para recibir un enlace de recuperación
            </p>
          </div>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {error && (
            <div className="rounded-md bg-red-50 p-4 border border-red-200">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Error
                  </h3>
                  <p className="mt-1 text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {!showConfirmation ? (
            <>
              <div>
                <label htmlFor="rut" className="sr-only">
                  RUT
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Fingerprint className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...register('rut')}
                    type="text"
                    autoComplete="username"
                    onChange={handleRutChange}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition-all duration-200"
                    placeholder="Tu RUT (12345678-9)"
                  />
                </div>
                {errors.rut && (
                  <p className="mt-2 text-sm text-red-600">{errors.rut.message}</p>
                )}
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {isLoading ? 'Buscando...' : 'Buscar cuenta'}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="rounded-md bg-blue-50 p-4 border border-blue-200">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-blue-400" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      Confirmación
                    </h3>
                    <p className="mt-2 text-sm text-blue-700">
                      Se enviará un enlace de recuperación al email:
                    </p>
                    <p className="mt-1 text-base font-semibold text-blue-900">
                      {userEmail}
                    </p>
                    <p className="mt-2 text-xs text-blue-600">
                      asociado al RUT: <strong>{rut}</strong>
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowConfirmation(false)}
                  className="flex-1 py-3 px-4 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all duration-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {isLoading ? 'Enviando...' : 'Confirmar y enviar'}
                </button>
              </div>
            </>
          )}

          <div className="text-center">
            <Link
              to="/auth"
              className="font-medium text-orange-600 hover:text-orange-500 text-sm transition-colors"
            >
              ¿Recordaste tu contraseña? Inicia sesión
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;