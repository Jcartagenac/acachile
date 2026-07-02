import React from 'react';
import { useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';

interface LayoutProps {
  children: React.ReactNode;
}

const STANDALONE_PATHS = new Set(['/cotizador', '/inscripciones']);

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const isStandalone = STANDALONE_PATHS.has(location.pathname);

  return (
    <div className="min-h-screen flex flex-col">
      {!isStandalone && <Header />}
      <main className="flex-1">{children}</main>
      {!isStandalone && <Footer />}
    </div>
  );
};
