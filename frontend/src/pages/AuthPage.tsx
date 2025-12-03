import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from '../components/auth';
import { useAuth } from '../contexts/AuthContext';

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  // Redireccionar si ya está autenticado
  React.useEffect(() => {
    if (isAuthenticated && user) {
      // Redirigir según el rol del usuario
      const isAdmin = user.roles?.includes('admin') || user.roles?.includes('director') || user.roles?.includes('director_editor');
      navigate(isAdmin ? '/panel-admin' : '/perfil');
    }
  }, [isAuthenticated, user, navigate]);

  const handleSuccess = () => {
    // Redirigir según el rol del usuario
    const isAdmin = user?.roles?.includes('admin') || user?.roles?.includes('director') || user?.roles?.includes('director_editor');
    navigate(isAdmin ? '/panel-admin' : '/perfil');
  };

  if (isAuthenticated) {
    return null; // Evitar flash antes del redirect
  }

  return (
    <div className="min-h-screen bg-soft-gradient-light relative overflow-hidden flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="absolute inset-y-0 left-0 w-64 bg-primary-500/10 blur-3xl" />
      <div className="absolute -top-20 right-10 w-72 h-72 bg-pastel-blue/20 rounded-full blur-3xl" />

      <div className="relative w-full max-w-md">
        <div className="rounded-3xl bg-white/70 backdrop-blur-md border border-white/60 shadow-soft-xl p-8 sm:p-10 space-y-8">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 text-white text-2xl font-bold">
              ACA
            </div>
            <h2 className="text-2xl font-bold text-neutral-900">
              Iniciar Sesión
            </h2>
            <p className="text-sm text-neutral-500">
              Accede con tu cuenta de socio
            </p>
          </div>

          <div className="space-y-6">
            <LoginForm onSuccess={handleSuccess} />
            <div className="text-center text-sm text-neutral-500">
              <span className="inline-flex flex-wrap items-center justify-center gap-1">
                ¿Aún no eres socio?{' '}
                <button
                  onClick={() => navigate('/unete')}
                  className="font-semibold text-primary-600 hover:text-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white rounded-lg px-1"
                >
                  Únete a ACA
                </button>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
