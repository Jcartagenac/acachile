import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Mail, Lock, LogIn } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'El email es requerido')
    .email('Email inválido'),
  password: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToRegister?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ 
  onSuccess, 
  onSwitchToRegister 
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, error, clearError } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      clearError();
      await login(data);
      reset();
      onSuccess?.();
    } catch (error) {
      // El error ya está manejado en el contexto
      console.error('Error en login:', error);
    }
  };

  return (
    <div 
      className="w-full max-w-md mx-auto p-8 rounded-3xl"
      style={{ 
        backgroundColor: '#e8ecf4',
        boxShadow: '20px 20px 40px #bec8d7, -20px -20px 40px #ffffff'
      }}
    >
      <div className="text-center mb-8">
        <div 
          className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
          style={{ 
            backgroundColor: '#e8ecf4',
            boxShadow: 'inset 8px 8px 16px #bec8d7, inset -8px -8px 16px #ffffff'
          }}
        >
          <LogIn className="w-8 h-8" style={{ color: '#EF4444' }} />
        </div>
        <h2 className="text-2xl font-bold" style={{ color: '#374151' }}>
          Iniciar Sesión
        </h2>
        <p className="text-sm mt-2" style={{ color: '#6B7280' }}>
          Bienvenido de vuelta a ACA Chile
        </p>
      </div>

      {error && (
        <div 
          className="mb-6 p-4 rounded-2xl text-sm"
          style={{ 
            backgroundColor: '#FEE2E2',
            color: '#DC2626',
            border: '1px solid #FECACA'
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Email Field */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
            Email
          </label>
          <div className="relative">
            <div 
              className="flex items-center px-4 py-3 rounded-xl"
              style={{ 
                backgroundColor: '#e8ecf4',
                boxShadow: 'inset 6px 6px 12px #bec8d7, inset -6px -6px 12px #ffffff'
              }}
            >
              <Mail className="w-5 h-5 mr-3" style={{ color: '#6B7280' }} />
              <input
                {...register('email')}
                type="email"
                placeholder="tu-email@ejemplo.com"
                className="flex-1 bg-transparent outline-none text-sm"
                style={{ color: '#374151' }}
              />
            </div>
          </div>
          {errors.email && (
            <p className="mt-2 text-sm" style={{ color: '#DC2626' }}>
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
            Contraseña
          </label>
          <div className="relative">
            <div 
              className="flex items-center px-4 py-3 rounded-xl"
              style={{ 
                backgroundColor: '#e8ecf4',
                boxShadow: 'inset 6px 6px 12px #bec8d7, inset -6px -6px 12px #ffffff'
              }}
            >
              <Lock className="w-5 h-5 mr-3" style={{ color: '#6B7280' }} />
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                placeholder="Tu contraseña"
                className="flex-1 bg-transparent outline-none text-sm"
                style={{ color: '#374151' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="ml-3 focus:outline-none"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" style={{ color: '#6B7280' }} />
                ) : (
                  <Eye className="w-5 h-5" style={{ color: '#6B7280' }} />
                )}
              </button>
            </div>
          </div>
          {errors.password && (
            <p className="mt-2 text-sm" style={{ color: '#DC2626' }}>
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-4 rounded-xl font-bold text-white text-lg transition-all duration-300 ${
            isLoading 
              ? 'opacity-70 cursor-not-allowed' 
              : 'transform hover:scale-105'
          }`}
          style={{ 
            background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
            boxShadow: isLoading 
              ? 'none' 
              : '0 10px 20px rgba(239, 68, 68, 0.3)'
          }}
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Iniciando sesión...
            </div>
          ) : (
            'Iniciar Sesión'
          )}
        </button>

        {/* Switch to Register */}
        <div className="text-center">
          <p className="text-sm" style={{ color: '#6B7280' }}>
            ¿No tienes cuenta?{' '}
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="font-semibold hover:underline"
              style={{ color: '#EF4444' }}
            >
              Regístrate aquí
            </button>
          </p>
        </div>

        {/* Forgot Password */}
        <div className="text-center">
          <button
            type="button"
            className="text-sm hover:underline"
            style={{ color: '#6B7280' }}
          >
            ¿Olvidaste tu contraseña?
          </button>
        </div>
      </form>
    </div>
  );
};