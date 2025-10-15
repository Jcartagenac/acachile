// Servicio para gestión de perfil de usuario
import { AppUser } from '../../../shared';

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
  private authContext?: {
    user: AppUser | null;
    updateUser: (userData: Partial<AppUser>) => void;
  };

  // Set the auth context for real data integration
  setAuthContext(authContext: { user: AppUser | null; updateUser: (userData: Partial<AppUser>) => void }) {
    this.authContext = authContext;
  }

  private mapAppUserToProfile(user: AppUser): UserProfile {
    return {
      id: user.id.toString(),
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email,
      phone: user.phone || undefined,
      direccion: user.city || undefined,
      avatar: user.avatar || undefined,
      region: typeof user.region === 'string' ? user.region : undefined,
      fechaIngreso: user.createdAt || undefined,
      acaMembership: {
        yearsActive: 2,
        membershipNumber: `ACA-${user.id.toString().slice(-4)}`,
        status: 'active' as const
      }
    };
  }

  // Obtener perfil completo del usuario
  async getProfile(): Promise<ApiResponse<UserProfile>> {
    try {
      // Use real user data from AuthContext if available
      if (this.authContext?.user) {
        await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API delay
        const profile = this.mapAppUserToProfile(this.authContext.user);
        return { success: true, data: profile };
      }

      // Fallback to mock data if no auth context (shouldn't happen in production)
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
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Validation
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

      // Use real AuthContext integration if available
      if (this.authContext?.user && this.authContext.updateUser) {
        // Update the AuthContext user with new data
        const userUpdates: Partial<AppUser> = {};
        
        if (profileData.firstName) userUpdates.firstName = profileData.firstName;
        if (profileData.lastName) userUpdates.lastName = profileData.lastName;
        if (profileData.email) userUpdates.email = profileData.email;
        if (profileData.phone !== undefined) userUpdates.phone = profileData.phone;
        if (profileData.direccion !== undefined) userUpdates.city = profileData.direccion;
        if (profileData.avatar !== undefined) userUpdates.avatar = profileData.avatar;
        if (profileData.region !== undefined) userUpdates.region = profileData.region;

        // Update name for display purposes
        if (profileData.firstName || profileData.lastName) {
          const firstName = profileData.firstName || this.authContext.user.firstName;
          const lastName = profileData.lastName || this.authContext.user.lastName;
          userUpdates.name = `${firstName} ${lastName}`.trim();
        }

        // Update AuthContext
        this.authContext.updateUser(userUpdates);

        // Return updated profile
        const updatedUser = { ...this.authContext.user, ...userUpdates };
        const updatedProfile = this.mapAppUserToProfile(updatedUser);

        return { 
          success: true, 
          data: updatedProfile, 
          message: 'Perfil actualizado exitosamente' 
        };
      }

      // Fallback mock response if no auth context
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

      // Create a preview URL for the uploaded file
      const avatarUrl = URL.createObjectURL(file);
      
      // Update the user's avatar in AuthContext if available
      if (this.authContext?.user && this.authContext.updateUser) {
        this.authContext.updateUser({ avatar: avatarUrl });
      }
      
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