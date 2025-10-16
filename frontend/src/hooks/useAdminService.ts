// Hook para integrar servicios administrativos con AuthContext
import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AppUser } from '../../../shared';

// Interfaces específicas para AdminModule
export interface Member {
  id: number;
  name: string;
  email: string;
  phone: string;
  memberSince: string;
  status: 'active' | 'inactive';
  lastPayment: string;
  role: string;
}

export interface Communication {
  id: number;
  title: string;
  content: string;
  type: 'importante' | 'corriente' | 'urgente';
  recipients: string[];
  sentAt: string;
  status: 'draft' | 'sent';
}

export interface PaymentRecord {
  id: number;
  memberId: number;
  memberName: string;
  amount: number;
  month: number;
  year: number;
  paid: boolean;
  paidDate?: string;
  paymentMethod?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

class AdminService {
  private authContext?: {
    user: AppUser | null;
    updateUser: (userData: Partial<AppUser>) => void;
    hasPermission: (permission: any) => boolean;
  };

  // Set the auth context for real data integration
  setAuthContext(authContext: { 
    user: AppUser | null; 
    updateUser: (userData: Partial<AppUser>) => void;
    hasPermission: (permission: any) => boolean;
  }) {
    this.authContext = authContext;
  }

  // Verificar si el usuario tiene permisos de administrador
  private hasAdminPermissions(): boolean {
    if (!this.authContext?.user) return false;
    const userRoles = this.authContext.user.roles || [];
    return userRoles.includes('admin') || userRoles.includes('director');
  }

  // Obtener lista de miembros
  async getMembers(searchTerm?: string): Promise<ApiResponse<Member[]>> {
    try {
      if (!this.hasAdminPermissions()) {
        return { success: false, error: 'No tienes permisos para ver los miembros' };
      }

      // Llamar a la API real de socios
      const queryParams = new URLSearchParams();
      if (searchTerm) {
        queryParams.append('search', searchTerm);
      }

      const response = await fetch(`/api/admin/socios?${queryParams}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al obtener socios');
      }

      const data = await response.json();
      
      if (!data.success || !data.data) {
        throw new Error(data.error || 'Error al obtener socios');
      }

      // Transformar los datos de la API al formato esperado por AdminModule
      const members: Member[] = data.data.socios.map((socio: any) => ({
        id: socio.id,
        name: socio.nombreCompleto || `${socio.nombre} ${socio.apellido}`,
        email: socio.email,
        phone: socio.telefono || 'N/A',
        memberSince: socio.fechaIngreso || socio.createdAt,
        status: socio.estadoSocio === 'activo' ? 'active' : 'inactive',
        lastPayment: socio.estadisticasAño?.ultimoPago || 'N/A',
        role: socio.role || 'usuario',
      }));

      return { success: true, data: members };
    } catch (error) {
      console.error('Error getting members:', error);
      return { success: false, error: 'Error obteniendo lista de miembros' };
    }
  }

  // Obtener comunicaciones
  async getCommunications(): Promise<ApiResponse<Communication[]>> {
    try {
      if (!this.hasAdminPermissions()) {
        return { success: false, error: 'No tienes permisos para ver las comunicaciones' };
      }

      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/admin/comunicados', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success || !data.comunicados) {
        throw new Error('Respuesta inválida del servidor');
      }

      // Transformar datos de la API al formato esperado por AdminModule
      const communications: Communication[] = data.comunicados.map((c: any) => ({
        id: c.id,
        title: c.titulo,
        content: c.contenido,
        type: c.tipo as 'importante' | 'corriente' | 'urgente',
        recipients: c.destinatarios,
        sentAt: c.fecha_envio || undefined,
        status: c.estado === 'enviado' ? 'sent' : 'draft'
      }));

      return { success: true, data: communications };
    } catch (error) {
      console.error('Error getting communications:', error);
      return { success: false, error: 'Error obteniendo comunicaciones' };
    }
  }

  // Obtener registros de pagos
  async getPaymentRecords(): Promise<ApiResponse<PaymentRecord[]>> {
    try {
      if (!this.hasAdminPermissions()) {
        return { success: false, error: 'No tienes permisos para ver los pagos' };
      }

      // Llamar a la API real de cuotas
      const currentYear = new Date().getFullYear();
      const response = await fetch(`/api/admin/cuotas?año=${currentYear}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al obtener cuotas');
      }

      const data = await response.json();
      
      if (!data.success || !data.data) {
        throw new Error(data.error || 'Error al obtener cuotas');
      }

      // Transformar los datos de la API al formato esperado
      const payments: PaymentRecord[] = data.data.cuotas.map((cuota: any) => ({
        id: cuota.id,
        memberId: cuota.usuarioId,
        memberName: cuota.socio?.nombreCompleto || `${cuota.socio?.nombre} ${cuota.socio?.apellido}`,
        amount: cuota.valor,
        month: cuota.mes,
        year: cuota.año,
        paid: cuota.pagado,
        paidDate: cuota.fechaPago,
        paymentMethod: cuota.metodoPago,
      }));

      return { success: true, data: payments };
    } catch (error) {
      console.error('Error getting payment records:', error);
      return { success: false, error: 'Error obteniendo registros de pagos' };
    }
  }

  // Crear nueva comunicación
  async createCommunication(communication: Omit<Communication, 'id' | 'sentAt' | 'status'>): Promise<ApiResponse<Communication>> {
    try {
      if (!this.hasAdminPermissions()) {
        return { success: false, error: 'No tienes permisos para crear comunicaciones' };
      }

      await new Promise(resolve => setTimeout(resolve, 800));

      const newCommunication: Communication = {
        ...communication,
        id: Date.now(),
        sentAt: new Date().toISOString().split('T')[0] || '',
        status: 'sent'
      };

      console.log('Creando comunicación:', newCommunication);

      return { 
        success: true, 
        data: newCommunication,
        message: 'Comunicación enviada exitosamente' 
      };
    } catch (error) {
      console.error('Error creating communication:', error);
      return { success: false, error: 'Error enviando comunicación' };
    }
  }
}

const adminServiceInstance = new AdminService();

export const useAdminService = () => {
  const { user, updateUser, hasPermission } = useAuth();

  useEffect(() => {
    // Initialize admin service with AuthContext
    if (user) {
      adminServiceInstance.setAuthContext({ user, updateUser, hasPermission });
    }
  }, [user, updateUser, hasPermission]);

  return adminServiceInstance;
};