// Servicio para gestión de cuenta de usuario (pagos, torneos, eventos)
import { AppUser } from '../../../shared';

export interface MembershipPayment {
  id: number;
  userId: number;
  month: number;
  year: number;
  amount: number;
  paid: boolean;
  paidDate?: string;
  paymentMethod?: 'transferencia' | 'efectivo' | 'tarjeta';
}

export interface Tournament {
  id: number;
  name: string;
  date: string;
  position?: number;
  participants: number;
  category: 'Profesional' | 'Amateur' | 'Regional';
}

export interface Award {
  id: number;
  title: string;
  description: string;
  date: string;
  category: 'torneo' | 'reconocimiento' | 'participacion';
}

export interface UserEvent {
  id: number;
  title: string;
  date: string;
  type: 'taller' | 'encuentro' | 'masterclass' | 'torneo';
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

class AccountService {
  private authContext?: {
    user: AppUser | null;
    updateUser: (userData: Partial<AppUser>) => void;
  };

  // Set the auth context for real data integration
  setAuthContext(authContext: { user: AppUser | null; updateUser: (userData: Partial<AppUser>) => void }) {
    this.authContext = authContext;
  }

  // Obtener pagos de membresía
  async getMembershipPayments(year?: number): Promise<ApiResponse<MembershipPayment[]>> {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      if (!this.authContext?.user) {
        return { success: false, error: 'Usuario no autenticado' };
      }

      // Mock data based on user
      const currentYear = year || new Date().getFullYear();
      const payments: MembershipPayment[] = [
        { id: 1, userId: this.authContext.user.id, month: 10, year: currentYear, amount: 25000, paid: true, paidDate: `${currentYear}-10-05`, paymentMethod: 'transferencia' },
        { id: 2, userId: this.authContext.user.id, month: 9, year: currentYear, amount: 25000, paid: true, paidDate: `${currentYear}-09-03`, paymentMethod: 'efectivo' },
        { id: 3, userId: this.authContext.user.id, month: 8, year: currentYear, amount: 25000, paid: false },
        { id: 4, userId: this.authContext.user.id, month: 7, year: currentYear, amount: 25000, paid: true, paidDate: `${currentYear}-07-02`, paymentMethod: 'tarjeta' },
        { id: 5, userId: this.authContext.user.id, month: 6, year: currentYear, amount: 25000, paid: true, paidDate: `${currentYear}-06-05`, paymentMethod: 'transferencia' },
      ];

      return { success: true, data: payments };
    } catch (error) {
      console.error('Error getting membership payments:', error);
      return { success: false, error: 'Error obteniendo historial de pagos' };
    }
  }

  // Obtener torneos del usuario
  async getUserTournaments(): Promise<ApiResponse<Tournament[]>> {
    try {
      await new Promise(resolve => setTimeout(resolve, 400));
      
      if (!this.authContext?.user) {
        return { success: false, error: 'Usuario no autenticado' };
      }

      const tournaments: Tournament[] = [
        { id: 1, name: 'Campeonato Nacional de Asado 2024', date: '2024-09-15', position: 3, participants: 24, category: 'Profesional' },
        { id: 2, name: 'Torneo Regional Santiago', date: '2024-07-20', position: 1, participants: 16, category: 'Amateur' },
        { id: 3, name: 'Copa ACA Primavera', date: '2024-06-10', position: 5, participants: 32, category: 'Profesional' },
        { id: 4, name: 'Desafío Parrilleros del Sur', date: '2024-05-05', position: 2, participants: 12, category: 'Regional' },
      ];

      return { success: true, data: tournaments };
    } catch (error) {
      console.error('Error getting user tournaments:', error);
      return { success: false, error: 'Error obteniendo historial de torneos' };
    }
  }

  // Obtener premios y reconocimientos
  async getUserAwards(): Promise<ApiResponse<Award[]>> {
    try {
      await new Promise(resolve => setTimeout(resolve, 350));
      
      if (!this.authContext?.user) {
        return { success: false, error: 'Usuario no autenticado' };
      }

      const awards: Award[] = [
        { id: 1, title: 'Mejor Asado Tradicional', description: 'Primer lugar en categoría tradicional', date: '2024-09-15', category: 'torneo' },
        { id: 2, title: 'Participación Destacada', description: 'Por excelente participación en eventos 2024', date: '2024-08-01', category: 'reconocimiento' },
        { id: 3, title: 'Asistencia Perfecta', description: 'Asistió a todos los eventos del año', date: '2024-07-15', category: 'participacion' },
      ];

      return { success: true, data: awards };
    } catch (error) {
      console.error('Error getting user awards:', error);
      return { success: false, error: 'Error obteniendo premios y reconocimientos' };
    }
  }

  // Obtener eventos del usuario
  async getUserEvents(): Promise<ApiResponse<UserEvent[]>> {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      if (!this.authContext?.user) {
        return { success: false, error: 'Usuario no autenticado' };
      }

      const events: UserEvent[] = [
        { id: 1, title: 'Workshop de Técnicas Avanzadas', date: '2024-10-01', type: 'taller' },
        { id: 2, title: 'Encuentro Mensual Octubre', date: '2024-10-15', type: 'encuentro' },
        { id: 3, title: 'Masterclass con Chef Invitado', date: '2024-09-20', type: 'masterclass' },
        { id: 4, title: 'Torneo Regional Santiago', date: '2024-07-20', type: 'torneo' },
      ];

      return { success: true, data: events };
    } catch (error) {
      console.error('Error getting user events:', error);
      return { success: false, error: 'Error obteniendo eventos del usuario' };
    }
  }

  // Registrar pago de membresía
  async recordPayment(month: number, year: number, amount: number, paymentMethod: string): Promise<ApiResponse<void>> {
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      if (!this.authContext?.user) {
        return { success: false, error: 'Usuario no autenticado' };
      }

      // En producción aquí se haría la llamada real a la API
      console.log('Registrando pago:', { month, year, amount, paymentMethod, userId: this.authContext.user.id });
      
      return { 
        success: true, 
        message: `Pago de ${amount.toLocaleString('es-CL')} registrado exitosamente para ${month}/${year}` 
      };
    } catch (error) {
      console.error('Error recording payment:', error);
      return { success: false, error: 'Error registrando el pago' };
    }
  }
}

export const accountService = new AccountService();