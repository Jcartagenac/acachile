// Servicio para APIs de administración
import { authService } from './authService';

const API_BASE_URL = '/api';

export interface DashboardStats {
  users: {
    total: number;
    active: number;
    new_today: number;
    new_week: number;
  };
  events: {
    total: number;
    active: number;
    archived: number;
    new_today: number;
  };
  news: {
    total: number;
    published: number;
    drafts: number;
    new_today: number;
  };
  comments: {
    total: number;
    pending: number;
    approved: number;
    new_today: number;
  };
  system: {
    uptime: string;
    health: string;
    last_backup: string;
  };
}

export interface RecentActivity {
  id: string;
  type: 'user_registration' | 'event_created' | 'news_published' | 'comment_added' | 'login';
  user: {
    id: string;
    name: string;
    email: string;
  };
  description: string;
  timestamp: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'director' | 'director_editor' | 'usuario';
  created_at: string;
  updated_at: string;
  last_login?: string;
  is_active: boolean;
  stats?: {
    events_created: number;
    inscriptions: number;
    comments: number;
  };
}

export interface SystemConfig {
  site: {
    name: string;
    description: string;
    logo: string;
    theme: string;
    maintenance_mode: boolean;
    maintenance_message: string;
  };
  features: {
    user_registration: boolean;
    event_registration: boolean;
    comments_enabled: boolean;
    news_public: boolean;
    search_enabled: boolean;
    notifications_enabled: boolean;
  };
  limits: {
    max_events_per_page: number;
    max_news_per_page: number;
    max_comments_per_item: number;
    max_file_size_mb: number;
    max_image_size_mb: number;
  };
  security: {
    max_login_attempts: number;
    session_timeout_hours: number;
    require_email_verification: boolean;
    allow_password_reset: boolean;
    min_password_length: number;
  };
}

export interface AdvancedStats {
  overview: {
    total_users: number;
    total_events: number;
    total_news: number;
    total_comments: number;
  };
  growth: {
    users: Array<{ date: string; count: number }>;
    events: Array<{ date: string; count: number }>;
    news: Array<{ date: string; count: number }>;
  };
  top_lists: {
    most_active_users: Array<{ user: User; activity_count: number }>;
    popular_events: Array<{ event: any; inscriptions: number }>;
    trending_news: Array<{ news: any; views: number }>;
  };
}

class AdminService {
  private getAuthHeaders() {
    const token = authService.getToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  private normalizeUser(raw: any): User {
    const id =
      raw?.id !== undefined && raw?.id !== null
        ? String(raw.id)
        : raw?.user_id !== undefined && raw?.user_id !== null
          ? String(raw.user_id)
          : '';

    const fallbackName = raw?.email ? raw.email.split('@')[0] : 'Usuario sin nombre';
    const joinedName = `${raw?.nombre ?? ''} ${raw?.apellido ?? ''}`.trim();
    const name = (raw?.name ?? joinedName || fallbackName).trim();

    const statsSource = raw?.stats ?? raw?.statistics ?? null;
    let normalizedStats: User['stats'] | undefined;

    if (statsSource) {
      const stats = {
        events_created: Number(
          statsSource.events_created ??
          statsSource.eventos_creados ??
          statsSource.total_eventos ??
          0
        ),
        inscriptions: Number(
          statsSource.inscriptions ??
          statsSource.inscripciones ??
          statsSource.inscripciones_count ??
          0
        ),
        comments: Number(
          statsSource.comments ??
          statsSource.comentarios ??
          statsSource.comments_count ??
          0
        )
      };

      normalizedStats = stats;
    }

    const isActive = (() => {
      if (typeof raw?.is_active === 'boolean') {
        return raw.is_active;
      }
      if (raw?.status !== undefined && raw?.status !== null) {
        if (typeof raw.status === 'string') {
          return raw.status === 'active' || raw.status === 'ACTIVO';
        }
        if (typeof raw.status === 'number') {
          return raw.status === 1;
        }
      }
      if (raw?.activo !== undefined) {
        return raw.activo === 1 || raw.activo === true;
      }
      return true;
    })();

    return {
      id,
      name: name || fallbackName,
      email: raw?.email ?? '',
      role: raw?.role ?? 'usuario',
      created_at: raw?.created_at ?? '',
      updated_at: raw?.updated_at ?? '',
      last_login: raw?.last_login || raw?.lastLogin || undefined,
      is_active: isActive,
      stats: normalizedStats
    };
  }

  // Dashboard
  async getDashboardStats(timeRange?: 'week' | 'month' | 'year'): Promise<{ success: boolean; data?: DashboardStats; error?: string }> {
    try {
      // Mock data for development - replace with real API call later
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
      
      const mockStats: DashboardStats = {
        users: {
          total: 156,
          active: 142,
          new_today: 3,
          new_week: 12
        },
        events: {
          total: 24,
          active: 18,
          archived: 6,
          new_today: 1
        },
        news: {
          total: 45,
          published: 38,
          drafts: 7,
          new_today: 2
        },
        comments: {
          total: 89,
          pending: 5,
          approved: 84,
          new_today: 4
        },
        system: {
          uptime: '15 días',
          health: 'Excelente',
          last_backup: '2024-10-15 02:00:00'
        }
      };
      
      return { success: true, data: mockStats };
    } catch (error) {
      console.error('Error en getDashboardStats:', error);
      return { success: false, error: 'Error cargando estadísticas del dashboard' };
    }
  }

  async getRecentActivity(): Promise<RecentActivity[]> {
    try {
      // Mock data for development - replace with real API call later
      await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API delay
      
      const mockActivity: RecentActivity[] = [
        {
          id: '1',
          type: 'user_registration',
          user: { id: '123', name: 'Juan Pérez', email: 'juan@email.com' },
          description: 'Nuevo usuario registrado',
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString() // 30 min ago
        },
        {
          id: '2',
          type: 'event_created',
          user: { id: '456', name: 'María Admin', email: 'maria@aca.cl' },
          description: 'Creó el evento "Asado de Octubre"',
          timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString() // 2 hours ago
        },
        {
          id: '3',
          type: 'news_published',
          user: { id: '789', name: 'Carlos Editor', email: 'carlos@aca.cl' },
          description: 'Publicó noticia sobre técnicas de parrilla',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString() // 4 hours ago
        }
      ];
      
      return mockActivity;
    } catch (error) {
      console.error('Error en getRecentActivity:', error);
      throw error;
    }
  }

  // Gestión de usuarios
  async getUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
  }): Promise<{ users: User[]; pagination: any }> {
    try {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', params.page.toString());
      if (params?.limit) searchParams.set('limit', params.limit.toString());
      if (params?.search) searchParams.set('search', params.search);
      if (params?.role) searchParams.set('role', params.role);
      if (params?.status) searchParams.set('status', params.status);

      const response = await fetch(`${API_BASE_URL}/admin/users?${searchParams}`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Error obteniendo usuarios');
      }

      const data = await response.json();
      if (data?.success === false) {
        throw new Error(data?.error || 'Error obteniendo usuarios');
      }

      const rawUsers: any[] = Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data?.users)
          ? data.users
          : [];

      const users = rawUsers.map((user) => this.normalizeUser(user));

      const rawPagination = data?.pagination ?? data?.meta?.pagination ?? null;
      let pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext?: boolean;
        hasPrev?: boolean;
      } | null = null;

      if (rawPagination) {
        const page = Number(rawPagination.page ?? rawPagination.currentPage ?? 1) || 1;
        const limit = Number(rawPagination.limit ?? rawPagination.perPage ?? 20) || 20;
        const total = Number(rawPagination.total ?? rawPagination.totalItems ?? rawPagination.count ?? users.length) || users.length;
        const computedTotalPages =
          Number(rawPagination.totalPages ?? rawPagination.total_pages ?? rawPagination.pages ?? Math.ceil(total / limit)) ||
          Math.ceil(total / limit);
        const totalPages = Math.max(1, computedTotalPages || 1);

        pagination = {
          page,
          limit,
          total,
          totalPages,
          hasNext: rawPagination.hasNext ?? rawPagination.has_next ?? page < totalPages,
          hasPrev: rawPagination.hasPrev ?? rawPagination.has_prev ?? page > 1
        };
      }

      return {
        users,
        pagination
      };
    } catch (error) {
      console.error('Error en getUsers:', error);
      throw error;
    }
  }

  async getUser(userId: string): Promise<User> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Error obteniendo usuario');
      }

      const data = await response.json();
      if (data?.success === false) {
        throw new Error(data?.error || 'Error obteniendo usuario');
      }

      const rawUser = data?.data ?? data?.user;
      return this.normalizeUser(rawUser);
    } catch (error) {
      console.error('Error en getUser:', error);
      throw error;
    }
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error('Error actualizando usuario');
      }

      const data = await response.json();
      if (data?.success === false) {
        throw new Error(data?.error || 'Error actualizando usuario');
      }

      const rawUser = data?.data ?? data?.user;
      return this.normalizeUser(rawUser);
    } catch (error) {
      console.error('Error en updateUser:', error);
      throw error;
    }
  }

  async deleteUser(userId: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Error eliminando usuario');
      }

      const data = await response.json().catch(() => null);
      if (data && data.success === false) {
        throw new Error(data?.error || 'Error eliminando usuario');
      }
    } catch (error) {
      console.error('Error en deleteUser:', error);
      throw error;
    }
  }

  async createUser(userData: {
    name: string;
    email: string;
    password: string;
    role: 'admin' | 'director' | 'director_editor' | 'usuario';
  }): Promise<User> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        throw new Error('Error creando usuario');
      }

      const data = await response.json();
      if (data?.success === false) {
        throw new Error(data?.error || 'Error creando usuario');
      }

      const rawUser = data?.data ?? data?.user;
      return this.normalizeUser(rawUser);
    } catch (error) {
      console.error('Error en createUser:', error);
      throw error;
    }
  }

  async getRoleCatalog(): Promise<Array<{ key: string; label: string; description: string }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/roles`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Error obteniendo catálogo de roles');
      }

      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        return data.data;
      }

      return [];
    } catch (error) {
      console.error('Error en getRoleCatalog:', error);
      return [];
    }
  }

  // Estadísticas avanzadas
  async getAdvancedStats(params?: {
    period?: 'day' | 'week' | 'month' | 'year';
    start_date?: string;
    end_date?: string;
  }): Promise<AdvancedStats> {
    try {
      const searchParams = new URLSearchParams();
      if (params?.period) searchParams.set('period', params.period);
      if (params?.start_date) searchParams.set('start_date', params.start_date);
      if (params?.end_date) searchParams.set('end_date', params.end_date);

      const response = await fetch(`${API_BASE_URL}/admin/stats?${searchParams}`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Error obteniendo estadísticas avanzadas');
      }

      const data = await response.json();
      return data.stats;
    } catch (error) {
      console.error('Error en getAdvancedStats:', error);
      throw error;
    }
  }

  // Configuraciones del sistema
  async getSystemConfig(): Promise<SystemConfig> {
    try {
      const response = await fetch(`${API_BASE_URL}/system/config`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Error obteniendo configuración del sistema');
      }

      const data = await response.json();
      return data.config;
    } catch (error) {
      console.error('Error en getSystemConfig:', error);
      throw error;
    }
  }

  async updateSystemConfig(config: Partial<SystemConfig>): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/system/config`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ config })
      });

      if (!response.ok) {
        throw new Error('Error actualizando configuración del sistema');
      }
    } catch (error) {
      console.error('Error en updateSystemConfig:', error);
      throw error;
    }
  }

  // Health check del sistema
  async getSystemHealth(detailed = false): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/system/health?detailed=${detailed}`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Error obteniendo estado del sistema');
      }

      return await response.json();
    } catch (error) {
      console.error('Error en getSystemHealth:', error);
      throw error;
    }
  }

  // Logs del sistema
  async getSystemLogs(params?: {
    type?: 'all' | 'system' | 'audit' | 'security' | 'errors';
    limit?: number;
    page?: number;
    level?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<any> {
    try {
      const searchParams = new URLSearchParams();
      if (params?.type) searchParams.set('type', params.type);
      if (params?.limit) searchParams.set('limit', params.limit.toString());
      if (params?.page) searchParams.set('page', params.page.toString());
      if (params?.level) searchParams.set('level', params.level);
      if (params?.start_date) searchParams.set('start_date', params.start_date);
      if (params?.end_date) searchParams.set('end_date', params.end_date);

      const response = await fetch(`${API_BASE_URL}/system/logs?${searchParams}`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Error obteniendo logs del sistema');
      }

      return await response.json();
    } catch (error) {
      console.error('Error en getSystemLogs:', error);
      throw error;
    }
  }

  // Operaciones de mantenimiento
  async performMaintenance(action: string, params?: any): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/system/maintenance`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ action, params })
      });

      if (!response.ok) {
        throw new Error('Error ejecutando operación de mantenimiento');
      }

      return await response.json();
    } catch (error) {
      console.error('Error en performMaintenance:', error);
      throw error;
    }
  }

  async getMaintenanceStatus(): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/system/maintenance`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Error obteniendo estado de mantenimiento');
      }

      return await response.json();
    } catch (error) {
      console.error('Error en getMaintenanceStatus:', error);
      throw error;
    }
  }
}

export const adminService = new AdminService();
