import React from 'react';
import { Container } from '../components/ui/Container';

export const AboutPage: React.FC = () => {
  return (
    <div className="section-padding">
      <Container>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">Quiénes Somos</h1>
          <div className="prose prose-lg max-w-none">
            <p>
              Te damos la bienvenida a la ASOCIACION CHILENA DE ASADORES (ACA).
            </p>
            <p>
              ACA es una asociación de Asadores en donde nos reunimos amantes de los fuegos,
              las brasas y la parrilla.
            </p>
            <p>
              Página en construcción...
            </p>
          </div>
        </div>
      </Container>
    </div>
  );
};