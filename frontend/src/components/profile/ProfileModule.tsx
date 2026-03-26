import React, { useState, useEffect } from 'react';
import { useAvatarPersistence } from '../../hooks/useImagePersistence';
import { useAuth } from '../../contexts/AuthContext';
import { UserProfile } from '../../services/userService';
import { useUserService } from '../../hooks/useUserService';
import { useImageService } from '../../hooks/useImageService';
import { normalizeRut, normalizePhone, formatPhone } from '@shared/utils/validators';
import { AddressInput } from '../ui/AddressInput';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Camera,
  Edit2,
  Save,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
  Instagram
} from 'lucide-react';

/**
 * Limpia un valor de formulario: convierte strings vacíos en null
 */
const cleanFormValue = (value: string): string | null => {
  return value && value.trim() !== '' ? value.trim() : null;
};

const getSocialProfileData = (value: string) => {
  const raw = value?.trim() || '';
  if (!raw) return null;

  const normalized = raw.startsWith('http://') || raw.startsWith('https://')
    ? raw
    : raw.startsWith('@')
      ? `https://instagram.com/${raw.slice(1)}`
      : `https://instagram.com/${raw.replace(/^@/, '')}`;

  try {
    const url = new URL(normalized);
    const parts = url.pathname.split('/').filter(Boolean);
    const handle = parts[0] || raw.replace(/^@/, '');

    return {
      url: normalized,
      handle: handle ? `@${handle}` : raw,
    };
  } catch {
    const handle = raw.replace(/^@/, '');
    return {
      url: `https://instagram.com/${handle}`,
      handle: `@${handle}`,
    };
  }
};

export const ProfileModule: React.FC = () => {
  const { user, updateUser } = useAuth();
  const userService = useUserService();
  const imageService = useImageService();
  const { updateAvatar, avatarUrl: persistedAvatarUrl } = useAvatarPersistence();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    direccion: '',
    avatar: '',
    region: '',
    comuna: '',
    fechaNacimiento: '',
    redSocial: '',
    rut: '',
    ciudad: ''
  });
  const socialProfile = getSocialProfileData(formData.redSocial);

  // Cargar perfil al montar el componente
  useEffect(() => {
    loadProfile();
  }, []);

  // Reload profile when user data changes in AuthContext
  useEffect(() => {
    if (user) {
      console.log('👤 ProfileModule: User data changed, reloading profile');
      loadProfile();
    }
  }, [user]);

    const loadProfile = async () => {
    try {
      setIsLoading(true);
      setMessage(null);
      
      console.log('🔄 ProfileModule: Loading profile from userService');
      const response = await userService.getProfile();
      console.log('📊 ProfileModule: Profile response:', response);
      
      if (response.success && response.data) {
        console.log('🔍 ProfileModule: Raw response.data:', response.data);
        console.log('🔍 ProfileModule: comuna from response:', response.data.comuna);
        console.log('🔍 ProfileModule: fechaNacimiento from response:', response.data.fechaNacimiento);
        console.log('🔍 ProfileModule: redSocial from response:', response.data.redSocial);
        
        setProfile(response.data);
        // Priorizar avatar persistido sobre el del perfil
        const avatarToUse = persistedAvatarUrl || response.data.avatar || '';
        
        const newFormData = {
          firstName: response.data.firstName,
          lastName: response.data.lastName,
          email: response.data.email,
          phone: response.data.phone || '',
          direccion: response.data.direccion || '',
          avatar: avatarToUse,
          region: response.data.region || '',
          comuna: response.data.comuna || '',
          fechaNacimiento: response.data.fechaNacimiento || '',
          redSocial: response.data.redSocial || '',
          rut: response.data.rut || '',
          ciudad: response.data.ciudad || ''
        };
        
        console.log('🔍 ProfileModule: New formData:', newFormData);
        console.log('🔍 ProfileModule: formData.comuna:', newFormData.comuna);
        console.log('🔍 ProfileModule: formData.fechaNacimiento:', newFormData.fechaNacimiento);
        console.log('🔍 ProfileModule: formData.redSocial:', newFormData.redSocial);
        
        setFormData(newFormData);
        console.log('✅ ProfileModule: Profile loaded successfully');
      } else {
        setMessage({ type: 'error', text: response.error || 'Error cargando perfil' });
        console.error('❌ ProfileModule: Error loading profile:', response.error);
      }
    } catch (error) {
      console.error('❌ ProfileModule: Exception loading profile:', error);
      setMessage({ type: 'error', text: 'Error cargando perfil de usuario' });
    } finally {
      setIsLoading(false);
    }
  };

  const validateAndNormalizeFields = () => {
    const errors: Record<string, string> = {};

    // Validar RUT si está presente
    if (formData.rut.trim()) {
      try {
        console.log('🔍 Validando RUT:', formData.rut);
        const normalizedRut = normalizeRut(formData.rut);
        console.log('✅ RUT normalizado:', normalizedRut);
        setFormData(prev => ({ ...prev, rut: normalizedRut }));
      } catch (err) {
        console.error('❌ Error validando RUT:', err);
        errors.rut = err instanceof Error ? err.message : 'RUT inválido';
      }
    }

    // Validar teléfono si está presente
    if (formData.phone.trim()) {
      try {
        console.log('🔍 Validando teléfono:', formData.phone);
        const normalizedPhone = normalizePhone(formData.phone);
        console.log('✅ Teléfono normalizado:', normalizedPhone);
        setFormData(prev => ({ ...prev, telefono: normalizedPhone }));
      } catch (err) {
        console.error('❌ Error validando teléfono:', err);
        errors.telefono = err instanceof Error ? err.message : 'Teléfono inválido';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    // Validar y normalizar campos
    if (!validateAndNormalizeFields()) {
      setMessage({ type: 'error', text: 'Por favor corrige los errores en el formulario' });
      setIsSaving(false);
      return;
    }

    try {
      // Limpiar y preparar los datos antes de enviar
      const cleanedData = {
        ...formData,
        phone: cleanFormValue(formData.phone),
        rut: cleanFormValue(formData.rut),
        ciudad: cleanFormValue(formData.ciudad),
        comuna: cleanFormValue(formData.comuna),
        fechaNacimiento: cleanFormValue(formData.fechaNacimiento),
        redSocial: cleanFormValue(formData.redSocial),
        direccion: cleanFormValue(formData.direccion),
        region: cleanFormValue(formData.region),
      };

      console.log('💾 ProfileModule: Original formData:', JSON.stringify(formData, null, 2));
      console.log('💾 ProfileModule: Cleaned data:', JSON.stringify(cleanedData, null, 2));
      console.log('💾 ProfileModule: Sending cleaned data to API:', cleanedData);

      // Preparar datos para el servicio (usar nombres de campos del servicio)
      const serviceData = {
        firstName: cleanedData.firstName,
        lastName: cleanedData.lastName,
        phone: cleanedData.phone,
        rut: cleanedData.rut,
        ciudad: cleanedData.ciudad,
        comuna: cleanedData.comuna,
        fechaNacimiento: cleanedData.fechaNacimiento,
        redSocial: cleanedData.redSocial,
        direccion: cleanedData.direccion
      };

      console.log('📡 ProfileModule: Service payload:', JSON.stringify(serviceData, null, 2));
      console.log('📡 ProfileModule: Field values:', {
        firstName: `"${cleanedData.firstName}"`,
        lastName: `"${cleanedData.lastName}"`,
        phone: `"${cleanedData.phone}"`,
        rut: `"${cleanedData.rut}"`,
        ciudad: `"${cleanedData.ciudad}"`,
        direccion: `"${cleanedData.direccion}"`
      });
      const response = await userService.updateProfile(serviceData);
      console.log('📊 ProfileModule: Update response:', response);

      if (response.success && response.data) {
        setProfile(response.data);
        setMessage({ type: 'success', text: response.message || 'Perfil actualizado exitosamente' });
        setIsEditing(false);
        setValidationErrors({});
        console.log('✅ ProfileModule: Profile updated successfully');

        // Reload profile to ensure we have the latest data from AuthContext
        setTimeout(() => {
          loadProfile();
        }, 100);
      } else {
        setMessage({ type: 'error', text: response.error || 'Error actualizando perfil' });
        console.error('❌ ProfileModule: Error updating profile:', response.error);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error actualizando perfil' });
      console.error('❌ ProfileModule: Exception updating profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        phone: profile.phone || '',
        direccion: profile.direccion || '',
        avatar: profile.avatar || '',
        region: profile.region || '',
        comuna: profile.comuna || '',
        fechaNacimiento: profile.fechaNacimiento || '',
        redSocial: profile.redSocial || '',
        rut: profile.rut || '',
        ciudad: profile.ciudad || ''
      });
    }
    setIsEditing(false);
    setMessage(null);
  };

  // Calcular años y meses en ACA desde la fecha de ingreso
  const calculateTimeInACA = () => {
    if (!profile?.fechaIngreso) return '0 meses';
    
    const fechaIngreso = new Date(profile.fechaIngreso);
    const hoy = new Date();
    
    let años = hoy.getFullYear() - fechaIngreso.getFullYear();
    let meses = hoy.getMonth() - fechaIngreso.getMonth();
    
    // Ajustar si los meses son negativos
    if (meses < 0) {
      años--;
      meses += 12;
    }
    
    // Construir el string de respuesta
    if (años === 0 && meses === 0) {
      return 'Menos de 1 mes';
    } else if (años === 0) {
      return `${meses} ${meses === 1 ? 'mes' : 'meses'}`;
    } else if (meses === 0) {
      return `${años} ${años === 1 ? 'año' : 'años'}`;
    } else {
      return `${años} ${años === 1 ? 'año' : 'años'} y ${meses} ${meses === 1 ? 'mes' : 'meses'}`;
    }
  };
  
  const timeInACA = calculateTimeInACA();
  const fechaIngreso = profile?.fechaIngreso ? new Date(profile.fechaIngreso) : new Date();
  
  // Determinar la URL del avatar a mostrar (priorizar avatar persistido)
  const displayAvatarUrl = persistedAvatarUrl || formData.avatar || profile?.avatar || '';

  const handleRutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    console.log('🔄 Profile RUT onChange - Input value:', `"${value}"`);

    // Limpiar errores previos
    if (validationErrors.rut) {
      setValidationErrors(prev => ({ ...prev, rut: '' }));
    }

    // Remover puntos automáticamente - solo permitir números, K/k y guiones
    const cleanedValue = value.replace(/\./g, '').replace(/[^0-9kK\-]/g, '');
    console.log('🔤 Profile RUT cleaned (no dots):', `"${cleanedValue}"`);

    // Normalizar en tiempo real al formato 12345678-9 (sin puntos)
    let normalizedValue = cleanedValue;
    if (cleanedValue.trim()) {
      try {
        // Remover guiones existentes para limpiar
        const withoutDash = cleanedValue.replace(/\-/g, '');
        if (withoutDash.length > 1) {
          // Agregar guión antes del último dígito
          const body = withoutDash.slice(0, -1);
          const dv = withoutDash.slice(-1).toUpperCase();
          normalizedValue = `${body}-${dv}`;
        }
        console.log('📝 Profile RUT normalized:', `"${normalizedValue}"`);
      } catch (err) {
        console.error('❌ Error normalizing RUT live:', err);
        normalizedValue = cleanedValue;
      }
    }

    console.log('💾 Profile RUT final value:', `"${normalizedValue}"`);
    setFormData({ ...formData, rut: normalizedValue });

    // Mantener el foco en el input después de actualizar el estado
    setTimeout(() => {
      const input = e.target as HTMLInputElement;
      const len = normalizedValue.length;
      input.setSelectionRange(len, len);
    }, 0);
  };

  const handleRutBlur = () => {
    // Validar completamente al perder foco
    if (formData.rut.trim()) {
      try {
        console.log('🔍 Profile validating RUT on blur:', formData.rut);
        const normalizedRut = normalizeRut(formData.rut);
        console.log('✅ Profile RUT normalized final:', normalizedRut);
        setFormData(prev => ({ ...prev, rut: normalizedRut }));
        setValidationErrors(prev => ({ ...prev, rut: '' }));
      } catch (err) {
        console.error('❌ Profile error validating RUT final:', err);
        setValidationErrors(prev => ({
          ...prev,
          rut: err instanceof Error ? err.message : 'RUT inválido'
        }));
        // Si es inválido, limpiar el campo
        setFormData(prev => ({ ...prev, rut: '' }));
      }
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    console.log('🔄 Profile Phone onChange - Input value:', `"${value}"`);

    // Limpiar errores previos
    if (validationErrors.telefono) {
      setValidationErrors(prev => ({ ...prev, telefono: '' }));
    }

    // Permitir números y +
    const allowedChars = value.replace(/[^0-9+]/g, '');
    console.log('🔤 Profile Phone allowed chars:', `"${allowedChars}"`);

    // Formatear en tiempo real mientras escribe (sin validar)
    let formattedValue = allowedChars;
    if (allowedChars.trim()) {
      try {
        formattedValue = formatPhone(allowedChars);
        console.log('📝 Profile Phone formatted:', `"${formattedValue}"`);
      } catch (err) {
        console.error('❌ Error formatting phone live:', err);
        // Si hay error, mantener el valor limpio
        formattedValue = allowedChars;
      }
    }

    console.log('💾 Profile Phone final value:', `"${formattedValue}"`);
    setFormData({ ...formData, phone: formattedValue });

    // Mantener el foco en el input después de actualizar el estado
    setTimeout(() => {
      const input = e.target as HTMLInputElement;
      const len = formattedValue.length;
      input.setSelectionRange(len, len);
    }, 0);
  };

  const handlePhoneBlur = () => {
    // Validar completamente al perder foco
    if (formData.phone.trim()) {
      try {
        console.log('🔍 Profile validating phone on blur:', formData.phone);
        const normalizedPhone = normalizePhone(formData.phone);
        console.log('✅ Profile phone normalized final:', normalizedPhone);
        setFormData(prev => ({ ...prev, phone: normalizedPhone }));
        setValidationErrors(prev => ({ ...prev, telefono: '' }));
      } catch (err) {
        console.error('❌ Profile error validating phone final:', err);
        setValidationErrors(prev => ({
          ...prev,
          telefono: err instanceof Error ? err.message : 'Teléfono inválido'
        }));
        // Si es inválido, limpiar el campo
        setFormData(prev => ({ ...prev, phone: '' }));
      }
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setMessage(null);

    try {
      console.log('🖼️ Subiendo avatar a Cloudflare R2...');
      const response = await imageService.uploadAvatar(file);
      
      if (response.success && response.data) {
        const avatarUrl = response.data.publicUrl;
        const filename = response.data.filename;
        
        // Actualizar estado local
        setFormData({ ...formData, avatar: avatarUrl });
        
        // Persistir en cache con hook especializado
        updateAvatar(avatarUrl, filename);
        
        // Actualizar perfil visual inmediatamente
        if (profile) {
          setProfile({ ...profile, avatar: avatarUrl });
        }
        
        // 🔄 Actualizar avatar en AuthContext para que se refleje en toda la app
        updateUser({ avatar: avatarUrl });
        console.log('🔄 Avatar actualizado en AuthContext:', { avatarUrl });
        
        setMessage({ 
          type: 'success', 
          text: 'Avatar actualizado en toda la aplicación' 
        });
        
        console.log('✅ Avatar persistido en R2 y cache:', { avatarUrl, filename });
        
        // Sincronizar con AuthContext
        setTimeout(() => {
          loadProfile();
        }, 100);
      } else {
        setMessage({ type: 'error', text: response.error || 'Error subiendo imagen a R2' });
      }
    } catch (error) {
      console.error('❌ Error subiendo avatar:', error);
      setMessage({ type: 'error', text: 'Error subiendo imagen. Inténtalo nuevamente.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Mostrar estado de carga inicial
  if (isLoading && !profile) {
    return (
      <div className="bg-white/60 backdrop-blur-soft border border-white/30 rounded-2xl shadow-soft-lg p-6">
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-3">
            <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
            <span className="text-neutral-600">Cargando perfil...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/60 backdrop-blur-soft border border-white/30 rounded-2xl shadow-soft-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-neutral-700">Mi Perfil</h2>
          <button
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            disabled={isSaving}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl shadow-soft-sm hover:shadow-soft-md transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isEditing ? (
              isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Guardar</span>
                </>
              )
            ) : (
              <>
                <Edit2 className="w-4 h-4" />
                <span>Editar</span>
              </>
            )}
          </button>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`mb-6 p-4 rounded-xl border ${
            message.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-700' 
              : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            <div className="flex items-center space-x-2">
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <span className="font-medium">{message.text}</span>
            </div>
          </div>
        )}

        {/* Profile Photo Section */}
        <div className="flex flex-col sm:flex-row sm:items-start space-y-6 sm:space-y-0 sm:space-x-8 mb-8">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div 
                className="rounded-full bg-gradient-to-r from-primary-600 to-primary-500 shadow-soft-lg overflow-hidden"
                style={{
                  width: '128px',
                  height: '128px',
                  minWidth: '128px',
                  minHeight: '128px',
                  maxWidth: '128px',
                  maxHeight: '128px'
                }}
              >
                {displayAvatarUrl ? (
                  <div style={{
                    width: '128px',
                    height: '128px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    position: 'relative',
                    backgroundColor: '#f3f4f6'
                  }}>
                    <img
                      src={displayAvatarUrl}
                      alt="Foto de perfil"
                      style={{ 
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        objectPosition: 'center top',
                        display: 'block'
                      }}
                      onError={(e) => {
                        // Fallback si la imagen no carga
                        console.warn('⚠️ Error cargando avatar:', displayAvatarUrl);
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  </div>
                ) : (
                  <div 
                    style={{
                      width: '128px',
                      height: '128px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <span className="text-white font-bold text-4xl">
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                )}
              </div>
              {isEditing && (
                <label className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full shadow-soft-sm flex items-center justify-center cursor-pointer hover:shadow-soft-md transition-shadow">
                  <Camera className="w-4 h-4 text-primary-600" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            
            <div className="text-center">
              <p className="text-lg font-semibold text-neutral-700">{user?.name}</p>
              <p className="text-sm text-neutral-500">Miembro desde {fechaIngreso.getFullYear()}</p>
              <div className="mt-2 px-3 py-1 bg-gradient-to-r from-green-100 to-green-50 border border-green-200 rounded-full">
                <span className="text-sm font-medium text-green-700">
                  {timeInACA} en ACA
                </span>
              </div>
            </div>
          </div>

          {/* Personal Info */}
          <div className="flex-1 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Nombre
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    disabled={!isEditing}
                    className={`w-full pl-10 pr-4 py-3 bg-white/50 backdrop-blur-medium border border-white/30 rounded-xl shadow-soft-xs text-neutral-700 placeholder-neutral-500 transition-all duration-300 ${
                      isEditing 
                        ? 'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:shadow-soft-sm' 
                        : 'cursor-not-allowed opacity-75'
                    }`}
                    placeholder="Tu nombre"
                  />
                </div>
              </div>

              {/* Apellido */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Apellido
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    disabled={!isEditing}
                    className={`w-full pl-10 pr-4 py-3 bg-white/50 backdrop-blur-medium border border-white/30 rounded-xl shadow-soft-xs text-neutral-700 placeholder-neutral-500 transition-all duration-300 ${
                      isEditing 
                        ? 'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:shadow-soft-sm' 
                        : 'cursor-not-allowed opacity-75'
                    }`}
                    placeholder="Tu apellido"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={!isEditing}
                    className={`w-full pl-10 pr-4 py-3 bg-white/50 backdrop-blur-medium border border-white/30 rounded-xl shadow-soft-xs text-neutral-700 placeholder-neutral-500 transition-all duration-300 ${
                      isEditing 
                        ? 'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:shadow-soft-sm' 
                        : 'cursor-not-allowed opacity-75'
                    }`}
                    placeholder="tu@email.com"
                  />
                </div>
              </div>

              {/* Teléfono */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Teléfono
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    onBlur={handlePhoneBlur}
                    disabled={!isEditing}
                    className={`w-full pl-10 pr-4 py-3 bg-white/50 backdrop-blur-medium border rounded-xl shadow-soft-xs text-neutral-700 placeholder-neutral-500 transition-all duration-300 ${
                      isEditing
                        ? 'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:shadow-soft-sm'
                        : 'cursor-not-allowed opacity-75'
                    } ${validationErrors.telefono ? 'border-red-500' : 'border-white/30'}`}
                    placeholder="+56 9 1234 5678"
                  />
                  {validationErrors.telefono && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.telefono}</p>
                  )}
                </div>
              </div>

              {/* RUT */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  RUT (sin puntos)
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input
                    type="text"
                    value={formData.rut}
                    onChange={handleRutChange}
                    onBlur={handleRutBlur}
                    disabled={!isEditing}
                    className={`w-full pl-10 pr-4 py-3 bg-white/50 backdrop-blur-medium border rounded-xl shadow-soft-xs text-neutral-700 placeholder-neutral-500 transition-all duration-300 ${
                      isEditing
                        ? 'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:shadow-soft-sm'
                        : 'cursor-not-allowed opacity-75'
                    } ${validationErrors.rut ? 'border-red-500' : 'border-white/30'}`}
                    placeholder="12345678-9"
                  />
                  {validationErrors.rut && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.rut}</p>
                  )}
                </div>
                {isEditing && (
                  <p className="mt-1 text-xs text-neutral-500">
                    ⚠️ Importante: Ingresa tu RUT sin puntos, solo con guión (ej: 12345678-9)
                  </p>
                )}
              </div>

              {/* Región */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Región
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input
                    type="text"
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    disabled={!isEditing}
                    className={`w-full pl-10 pr-4 py-3 bg-white/50 backdrop-blur-medium border border-white/30 rounded-xl shadow-soft-xs text-neutral-700 placeholder-neutral-500 transition-all duration-300 ${
                      isEditing 
                        ? 'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:shadow-soft-sm' 
                        : 'cursor-not-allowed opacity-75'
                    }`}
                    placeholder="Metropolitana de Santiago, Valparaíso, etc."
                  />
                </div>
              </div>

              {/* Comuna */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Comuna
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input
                    type="text"
                    value={formData.comuna}
                    onChange={(e) => setFormData({ ...formData, comuna: e.target.value })}
                    disabled={!isEditing}
                    className={`w-full pl-10 pr-4 py-3 bg-white/50 backdrop-blur-medium border border-white/30 rounded-xl shadow-soft-xs text-neutral-700 placeholder-neutral-500 transition-all duration-300 ${
                      isEditing 
                        ? 'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:shadow-soft-sm' 
                        : 'cursor-not-allowed opacity-75'
                    }`}
                    placeholder="Las Condes, Providencia, etc."
                  />
                </div>
              </div>

              {/* Fecha de Nacimiento */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Fecha de Nacimiento
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input
                    type="date"
                    value={formData.fechaNacimiento}
                    onChange={(e) => setFormData({ ...formData, fechaNacimiento: e.target.value })}
                    disabled={!isEditing}
                    className={`w-full pl-10 pr-4 py-3 bg-white/50 backdrop-blur-medium border border-white/30 rounded-xl shadow-soft-xs text-neutral-700 placeholder-neutral-500 transition-all duration-300 ${
                      isEditing 
                        ? 'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:shadow-soft-sm' 
                        : 'cursor-not-allowed opacity-75'
                    }`}
                  />
                </div>
              </div>

              {/* Red Social */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Red Social (Instagram, Facebook, etc.)
                </label>
                {isEditing ? (
                  <div className="relative">
                    <Instagram className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                    <input
                      type="url"
                      value={formData.redSocial}
                      onChange={(e) => setFormData({ ...formData, redSocial: e.target.value })}
                      disabled={!isEditing}
                      placeholder="https://instagram.com/tu_usuario"
                      className={`w-full pl-10 pr-4 py-3 bg-white/50 backdrop-blur-medium border border-white/30 rounded-xl shadow-soft-xs text-neutral-700 placeholder-neutral-500 transition-all duration-300 ${
                        isEditing 
                          ? 'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:shadow-soft-sm' 
                          : 'cursor-not-allowed opacity-75'
                      }`}
                    />
                  </div>
                ) : socialProfile ? (
                  <a
                    href={socialProfile.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center gap-3 rounded-xl border border-white/30 bg-white/50 px-4 py-3 text-neutral-700 shadow-soft-xs transition-all duration-300 hover:text-primary-700"
                  >
                    <Instagram className="w-5 h-5 text-neutral-400" />
                    <span className="font-medium">{socialProfile.handle}</span>
                  </a>
                ) : (
                  <div className="inline-flex w-full items-center gap-3 rounded-xl border border-white/30 bg-white/50 px-4 py-3 text-neutral-400 shadow-soft-xs">
                    <Instagram className="w-5 h-5" />
                    <span>Sin red social registrada</span>
                  </div>
                )}
              </div>
            </div>

            {/* Dirección */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Dirección
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-5 h-5 text-neutral-400 z-10" />
                <div className="pl-10">
                  <AddressInput
                    value={formData.direccion}
                    onChange={(value) => setFormData({ ...formData, direccion: value })}
                    disabled={!isEditing}
                    placeholder="Tu dirección completa"
                    className={`bg-white/50 backdrop-blur-medium border border-white/30 rounded-xl shadow-soft-xs text-neutral-700 placeholder-neutral-500 transition-all duration-300 ${
                      isEditing
                        ? 'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:shadow-soft-sm'
                        : 'cursor-not-allowed opacity-75'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Botones de acción cuando está editando */}
            {isEditing && (
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleSave}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-xl shadow-soft-sm hover:shadow-soft-md transition-all duration-300 hover:scale-105"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar Cambios</span>
                </button>
                <button
                  onClick={handleCancel}
                  className="flex items-center space-x-2 px-6 py-3 bg-white/60 backdrop-blur-medium border border-white/30 text-neutral-700 rounded-xl shadow-soft-sm hover:shadow-soft-md transition-all duration-300 hover:scale-105"
                >
                  <X className="w-4 h-4" />
                  <span>Cancelar</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Información adicional */}
        <div className="grid md:grid-cols-3 gap-6 pt-6 border-t border-neutral-200/50">
          <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-blue-25 border border-blue-200/50 rounded-xl">
            <Calendar className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-blue-700">Fecha de Ingreso</p>
            <p className="text-lg font-bold text-blue-800">
              {fechaIngreso.toLocaleDateString('es-CL')}
            </p>
          </div>

          <div className="text-center p-4 bg-gradient-to-r from-green-50 to-green-25 border border-green-200/50 rounded-xl">
            <User className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-green-700">Estado</p>
            <p className="text-lg font-bold text-green-800">Activo</p>
          </div>

          <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-purple-25 border border-purple-200/50 rounded-xl">
            <MapPin className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-purple-700">Región</p>
            <p className="text-lg font-bold text-purple-800">
              {formData.region || profile?.region || 'No especificada'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};