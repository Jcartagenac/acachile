import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { LoginForm } from './LoginForm';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose
}) => {
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSuccess = () => {
    onClose();
    // Redirigir al usuario a eventos después del login exitoso
    navigate('/eventos');
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-lg max-h-screen overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full transition-all duration-200 hover:scale-110"
          style={{ 
            backgroundColor: '#e8ecf4',
            boxShadow: '6px 6px 12px #bec8d7, -6px -6px 12px #ffffff'
          }}
        >
          <X className="w-5 h-5" style={{ color: '#6B7280' }} />
        </button>

        {/* Form Content */}
        <div className="animate-fade-in space-y-6">
          <LoginForm onSuccess={handleSuccess} />
          <div className="text-center text-sm text-slate-500">
            ¿No tienes acceso todavía?{' '}
            <button
              onClick={() => {
                onClose();
                navigate('/unete');
              }}
              className="font-semibold text-primary-600 hover:text-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white rounded-lg px-1"
            >
              Únete a ACA
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
