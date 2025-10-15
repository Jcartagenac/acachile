import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Container } from './Container';
import { useAuth } from '../../contexts/AuthContext';
import { UserMenu, AuthModal } from '../auth';
import SearchBar from '../SearchBar';

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
    <>
      {/* Header - Soft UI 2.0 */}
      <header className="bg-white/80 backdrop-blur-soft sticky top-0 z-50 border-b border-white/20 shadow-soft-sm">
        <Container>
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-4 group">
                <div className="w-14 h-14 bg-white/60 backdrop-blur-soft rounded-2xl flex items-center justify-center shadow-soft-md hover:shadow-soft-lg transition-all duration-300 transform group-hover:scale-105 border border-white/30">
                  <span className="text-2xl">🔥</span>
                </div>
                <div className="hidden sm:block">
                  <div className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">
                    ACA Chile
                  </div>
                  <div className="text-sm text-neutral-600 font-medium">
                    Asociación Chilena de Asadores
                  </div>
                </div>
              </Link>
            </div>

            {/* Search Bar - Solo en desktop */}
            <div className="hidden lg:flex items-center flex-1 max-w-xl mx-8">
              <div className="w-full relative">
                <SearchBar 
                  placeholder="Buscar eventos, noticias..."
                  size="medium"
                  className="w-full bg-white/60 backdrop-blur-soft rounded-2xl shadow-soft-inset-sm border border-white/40 focus-within:shadow-soft-inset-md focus-within:border-primary-300 transition-all duration-300"
                />
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`px-6 py-3 text-sm font-semibold rounded-2xl transition-all duration-300 ${
                    location.pathname === item.href
                      ? 'text-primary-700 bg-primary-50/80 backdrop-blur-soft shadow-soft-inset-sm border border-primary-200/50'
                      : 'text-neutral-700 hover:text-primary-600 hover:bg-white/60 hover:shadow-soft-sm border border-transparent hover:border-white/30'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* Auth Section */}
            <div className="flex items-center space-x-3 ml-4">
              {isAuthenticated ? (
                <UserMenu />
              ) : (
                <div className="hidden md:flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setAuthMode('login');
                      setAuthModalOpen(true);
                    }}
                    className="px-6 py-3 text-sm font-semibold text-neutral-700 bg-white/60 backdrop-blur-soft rounded-2xl hover:bg-white/80 hover:shadow-soft-sm transition-all duration-300 border border-white/30"
                  >
                    Iniciar Sesión
                  </button>
                  <button
                    onClick={() => {
                      setAuthMode('register');
                      setAuthModalOpen(true);
                    }}
                    className="px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-primary-600 to-primary-500 rounded-2xl hover:from-primary-700 hover:to-primary-600 transition-all duration-300 transform hover:scale-105 shadow-soft-colored-red hover:shadow-soft-md"
                  >
                    Registrarse
                  </button>
                </div>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden w-12 h-12 bg-white/60 backdrop-blur-soft rounded-2xl flex items-center justify-center shadow-soft-md hover:shadow-soft-lg transition-all duration-300 border border-white/30"
              >
                <div className="w-6 h-6 flex flex-col justify-center items-center">
                  <div className={`w-5 h-0.5 bg-neutral-600 transition-all duration-300 ${isMenuOpen ? 'rotate-45 translate-y-1' : ''}`}></div>
                  <div className={`w-5 h-0.5 bg-neutral-600 transition-all duration-300 mt-1 ${isMenuOpen ? 'opacity-0' : ''}`}></div>
                  <div className={`w-5 h-0.5 bg-neutral-600 transition-all duration-300 mt-1 ${isMenuOpen ? '-rotate-45 -translate-y-1' : ''}`}></div>
                </div>
              </button>
            </div>
          </div>

          {/* Mobile Search Bar */}
          <div className="lg:hidden pb-4">
            <SearchBar 
              placeholder="Buscar..."
              size="small"
              className="w-full bg-white/60 backdrop-blur-soft rounded-2xl shadow-soft-inset-sm border border-white/40 focus-within:shadow-soft-inset-md focus-within:border-primary-300 transition-all duration-300"
            />
          </div>
        </Container>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-soft border-t border-white/20 shadow-soft-lg">
            <Container>
              <div className="py-6 space-y-2">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`block px-6 py-4 text-base font-semibold rounded-2xl transition-all duration-300 ${
                      location.pathname === item.href
                        ? 'text-primary-700 bg-primary-50/80 backdrop-blur-soft shadow-soft-inset-sm border border-primary-200/50'
                        : 'text-neutral-700 hover:text-primary-600 hover:bg-white/60 hover:shadow-soft-sm border border-transparent hover:border-white/30'
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
                
                {/* Mobile Auth Buttons */}
                {!isAuthenticated && (
                  <div className="pt-4 space-y-3 border-t border-neutral-200/50 mt-6">
                    <button
                      onClick={() => {
                        setAuthMode('login');
                        setAuthModalOpen(true);
                        setIsMenuOpen(false);
                      }}
                      className="w-full px-6 py-4 text-base font-semibold text-neutral-700 bg-white/60 backdrop-blur-soft rounded-2xl hover:bg-white/80 hover:shadow-soft-sm transition-all duration-300 border border-white/30"
                    >
                      Iniciar Sesión
                    </button>
                    <button
                      onClick={() => {
                        setAuthMode('register');
                        setAuthModalOpen(true);
                        setIsMenuOpen(false);
                      }}
                      className="w-full px-6 py-4 text-base font-semibold text-white bg-gradient-to-r from-primary-600 to-primary-500 rounded-2xl hover:from-primary-700 hover:to-primary-600 transition-all duration-300 transform hover:scale-105 shadow-soft-colored-red hover:shadow-soft-md"
                    >
                      Registrarse
                    </button>
                  </div>
                )}
              </div>
            </Container>
          </div>
        )}
      </header>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
      />
    </>
  );
};

export default Header;