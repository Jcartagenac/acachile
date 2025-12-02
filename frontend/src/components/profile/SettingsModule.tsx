import React, { useState, useEffect } from 'react';
import {
  Lock,
  Bell,
  Mail,
  MessageCircle,
  Smartphone,
  Eye,
  EyeOff,
  Check,
  AlertTriangle,
  Save,
  Settings as SettingsIcon,
  Loader2,
  Shield,
  MapPin,
  Fingerprint,
  Cake
} from 'lucide-react';
import { NotificationPreferences } from '@shared/index';
import type { PrivacyPreferences } from '../../services/userService';
import { useUserService } from '../../hooks/useUserService';

interface PasswordChangeForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

type SettingsSection = 'password' | 'notifications' | 'privacy';

export const SettingsModule: React.FC = () => {
  const userService = useUserService();
  const [activeSection, setActiveSection] = useState<SettingsSection>('password');
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  const [passwordForm, setPasswordForm] = useState<PasswordChangeForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [notifications, setNotifications] = useState<NotificationPreferences>({
    noticiasImportantes: true,
    noticiasCorrientes: false,
    comunicadosUrgentes: true,
    medios: {
      email: true,
      whatsapp: true,
    sms: false
    }
  });

  const [privacy, setPrivacy] = useState<PrivacyPreferences>({
    showEmail: false,
    showPhone: false,
    showRut: false,
    showAddress: false,
    showRegionComuna: false,
    showBirthdate: false,
    showPublicProfile: true
  });

  // Load notification preferences on component mount
  useEffect(() => {
    const loadNotificationPreferences = async () => {
      const response = await userService.getNotificationPreferences();
      if (response.success && response.data) {
        setNotifications(response.data);
      }
    };
    
    loadNotificationPreferences();
  }, []);

  useEffect(() => {
    const loadPrivacyPreferences = async () => {
      const response = await userService.getPrivacyPreferences();
      if (response.success && response.data) {
        setPrivacy(response.data);
      }
    };

    loadPrivacyPreferences();
  }, []);

  const [isLoading, setIsLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const handlePasswordChange = (field: keyof PasswordChangeForm, value: string) => {
    setPasswordForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setSaveMessage({ type: 'error', message: 'Las contraseñas no coinciden' });
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setSaveMessage({ type: 'error', message: 'La contraseña debe tener al menos 8 caracteres' });
      return;
    }

    setIsLoading(true);
    setSaveMessage(null);
    
    try {
      const response = await userService.changePassword(
        passwordForm.currentPassword, 
        passwordForm.newPassword
      );
      
      if (response.success) {
        setSaveMessage({ type: 'success', message: response.message || 'Contraseña actualizada exitosamente' });
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setSaveMessage({ type: 'error', message: response.error || 'Error al cambiar la contraseña' });
      }
    } catch (error) {
      setSaveMessage({ type: 'error', message: 'Error al cambiar la contraseña' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationChange = (type: keyof Omit<NotificationPreferences, 'medios'>, value: boolean) => {
    setNotifications(prev => ({
      ...prev,
      [type]: value
    }));
  };

  const handleMethodChange = (method: keyof NotificationPreferences['medios'], value: boolean) => {
    setNotifications(prev => ({
      ...prev,
      medios: {
        ...prev.medios,
        [method]: value
      }
    }));
  };

  const handlePrivacyChange = (field: keyof PrivacyPreferences, value: boolean) => {
    setPrivacy((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const saveNotifications = async () => {
    setIsLoading(true);
    setSaveMessage(null);

    try {
      const response = await userService.updateNotificationPreferences(notifications);
      
      if (response.success) {
        setSaveMessage({ type: 'success', message: response.message || 'Preferencias de notificaciones guardadas' });
      } else {
        setSaveMessage({ type: 'error', message: response.error || 'Error al guardar las preferencias' });
      }
    } catch (error) {
      setSaveMessage({ type: 'error', message: 'Error al guardar las preferencias' });
    } finally {
      setIsLoading(false);
    }
  };

  const savePrivacySettings = async () => {
    setIsLoading(true);
    setSaveMessage(null);

    try {
      const response = await userService.updatePrivacyPreferences(privacy);

      if (response.success) {
        setSaveMessage({ type: 'success', message: response.message || 'Preferencias de privacidad actualizadas' });
      } else {
        setSaveMessage({ type: 'error', message: response.error || 'Error al guardar la privacidad' });
      }
    } catch (error) {
      setSaveMessage({ type: 'error', message: 'Error al guardar la privacidad' });
    } finally {
      setIsLoading(false);
    }
  };

  const sections: Array<{ id: SettingsSection; title: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'password', title: 'Cambiar Contraseña', icon: Lock },
    { id: 'notifications', title: 'Notificaciones', icon: Bell },
    { id: 'privacy', title: 'Privacidad', icon: Shield }
  ];

  const privacyOptions: Array<{
    key: keyof PrivacyPreferences;
    label: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    {
      key: 'showPublicProfile',
      label: 'Perfil público visible',
      description: 'Permite que otros socios encuentren tu perfil en el buscador público.',
      icon: Eye
    },
    {
      key: 'showEmail',
      label: 'Correo electrónico',
      description: 'Permite que otros socios vean tu email público para contactarte.',
      icon: Mail
    },
    {
      key: 'showPhone',
      label: 'Teléfono',
      description: 'Comparte tu número de contacto con quienes visiten tu perfil.',
      icon: Smartphone
    },
    {
      key: 'showAddress',
      label: 'Dirección',
      description: 'Muestra tu dirección completa en tu perfil público.',
      icon: MapPin
    },
    {
      key: 'showRegionComuna',
      label: 'Región y Comuna',
      description: 'Comparte tu región y comuna con la comunidad.',
      icon: MapPin
    },
    {
      key: 'showRut',
      label: 'RUT',
      description: 'Exhibe tu RUT en tu perfil público sólo si decides compartirlo.',
      icon: Fingerprint
    },
    {
      key: 'showBirthdate',
      label: 'Fecha de nacimiento',
      description: 'Permite que tu comunidad conozca tu fecha de cumpleaños.',
      icon: Cake
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/60 backdrop-blur-soft border border-white/30 rounded-2xl shadow-soft-lg p-6">
        <h2 className="text-2xl font-bold text-neutral-700 mb-6">Configuración</h2>

        {/* Section Navigation */}
        <div className="flex flex-wrap gap-2">
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            
            return (
              <button
                key={section.id}
                onClick={() => {
                  setActiveSection(section.id);
                  setSaveMessage(null);
                }}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-soft-sm'
                    : 'bg-white/50 hover:bg-white/70 text-neutral-700 hover:shadow-soft-xs'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{section.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Save Message */}
      {saveMessage && (
        <div className={`p-4 rounded-xl border ${
          saveMessage.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-700' 
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          <div className="flex items-center space-x-2">
            {saveMessage.type === 'success' ? (
              <Check className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
            <span className="font-medium">{saveMessage.message}</span>
          </div>
        </div>
      )}

      {/* Password Change Section */}
      {activeSection === 'password' && (
        <div className="bg-white/60 backdrop-blur-soft border border-white/30 rounded-2xl shadow-soft-lg p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-red-100 to-red-200 rounded-full flex items-center justify-center">
              <Lock className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-neutral-700">Cambiar Contraseña</h3>
              <p className="text-sm text-neutral-500">Actualiza tu contraseña para mantener tu cuenta segura</p>
            </div>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-4">
              {/* Current Password */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Contraseña Actual
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.current ? 'text' : 'password'}
                    value={passwordForm.currentPassword}
                    onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                    className="w-full pr-12 pl-4 py-3 bg-white/50 backdrop-blur-medium border border-white/30 rounded-xl shadow-soft-xs focus:outline-none focus:ring-2 focus:ring-primary-500 focus:shadow-soft-sm"
                    placeholder="Ingresa tu contraseña actual"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('current')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  >
                    {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Nueva Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                    className="w-full pr-12 pl-4 py-3 bg-white/50 backdrop-blur-medium border border-white/30 rounded-xl shadow-soft-xs focus:outline-none focus:ring-2 focus:ring-primary-500 focus:shadow-soft-sm"
                    placeholder="Mínimo 8 caracteres"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('new')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  >
                    {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Confirmar Nueva Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                    className="w-full pr-12 pl-4 py-3 bg-white/50 backdrop-blur-medium border border-white/30 rounded-xl shadow-soft-xs focus:outline-none focus:ring-2 focus:ring-primary-500 focus:shadow-soft-sm"
                    placeholder="Repite tu nueva contraseña"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('confirm')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  >
                    {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl shadow-soft-sm hover:shadow-soft-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Cambiando...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Cambiar Contraseña</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Privacy Section */}
      {activeSection === 'privacy' && (
        <div className="bg-white/60 backdrop-blur-soft border border-white/30 rounded-2xl shadow-soft-lg p-6 space-y-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-emerald-100 to-emerald-200 rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-neutral-700">Privacidad de Perfil</h3>
              <p className="text-sm text-neutral-500">Controla qué información personal es visible para la comunidad.</p>
            </div>
          </div>

          <div className="p-4 bg-white/40 backdrop-blur-soft border border-white/20 rounded-xl">
            <p className="text-sm text-neutral-600">
              Tu <strong>nombre y foto</strong> siempre son públicos para identificarte como socio activo. El resto de los datos son opcionales y puedes activarlos o desactivarlos cuando quieras.
            </p>
          </div>

          <div className="space-y-3">
            {privacyOptions.map((option) => {
              const OptionIcon = option.icon;
              const checked = privacy[option.key];

              return (
                <div
                  key={option.key}
                  className="flex items-center justify-between p-4 bg-white/40 backdrop-blur-soft border border-white/20 rounded-xl"
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${checked ? 'bg-emerald-500/15 text-emerald-600' : 'bg-neutral-100 text-neutral-500'}`}>
                      <OptionIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium text-neutral-700">{option.label}</p>
                      <p className="text-sm text-neutral-500">{option.description}</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => handlePrivacyChange(option.key, e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end">
            <button
              onClick={savePrivacySettings}
              disabled={isLoading}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-xl shadow-soft-sm hover:shadow-soft-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Guardando…</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Guardar privacidad</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Notifications Section */}
      {activeSection === 'notifications' && (
        <div className="bg-white/60 backdrop-blur-soft border border-white/30 rounded-2xl shadow-soft-lg p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-blue-200 rounded-full flex items-center justify-center">
              <Bell className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-neutral-700">Preferencias de Notificaciones</h3>
              <p className="text-sm text-neutral-500">Configura qué notificaciones quieres recibir y cómo</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Notification Types */}
            <div>
              <h4 className="text-md font-semibold text-neutral-700 mb-4">Tipos de Notificaciones</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-white/40 backdrop-blur-soft border border-white/20 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium text-neutral-700">Noticias Importantes</p>
                      <p className="text-sm text-neutral-500">Eventos importantes y anuncios críticos</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.noticiasImportantes}
                      onChange={(e) => handleNotificationChange('noticiasImportantes', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/40 backdrop-blur-soft border border-white/20 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <SettingsIcon className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-neutral-700">Noticias Corrientes</p>
                      <p className="text-sm text-neutral-500">Actualizaciones generales y noticias regulares</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.noticiasCorrientes}
                      onChange={(e) => handleNotificationChange('noticiasCorrientes', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/40 backdrop-blur-soft border border-white/20 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                      <AlertTriangle className="w-4 h-4 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-medium text-neutral-700">Comunicados Urgentes</p>
                      <p className="text-sm text-neutral-500">Avisos urgentes que requieren atención inmediata</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.comunicadosUrgentes}
                      onChange={(e) => handleNotificationChange('comunicadosUrgentes', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Notification Methods */}
            <div>
              <h4 className="text-md font-semibold text-neutral-700 mb-4">Medios de Notificación</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-white/40 backdrop-blur-soft border border-white/20 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Mail className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-neutral-700">Correo Electrónico</p>
                      <p className="text-sm text-neutral-500">Recibir notificaciones por email</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.medios.email}
                      onChange={(e) => handleMethodChange('email', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/40 backdrop-blur-soft border border-white/20 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <MessageCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-neutral-700">WhatsApp</p>
                      <p className="text-sm text-neutral-500">Recibir mensajes por WhatsApp</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.medios.whatsapp}
                      onChange={(e) => handleMethodChange('whatsapp', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/40 backdrop-blur-soft border border-white/20 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Smartphone className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-neutral-700">SMS</p>
                      <p className="text-sm text-neutral-500">Recibir mensajes de texto</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifications.medios.sms}
                      onChange={(e) => handleMethodChange('sms', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
              </div>
            </div>

            <button
              onClick={saveNotifications}
              disabled={isLoading}
              className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl shadow-soft-sm hover:shadow-soft-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Guardar Preferencias</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
