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
          <UserPlus className="w-8 h-8" style={{ color: '#EF4444' }} />
        </div>
        <h2 className="text-2xl font-bold" style={{ color: '#374151' }}>
          Únete a ACA Chile
        </h2>
        <p className="text-sm mt-2" style={{ color: '#6B7280' }}>
          Crea tu cuenta y forma parte de la comunidad
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
        {/* Name Field */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
            Nombre Completo *
          </label>
          <div className="relative">
            <div 
              className="flex items-center px-4 py-3 rounded-xl"
              style={{ 
                backgroundColor: '#e8ecf4',
                boxShadow: 'inset 6px 6px 12px #bec8d7, inset -6px -6px 12px #ffffff'
              }}
            >
              <User className="w-5 h-5 mr-3" style={{ color: '#6B7280' }} />
              <input
                {...register('name')}
                type="text"
                placeholder="Tu nombre completo"
                className="flex-1 bg-transparent outline-none text-sm"
                style={{ color: '#374151' }}
              />
            </div>
          </div>
          {errors.name && (
            <p className="mt-2 text-sm" style={{ color: '#DC2626' }}>
              {errors.name.message}
            </p>
          )}
        </div>

        {/* Email Field */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
            Email *
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

        {/* Phone Field */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
            Teléfono (opcional)
          </label>
          <div className="relative">
            <div 
              className="flex items-center px-4 py-3 rounded-xl"
              style={{ 
                backgroundColor: '#e8ecf4',
                boxShadow: 'inset 6px 6px 12px #bec8d7, inset -6px -6px 12px #ffffff'
              }}
            >
              <Phone className="w-5 h-5 mr-3" style={{ color: '#6B7280' }} />
              <input
                {...register('phone')}
                type="tel"
                placeholder="+56 9 1234 5678"
                className="flex-1 bg-transparent outline-none text-sm"
                style={{ color: '#374151' }}
              />
            </div>
          </div>
          {errors.phone && (
            <p className="mt-2 text-sm" style={{ color: '#DC2626' }}>
              {errors.phone.message}
            </p>
          )}
        </div>

        {/* Region Field */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
            Región (opcional)
          </label>
          <div className="relative">
            <div 
              className="flex items-center px-4 py-3 rounded-xl"
              style={{ 
                backgroundColor: '#e8ecf4',
                boxShadow: 'inset 6px 6px 12px #bec8d7, inset -6px -6px 12px #ffffff'
              }}
            >
              <MapPin className="w-5 h-5 mr-3" style={{ color: '#6B7280' }} />
              <select
                {...register('region')}
                className="flex-1 bg-transparent outline-none text-sm"
                style={{ color: '#374151' }}
              >
                <option value="">Selecciona tu región</option>
                {REGIONES_CHILE.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {errors.region && (
            <p className="mt-2 text-sm" style={{ color: '#DC2626' }}>
              {errors.region.message}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
            Contraseña *
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
                placeholder="Mínimo 6 caracteres"
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

        {/* Confirm Password Field */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
            Confirmar Contraseña *
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
                {...register('confirmPassword')}
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirma tu contraseña"
                className="flex-1 bg-transparent outline-none text-sm"
                style={{ color: '#374151' }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="ml-3 focus:outline-none"
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-5 h-5" style={{ color: '#6B7280' }} />
                ) : (
                  <Eye className="w-5 h-5" style={{ color: '#6B7280' }} />
                )}
              </button>
            </div>
          </div>
          {errors.confirmPassword && (
            <p className="mt-2 text-sm" style={{ color: '#DC2626' }}>
              {errors.confirmPassword.message}
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
              Creando cuenta...
            </div>
          ) : (
            'Crear Cuenta'
          )}
        </button>

        {/* Switch to Login */}
        <div className="text-center">
          <p className="text-sm" style={{ color: '#6B7280' }}>
            ¿Ya tienes cuenta?{' '}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="font-semibold hover:underline"
              style={{ color: '#EF4444' }}
            >
              Inicia sesión
            </button>
          </p>
        </div>
      </form>
    </div>
  );
};
