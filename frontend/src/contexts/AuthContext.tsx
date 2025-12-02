import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import Cookies from 'js-cookie';
import {
  AppUser,
  AuthApiUser,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  RegisterResponse,
  UserRole,
  Permission,
  roleUtils,
} from '@shared/index';
import { logger } from '../utils/logger';
import { getStoredToken } from '../utils/authToken';

const TOKEN_COOKIE_KEY = 'auth_token';
const USER_COOKIE_KEY = 'auth_user';

const persistAuth = (token: string, user: AppUser) => {
  Cookies.set(TOKEN_COOKIE_KEY, token, { expires: 7 });
  Cookies.set(USER_COOKIE_KEY, JSON.stringify(user), { expires: 7 });

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(TOKEN_COOKIE_KEY, token);
    window.localStorage.setItem(USER_COOKIE_KEY, JSON.stringify(user));
  }
};

const clearPersistedAuth = () => {
  Cookies.remove(TOKEN_COOKIE_KEY);
  Cookies.remove(USER_COOKIE_KEY);

  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(TOKEN_COOKIE_KEY);
    window.localStorage.removeItem(USER_COOKIE_KEY);
  }
};

const mapApiUserToAppUser = (apiUser: AuthApiUser, overrides?: Partial<AppUser>): AppUser => {
  const firstName = (apiUser.nombre ?? '').trim();
  const lastName = (apiUser.apellido ?? '').trim();

  // Map legacy roles to new role system
  let mappedRole: UserRole;
  switch (apiUser.role as string) {
    case 'super_admin':
    case 'admin':
      mappedRole = 'admin';
      break;
    case 'editor':
      mappedRole = 'director_editor';
      break;
    case 'organizer':
      mappedRole = 'director';
      break;
    case 'user':
    default:
      mappedRole = 'usuario';
      break;
  }

  const base: AppUser = {
    id: apiUser.id,
    email: apiUser.email,
    firstName,
    lastName,
    name: [firstName, lastName].filter(Boolean).join(' ').trim() || apiUser.email,
    roles: [mappedRole],
    avatar: apiUser.foto_url ?? null,
    phone: apiUser.telefono ?? null,
    rut: apiUser.rut ?? null,
    ciudad: apiUser.ciudad ?? null,
    direccion: apiUser.direccion ?? null,
    comuna: apiUser.comuna ?? null,
    region: apiUser.region ?? null,
    fechaNacimiento: apiUser.fecha_nacimiento ?? null,
    redSocial: apiUser.red_social ?? null,
    membershipType: null,
    isActive: Boolean(apiUser.activo),
    createdAt: apiUser.created_at,
    lastLogin: apiUser.last_login ?? null,
  };

  return { ...base, ...overrides };
};

const parseStoredUser = (raw: string | undefined): AppUser | null => {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    // Datos antiguos almacenados como AuthApiUser
    if ('nombre' in parsed || 'apellido' in parsed) {
      return mapApiUserToAppUser(parsed as AuthApiUser);
    }

    const firstName = (parsed.firstName ?? parsed.nombre ?? '').toString().trim();
    const lastName = (parsed.lastName ?? parsed.apellido ?? '').toString().trim();
    // Map legacy roles to new role system
    const legacyRole = parsed.role as string;
    let mappedRole: UserRole;
    switch (legacyRole) {
      case 'super_admin':
      case 'admin':
        mappedRole = 'admin';
        break;
      case 'editor':
        mappedRole = 'director_editor';
        break;
      case 'organizer':
        mappedRole = 'director';
        break;
      case 'user':
      default:
        mappedRole = 'usuario';
        break;
    }

    const roles = Array.isArray(parsed.roles) && parsed.roles.length > 0
      ? parsed.roles
      : [mappedRole];

    return {
      id: Number(parsed.id),
      email: String(parsed.email ?? ''),
      firstName,
      lastName,
      name:
        (parsed.name ??
          [firstName, lastName].filter(Boolean).join(' ').trim() ??
          String(parsed.email ?? '')).trim(),
      roles,
      avatar: parsed.avatar ?? null,
      phone: parsed.phone ?? parsed.telefono ?? null,
      rut: parsed.rut ?? null,
      ciudad: parsed.ciudad ?? null,
      direccion: parsed.direccion ?? null,
      comuna: parsed.comuna ?? null,
      region: parsed.region ?? null,
      fechaNacimiento: parsed.fechaNacimiento ?? parsed.fecha_nacimiento ?? null,
      redSocial: parsed.redSocial ?? parsed.red_social ?? null,
      membershipType: parsed.membershipType ?? null,
      isActive:
        typeof parsed.isActive === 'boolean'
          ? parsed.isActive
          : Boolean(parsed.activo ?? true),
      createdAt: parsed.createdAt ?? parsed.created_at ?? new Date().toISOString(),
      lastLogin: parsed.lastLogin ?? parsed.last_login ?? null,
    };
  } catch (error) {
    console.error('Error parsing stored user data:', error);
    return null;
  }
};

const buildRegisterPayload = (userData: RegisterRequest) => {
  const trimmedName = userData.name.trim();
  const [firstName, ...lastNameParts] = trimmedName.split(/\s+/);
  const lastName = lastNameParts.join(' ');

  return {
    email: userData.email,
    password: userData.password,
    nombre: firstName || userData.email,
    apellido: lastName || firstName || userData.email,
    telefono: userData.phone || null,
    rut: userData.rut || null,
    ciudad: userData.region || null,
    role: userData.preferredRole === 'organizer' ? 'editor' : 'user',
  };
};

interface AuthState {
  user: AppUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: AppUser; token: string } }
  | { type: 'AUTH_ERROR'; payload: string }
  | { type: 'UPDATE_USER'; payload: Partial<AppUser> }
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
    case 'UPDATE_USER':
      if (!state.user) return state;
      return {
        ...state,
        user: {
          ...state.user,
          ...action.payload,
        },
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
  updateUser: (userData: Partial<AppUser>) => void;
  // Role and permission utilities
  hasPermission: (permission: Permission) => boolean;
  hasRole: (role: UserRole) => boolean;
  canManage: (targetRole: UserRole) => boolean;
  isAdmin: () => boolean;
  isDirector: () => boolean;
  isDirectorEditor: () => boolean;
  isUsuario: () => boolean;
  getUserRole: () => UserRole | null;
  getRoleDisplayName: () => string;
  getRoleColor: () => string;
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

  const readStoredUser = useCallback((): string | undefined => {
    const cookieValue = Cookies.get(USER_COOKIE_KEY);
    if (cookieValue) {
      return cookieValue;
    }

    if (typeof window !== 'undefined') {
      const localValue = window.localStorage.getItem(USER_COOKIE_KEY);
      if (localValue) {
        return localValue;
      }
    }

    return undefined;
  }, []);

  const handleAuthSuccess = useCallback((
    token: string,
    apiUser: AuthApiUser,
    overrides?: Partial<AppUser>,
  ) => {
    const mappedUser = mapApiUserToAppUser(apiUser, overrides);
    persistAuth(token, mappedUser);
    dispatch({
      type: 'AUTH_SUCCESS',
      payload: { user: mappedUser, token },
    });
  }, [dispatch]);

  const performLogout = useCallback(() => {
    clearPersistedAuth();
    dispatch({ type: 'LOGOUT' });
  }, [dispatch]);

  const verifyAndRefresh = useCallback(async (token: string) => {
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (!data?.success || !data?.data) {
        throw new Error(data?.error || 'Sesión inválida');
      }

      handleAuthSuccess(token, data.data);
    } catch (error) {
      logger.auth.warn('⚠️ AuthContext: Sesión inválida al verificar token', {
        error: error instanceof Error ? error.message : String(error),
      });
      performLogout();
    }
  }, [handleAuthSuccess, performLogout]);

  const login = async (credentials: LoginRequest) => {
    logger.auth.info('🔄 AuthContext: Iniciando login', { rut: credentials.rut });
    dispatch({ type: 'AUTH_START' });

    try {
      logger.auth.debug('🌐 AuthContext: Enviando request a API', { url: '/api/auth/login' });

      const response = await fetch('/api/auth/login', {
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
        hasToken: !!data.data?.token,
      });

      if (!response.ok || !data.success || !data.data) {
        const errorMessage = data.error || 'Error en el login';
        throw new Error(errorMessage);
      }

      handleAuthSuccess(data.data.token, data.data.user);
      logger.auth.info('✅ AuthContext: Login exitoso', {
        userId: data.data.user.id,
        userEmail: data.data.user.email,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      logger.auth.error('❌ AuthContext: Error en login', {
        error: errorMessage,
        type: error instanceof Error ? 'Error' : typeof error,
      });
      clearPersistedAuth();
      dispatch({ type: 'AUTH_ERROR', payload: errorMessage });
      throw error;
    }
  };

  const register = async (userData: RegisterRequest) => {
    logger.auth.info('🆕 AuthContext: Iniciando registro', { email: userData.email });
    dispatch({ type: 'AUTH_START' });

    try {
      const payload = buildRegisterPayload(userData);
      logger.auth.debug('🌐 AuthContext: Enviando request de registro', {
        payload: { ...payload, password: '[REDACTED]' },
      });

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data: RegisterResponse = await response.json();
      logger.auth.debug('📥 AuthContext: Response registro recibida', {
        success: data.success,
        status: response.status,
        hasUser: !!data.data?.user,
        hasToken: !!data.data?.token,
      });

      if (!response.ok || !data.success) {
        const errorMessage = data.error || 'Error en el registro';
        throw new Error(errorMessage);
      }

      if (data.data?.token && data.data.user) {
        logger.auth.info('✅ AuthContext: Registro exitoso con token recibido', {
          userId: data.data.user.id,
        });
        handleAuthSuccess(data.data.token, data.data.user, {
          region: userData.region ?? null,
        });
      } else {
        logger.auth.info('ℹ️ AuthContext: Registro exitoso, iniciando login automático');
        await login({
          email: userData.email,
          password: userData.password,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      logger.auth.error('❌ AuthContext: Error en registro', {
        error: errorMessage,
        type: error instanceof Error ? 'Error' : typeof error,
      });
      dispatch({ type: 'AUTH_ERROR', payload: errorMessage });
      throw error;
    }
  };

  useEffect(() => {
    const token = getStoredToken();
    const userStr = readStoredUser();

    if (token && userStr) {
      const storedUser = parseStoredUser(userStr);
      if (storedUser) {
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: { user: storedUser, token },
        });
        verifyAndRefresh(token);
        return;
      }
    }

    performLogout();
  }, [performLogout, readStoredUser, verifyAndRefresh]);

  const logout = () => {
    logger.auth.info('🚪 AuthContext: Logout solicitado', {
      userId: state.user?.id,
      userEmail: state.user?.email,
    });
    performLogout();
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const updateUser = (userData: Partial<AppUser>) => {
    logger.auth.info('🔄 AuthContext: Actualizando usuario', {
      userId: state.user?.id,
      updateFields: Object.keys(userData),
    });
    
    if (!state.user || !state.token) {
      logger.auth.warn('⚠️ AuthContext: No se puede actualizar usuario - no autenticado');
      return;
    }

    const updatedUser = {
      ...state.user,
      ...userData,
    };

    // Update the state
    dispatch({ type: 'UPDATE_USER', payload: userData });
    
    // Persist the updated user to cookies
    persistAuth(state.token, updatedUser);
    
    logger.auth.info('✅ AuthContext: Usuario actualizado exitosamente', {
      userId: updatedUser.id,
      updatedFields: Object.keys(userData),
    });
  };

  // Role and permission utility functions
  const hasPermission = (permission: Permission): boolean => {
    if (!state.user || !state.isAuthenticated) return false;
    const userRole = state.user.roles[0] as UserRole; // Taking first role
    return roleUtils.hasPermission(userRole, permission);
  };

  const hasRole = (role: UserRole): boolean => {
    if (!state.user || !state.isAuthenticated) return false;
    return state.user.roles.includes(role);
  };

  const canManage = (targetRole: UserRole): boolean => {
    if (!state.user || !state.isAuthenticated) return false;
    const userRole = state.user.roles[0] as UserRole;
    return roleUtils.canManage(userRole, targetRole);
  };

  const isAdmin = (): boolean => hasRole('admin');
  const isDirector = (): boolean => hasRole('director') || hasRole('admin');
  const isDirectorEditor = (): boolean => hasRole('director_editor') || hasRole('director') || hasRole('admin');
  const isUsuario = (): boolean => hasRole('usuario');

  const getUserRole = (): UserRole | null => {
    if (!state.user || !state.isAuthenticated) return null;
    return state.user.roles[0] as UserRole;
  };

  const getRoleDisplayName = (): string => {
    const role = getUserRole();
    return role ? roleUtils.getRoleDisplayName(role) : 'Sin rol';
  };

  const getRoleColor = (): string => {
    const role = getUserRole();
    return role ? roleUtils.getRoleColor(role) : 'gray';
  };

  const contextValue: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    clearError,
    updateUser,
    hasPermission,
    hasRole,
    canManage,
    isAdmin,
    isDirector,
    isDirectorEditor,
    isUsuario,
    getUserRole,
    getRoleDisplayName,
    getRoleColor,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
