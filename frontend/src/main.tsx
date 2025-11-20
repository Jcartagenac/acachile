import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './contexts/AuthContext'
import { EventProvider } from './contexts/EventContext'
import { logger } from './utils/logger'

// Override console.log en producción para silenciar logs directos
// El structured logging (logger utility) sigue funcionando
if (import.meta.env.MODE !== 'development') {
  console.log = () => { }; // Silenciar en producción

  // Mantener console.error y console.warn siempre activos
  // (ya funcionan por defecto)
}

// Initialize logger for debugging
logger.auth.info('🚀 Aplicación iniciando...');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <EventProvider>
        <App />
      </EventProvider>
    </AuthProvider>
  </StrictMode>,
)
