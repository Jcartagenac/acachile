// Servicio de autenticación
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  message?: string;
}

export interface PendingRegistration {
  id: string;
  userData: {
    email: string;
    name: string;
    phone?: string;
    region?: string;
    motivation?: string;
    experience?: string;
    references?: string;
    preferredRole?: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedBy?: number;
  reviewedAt?: string;
  reviewNotes?: string;
}

export interface PendingRegistrationResponse {
  success: boolean;
  data?: PendingRegistration[];
  error?: string;
  message?: string;
}

export interface RegistrationActionResponse {
  success: boolean;
  error?: string;
  message?: string;
}

class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'auth_user';

  // Obtener token guardado
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  // Obtener usuario guardado
  getUser(): User | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  // Guardar datos de autenticación
  setAuth(token: string, user: User): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  // Limpiar datos de autenticación
  clearAuth(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  // Verificar si está autenticado
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // Verificar si es admin
  isAdmin(): boolean {
    const user = this.getUser();
    return user?.role === 'admin';
  }

  // Login
  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success && data.token && data.user) {
        this.setAuth(data.token, data.user);
      }

      return data;
    } catch (error) {
      console.error('Error en login:', error);
      return {
        success: false,
        message: 'Error de conexión'
      };
    }
  }

  // Logout
  logout(): void {
    this.clearAuth();
  }

  // Verificar sesión actual
  async verifySession(): Promise<User | null> {
    const token = this.getToken();
    if (!token) return null;

    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          // Actualizar datos del usuario
          localStorage.setItem(this.USER_KEY, JSON.stringify(data.user));
          return data.user;
        }
      }

      // Token inválido, limpiar
      this.clearAuth();
      return null;
    } catch (error) {
      console.error('Error verificando sesión:', error);
      return null;
    }
  }

  async getPendingRegistrations(): Promise<PendingRegistrationResponse> {
    const token = this.getToken();
    if (!token) {
      return { success: false, error: 'Sesión expirada. Inicia sesión nuevamente.' };
    }

    try {
      const response = await fetch('/api/admin/registrations/pending', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 404) {
        console.warn('[authService] Endpoint de registros pendientes no disponible');
        return { success: true, data: [] };
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        return {
          success: false,
          error: data.error || `Error ${response.status} obteniendo registros pendientes`
        };
      }

      const data = await response.json();
      return {
        success: Boolean(data.success),
        data: data.data || [],
        message: data.message
      };
    } catch (error) {
      console.error('[authService] Error getPendingRegistrations:', error);
      return {
        success: false,
        error: 'Error de conexión obteniendo registros pendientes'
      };
    }
  }

  async approveRegistration(
    registrationId: string,
    options: { assignedRole?: string; membershipType?: string; notes?: string } = {}
  ): Promise<RegistrationActionResponse> {
    const token = this.getToken();
    if (!token) {
      return { success: false, error: 'Sesión expirada. Inicia sesión nuevamente.' };
    }

    try {
      const response = await fetch(`/api/admin/registrations/${registrationId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(options)
      });

      if (response.status === 404) {
        console.warn('[authService] Endpoint approveRegistration no disponible');
        return {
          success: false,
          error: 'La aprobación de registros no está disponible actualmente.'
        };
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `Error ${response.status} aprobando registro`
        };
      }

      return {
        success: Boolean(data.success),
        message: data.message,
        error: data.error
      };
    } catch (error) {
      console.error('[authService] Error approveRegistration:', error);
      return {
        success: false,
        error: 'Error de conexión aprobando registro'
      };
    }
  }

  async rejectRegistration(registrationId: string, reason?: string): Promise<RegistrationActionResponse> {
    const token = this.getToken();
    if (!token) {
      return { success: false, error: 'Sesión expirada. Inicia sesión nuevamente.' };
    }

    try {
      const response = await fetch(`/api/admin/registrations/${registrationId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });

      if (response.status === 404) {
        console.warn('[authService] Endpoint rejectRegistration no disponible');
        return {
          success: false,
          error: 'El rechazo de registros no está disponible actualmente.'
        };
      }

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `Error ${response.status} rechazando registro`
        };
      }

      return {
        success: Boolean(data.success),
        message: data.message,
        error: data.error
      };
    } catch (error) {
      console.error('[authService] Error rejectRegistration:', error);
      return {
        success: false,
        error: 'Error de conexión rechazando registro'
      };
    }
  }
}

export const authService = new AuthService();
