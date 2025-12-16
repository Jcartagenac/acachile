import { ReactNode, useState, useEffect } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';

interface ShopPasswordProtectionProps {
  children: ReactNode;
}

const SHOP_PASSWORD = 'Aca2025';
const SHOP_ACCESS_KEY = 'aca_shop_access';
const SHOP_ACCESS_EXPIRY_KEY = 'aca_shop_access_expiry';
const ACCESS_DURATION_MS = 24 * 60 * 60 * 1000; // 24 horas en milisegundos

export const ShopPasswordProtection: React.FC<ShopPasswordProtectionProps> = ({ children }) => {
  const [hasAccess, setHasAccess] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check if user has already entered the password and if it hasn't expired
    const accessGranted = localStorage.getItem(SHOP_ACCESS_KEY);
    const expiryTime = localStorage.getItem(SHOP_ACCESS_EXPIRY_KEY);
    
    if (accessGranted === 'true' && expiryTime) {
      const now = Date.now();
      const expiry = parseInt(expiryTime, 10);
      
      if (now < expiry) {
        // Access is still valid
        setHasAccess(true);
      } else {
        // Access has expired, clean up
        localStorage.removeItem(SHOP_ACCESS_KEY);
        localStorage.removeItem(SHOP_ACCESS_EXPIRY_KEY);
      }
    }
    setIsChecking(false);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password === SHOP_PASSWORD) {
      const expiryTime = Date.now() + ACCESS_DURATION_MS;
      localStorage.setItem(SHOP_ACCESS_KEY, 'true');
      localStorage.setItem(SHOP_ACCESS_EXPIRY_KEY, expiryTime.toString());
      setHasAccess(true);
    } else {
      setError('Clave incorrecta. Por favor intenta nuevamente.');
      setPassword('');
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <div className="text-sm text-gray-500">Verificando acceso...</div>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-primary-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-soft-lg p-8 border border-neutral-200">
            {/* Icon */}
            <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="h-8 w-8 text-primary-600" />
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-neutral-900 mb-2 text-center">
              Tienda Exclusiva
            </h2>
            <p className="text-neutral-600 mb-6 text-center">
              Ingresa la clave de acceso para continuar
            </p>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-2">
                  Clave de Acceso
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    placeholder="Ingresa la clave"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
                  <Lock className="h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold shadow-soft-md hover:shadow-soft-lg"
              >
                Ingresar a la Tienda
              </button>
            </form>

            {/* Footer */}
            <div className="mt-6 pt-6 border-t border-neutral-200">
              <p className="text-xs text-neutral-500 text-center mb-2">
                El acceso será válido por 24 horas
              </p>
              <p className="text-xs text-neutral-400 text-center">
                Si no conoces la clave de acceso, contacta con ACA Chile
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
