import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Container } from './Container';
import { useAuth } from '../../contexts/AuthContext';
import { UserMenu, AuthModal } from '../auth';

export const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  const navigation = [
    { name: 'Inicio', href: '/' },
    { name: 'Quiénes Somos', href: '/quienes-somos' },
    { name: 'Eventos', href: '/eventos' },
    { name: 'Noticias', href: '/noticias' },
    { name: 'Contacto', href: '/contacto' },
  ];



  return (
    <header className="bg-neuro-base sticky top-0 z-50 border-b border-neuro-shadow/20">
      <Container>
        <div className="flex justify-between items-center py-6">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-neuro-base rounded-2xl flex items-center justify-center shadow-neuro-outset hover:shadow-neuro-pressed transition-all duration-300">
                <span className="text-2xl">🔥</span>
              </div>
              <div className="hidden sm:block">
                <div className="text-xl font-bold text-primary-700">ACA Chile</div>
                <div className="text-sm text-primary-500">Asociación Chilena de Asadores</div>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-300 ${
                  location.pathname === item.href
                    ? 'text-primary-700 shadow-neuro-inset bg-neuro-dark/20'
                    : 'text-primary-600 hover:text-primary-700 hover:shadow-neuro-soft'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Auth Section */}
          <div className="hidden md:flex items-center space-x-3">
            {isAuthenticated ? (
              <UserMenu />
            ) : (
              <>
                <button 
                  onClick={() => {
                    setAuthMode('login');
                    setAuthModalOpen(true);
                  }}
                  className="px-6 py-3 rounded-xl text-primary-700 font-medium shadow-neuro-outset hover:shadow-neuro-pressed transition-all duration-300"
                >
                  Iniciar Sesión
                </button>
                <button 
                  onClick={() => {
                    setAuthMode('register');
                    setAuthModalOpen(true);
                  }}
                  className="px-6 py-3 rounded-xl text-white font-medium bg-gradient-to-br from-primary-500 to-primary-600 shadow-neuro-card hover:shadow-neuro-pressed hover:from-primary-600 hover:to-primary-700 transition-all duration-300"
                >
                  Únete
                </button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-3 rounded-xl text-primary-600 hover:text-primary-700 shadow-neuro-outset hover:shadow-neuro-pressed transition-all duration-300 focus:outline-none"
            >
              <span className="sr-only">Abrir menú principal</span>
              {!isMenuOpen ? (
                <svg className="block h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              ) : (
                <svg className="block h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-4 pt-4 pb-6 space-y-3 bg-neuro-light/50 border-t border-neuro-shadow/20 shadow-neuro-inset">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`block px-4 py-3 rounded-xl text-base font-medium transition-all duration-300 ${
                    location.pathname === item.href
                      ? 'text-primary-700 shadow-neuro-inset bg-neuro-dark/20'
                      : 'text-primary-600 hover:text-primary-700 hover:shadow-neuro-soft'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              <div className="px-2 pt-4 space-y-3">
                {isAuthenticated ? (
                  <div className="px-4">
                    <UserMenu />
                  </div>
                ) : (
                  <>
                    <button 
                      onClick={() => {
                        setAuthMode('login');
                        setAuthModalOpen(true);
                        setIsMenuOpen(false);
                      }}
                      className="w-full px-4 py-3 rounded-xl text-primary-700 font-medium shadow-neuro-outset hover:shadow-neuro-pressed transition-all duration-300"
                    >
                      Iniciar Sesión
                    </button>
                    <button 
                      onClick={() => {
                        setAuthMode('register');
                        setAuthModalOpen(true);
                        setIsMenuOpen(false);
                      }}
                      className="w-full px-4 py-3 rounded-xl text-white font-medium bg-gradient-to-br from-primary-500 to-primary-600 shadow-neuro-card hover:shadow-neuro-pressed transition-all duration-300"
                    >
                      Únete
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </Container>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
      />
    </header>
  );
};