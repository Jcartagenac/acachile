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

      await new Promise(resolve => setTimeout(resolve, 400));

      const allMembers: Member[] = [
        { id: 1, name: 'Juan Pérez', email: 'juan@email.com', phone: '+56912345678', memberSince: '2023-01-15', status: 'active', lastPayment: '2024-10-01', role: 'usuario' },
        { id: 2, name: 'María González', email: 'maria@email.com', phone: '+56987654321', memberSince: '2022-06-10', status: 'active', lastPayment: '2024-09-15', role: 'director' },
        { id: 3, name: 'Carlos Rodríguez', email: 'carlos@email.com', phone: '+56956789012', memberSince: '2024-03-20', status: 'inactive', lastPayment: '2024-07-01', role: 'usuario' },
        { id: 4, name: 'Ana Martínez', email: 'ana@email.com', phone: '+56923456789', memberSince: '2021-11-05', status: 'active', lastPayment: '2024-10-05', role: 'usuario' },
      ];

      const filteredMembers = searchTerm 
        ? allMembers.filter(member => 
            member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            member.email.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : allMembers;

      return { success: true, data: filteredMembers };
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

      await new Promise(resolve => setTimeout(resolve, 300));

      const communications: Communication[] = [
        {
          id: 1,
          title: 'Reunión General Noviembre',
          content: 'Se convoca a todos los miembros a la reunión general del mes de noviembre...',
          type: 'importante',
          recipients: ['todos'],
          sentAt: '2024-10-01',
          status: 'sent'
        },
        {
          id: 2,
          title: 'Recordatorio Cuotas Octubre',
          content: 'Recordamos que las cuotas de octubre vencen el 15 del mes...',
          type: 'corriente',
          recipients: ['morosos'],
          sentAt: '2024-10-10',
          status: 'sent'
        }
      ];

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

      await new Promise(resolve => setTimeout(resolve, 350));

      const payments: PaymentRecord[] = [
        { id: 1, memberId: 1, memberName: 'Juan Pérez', amount: 25000, month: 10, year: 2024, paid: true, paidDate: '2024-10-01', paymentMethod: 'transferencia' },
        { id: 2, memberId: 2, memberName: 'María González', amount: 25000, month: 10, year: 2024, paid: true, paidDate: '2024-10-02', paymentMethod: 'efectivo' },
        { id: 3, memberId: 3, memberName: 'Carlos Rodríguez', amount: 25000, month: 10, year: 2024, paid: false },
        { id: 4, memberId: 4, memberName: 'Ana Martínez', amount: 25000, month: 10, year: 2024, paid: true, paidDate: '2024-10-05', paymentMethod: 'tarjeta' },
      ];

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