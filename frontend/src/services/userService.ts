// Servicio para gestión de perfil de usuario
import { authService } from './authService';

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  direccion?: string;
  avatar?: string;
  region?: string;
  fechaIngreso?: string;
  acaMembership?: {
    yearsActive: number;
    membershipNumber?: string;
    status: 'active' | 'inactive';
  };
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  direccion?: string;
  avatar?: string;
  region?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

class UserService {
  private readonly API_BASE_URL = '/api';

  private getAuthHeaders() {
    const token = authService.getToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  // Obtener perfil completo del usuario
  async getProfile(): Promise<ApiResponse<UserProfile>> {
    try {
      // Mock data for development - replace with real API call
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const mockProfile: UserProfile = {
        id: '1',
        firstName: 'Juan',
        lastName: 'Pérez',
        email: 'juan.perez@email.com',
        phone: '+56912345678',
        direccion: 'Las Condes, Santiago',
        region: 'Región Metropolitana',
        avatar: '/avatars/juan.jpg',
        fechaIngreso: '2020-03-15',
        acaMembership: {
          yearsActive: 4,
          membershipNumber: 'ACA-2020-001',
          status: 'active'
        }
      };

      return { success: true, data: mockProfile };
    } catch (error) {
      console.error('Error getting profile:', error);
      return { success: false, error: 'Error obteniendo perfil de usuario' };
    }
  }

  // Actualizar perfil de usuario
  async updateProfile(profileData: UpdateProfileRequest): Promise<ApiResponse<UserProfile>> {
    try {
      // Mock implementation - replace with real API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Simulate validation
      if (!profileData.firstName || !profileData.lastName) {
        return { 
          success: false, 
          error: 'Nombre y apellido son obligatorios' 
        };
      }

      if (profileData.email && !this.isValidEmail(profileData.email)) {
        return { 
          success: false, 
          error: 'Email no es válido' 
        };
      }

      // Simulate successful update
      const updatedProfile: UserProfile = {
        id: '1',
        firstName: profileData.firstName || 'Juan',
        lastName: profileData.lastName || 'Pérez',
        email: profileData.email || 'juan.perez@email.com',
        phone: profileData.phone,
        direccion: profileData.direccion,
        avatar: profileData.avatar,
        region: profileData.region || 'Región Metropolitana',
        fechaIngreso: '2020-03-15',
        acaMembership: {
          yearsActive: 4,
          membershipNumber: 'ACA-2020-001',
          status: 'active'
        }
      };

      return { 
        success: true, 
        data: updatedProfile, 
        message: 'Perfil actualizado exitosamente' 
      };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { success: false, error: 'Error actualizando perfil' };
    }
  }

  // Subir avatar
  async uploadAvatar(file: File): Promise<ApiResponse<{ avatarUrl: string }>> {
    try {
      // Mock implementation - replace with real file upload
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Validate file
      if (!file.type.startsWith('image/')) {
        return { success: false, error: 'Solo se permiten archivos de imagen' };
      }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB
        return { success: false, error: 'El archivo no puede ser mayor a 5MB' };
      }

      // Simulate successful upload
      const avatarUrl = `/avatars/${Date.now()}-${file.name}`;
      
      return { 
        success: true, 
        data: { avatarUrl }, 
        message: 'Avatar subido exitosamente' 
      };
    } catch (error) {
      console.error('Error uploading avatar:', error);
      return { success: false, error: 'Error subiendo imagen' };
    }
  }

  // Cambiar contraseña
  async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse<void>> {
    try {
      // Mock implementation - replace with real API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Validate password strength
      if (newPassword.length < 8) {
        return { 
          success: false, 
          error: 'La nueva contraseña debe tener al menos 8 caracteres' 
        };
      }

      // Simulate password validation
      if (currentPassword === 'wrongpassword') {
        return { 
          success: false, 
          error: 'Contraseña actual incorrecta' 
        };
      }

      return { 
        success: true, 
        message: 'Contraseña cambiada exitosamente' 
      };
    } catch (error) {
      console.error('Error changing password:', error);
      return { success: false, error: 'Error cambiando contraseña' };
    }
  }

  // Actualizar preferencias de notificación
  async updateNotificationPreferences(preferences: any): Promise<ApiResponse<void>> {
    try {
      // Mock implementation - replace with real API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return { 
        success: true, 
        message: 'Preferencias de notificación actualizadas' 
      };
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      return { success: false, error: 'Error actualizando preferencias' };
    }
  }

  // Helper methods
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

export const userService = new UserService();