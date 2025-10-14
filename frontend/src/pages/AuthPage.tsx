import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Container } from '../components/layout/Container';
import { LoginForm, RegisterForm } from '../components/auth';
import { useAuth } from '../contexts/AuthContext';

type AuthMode = 'login' | 'register';

export const AuthPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [mode, setMode] = useState<AuthMode>(
    (searchParams.get('mode') as AuthMode) || 'login'
  );

  // Redireccionar si ya está autenticado
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/eventos');
    }
  }, [isAuthenticated, navigate]);

  const handleSuccess = () => {
    navigate('/eventos');
  };

  if (isAuthenticated) {
    return null; // Evitar flash antes del redirect
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#e8ecf4' }}>
      <Container className="py-16">
        <div className="max-w-lg mx-auto">
          {/* Logo y título */}
          <div className="text-center mb-8">
            <div 
              className="w-20 h-20 mx-auto mb-6 rounded-3xl flex items-center justify-center"
              style={{ 
                backgroundColor: '#e8ecf4',
                boxShadow: '12px 12px 24px #bec8d7, -12px -12px 24px #ffffff'
              }}
            >
              <div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ 
                  background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                }}
              >
                <span className="text-white font-bold text-xl">A</span>
              </div>
            </div>
            
            <h1 className="text-3xl font-bold mb-2" style={{ color: '#374151' }}>
              ACA Chile
            </h1>
            <p className="text-lg" style={{ color: '#6B7280' }}>
              Asociación Chilena de Asadores
            </p>
          </div>

          {/* Selector de modo */}
          <div 
            className="flex rounded-2xl p-2 mb-8"
            style={{ 
              backgroundColor: '#e8ecf4',
              boxShadow: 'inset 8px 8px 16px #bec8d7, inset -8px -8px 16px #ffffff'
            }}
          >
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-3 rounded-xl font-medium transition-all duration-300 ${
                mode === 'login' 
                  ? 'text-white' 
                  : 'text-gray-600'
              }`}
              style={{
                background: mode === 'login' 
                  ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'
                  : 'transparent',
                boxShadow: mode === 'login' 
                  ? '0 4px 12px rgba(239, 68, 68, 0.3)'
                  : 'none'
              }}
            >
              Iniciar Sesión
            </button>
            
            <button
              onClick={() => setMode('register')}
              className={`flex-1 py-3 rounded-xl font-medium transition-all duration-300 ${
                mode === 'register' 
                  ? 'text-white' 
                  : 'text-gray-600'
              }`}
              style={{
                background: mode === 'register' 
                  ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'
                  : 'transparent',
                boxShadow: mode === 'register' 
                  ? '0 4px 12px rgba(239, 68, 68, 0.3)'
                  : 'none'
              }}
            >
              Registrarse
            </button>
          </div>

          {/* Formularios */}
          <div className="space-y-6">
            {mode === 'login' ? (
              <LoginForm
                onSuccess={handleSuccess}
                onSwitchToRegister={() => setMode('register')}
              />
            ) : (
              <RegisterForm
                onSuccess={handleSuccess}
                onSwitchToLogin={() => setMode('login')}
              />
            )}
          </div>

          {/* Información adicional */}
          <div className="mt-8 text-center">
            <div 
              className="rounded-2xl p-6"
              style={{ 
                backgroundColor: '#F0F9FF',
                border: '1px solid #E0F2FE'
              }}
            >
              <h3 className="font-semibold mb-2" style={{ color: '#0369A1' }}>
                ¿Por qué unirse a ACA Chile?
              </h3>
              <ul className="text-sm space-y-1" style={{ color: '#075985' }}>
                <li>• Participa en eventos exclusivos de asadores</li>
                <li>• Conecta con la comunidad de parrilleros</li>
                <li>• Accede a talleres y workshops especializados</li>
                <li>• Compite en torneos nacionales</li>
              </ul>
            </div>
          </div>

          {/* Demo credentials */}
          <div className="mt-6 text-center">
            <div 
              className="rounded-2xl p-4"
              style={{ 
                backgroundColor: '#FFFBEB',
                border: '1px solid #FEF3C7'
              }}
            >
              <p className="text-xs font-semibold mb-2" style={{ color: '#92400E' }}>
                Credenciales de Demo:
              </p>
              <div className="text-xs space-y-1" style={{ color: '#A16207' }}>
                <div>
                  <strong>Admin:</strong> admin@acachile.com / 123456
                </div>
                <div>
                  <strong>Usuario:</strong> usuario@acachile.com / 123456
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
};