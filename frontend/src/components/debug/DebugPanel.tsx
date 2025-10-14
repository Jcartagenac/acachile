import React, { useState } from 'react';
import { logger } from '../../utils/logger';
import { useAuth } from '../../contexts/AuthContext';

export const DebugPanel: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { user, isAuthenticated, error, isLoading } = useAuth();

  const testLogin = () => {
    logger.auth.info('🧪 Test: Botón de test login presionado');
  };

  const testSearch = () => {
    logger.search.info('🧪 Test: Botón de test search presionado');
  };

  const clearLogs = () => {
    console.clear();
    logger.ui.info('🗑️ Console cleared');
  };

  const testApiConnection = async () => {
    logger.api.info('🧪 Test: Verificando conexión API...');
    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'https://acachile-api-production.juecart.workers.dev';
      const response = await fetch(`${apiUrl}/api/health`);
      const data = await response.json();
      
      logger.api.info('✅ API Health Check:', { 
        status: response.status, 
        data,
        url: apiUrl 
      });
    } catch (error) {
      logger.api.error('❌ API Health Check falló:', error);
    }
  };

  if (import.meta.env.PROD) {
    return null; // No mostrar en producción
  }

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        style={{
          position: 'fixed',
          top: '10px',
          right: '10px',
          zIndex: 9999,
          backgroundColor: '#FF6B6B',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          width: '50px',
          height: '50px',
          fontSize: '18px',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
        }}
        title="Debug Panel"
      >
        🐛
      </button>

      {/* Debug Panel */}
      {isVisible && (
        <div
          style={{
            position: 'fixed',
            top: '70px',
            right: '10px',
            width: '350px',
            maxHeight: '80vh',
            backgroundColor: 'white',
            border: '2px solid #FF6B6B',
            borderRadius: '10px',
            zIndex: 9998,
            padding: '15px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            overflow: 'auto'
          }}
        >
          <h3 style={{ margin: '0 0 15px 0', color: '#FF6B6B' }}>🐛 Debug Panel</h3>
          
          {/* Auth Status */}
          <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>🔐 Estado de Auth:</h4>
            <div style={{ fontSize: '12px', fontFamily: 'monospace' }}>
              <div>Autenticado: <span style={{ color: isAuthenticated ? 'green' : 'red' }}>{isAuthenticated ? 'SÍ' : 'NO'}</span></div>
              <div>Loading: <span style={{ color: isLoading ? 'orange' : 'green' }}>{isLoading ? 'SÍ' : 'NO'}</span></div>
              <div>Usuario: {user ? `${user.email} (${user.id})` : 'null'}</div>
              <div>Error: <span style={{ color: error ? 'red' : 'green' }}>{error || 'none'}</span></div>
            </div>
          </div>

          {/* Environment Info */}
          <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#e8f4fd', borderRadius: '5px' }}>
            <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>🌍 Environment:</h4>
            <div style={{ fontSize: '12px', fontFamily: 'monospace' }}>
              <div>API_URL: {import.meta.env.VITE_API_BASE_URL || 'undefined'}</div>
              <div>Mode: {import.meta.env.MODE}</div>
              <div>Dev: {import.meta.env.DEV ? 'SÍ' : 'NO'}</div>
            </div>
          </div>

          {/* Test Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              onClick={testApiConnection}
              style={{
                padding: '8px 12px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              🔗 Test API Connection
            </button>
            
            <button
              onClick={testLogin}
              style={{
                padding: '8px 12px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              🔐 Test Login Debug
            </button>
            
            <button
              onClick={testSearch}
              style={{
                padding: '8px 12px',
                backgroundColor: '#ffc107',
                color: 'black',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              🔍 Test Search Debug
            </button>
            
            <button
              onClick={clearLogs}
              style={{
                padding: '8px 12px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              🗑️ Clear Console
            </button>
          </div>

          <div style={{ 
            marginTop: '15px', 
            fontSize: '11px', 
            color: '#666',
            textAlign: 'center'
          }}>
            Abre DevTools (F12) para ver los logs
          </div>
        </div>
      )}
    </>
  );
};