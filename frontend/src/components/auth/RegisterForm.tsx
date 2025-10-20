import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Mail, Lock, User, Phone, MapPin, UserPlus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { REGIONES_CHILE } from '@shared/index';

const registerSchema = z.object({
  email: z
    .string()
    .min(1, 'El email es requerido')
    .email('Email inválido'),
  password: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .max(100, 'La contraseña es demasiado larga'),
  confirmPassword: z
    .string()
    .min(1, 'Confirma tu contraseña'),
  name: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede tener más de 50 caracteres'),
  phone: z
    .string()
    .optional()
    .refine((val) => !val || /^\+?[1-9]\d{8,14}$/.test(val), 'Número de teléfono inválido'),
  region: z
    .string()
    .optional(),
  motivation: z
    .string()
    .min(10, 'Por favor cuéntanos un poco más (mín. 10 caracteres)')
    .max(500, 'Máximo 500 caracteres')
    .optional(),
  experience: z
    .string()
    .max(500, 'Máximo 500 caracteres')
    .optional(),
  references: z
    .string()
    .max(200, 'Máximo 200 caracteres')
    .optional(),
  preferredRole: z
    .enum(['user', 'organizer'], {
      errorMap: () => ({ message: 'Selecciona un rol válido' })
    })
    .optional()
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

interface RegisterFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ 
  onSuccess, 
  onSwitchToLogin 
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register: registerUser, isLoading, error, clearError } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      clearError();
      const { confirmPassword, ...registerData } = data;
      await registerUser({
        ...registerData,
        region: registerData.region || undefined
      });
      reset();
      onSuccess?.();
    } catch (error) {
      console.error('Error en registro:', error);
    }
  };

  const baseInput =
    'w-full rounded-2xl border border-slate-200 bg-slate-50/80 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-primary-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-100';
  const errorInput = 'border-primary-300 focus:border-primary-400 focus:ring-primary-200';
  const withIconPadding = 'pl-12 pr-4';
  const defaultPadding = 'px-4';

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="relative rounded-3xl border border-slate-200 bg-white/90 shadow-xl backdrop-blur-sm">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary-500 via-primary-500 to-primary-600" />

        <div className="px-8 py-10 sm:px-10 sm:py-12">
          <div className="flex flex-col items-center text-center gap-4 mb-8">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-500 ring-1 ring-primary-100">
              <UserPlus className="h-7 w-7" aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">
                Únete a ACA Chile
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Crea tu cuenta y forma parte de la comunidad.
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-6 rounded-xl border border-primary-200 bg-primary-50 px-4 py-3 text-sm text-primary-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">
                  Nombre completo *
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    {...register('name')}
                    type="text"
                    placeholder="Tu nombre completo"
                    className={`${baseInput} ${withIconPadding} ${errors.name ? errorInput : ''}`}
                    autoComplete="name"
                  />
                </div>
                {errors.name && (
                  <p className="text-sm text-primary-500">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">
                  Email *
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    {...register('email')}
                    type="email"
                    placeholder="tu-email@ejemplo.com"
                    className={`${baseInput} ${withIconPadding} ${errors.email ? errorInput : ''}`}
                    autoComplete="email"
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-primary-500">{errors.email.message}</p>
                )}
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">
                  Teléfono (opcional)
                </label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    {...register('phone')}
                    type="tel"
                    placeholder="+56 9 1234 5678"
                    className={`${baseInput} ${withIconPadding} ${errors.phone ? errorInput : ''}`}
                    autoComplete="tel"
                  />
                </div>
                {errors.phone && (
                  <p className="text-sm text-primary-500">{errors.phone.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">
                  Región (opcional)
                </label>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <select
                    {...register('region')}
                    className={`${baseInput} ${withIconPadding} appearance-none ${errors.region ? errorInput : ''}`}
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Selecciona tu región
                    </option>
                    {REGIONES_CHILE.map((region) => (
                      <option key={region} value={region}>
                        {region}
                      </option>
                    ))}
                  </select>
                </div>
                {errors.region && (
                  <p className="text-sm text-primary-500">{errors.region.message}</p>
                )}
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">
                  Contraseña *
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mínimo 6 caracteres"
                    className={`${baseInput} ${withIconPadding} ${errors.password ? errorInput : ''}`}
                    autoComplete="new-password"
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

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">
                  Confirmar contraseña *
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    {...register('confirmPassword')}
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Repite tu contraseña"
                    className={`${baseInput} ${withIconPadding} ${errors.confirmPassword ? errorInput : ''}`}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-200"
                    aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <Eye className="h-5 w-5" aria-hidden="true" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-primary-500">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full rounded-2xl bg-gradient-to-r from-primary-500 to-primary-600 px-4 py-3 text-base font-semibold text-white shadow-lg shadow-primary-200/70 transition hover:from-primary-600 hover:to-primary-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${isLoading ? 'cursor-not-allowed opacity-80' : ''}`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Creando cuenta...
                </div>
              ) : (
                'Crear cuenta'
              )}
            </button>

            <div className="text-center text-sm text-slate-500">
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="font-semibold text-primary-600 transition hover:text-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                ¿Ya tienes cuenta? Inicia sesión aquí
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
