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

  /**
   * Valida los datos del perfil
   */
  private validateProfileData(profileData: UpdateProfileRequest): { valid: boolean; error?: string } {
    if (!profileData.firstName || !profileData.lastName) {
      return { 
        valid: false, 
        error: 'Nombre y apellido son obligatorios' 
      };
    }

    if (profileData.email && !this.isValidEmail(profileData.email)) {
      return { 
        valid: false, 
        error: 'Email no es válido' 
      };
    }

    return { valid: true };
  }

  /**
   * Construye el objeto de actualizaciones para AppUser
   */
  private buildUserUpdates(profileData: UpdateProfileRequest): Partial<AppUser> {
    const userUpdates: Partial<AppUser> = {};
    
    if (profileData.firstName) userUpdates.firstName = profileData.firstName;
    if (profileData.lastName) userUpdates.lastName = profileData.lastName;
    if (profileData.email) userUpdates.email = profileData.email;
    if (profileData.phone !== undefined) userUpdates.phone = profileData.phone;
    if (profileData.direccion !== undefined) userUpdates.city = profileData.direccion;
    if (profileData.avatar !== undefined) userUpdates.avatar = profileData.avatar;
    if (profileData.region !== undefined) userUpdates.region = profileData.region;

    return userUpdates;
  }

  /**
   * Actualiza el nombre completo del usuario
   */
  private updateFullName(userUpdates: Partial<AppUser>, profileData: UpdateProfileRequest): void {
    if (profileData.firstName || profileData.lastName) {
      const firstName = profileData.firstName || this.authContext?.user?.firstName || '';
      const lastName = profileData.lastName || this.authContext?.user?.lastName || '';
      userUpdates.name = `${firstName} ${lastName}`.trim();
    }
  }

  /**
   * Actualiza el perfil usando AuthContext
   */
  private updateProfileWithAuthContext(profileData: UpdateProfileRequest): ApiResponse<UserProfile> {
    if (!this.authContext?.user || !this.authContext.updateUser) {
      return { success: false, error: 'No hay contexto de autenticación' };
    }

    const userUpdates = this.buildUserUpdates(profileData);
    this.updateFullName(userUpdates, profileData);
    
    this.authContext.updateUser(userUpdates);

    const updatedUser = { ...this.authContext.user, ...userUpdates };
    const updatedProfile = this.mapAppUserToProfile(updatedUser);

    return { 
      success: true, 
      data: updatedProfile, 
      message: 'Perfil actualizado exitosamente' 
    };
  }

  /**
   * Crea un perfil mock como fallback
   */
  private createMockProfile(profileData: UpdateProfileRequest): UserProfile {
    return {
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
  }

  // Actualizar perfil de usuario
  async updateProfile(profileData: UpdateProfileRequest): Promise<ApiResponse<UserProfile>> {
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Validar datos
      const validation = this.validateProfileData(profileData);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Usar AuthContext si está disponible
      if (this.authContext?.user) {
        return this.updateProfileWithAuthContext(profileData);
      }

      // Fallback a respuesta mock
      const updatedProfile = this.createMockProfile(profileData);
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

    // Subir avatar de usuario (DEPRECATED - use imageService instead)
  async uploadAvatar(file: File): Promise<ApiResponse<{ avatarUrl: string }>> {
    try {
      console.warn('⚠️ userService.uploadAvatar is deprecated. Use imageService.uploadAvatar instead.');
      
      // Validate file
      if (!file.type.startsWith('image/')) {
        return { success: false, error: 'Solo se permiten archivos de imagen' };
      }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB
        return { success: false, error: 'El archivo no puede ser mayor a 5MB' };
      }

      // Create a temporary preview URL (will be lost on refresh)
      const avatarUrl = URL.createObjectURL(file);
      
      console.warn('⚠️ Esta imagen es temporal y se perderá al refrescar la página. Use imageService para persistencia en R2.');
      
      // Update the user's avatar in AuthContext if available
      if (this.authContext?.user && this.authContext.updateUser) {
        this.authContext.updateUser({ avatar: avatarUrl });
      }
      
      return { 
        success: true, 
        data: { avatarUrl }, 
        message: 'Avatar subido exitosamente (temporal)' 
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

  // Obtener preferencias de notificación
  async getNotificationPreferences(): Promise<ApiResponse<any>> {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      if (!this.authContext?.user) {
        return { success: false, error: 'Usuario no autenticado' };
      }

      // Mock data - en producción vendrá de la BD del usuario
      const preferences = {
        noticiasImportantes: true,
        noticiasCorrientes: false,
        comunicadosUrgentes: true,
        medios: {
          email: true,
          whatsapp: true,
          sms: false
        }
      };

      return { success: true, data: preferences };
    } catch (error) {
      console.error('Error getting notification preferences:', error);
      return { success: false, error: 'Error obteniendo preferencias' };
    }
  }

  // Actualizar preferencias de notificación
  async updateNotificationPreferences(preferences: any): Promise<ApiResponse<void>> {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (!this.authContext?.user) {
        return { success: false, error: 'Usuario no autenticado' };
      }

      // En producción aquí se actualizaría en la BD
      console.log('Actualizando preferencias de notificación:', preferences);
      
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