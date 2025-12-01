import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';

// Esquema de validación
const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido').min(1, 'Email es requerido'),
});

type ForgotPasswordData = z.infer<typeof forgotPasswordSchema>;

const ForgotPasswordPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [resetToken, setResetToken] = useState(''); // Para desarrollo

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<ForgotPasswordData>({
    resolver: zodResolver(forgotPasswordSchema)
  });

  const email = watch('email');

  const onSubmit = async (data: ForgotPasswordData) => {
    setIsLoading(true);
    setError('');

    try {
      // Usar la URL base correcta (sin VITE_API_URL)
      const apiUrl = '/api/auth/forgot-password';
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      // Verificar si la respuesta es JSON antes de parsear
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
              Si existe una cuenta con el email <strong>{email}</strong>, 
              recibirás un enlace para restablecer tu contraseña.
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
              Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña
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

          <div>
            <label htmlFor="email" className="sr-only">
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition-all duration-200"
                placeholder="Tu email"
              />
            </div>
            {errors.email && (
              <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isLoading ? 'Enviando...' : 'Enviar enlace de recuperación'}
            </button>
          </div>

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