import React, { useState } from 'react';
import { User, LogOut, Settings, ChevronDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const UserMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();

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
        className="flex items-center space-x-3 px-4 py-2 rounded-2xl transition-all duration-300 hover:scale-105"
        style={{ 
          backgroundColor: '#e8ecf4',
          boxShadow: '6px 6px 12px #bec8d7, -6px -6px 12px #ffffff'
        }}
      >
        {/* Avatar */}
        <div 
          className="w-8 h-8 rounded-full flex items-center justify-center"
          style={{ 
            backgroundColor: '#EF4444',
            boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <span className="text-white font-bold text-sm">
              {user.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        {/* User Info */}
        <div className="flex items-center space-x-2">
          <div className="text-left">
            <p className="font-medium text-sm" style={{ color: '#374151' }}>
              {user.name}
            </p>
            <p className="text-xs" style={{ color: '#6B7280' }}>
              {user.membershipType || 'Miembro'}
            </p>
          </div>
          <ChevronDown 
            className={`w-4 h-4 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
            style={{ color: '#6B7280' }}
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
          <div 
            className="absolute right-0 mt-2 w-56 rounded-2xl py-2 shadow-lg z-20"
            style={{ 
              backgroundColor: '#e8ecf4',
              boxShadow: '10px 10px 20px #bec8d7, -10px -10px 20px #ffffff'
            }}
          >
            {/* User Info Header */}
            <div className="px-4 py-3 border-b border-gray-200">
              <p className="font-semibold" style={{ color: '#374151' }}>
                {user.name}
              </p>
              <p className="text-sm" style={{ color: '#6B7280' }}>
                {user.email}
              </p>
              {user.region && (
                <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>
                  📍 {user.region}
                </p>
              )}
            </div>

            {/* Menu Items */}
            <div className="py-2">
              <button
                onClick={() => {
                  setIsOpen(false);
                  // TODO: Navigate to profile
                }}
                className="flex items-center w-full px-4 py-3 text-left hover:bg-opacity-50 transition-colors duration-200"
                style={{ color: '#374151' }}
              >
                <User className="w-4 h-4 mr-3" />
                Mi Perfil
              </button>

              <button
                onClick={() => {
                  setIsOpen(false);
                  // TODO: Navigate to settings
                }}
                className="flex items-center w-full px-4 py-3 text-left hover:bg-opacity-50 transition-colors duration-200"
                style={{ color: '#374151' }}
              >
                <Settings className="w-4 h-4 mr-3" />
                Configuración
              </button>

              <hr className="my-2 border-gray-200" />

              <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-3 text-left hover:bg-opacity-50 transition-colors duration-200"
                style={{ color: '#EF4444' }}
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