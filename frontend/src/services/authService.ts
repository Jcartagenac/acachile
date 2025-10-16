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
}

export const authService = new AuthService();