// Servicio para gestión de perfil de usuario
import { AppUser } from '../../../shared';
import { buildAuthHeaders, getStoredToken } from '../utils/authToken';

export interface PrivacyPreferences {
  showEmail: boolean;
  showPhone: boolean;
  showRut: boolean;
  showAddress: boolean;
  showBirthdate: boolean;
  showPublicProfile: boolean;
}

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  direccion?: string;
  avatar?: string;
  region?: string;
  comuna?: string;
  fechaNacimiento?: string;
  redSocial?: string;
  rut?: string;
  ciudad?: string;
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
  phone?: string | null;
  direccion?: string | null;
  avatar?: string;
  region?: string | null;
  comuna?: string | null;
  fechaNacimiento?: string | null;
  redSocial?: string | null;
  rut?: string | null;
  ciudad?: string | null;
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

  private getAuthToken(): string | null {
    return getStoredToken();
  }

  private getAuthHeaders(contentType?: string): Headers {
    return buildAuthHeaders(undefined, contentType);
  }

  private mapAppUserToProfile(user: AppUser): UserProfile {
    return {
      id: user.id.toString(),
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email,
      phone: user.phone || undefined,
      rut: user.rut || undefined,
      ciudad: user.ciudad || undefined,
      direccion: user.direccion || undefined,
      avatar: user.avatar || undefined,
      region: typeof user.region === 'string' ? user.region : undefined,
      comuna: user.comuna || undefined,
      fechaNacimiento: user.fechaNacimiento || undefined,
      redSocial: user.redSocial || undefined,
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
      console.log('🔍 UserService: Fetching profile from API /api/user/me');
      
      // Intentar obtener de la API primero
      try {
        const response = await fetch('/api/user/me', {
          method: 'GET',
          headers: this.getAuthHeaders('application/json')
        });

        if (response.ok) {
          const data = await response.json();
          console.log('✅ UserService: API response:', data);

          if (data.success && data.data) {
            // Mapear la respuesta de la API al formato UserProfile
            const apiUser = data.data;
            console.log('🔍 UserService: API user data received:', apiUser);
            console.log('🔍 UserService: comuna from API:', apiUser.comuna);
            console.log('🔍 UserService: fecha_nacimiento from API:', apiUser.fecha_nacimiento);
            console.log('🔍 UserService: red_social from API:', apiUser.red_social);
            
            const profile: UserProfile = {
              id: apiUser.id.toString(),
              firstName: apiUser.nombre || '',
              lastName: apiUser.apellido || '',
              email: apiUser.email,
              phone: apiUser.telefono || undefined,
              rut: apiUser.rut || undefined,
              ciudad: apiUser.ciudad || undefined,
              direccion: apiUser.direccion || undefined,
              avatar: apiUser.avatar || undefined,
              region: apiUser.region || undefined,
              comuna: apiUser.comuna || undefined,
              fechaNacimiento: apiUser.fecha_nacimiento || undefined,
              redSocial: apiUser.red_social || undefined,
              fechaIngreso: apiUser.created_at || undefined,
              acaMembership: {
                yearsActive: 2,
                membershipNumber: `ACA-${apiUser.id.toString().slice(-4)}`,
                status: 'active' as const
              }
            };

            console.log('✅ UserService: Mapped profile from API:', profile);
            console.log('✅ UserService: comuna mapped:', profile.comuna);
            console.log('✅ UserService: fechaNacimiento mapped:', profile.fechaNacimiento);
            console.log('✅ UserService: redSocial mapped:', profile.redSocial);
            return { success: true, data: profile };
          }
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.warn('⚠️ UserService: API error, falling back to AuthContext:', errorData);
        }
      } catch (apiError) {
        console.warn('⚠️ UserService: API call failed, falling back to AuthContext:', apiError);
      }

      // Fallback: usar AuthContext si la API falla
      if (this.authContext?.user) {
        console.log('🔄 UserService: Using AuthContext fallback');
        await new Promise(resolve => setTimeout(resolve, 100));
        const profile = this.mapAppUserToProfile(this.authContext.user);
        console.log('✅ UserService: Mapped profile from AuthContext:', profile);
        return { success: true, data: profile };
      }

      return { success: false, error: 'No se pudo obtener el perfil del usuario' };

    } catch (error) {
      console.error('❌ UserService: Exception getting profile:', error);
      
      // Último fallback: AuthContext
      if (this.authContext?.user) {
        console.log('🔄 UserService: Exception fallback to AuthContext');
        const profile = this.mapAppUserToProfile(this.authContext.user);
        return { success: true, data: profile };
      }
      
      return { success: false, error: 'Error obteniendo perfil de usuario' };
    }
  }

  /**
   * Valida los datos del perfil
   */
  private validateProfileData(profileData: UpdateProfileRequest): { valid: boolean; error?: string } {
    // Solo validar si los campos están presentes en la solicitud
    if (profileData.hasOwnProperty('firstName') && (!profileData.firstName || profileData.firstName.trim().length < 2)) {
      return {
        valid: false,
        error: 'El nombre debe tener al menos 2 caracteres'
      };
    }

    if (profileData.hasOwnProperty('lastName') && (!profileData.lastName || profileData.lastName.trim().length < 2)) {
      return {
        valid: false,
        error: 'El apellido debe tener al menos 2 caracteres'
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
    if (profileData.rut !== undefined) userUpdates.rut = profileData.rut;
    if (profileData.ciudad !== undefined) userUpdates.ciudad = profileData.ciudad;
    if (profileData.direccion !== undefined) userUpdates.direccion = profileData.direccion;
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
   * Actualiza el perfil usando AuthContext y API real
   */
  private async updateProfileWithAuthContext(profileData: UpdateProfileRequest): Promise<ApiResponse<UserProfile>> {
    if (!this.authContext?.user || !this.authContext.updateUser) {
      return { success: false, error: 'No hay contexto de autenticación' };
    }

    try {
      // Llamar a la API real para actualizar en la base de datos
      const headers = this.getAuthHeaders('application/json');
      if (!headers.has('Authorization')) {
        return { success: false, error: 'No hay token de autenticación' };
      }

      const response = await fetch('/api/user/me', {
        method: 'PUT',
        headers,
        body: JSON.stringify(profileData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { success: false, error: errorData.error || 'Error actualizando perfil en el servidor' };
      }

      const result = await response.json();
      
      // Usar los datos del backend para actualizar el AuthContext
      if (result.data) {
        const backendUser = result.data;
        const userUpdates: Partial<AppUser> = {
          firstName: backendUser.nombre,
          lastName: backendUser.apellido,
          phone: backendUser.telefono,
          rut: backendUser.rut,
          ciudad: backendUser.ciudad,
          direccion: backendUser.direccion,
          avatar: backendUser.avatar,
          region: backendUser.region,
          comuna: backendUser.comuna,
          fechaNacimiento: backendUser.fecha_nacimiento,
          redSocial: backendUser.red_social,
        };
        
        // Actualizar nombre completo
        if (userUpdates.firstName || userUpdates.lastName) {
          userUpdates.name = [userUpdates.firstName, userUpdates.lastName]
            .filter(Boolean)
            .join(' ')
            .trim();
        }
        
        console.log('🔄 UserService: Updating AuthContext with backend data:', userUpdates);
        this.authContext.updateUser(userUpdates);

        // Mapear correctamente la respuesta a UserProfile
        const updatedProfile: UserProfile = {
          id: backendUser.id.toString(),
          firstName: backendUser.nombre || '',
          lastName: backendUser.apellido || '',
          email: backendUser.email,
          phone: backendUser.telefono || undefined,
          rut: backendUser.rut || undefined,
          ciudad: backendUser.ciudad || undefined,
          direccion: backendUser.direccion || undefined,
          avatar: backendUser.avatar || undefined,
          region: backendUser.region || undefined,
          comuna: backendUser.comuna || undefined,
          fechaNacimiento: backendUser.fecha_nacimiento || undefined,
          redSocial: backendUser.red_social || undefined,
          fechaIngreso: backendUser.created_at || undefined,
          acaMembership: {
            yearsActive: 2,
            membershipNumber: `ACA-${backendUser.id.toString().slice(-4)}`,
            status: 'active' as const
          }
        };

        return { 
          success: true, 
          data: updatedProfile, 
          message: result.message || 'Perfil actualizado exitosamente' 
        };
      }

      // Fallback si no hay data en la respuesta
      const userUpdates = this.buildUserUpdates(profileData);
      this.updateFullName(userUpdates, profileData);
      
      this.authContext.updateUser(userUpdates);

      const updatedUser = { ...this.authContext.user, ...userUpdates };
      const updatedProfile = this.mapAppUserToProfile(updatedUser);

      return { 
        success: true, 
        data: updatedProfile, 
        message: result.message || 'Perfil actualizado exitosamente' 
      };
    } catch (error) {
      console.error('Error calling API:', error);
      return { success: false, error: 'Error de conexión con el servidor' };
    }
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
      phone: profileData.phone || undefined,
      direccion: profileData.direccion || undefined,
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
      // Validar datos
      const validation = this.validateProfileData(profileData);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Usar AuthContext si está disponible
      if (this.authContext?.user) {
        return await this.updateProfileWithAuthContext(profileData);
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

  async getPrivacyPreferences(): Promise<ApiResponse<PrivacyPreferences>> {
    try {
      const headers = this.getAuthHeaders('application/json');
      if (!headers.has('Authorization')) {
        return { success: false, error: 'No hay token de autenticación' };
      }

      const response = await fetch('/api/auth/privacy', {
        method: 'GET',
        headers
      });

      const result = await response.json();

      if (!response.ok) {
        return { success: false, error: result?.error || 'Error obteniendo preferencias de privacidad' };
      }

      const data = result.data as PrivacyPreferences;
      return {
        success: true,
        data: {
          showEmail: Boolean(data?.showEmail),
          showPhone: Boolean(data?.showPhone),
          showRut: Boolean(data?.showRut),
          showAddress: Boolean(data?.showAddress),
          showBirthdate: Boolean(data?.showBirthdate),
          showPublicProfile: data?.showPublicProfile === false ? false : true
        }
      };
    } catch (error) {
      console.error('Error getting privacy preferences:', error);
      return { success: false, error: 'Error obteniendo preferencias de privacidad' };
    }
  }

  async updatePrivacyPreferences(preferences: PrivacyPreferences): Promise<ApiResponse<PrivacyPreferences>> {
    try {
      const headers = this.getAuthHeaders('application/json');
      if (!headers.has('Authorization')) {
        return { success: false, error: 'No hay token de autenticación' };
      }

      const response = await fetch('/api/auth/privacy', {
        method: 'PUT',
        headers,
        body: JSON.stringify(preferences)
      });

      const result = await response.json();

      if (!response.ok) {
        return { success: false, error: result?.error || 'Error guardando preferencias de privacidad' };
      }

      const data = result.data as PrivacyPreferences;
      return {
        success: true,
        data: {
          showEmail: Boolean(data?.showEmail),
          showPhone: Boolean(data?.showPhone),
          showRut: Boolean(data?.showRut),
          showAddress: Boolean(data?.showAddress),
          showBirthdate: Boolean(data?.showBirthdate),
          showPublicProfile: data?.showPublicProfile === false ? false : true
        },
        message: result?.message || 'Preferencias de privacidad actualizadas'
      };
    } catch (error) {
      console.error('Error updating privacy preferences:', error);
      return { success: false, error: 'Error guardando preferencias de privacidad' };
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
      // Basic client-side validation
      if (newPassword.length < 6) {
        return {
          success: false,
          error: 'La nueva contraseña debe tener al menos 6 caracteres'
        };
      }

      const headers = this.getAuthHeaders('application/json');
      if (!headers.has('Authorization')) {
        return { success: false, error: 'No hay token de autenticación' };
      }

      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers,
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword: newPassword })
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        const errorMsg = result?.error || result?.message || 'Error cambiando contraseña';
        return { success: false, error: errorMsg };
      }

      return { success: true, message: result?.message || 'Contraseña cambiada exitosamente' };
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
