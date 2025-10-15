import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Camera,
  Edit2,
  Save,
  X
} from 'lucide-react';

export const ProfileModule: React.FC = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    direccion: '',
    avatar: user?.avatar || ''
  });

  // Calcular años en ACA (mock data por ahora)
  const fechaIngreso = new Date('2020-03-15'); // Mock date
  const yearsInACA = new Date().getFullYear() - fechaIngreso.getFullYear();

  const handleSave = () => {
    // TODO: Implementar guardado de datos
    console.log('Guardando datos:', formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      direccion: '',
      avatar: user?.avatar || ''
    });
    setIsEditing(false);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData({ ...formData, avatar: e.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/60 backdrop-blur-soft border border-white/30 rounded-2xl shadow-soft-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-neutral-700">Mi Perfil</h2>
          <button
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-500 text-white rounded-xl shadow-soft-sm hover:shadow-soft-md transition-all duration-300 hover:scale-105"
          >
            {isEditing ? (
              <>
                <Save className="w-4 h-4" />
                <span>Guardar</span>
              </>
            ) : (
              <>
                <Edit2 className="w-4 h-4" />
                <span>Editar</span>
              </>
            )}
          </button>
        </div>

        {/* Profile Photo Section */}
        <div className="flex flex-col sm:flex-row sm:items-start space-y-6 sm:space-y-0 sm:space-x-8 mb-8">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-gradient-to-r from-primary-600 to-primary-500 shadow-soft-lg flex items-center justify-center overflow-hidden">
                {formData.avatar ? (
                  <img
                    src={formData.avatar}
                    alt="Foto de perfil"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white font-bold text-4xl">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
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