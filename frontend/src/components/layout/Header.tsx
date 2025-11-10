import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Container } from './Container';
import { useAuth } from '../../contexts/AuthContext';
import { UserMenu, AuthModal } from '../auth';
import SearchBar from '../SearchBar';
import logoFallback from '@/assets/aca-logo.svg';

const DEFAULT_HEADER_LOGO = 'https://pub-9edd01c5f73442228a840ca5c8fca38a.r2.dev/home/img-1762489301673-11k166.jpg';

export const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const envLogoUrl = (import.meta.env.VITE_HEADER_LOGO_URL as string | undefined)?.trim();
  const [logoSrc, setLogoSrc] = useState<string>(envLogoUrl || DEFAULT_HEADER_LOGO);

  const navigation = [
    { name: 'Inicio', href: '/' },
    { name: 'Quiénes Somos', href: '/quienes-somos' },
    { name: 'Eventos', href: '/eventos' },
    { name: 'Noticias', href: '/noticias' },
    { name: 'Contacto', href: '/contacto' },
  ];

  // Separar navegación para mobile
  const mobileVisibleNav = navigation.slice(0, 3); // Inicio, Quiénes Somos, Eventos
  const mobileMenuNav = navigation.slice(3); // Noticias, Contacto

  return (
    <>
      {/* Header - Soft UI 2.0 */}
      <header className="relative bg-white/80 backdrop-blur-soft sticky top-0 z-50 border-b border-white/20 shadow-soft-sm">
        <Container>
          <div className="flex justify-between items-center py-3 sm:py-4 relative">
            {/* Logo */}
            <div className="flex items-center flex-shrink-0">
              <Link to="/" className="flex items-center space-x-2 sm:space-x-4 group">
                <div className="w-10 h-10 sm:w-14 sm:h-14 bg-white/60 backdrop-blur-soft rounded-2xl flex items-center justify-center shadow-soft-md hover:shadow-soft-lg transition-all duration-300 transform group-hover:scale-105 border border-white/30 p-1.5 sm:p-2">
                  <img
                    src={logoSrc}
                    alt="ACA Chile"
                    className="w-full h-full object-contain"
                    loading="lazy"
                    onError={() => setLogoSrc(logoFallback)}
                  />
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

            {/* Mobile Visible Navigation - Siempre visible en mobile */}
            <nav className="md:hidden flex items-center justify-center space-x-1 flex-1 mx-1 min-w-0">
              {mobileVisibleNav.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`px-1.5 py-2 text-xs font-semibold rounded-xl transition-all duration-300 whitespace-nowrap flex-shrink-0 ${
                    location.pathname === item.href
                      ? 'text-primary-700 bg-primary-50/80 backdrop-blur-soft shadow-soft-inset-sm border border-primary-200/50'
                      : 'text-neutral-700 hover:text-primary-600 hover:bg-white/60 border border-transparent'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* Desktop Navigation (centered with more spacing) */}
            <nav className="hidden md:flex items-center space-x-2 absolute left-1/2 transform -translate-x-1/2 ml-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`px-6 py-3 text-sm font-semibold rounded-2xl transition-all duration-300 flex items-center justify-center text-center ${
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
            <div className="flex items-center space-x-1 sm:space-x-3 ml-1 sm:ml-4 flex-shrink-0">
              {isAuthenticated ? (
                <UserMenu />
              ) : (
                <div className="hidden md:flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setAuthModalOpen(true);
                    }}
                    className="px-6 py-3 text-sm font-semibold text-neutral-700 bg-white/60 backdrop-blur-soft rounded-2xl hover:bg-white/80 hover:shadow-soft-sm transition-all duration-300 border border-white/30"
                  >
                    Iniciar Sesión
                  </button>
                  <Link
                    to="/unete"
                    className="px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-primary-600 to-primary-500 rounded-2xl hover:from-primary-700 hover:to-primary-600 transition-all duration-300 transform hover:scale-105 shadow-soft-colored-red hover:shadow-soft-md"
                  >
                    Únete a ACA
                  </Link>
                </div>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden w-10 h-10 bg-white/60 backdrop-blur-soft rounded-2xl flex items-center justify-center shadow-soft-md hover:shadow-soft-lg transition-all duration-300 border border-white/30 flex-shrink-0"
              >
                <div className="w-5 h-5 flex flex-col justify-center items-center">
                  <div className={`w-4 h-0.5 bg-neutral-600 transition-all duration-300 ${isMenuOpen ? 'rotate-45 translate-y-0.5' : ''}`}></div>
                  <div className={`w-4 h-0.5 bg-neutral-600 transition-all duration-300 mt-1 ${isMenuOpen ? 'opacity-0' : ''}`}></div>
                  <div className={`w-4 h-0.5 bg-neutral-600 transition-all duration-300 mt-1 ${isMenuOpen ? '-rotate-45 -translate-y-0.5' : ''}`}></div>
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

        {/* Desktop Search Bar */}
        <div className="hidden lg:block border-t border-white/20 bg-white/80">
          <Container>
            <div className="py-4 flex justify-center">
              <SearchBar 
                placeholder="Buscar eventos, noticias, socios..."
                size="large"
                className="bg-white/70 backdrop-blur-soft rounded-2xl shadow-soft-inset-sm border border-white/40 focus-within:shadow-soft-inset-md focus-within:border-primary-300"
              />
            </div>
          </Container>
        </div>

        {/* Mobile Navigation Menu - Solo Noticias y Contacto */}
        {isMenuOpen && (
          <div className="md:hidden absolute inset-x-0 top-full z-40 bg-white/98 backdrop-blur-soft border-t border-white/30 shadow-soft-lg">
            <div className="max-h-[calc(100vh-5rem)] overflow-y-auto">
              <Container className="py-4 space-y-3">
                {mobileMenuNav.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`block px-4 py-3 text-base font-semibold rounded-2xl transition-all duration-300 text-center ${
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
                  <div className="pt-3 space-y-3 border-t border-neutral-200/50">
                    <button
                      onClick={() => {
                        setAuthModalOpen(true);
                        setIsMenuOpen(false);
                      }}
                      className="w-full px-4 py-3 text-base font-semibold text-neutral-700 bg-white/60 backdrop-blur-soft rounded-2xl hover:bg-white/80 hover:shadow-soft-sm transition-all duration-300 border border-white/30"
                    >
                      Iniciar Sesión
                    </button>
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        navigate('/unete');
                      }}
                      className="w-full px-4 py-3 text-base font-semibold text-white bg-gradient-to-r from-primary-600 to-primary-500 rounded-2xl hover:from-primary-700 hover:to-primary-600 transition-all duration-300 transform hover:scale-105 shadow-soft-colored-red hover:shadow-soft-md"
                    >
                      Únete a ACA
                    </button>
                  </div>
                )}
              </Container>
            </div>
          </div>
        )}
      </header>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </>
  );
};

export default Header;
