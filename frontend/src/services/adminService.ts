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
    username: string;
    email: string;
  };
  description: string;
  timestamp: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
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

  // Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/dashboard`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Error obteniendo estadísticas del dashboard');
      }

      const data = await response.json();
      return data.stats;
    } catch (error) {
      console.error('Error en getDashboardStats:', error);
      throw error;
    }
  }

  async getRecentActivity(): Promise<RecentActivity[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/dashboard`, {
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Error obteniendo actividad reciente');
      }

      const data = await response.json();
      return data.recent_activity || [];
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
      return {
        users: data.users,
        pagination: data.pagination
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
      return data.user;
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
      return data.user;
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
    } catch (error) {
      console.error('Error en deleteUser:', error);
      throw error;
    }
  }

  async createUser(userData: {
    username: string;
    email: string;
    password: string;
    role: 'admin' | 'user';
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
      return data.user;
    } catch (error) {
      console.error('Error en createUser:', error);
      throw error;
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