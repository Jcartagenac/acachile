import React from 'react';
import { Link } from 'react-router-dom';
import { Container } from '../ui/Container';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-secondary-900 text-white">
      <Container>
        <div className="py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Logo y descripción */}
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-xl">ACA</span>
                </div>
                <div>
                  <div className="text-xl font-bold">ACA Chile</div>
                  <div className="text-sm text-secondary-400">Asociación Chilena de Asadores</div>
                </div>
              </div>
              <p className="text-secondary-300 text-sm leading-relaxed mb-6">
                ACA es una asociación de Asadores donde nos reunimos amantes de los fuegos, 
                las brasas y la parrilla. Una asociación sin fines de lucro que busca 
                hacer crecer el movimiento parrillero nacional.
              </p>
              <div className="flex space-x-4">
                <a
                  href="https://www.instagram.com/aca.chile/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-secondary-400 hover:text-white transition-colors"
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
                  className="text-secondary-400 hover:text-white transition-colors"
                >
                  <span className="sr-only">Facebook</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </a>
                <a
                  href="https://www.youtube.com/@acachile7102"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-secondary-400 hover:text-white transition-colors"
                >
                  <span className="sr-only">YouTube</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Información */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Información</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/quienes-somos" className="text-secondary-300 hover:text-white transition-colors text-sm">
                    Quiénes somos
                  </Link>
                </li>
                <li>
                  <Link to="/unete" className="text-secondary-300 hover:text-white transition-colors text-sm">
                    Únete a ACA
                  </Link>
                </li>
                <li>
                  <Link to="/eventos" className="text-secondary-300 hover:text-white transition-colors text-sm">
                    Eventos
                  </Link>
                </li>
                <li>
                  <Link to="/noticias" className="text-secondary-300 hover:text-white transition-colors text-sm">
                    Noticias
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="text-secondary-300 hover:text-white transition-colors text-sm">
                    Política de Privacidad
                  </a>
                </li>
                <li>
                  <a href="#" className="text-secondary-300 hover:text-white transition-colors text-sm">
                    Términos de Uso
                  </a>
                </li>
                <li>
                  <Link to="/contacto" className="text-secondary-300 hover:text-white transition-colors text-sm">
                    Contacto
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-secondary-800 py-6">
          <p className="text-center text-secondary-400 text-sm">
            © 2025 ACA CHILE. Todos los derechos reservados.
          </p>
        </div>
      </Container>
    </footer>
  );
};