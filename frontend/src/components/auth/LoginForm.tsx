import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Mail, Lock, LogIn } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { logger } from '../../utils/logger';

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
      logger.auth.info('🔐 Iniciando proceso de login', { email: data.email });
      clearError();
      
      logger.time('login-form-submit');
      await login(data);
      logger.timeEnd('login-form-submit');
      
      logger.auth.info('✅ Login exitoso desde formulario');
      reset();
      onSuccess?.();
    } catch (error) {
      logger.auth.error('❌ Error en login desde formulario:', error);
      console.error('Error en login:', error);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="relative rounded-3xl border border-slate-200 bg-white/90 shadow-xl backdrop-blur-sm">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary-500 via-primary-500 to-primary-600" />

        <div className="px-8 py-10 sm:px-10 sm:py-12">
          <div className="flex flex-col items-center text-center gap-4 mb-8">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-500 ring-1 ring-primary-100">
              <LogIn className="h-7 w-7" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">
                Iniciar sesión
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Accede a tu cuenta para gestionar tus actividades en ACA Chile.
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-primary-200 bg-primary-50 px-4 py-3 text-sm text-primary-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">
                Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  {...register('email')}
                  type="email"
                  placeholder="tu-email@ejemplo.com"
                  className={`w-full rounded-2xl border border-slate-200 bg-slate-50/80 py-3 pl-12 pr-4 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-primary-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100 ${errors.email ? 'border-primary-300 focus:border-primary-400 focus:ring-primary-200' : ''}`}
                  autoComplete="email"
                />
              </div>
              {errors.email && (
                <p className="text-sm text-primary-500">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Tu contraseña"
                  className={`w-full rounded-2xl border border-slate-200 bg-slate-50/80 py-3 pl-12 pr-12 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-primary-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100 ${errors.password ? 'border-primary-300 focus:border-primary-400 focus:ring-primary-200' : ''}`}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-200"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <Eye className="h-5 w-5" aria-hidden="true" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-primary-500">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full rounded-2xl bg-gradient-to-r from-primary-500 to-primary-600 px-4 py-3 text-base font-semibold text-white shadow-lg shadow-primary-200/70 transition hover:from-primary-600 hover:to-primary-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${isLoading ? 'cursor-not-allowed opacity-80' : ''}`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Iniciando sesión...
                </div>
              ) : (
                'Iniciar sesión'
              )}
            </button>

            <div className="space-y-3 text-center text-sm text-slate-500">
              <button
                type="button"
                onClick={onSwitchToRegister}
                className="font-semibold text-primary-600 transition hover:text-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                ¿No tienes cuenta? Regístrate aquí
              </button>
              <div>
                <Link
                  to="/forgot-password"
                  className="font-medium text-slate-500 transition hover:text-slate-700"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
