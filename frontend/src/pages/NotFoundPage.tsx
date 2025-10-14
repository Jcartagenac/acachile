import React from 'react';
import { Link } from 'react-router-dom';
import { Container } from '../components/ui/Container';
import { Button } from '../components/ui/Button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="section-padding">
      <Container>
        <div className="text-center max-w-md mx-auto">
          <h1 className="text-6xl font-bold text-primary-600 mb-4">404</h1>
          <h2 className="text-2xl font-bold mb-4">Página no encontrada</h2>
          <p className="text-secondary-600 mb-8">
            La página que buscas no existe o ha sido movida.
          </p>
          <Link to="/">
            <Button>Volver al inicio</Button>
          </Link>
        </div>
      </Container>
    </div>
  );
};