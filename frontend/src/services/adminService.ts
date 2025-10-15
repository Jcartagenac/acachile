/**
 * Servicio para panel de administración
 * ACA Chile Frontexport interface AdminResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface DashboardStats {
  users: {
    total: number;
    activeUsers: number;
    newRegistrations: number;
    growth: number;
  };
  events: {
    active: number;
    pending: number;
    total: number;
    growth: number;
  };
  articles: {
    published: number;
    draft: number;
    total: number;
    growth: number;
  };
  comments: {
    total: number;
    pending: number;
    approved: number;
    growth: number;
  };
  pageViews: {
    total: number;
    growth: number;
  };
  registrations: {
    total: number;
    growth: number;
  };
  cancellations: {
    total: number;
    rate: number;
  };
}*/

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://acachile-prod.pages.dev';

export interface AdminStats {
  usuarios: {
    total: number;
    activos: number;
    nuevos_mes: number;
  };
  eventos: {
    total: number;
    activos: number;
    inscripciones_mes: number;
  };
  noticias: {
    total: number;
    publicadas: number;
    vistas_mes: number;
  };
  comentarios: {
    total: number;
    pendientes: number;
    aprobados_mes: number;
  };
}

export interface AdminUser {
  id: number;
  email: string;
  nombre: string;
  apellido: string;
  telefono?: string;
  rut?: string;
  ciudad?: string;
  role: 'admin' | 'editor' | 'user';
  activo: boolean;
  created_at: string;
  last_login?: string;
}

export interface PendingComment {
  id: number;
  article_id: number;
  author_name: string;
  author_email: string;
  content: string;
  status: string;
  created_at: string;
  article_title: string;
}

export interface ActivityItem {
  tipo: 'inscripcion' | 'usuario' | 'comentario';
  id: number;
  usuario: string;
  descripcion: string;
  fecha: string;
}

export interface DashboardStats {
  users: {
    total: number;
    activeUsers: number;
    newRegistrations: number;
    growth: number;
  };
  events: {
    active: number;
    pending: number;
    total: number;
    growth: number;
  };
  articles: {
    published: number;
    draft: number;
    total: number;
    growth: number;
  };
  comments: {
    total: number;
    pending: number;
    approved: number;
    growth: number;
  };
  pageViews: {
    total: number;
    growth: number;
  };
  registrations: {
    total: number;
    growth: number;
  };
  cancellations: {
    total: number;
    rate: number;
  };
}

export interface AdminResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  results?: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

class AdminService {
  private getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }

  // Obtener estadísticas del dashboard
  async getDashboardStats(timeRange?: 'week' | 'month' | 'year'): Promise<AdminResponse<DashboardStats>> {
    try {
      const params = new URLSearchParams();
      if (timeRange) {
        params.append('timeRange', timeRange);
      }
      
      const url = `${API_BASE_URL}/admin/dashboard/stats${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error obteniendo estadísticas del dashboard' 
      };
    }
  }

  // Obtener lista de usuarios
  async getUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<AdminResponse<PaginatedResponse<AdminUser>>> {
    try {
      const searchParams = new URLSearchParams();
      
      if (params?.page) searchParams.append('page', params.page.toString());
      if (params?.limit) searchParams.append('limit', params.limit.toString());
      if (params?.search) searchParams.append('search', params.search);

      const response = await fetch(
        `${API_BASE_URL}/api/admin/usuarios${searchParams.toString() ? `?${searchParams.toString()}` : ''}`,
        {
          method: 'GET',
          headers: this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return {
        success: true,
        data: {
          results: result.usuarios || [],
          pagination: result.pagination
        }
      };
    } catch (error) {
      console.error('Error getting users:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error obteniendo usuarios'
      };
    }
  }

  // Actualizar usuario
  async updateUser(
    userId: number,
    updates: Partial<{
      nombre: string;
      apellido: string;
      email: string;
      telefono: string;
      ciudad: string;
      role: 'admin' | 'editor' | 'user';
      activo: boolean;
    }>
  ): Promise<AdminResponse<{ message: string }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/usuarios/${userId}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('Error updating user:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error actualizando usuario'
      };
    }
  }

  // Desactivar usuario
  async deleteUser(userId: number): Promise<AdminResponse<{ message: string }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/usuarios/${userId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('Error deleting user:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error eliminando usuario'
      };
    }
  }

  // Obtener comentarios pendientes de moderación
  async getPendingComments(params?: {
    page?: number;
    limit?: number;
  }): Promise<AdminResponse<PaginatedResponse<PendingComment>>> {
    try {
      const searchParams = new URLSearchParams();
      
      if (params?.page) searchParams.append('page', params.page.toString());
      if (params?.limit) searchParams.append('limit', params.limit.toString());

      const response = await fetch(
        `${API_BASE_URL}/api/admin/comentarios${searchParams.toString() ? `?${searchParams.toString()}` : ''}`,
        {
          method: 'GET',
          headers: this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return {
        success: true,
        data: {
          results: result.comentarios || [],
          pagination: result.pagination
        }
      };
    } catch (error) {
      console.error('Error getting pending comments:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error obteniendo comentarios pendientes'
      };
    }
  }

  // Obtener actividad reciente
  async getRecentActivity(limit?: number): Promise<AdminResponse<{ actividad: ActivityItem[] }>> {
    try {
      const searchParams = new URLSearchParams();
      if (limit) searchParams.append('limit', limit.toString());

      const response = await fetch(
        `${API_BASE_URL}/api/admin/actividad${searchParams.toString() ? `?${searchParams.toString()}` : ''}`,
        {
          method: 'GET',
          headers: this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('Error getting recent activity:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error obteniendo actividad reciente'
      };
    }
  }

  // Ejecutar herramientas administrativas
  async runTool(action: 'clear_cache' | 'backup_data' | 'generate_report'): Promise<AdminResponse<any>> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/herramientas`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('Error running admin tool:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error ejecutando herramienta'
      };
    }
  }
}

export const adminService = new AdminService();