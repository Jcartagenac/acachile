import React from 'react';
import { Link } from 'react-router-dom';
import { Container } from './Container';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-soft-gradient-medium border-t border-white/20 relative overflow-hidden">
      {/* Elementos decorativos de fondo */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl -translate-x-48 -translate-y-48"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-pastel-blue/10 rounded-full blur-3xl translate-x-48 translate-y-48"></div>
      
      <Container>
        <div className="py-16 relative">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            {/* Logo y descripción */}
            <div className="md:col-span-2">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 bg-white/60 backdrop-blur-soft rounded-3xl flex items-center justify-center shadow-soft-lg border border-white/30">
                  <span className="text-3xl">🔥</span>
                </div>
                <div>
                  <div className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">
                    ACA Chile
                  </div>
                  <div className="text-sm text-neutral-600 font-medium">
                    Asociación Chilena de Asadores
                  </div>
                </div>
              </div>
              
              <div className="bg-white/40 backdrop-blur-soft rounded-2xl p-6 shadow-soft-sm border border-white/30 mb-8">
                <p className="text-neutral-600 text-base leading-relaxed font-light">
                  ACA es una asociación de Asadores donde nos reunimos amantes de los fuegos, 
                  las brasas y la parrilla. Una asociación sin fines de lucro que busca 
                  hacer crecer el movimiento parrillero nacional.
                </p>
              </div>
              
              {/* Redes sociales */}
              <div className="flex space-x-4">
                <a
                  href="https://www.instagram.com/aca.chile/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 bg-white/60 backdrop-blur-soft rounded-2xl flex items-center justify-center shadow-soft-md hover:shadow-soft-lg border border-white/30 text-neutral-600 hover:text-primary-600 transition-all duration-300 transform hover:scale-110"
                >
                  <span className="sr-only">Instagram</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12.017 0C8.396 0 7.929.01 6.684.048 5.443.085 4.60.204 3.875.43c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.403 4.864.284 5.706.247 6.948.01 8.192 0 8.66 0 12.017s.01 3.825.048 5.068c.036 1.243.155 2.085.38 2.81.307.788.718 1.458 1.384 2.126.667.666 1.336 1.077 2.126 1.384.725.226 1.567.344 2.809.38 1.244.038 1.713.048 5.070.048s3.825-.01 5.068-.048c1.243-.036 2.085-.155 2.81-.38.788-.307 1.458-.718 2.126-1.384.666-.667 1.077-1.336 1.384-2.126.226-.725.344-1.567.38-2.809.038-1.244.048-1.713.048-5.070s-.01-3.825-.048-5.068c-.036-1.243-.155-2.085-.38-2.81-.307-.788-.718-1.458-1.384-2.126C19.458.935 18.789.524 18 .217 17.275-.009 16.433-.128 15.190-.165 13.946-.203 13.477-.213 10.121-.213s-3.825.01-5.068.048C3.81.085 2.968.204 2.243.43 1.455.737.785 1.148.118 1.815-.549 2.482-.96 3.151-1.267 3.94c-.226.725-.344 1.567-.38 2.809C-1.685 8.192-1.695 8.66-1.695 12.017s.01 3.825.048 5.068c.036 1.243.155 2.085.38 2.81.307.788.718 1.458 1.384 2.126.667.666 1.336 1.077 2.126 1.384.725.226 1.567.344 2.809.38 1.244.038 1.713.048 5.070.048s3.825-.01 5.068-.048c1.243-.036 2.085-.155 2.81-.38.788-.307 1.458-.718 2.126-1.384.666-.667 1.077-1.336 1.384-2.126.226-.725.344-1.567.38-2.809.038-1.244.048-1.713.048-5.070s-.01-3.825-.048-5.068c-.036-1.243-.155-2.085-.38-2.81-.307-.788-.718-1.458-1.384-2.126C18.542.935 17.873.524 17.085.217 16.36-.009 15.518-.128 14.275-.165 13.031-.203 12.562-.213 9.206-.213s-3.825.01-5.068.048C2.895.085 2.053.204 1.328.43c-.788.307-1.458.718-2.126 1.384S-.96 3.15-1.267 3.94c-.226.725-.344 1.567-.38 2.809C-1.685 8.192-1.695 8.66-1.695 12.017s.01 3.825.048 5.068c.036 1.243.155 2.085.38 2.81.307.788.718 1.458 1.384 2.126.667.666 1.336 1.077 2.126 1.384.725.226 1.567.344 2.809.38 1.244.038 1.713.048 5.070.048z" clipRule="evenodd" />
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
                  href="mailto:info@acachile.com"
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
                    <span className="text-2xl">📍</span>
                    <div>
                      <div className="text-sm font-semibold text-neutral-700">Ubicación</div>
                      <div className="text-sm text-neutral-600">Viña del Mar, Chile</div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white/40 backdrop-blur-soft rounded-2xl p-4 shadow-soft-sm border border-white/30">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📧</span>
                    <div>
                      <div className="text-sm font-semibold text-neutral-700">Email</div>
                      <div className="text-sm text-neutral-600">info@acachile.com</div>
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
          <div className="mt-16 pt-8 border-t border-white/20">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <div className="text-center md:text-left">
                <p className="text-neutral-600 text-sm font-medium">
                  © 2025 ACA Chile - Asociación Chilena de Asadores
                </p>
                <p className="text-neutral-500 text-xs mt-1">
                  Todos los derechos reservados. Hecho con ❤️ para la comunidad asadora.
                </p>
              </div>
              
              <div className="flex items-center space-x-6 text-sm">
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
                  className="px-4 py-2 bg-primary-500/10 hover:bg-primary-500/20 text-primary-600 hover:text-primary-700 rounded-xl font-semibold transition-all duration-300 hover:shadow-soft-sm border border-primary-200/50"
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