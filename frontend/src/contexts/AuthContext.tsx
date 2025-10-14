import React, { createContext, useContext, useReducer, useEffect } from 'react';
import Cookies from 'js-cookie';
import { User, LoginRequest, RegisterRequest, AuthResponse } from '@shared/index';
import { logger } from '../utils/logger';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'AUTH_ERROR'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' };

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    case 'AUTH_ERROR':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    default:
      return state;
  }
};

interface AuthContextType extends AuthState {
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // API Base URL - usar variable de entorno o fallback local
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787';

  // Verificar token al cargar la aplicación
  useEffect(() => {
    const token = Cookies.get('auth_token');
    const userStr = Cookies.get('auth_user');
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        dispatch({ 
          type: 'AUTH_SUCCESS', 
          payload: { user, token } 
        });
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        logout();
      }
    }
  }, []);

  const login = async (credentials: LoginRequest) => {
    logger.auth.info('🔄 AuthContext: Iniciando login', { email: credentials.email });
    dispatch({ type: 'AUTH_START' });
    
    try {
      logger.auth.debug('🌐 AuthContext: Enviando request a API', { url: `${API_BASE_URL}/api/auth/login` });
      
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data: AuthResponse = await response.json();
      logger.auth.debug('📥 AuthContext: Response recibida', { 
        success: data.success, 
        status: response.status,
        hasUser: !!data.data?.user,
        hasToken: !!data.data?.token
      });

      if (!response.ok) {
        throw new Error(data.error || 'Error en el login');
      }

      if (data.success && data.data) {
        const { user, token } = data.data;
        logger.auth.info('✅ AuthContext: Login exitoso', { 
          userId: user.id, 
          userEmail: user.email,
          tokenLength: token.length 
        });
        
        // Guardar en cookies
        Cookies.set('auth_token', token, { expires: 7 }); // 7 días
        Cookies.set('auth_user', JSON.stringify(user), { expires: 7 });

        dispatch({ 
          type: 'AUTH_SUCCESS', 
          payload: { user, token } 
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      logger.auth.error('❌ AuthContext: Error en login', { 
        error: errorMessage,
        type: error instanceof Error ? 'Error' : typeof error
      });
      dispatch({ type: 'AUTH_ERROR', payload: errorMessage });
      throw error;
    }
  };

  const register = async (userData: RegisterRequest) => {
    dispatch({ type: 'AUTH_START' });
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data: AuthResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error en el registro');
      }

      if (data.success && data.data) {
        const { user, token } = data.data;
        
        // Guardar en cookies
        Cookies.set('auth_token', token, { expires: 7 });
        Cookies.set('auth_user', JSON.stringify(user), { expires: 7 });

        dispatch({ 
          type: 'AUTH_SUCCESS', 
          payload: { user, token } 
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      dispatch({ type: 'AUTH_ERROR', payload: errorMessage });
      throw error;
    }
  };

  const logout = () => {
    // Limpiar cookies
    Cookies.remove('auth_token');
    Cookies.remove('auth_user');
    
    dispatch({ type: 'LOGOUT' });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const contextValue: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    clearError,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};