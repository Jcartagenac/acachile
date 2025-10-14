import React from 'react';
import { Container } from '../components/ui/Container';

export const BlogPage: React.FC = () => {
  return (
    <div className="section-padding">
      <Container>
        <h1 className="text-4xl font-bold mb-8">Noticias</h1>
        <p className="text-lg text-secondary-600">
          Página en construcción...
        </p>
      </Container>
    </div>
  );
};

export const PostDetailPage: React.FC = () => {
  return (
    <div className="section-padding">
      <Container>
        <h1 className="text-4xl font-bold mb-8">Detalle de la Noticia</h1>
        <p className="text-lg text-secondary-600">
          Página en construcción...
        </p>
      </Container>
    </div>
  );
};