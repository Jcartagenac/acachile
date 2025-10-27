import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from '../components/auth';
import { useAuth } from '../contexts/AuthContext';

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

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
    <div className="min-h-screen bg-soft-gradient-light relative overflow-hidden py-16">
      <div className="absolute inset-y-0 left-0 w-64 bg-primary-500/10 blur-3xl" />
      <div className="absolute -top-20 right-10 w-72 h-72 bg-pastel-blue/20 rounded-full blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] items-stretch">
          {/* Columna de storytelling */}
          <div className="hidden lg:flex flex-col justify-center rounded-3xl bg-white/60 backdrop-blur-md border border-white/30 shadow-soft-xl p-10 space-y-8">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 rounded-full shadow-soft-sm border border-white/40 text-primary-600 font-semibold text-sm uppercase">
              Comunidad ACA Chile
            </span>
            <h1 className="text-4xl font-bold leading-tight text-neutral-900">
              Tu entrada a la red oficial de asadores en Chile
            </h1>
            <p className="text-lg text-neutral-600 leading-relaxed">
              Participa de campeonatos, talleres exclusivos y encuentros únicos en torno al fuego.
              Administra tus eventos y conecta con una comunidad que comparte tu pasión.
            </p>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Eventos organizados', value: '150+' },
                { label: 'Miembros activos', value: '500+' },
                { label: 'Ciudades presentes', value: '25+' },
                { label: 'Años de trayectoria', value: '10' }
              ].map((stat) => (
                <div key={stat.label} className="bg-white/70 rounded-2xl p-4 text-center border border-white/60 shadow-soft-lg">
                  <p className="text-2xl font-bold text-primary-600">{stat.value}</p>
                  <p className="text-xs uppercase tracking-wide text-neutral-500">{stat.label}</p>
                </div>
              ))}
            </div>
            <div className="rounded-2xl bg-primary-50/60 border border-primary-100/50 p-6 text-sm text-primary-900">
              <p className="font-semibold mb-2">Credenciales de Demo</p>
              <p>Admin: <span className="font-mono">admin@acachile.com / 123456</span></p>
              <p>Usuario: <span className="font-mono">usuario@acachile.com / 123456</span></p>
            </div>
          </div>

          {/* Columna formulario */}
          <div className="rounded-3xl bg-white/70 backdrop-blur-md border border-white/60 shadow-soft-xl p-8 sm:p-10 space-y-8">
            <div className="text-center space-y-3">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 text-white text-2xl font-bold">
                ACA
              </div>
              <h2 className="text-2xl font-bold text-neutral-900">
                Bienvenido de vuelta
              </h2>
              <p className="text-sm text-neutral-500">
                Accede a tu panel personal para gestionar eventos y experiencias.
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
    </div>
  );
};

export default AuthPage;
