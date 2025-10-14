import React from 'react';

export const HomePage: React.FC = () => {
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#e8ecf4', 
      padding: '2rem',
      fontFamily: 'Inter, sans-serif'
    }}>
      <h1 style={{ 
        fontSize: '3rem', 
        color: '#374151', 
        textAlign: 'center',
        marginBottom: '2rem'
      }}>
        🔥 ACA Chile - Asociación Chilena de Asadores
      </h1>
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '1rem',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        maxWidth: '800px',
        margin: '0 auto',
        textAlign: 'center'
      }}>
        <h2 style={{ color: '#374151', marginBottom: '1rem' }}>
          ¡Sitio Funcionando! 🎉
        </h2>
        <p style={{ color: '#6B7280', fontSize: '1.1rem' }}>
          El servidor está corriendo correctamente. 
          El diseño neumórfico está activado y las imágenes están cargando.
        </p>
        <img 
          src="https://www.acachile.com/uploads/events/banners/banner-578-12052023_005737.jpeg"
          alt="ACA Chile"
          style={{
            width: '100%',
            height: '300px',
            objectFit: 'cover',
            borderRadius: '0.5rem',
            marginTop: '1.5rem'
          }}
        />
      </div>
    </div>
  );
};