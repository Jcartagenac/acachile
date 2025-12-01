import { ReactNode, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Lock } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [showAccessDenied, setShowAccessDenied] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Mostrar mensaje de acceso denegado
      setShowAccessDenied(true);
      
      // Guardar la ruta a la que intentaba acceder
      const currentPath = window.location.pathname;
      sessionStorage.setItem('redirectAfterLogin', currentPath);
      
      // Redirigir después de 2 segundos
      const timer = setTimeout(() => {
        navigate('/', { replace: true });
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Mostrar loading mientras se verifica la autenticación
  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <div className="text-sm text-gray-500">Verificando acceso...</div>
        </div>
      </div>
    );
  }

  // Si no está autenticado, mostrar mensaje de acceso denegado
  if (!isAuthenticated && showAccessDenied) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-2xl shadow-soft-lg p-8 text-center border border-neutral-200">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="h-8 w-8 text-amber-600" />
            </div>
            <h2 className="text-2xl font-bold text-neutral-900 mb-2">
              Acceso Restringido
            </h2>
            <p className="text-neutral-600 mb-4">
              Esta sección es exclusiva para miembros de ACA Chile.
            </p>
            <p className="text-sm text-neutral-500">
              Redirigiendo a la página principal...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Si no está autenticado y no se muestra el mensaje, no mostrar nada
  if (!isAuthenticated) {
    return null;
  }

  // Si está autenticado, mostrar el contenido
  return <>{children}</>;
};
