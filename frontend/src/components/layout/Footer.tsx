import React from 'react';
import { Link } from 'react-router-dom';
import { Flame } from 'lucide-react';
import { Container } from './Container';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-soft-gradient-medium border-t border-white/20 relative overflow-hidden">
      {/* Elementos decorativos de fondo */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl -translate-x-48 -translate-y-48"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-pastel-blue/10 rounded-full blur-3xl translate-x-48 translate-y-48"></div>
      
      <Container>
        <div className="py-10 sm:py-16 relative">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
            {/* Logo y descripción */}
            <div className="md:col-span-2">
                            <div className="flex items-center space-x-4 mb-6">
                <Flame className="h-12 w-12 text-primary-600" />
                <div>
                  <div className="text-2xl font-bold text-primary-600">ACA Chile</div>
                  <div className="text-sm text-neutral-600">
                    Asociación Chilena de Asadores A.G.
                  </div>
                </div>
              </div>
              
              <div className="bg-white/40 backdrop-blur-soft rounded-2xl p-5 sm:p-6 shadow-soft-sm border border-white/30 mb-8">
                <p className="text-neutral-600 text-sm sm:text-base leading-relaxed font-light">
                  ACA es una asociación de Asadores donde nos reunimos amantes de los fuegos, 
                  las brasas y la parrilla. Una asociación sin fines de lucro que busca 
                  hacer crecer el movimiento parrillero nacional.
                </p>
              </div>
              
              {/* Redes sociales */}
              <div className="flex space-x-3 sm:space-x-4">
                <a
                  href="https://www.instagram.com/aca.chile/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group w-12 h-12 bg-white/60 hover:bg-gradient-to-br hover:from-purple-600 hover:via-pink-500 hover:to-orange-400 backdrop-blur-soft rounded-2xl flex items-center justify-center shadow-soft-md hover:shadow-soft-lg border border-white/30 transition-all duration-300 transform hover:scale-110"
                >
                  <span className="sr-only">Instagram</span>
                  <svg className="h-6 w-6 text-neutral-600 group-hover:text-white transition-colors duration-300" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                
                <a
                  href="https://www.facebook.com/aca.chile"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 bg-white/60 backdrop-blur-soft rounded-2xl flex items-center justify-center shadow-soft-md hover:shadow-soft-lg border border-white/30 text-neutral-600 hover:text-primary-600 transition-all duration-300 transform hover:scale-110"
                >
                  <span className="sr-only">Facebook</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </a>
                
                <a
                  href="mailto:hola@acachile.com"
                  className="w-12 h-12 bg-white/60 backdrop-blur-soft rounded-2xl flex items-center justify-center shadow-soft-md hover:shadow-soft-lg border border-white/30 text-neutral-600 hover:text-primary-600 transition-all duration-300 transform hover:scale-110"
                >
                  <span className="sr-only">Email</span>
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Enlaces rápidos */}
            <div>
              <h3 className="text-lg font-bold text-neutral-800 mb-6">
                Enlaces Rápidos
              </h3>
              <div className="space-y-3">
                {[
                  { name: 'Inicio', href: '/' },
                  { name: 'Quiénes Somos', href: '/quienes-somos' },
                  { name: 'Eventos', href: '/eventos' },
                  { name: 'Noticias', href: '/noticias' },
                  { name: 'Contacto', href: '/contacto' },
                ].map((link) => (
                  <Link
                    key={link.name}
                    to={link.href}
                    className="block px-4 py-2 text-neutral-600 hover:text-primary-600 font-medium bg-white/20 hover:bg-white/40 rounded-xl transition-all duration-300 hover:shadow-soft-sm border border-transparent hover:border-white/30"
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Información de contacto */}
            <div>
              <h3 className="text-lg font-bold text-neutral-800 mb-6">
                Contacto
              </h3>
              <div className="space-y-4">
                <div className="bg-white/40 backdrop-blur-soft rounded-2xl p-4 shadow-soft-sm border border-white/30">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl"></span>
                    <div>
                      <div className="text-sm font-semibold text-neutral-700">Email</div>
                      <div className="text-sm text-neutral-600">hola@acachile.com</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/40 backdrop-blur-soft rounded-2xl p-4 shadow-soft-sm border border-white/30">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🌐</span>
                    <div>
                      <div className="text-sm font-semibold text-neutral-700">Web</div>
                      <div className="text-sm text-neutral-600">acachile.com</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Línea divisoria */}
          <div className="mt-12 sm:mt-16 pt-6 sm:pt-8 border-t border-white/20">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <div className="text-center md:text-left">
                <p className="text-neutral-600 text-sm font-medium">
                  © 2025 ACA Chile - Asociación Chilena de Asadores A.G.
                </p>
                <p className="text-neutral-500 text-xs mt-1">
                  Todos los derechos reservados. Hecho con ❤️ para la comunidad asadora.
                </p>
                <p className="text-neutral-500 text-xs mt-2">
                  Desarrollado por{' '}
                  <a
                    href="https://juancartagena.cl"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-700 font-medium transition-colors duration-300 hover:underline"
                  >
                    Juan Cartagena
                  </a>
                  {' '}• Stack tecnológico principal: React, TypeScript, Cloudflare Pages • Hosteado en Cloudflare
                </p>
              </div>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 sm:gap-6 text-sm">
                <Link 
                  to="/privacidad" 
                  className="text-neutral-600 hover:text-primary-600 font-medium transition-colors duration-300"
                >
                  Privacidad
                </Link>
                <Link 
                  to="/terminos" 
                  className="text-neutral-600 hover:text-primary-600 font-medium transition-colors duration-300"
                >
                  Términos
                </Link>
                <a
                  href="https://wbqachile2025.cl/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 sm:px-4 bg-primary-500/10 hover:bg-primary-500/20 text-primary-600 hover:text-primary-700 rounded-xl font-semibold transition-all duration-300 hover:shadow-soft-sm border border-primary-200/50"
                >
                  WBQA 2025
                </a>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;
