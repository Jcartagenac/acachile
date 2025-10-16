import React, { useState, useEffect } from 'react';
import { useAvatarPersistence } from '../../hooks/useImagePersistence';
import { useAuth } from '../../contexts/AuthContext';
import { UserProfile } from '../../services/userService';
import { useUserService } from '../../hooks/useUserService';
import { useImageService } from '../../hooks/useImageService';
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
  AlertCircle
} from 'lucide-react';

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
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    direccion: '',
    avatar: '',
    region: ''
  });

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
        setProfile(response.data);
        // Priorizar avatar persistido sobre el del perfil
        const avatarToUse = persistedAvatarUrl || response.data.avatar || '';
        
        setFormData({
          firstName: response.data.firstName,
          lastName: response.data.lastName,
          email: response.data.email,
          phone: response.data.phone || '',
          direccion: response.data.direccion || '',
          avatar: avatarToUse,
          region: response.data.region || ''
        });
        console.log('✅ ProfileModule: Profile loaded successfully', response.data);
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

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);
    
    try {
      console.log('💾 ProfileModule: Saving profile data:', formData);
      const response = await userService.updateProfile(formData);
      console.log('📊 ProfileModule: Update response:', response);
      
      if (response.success && response.data) {
        setProfile(response.data);
        setMessage({ type: 'success', text: response.message || 'Perfil actualizado exitosamente' });
        setIsEditing(false);
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
        region: profile.region || ''
      });
    }
    setIsEditing(false);
    setMessage(null);
  };

  // Calcular años en ACA desde el perfil
  const yearsInACA = profile?.acaMembership?.yearsActive || 0;
  const fechaIngreso = profile?.fechaIngreso ? new Date(profile.fechaIngreso) : new Date();
  
  // Determinar la URL del avatar a mostrar (priorizar avatar persistido)
  const displayAvatarUrl = persistedAvatarUrl || formData.avatar || profile?.avatar || '';

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
                  {yearsInACA} años en ACA
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
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    disabled={!isEditing}
                    className={`w-full pl-10 pr-4 py-3 bg-white/50 backdrop-blur-medium border border-white/30 rounded-xl shadow-soft-xs text-neutral-700 placeholder-neutral-500 transition-all duration-300 ${
                      isEditing 
                        ? 'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:shadow-soft-sm' 
                        : 'cursor-not-allowed opacity-75'
                    }`}
                    placeholder="+56 9 1234 5678"
                  />
                </div>
              </div>
            </div>

            {/* Dirección */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Dirección
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-5 h-5 text-neutral-400" />
                <textarea
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  disabled={!isEditing}
                  rows={3}
                  className={`w-full pl-10 pr-4 py-3 bg-white/50 backdrop-blur-medium border border-white/30 rounded-xl shadow-soft-xs text-neutral-700 placeholder-neutral-500 transition-all duration-300 resize-none ${
                    isEditing 
                      ? 'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:shadow-soft-sm' 
                      : 'cursor-not-allowed opacity-75'
                  }`}
                  placeholder="Tu dirección completa"
                />
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
              {user?.region || 'No especificada'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};