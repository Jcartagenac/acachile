import React, { useState } from 'react';
import { User, LogOut, Settings, ChevronDown, Calendar, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from './PermissionGuard';

export const UserMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout, getRoleDisplayName, getRoleColor } = useAuth();
  const {
    isAdmin,
    isDirector,
    isDirectorEditor
  } = usePermissions();
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* User Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 px-4 py-2 bg-white/60 backdrop-blur-soft border border-white/30 rounded-2xl shadow-soft-sm hover:shadow-soft-md transition-all duration-300 hover:scale-105 group"
      >
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary-600 to-primary-500 shadow-soft-xs flex items-center justify-center">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <span className="text-white font-bold text-sm">
              {user.name?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          )}
        </div>

        {/* User Info */}
        <div className="flex items-center space-x-2">
          <div className="text-left">
            <p className="font-medium text-sm text-neutral-700 group-hover:text-primary-600 transition-colors">
              {user.name}
            </p>
            <p className="text-xs text-neutral-500">
              {getRoleDisplayName()}
            </p>
          </div>
          <ChevronDown 
            className={`w-4 h-4 transition-transform duration-200 text-neutral-500 group-hover:text-primary-500 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <div className="absolute right-0 mt-2 w-64 bg-white/70 backdrop-blur-soft border border-white/30 rounded-2xl py-2 shadow-soft-lg z-20">
            {/* User Info Header */}
            <div className="px-4 py-3 border-b border-neutral-200/50">
              <p className="font-semibold text-neutral-700">
                {user.name}
              </p>
              <p className="text-sm text-neutral-600">
                {user.email}
              </p>
              <div className="flex items-center justify-between mt-2">
                {user.region && (
                  <p className="text-xs text-neutral-500">
                    📍 {user.region}
                  </p>
                )}
                <span 
                  className={`px-2 py-1 text-xs rounded-full bg-${getRoleColor()}-50 text-${getRoleColor()}-600 border border-${getRoleColor()}-200/50`}
                >
                  {getRoleDisplayName()}
                </span>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              {/* Panel Administrativo - Solo para admins y directores */}
              {(isAdmin || isDirector || isDirectorEditor) && (
                <button
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/panel-admin');
                  }}
                  className="flex items-center w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200 rounded-lg mx-2"
                >
                  <Shield className="w-4 h-4 mr-3" />
                  Panel Administrativo
                </button>
              )}


              
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate('/perfil');
                }}
                className="flex items-center w-full px-4 py-3 text-left text-neutral-700 hover:bg-white/50 hover:text-primary-600 transition-all duration-200 rounded-lg mx-2"
              >
                <User className="w-4 h-4 mr-3" />
                Mi Perfil
              </button>

              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate('/mi-cuenta');
                }}
                className="flex items-center w-full px-4 py-3 text-left text-neutral-700 hover:bg-white/50 hover:text-primary-600 transition-all duration-200 rounded-lg mx-2"
              >
                <Calendar className="w-4 h-4 mr-3" />
                Mi Cuenta
              </button>

              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate('/configuracion');
                }}
                className="flex items-center w-full px-4 py-3 text-left text-neutral-700 hover:bg-white/50 hover:text-primary-600 transition-all duration-200 rounded-lg mx-2"
              >
                <Settings className="w-4 h-4 mr-3" />
                Configuración
              </button>

              <hr className="my-2 border-neutral-200/50 mx-2" />

              <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-3 text-left text-red-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200 rounded-lg mx-2"
              >
                <LogOut className="w-4 h-4 mr-3" />
                Cerrar Sesión
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};