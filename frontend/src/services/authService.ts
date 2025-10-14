import { ApiResponse, AuthResponse, User } from '@shared/index';
import Cookies from 'js-cookie';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://acachile-api-production.juecart.workers.dev';

// Helper function to get auth token
const getAuthToken = (): string | null => {
  return Cookies.get('auth_token') || null;
};

interface PendingRegistration {
  id: string;
  userData: {
    email: string;
    name: string;
    phone?: string;
    region?: string;
    motivation?: string;
    experience?: string;
    references?: string;
    preferredRole?: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedBy?: number;
  reviewedAt?: string;
  reviewNotes?: string;
}

interface ApprovalOptions {
  assignedRole?: string;
  membershipType?: string;
  notes?: string;
}

const authService = {
  // Login
  login: async (email: string, password: string): Promise<AuthResponse> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        error: 'Error de conexión',
      };
    }
  },

  // Register
  register: async (userData: {
    email: string;
    password: string;
    name: string;
    phone?: string;
    region?: string;
    motivation?: string;
    experience?: string;
    references?: string;
    preferredRole?: string;
  }): Promise<ApiResponse<any>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        error: 'Error de conexión',
      };
    }
  },

  // Get user profile
  getProfile: async (token: string): Promise<ApiResponse<User>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        error: 'Error de conexión',
      };
    }
  },

  // Forgot password
  forgotPassword: async (email: string): Promise<ApiResponse<any>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        error: 'Error de conexión',
      };
    }
  },

  // Reset password
  resetPassword: async (token: string, newPassword: string): Promise<ApiResponse<any>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        error: 'Error de conexión',
      };
    }
  },

  // Change password
  changePassword: async (
    token: string, 
    currentPassword: string, 
    newPassword: string
  ): Promise<ApiResponse<any>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        error: 'Error de conexión',
      };
    }
  },

  // Admin: Get pending registrations
  getPendingRegistrations: async (): Promise<ApiResponse<PendingRegistration[]>> => {
    try {
      const token = getAuthToken();
      if (!token) {
        return {
          success: false,
          error: 'No autorizado - token requerido',
        };
      }

      const response = await fetch(`${API_BASE_URL}/api/admin/registrations/pending`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        error: 'Error de conexión',
      };
    }
  },

  // Admin: Approve registration
  approveRegistration: async (
    registrationId: string, 
    options: ApprovalOptions = {}
  ): Promise<ApiResponse<any>> => {
    try {
      const token = getAuthToken();
      if (!token) {
        return {
          success: false,
          error: 'No autorizado - token requerido',
        };
      }

      const response = await fetch(`${API_BASE_URL}/api/admin/registrations/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          registrationId,
          ...options
        }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        error: 'Error de conexión',
      };
    }
  },

  // Admin: Reject registration
  rejectRegistration: async (
    registrationId: string, 
    reason?: string
  ): Promise<ApiResponse<any>> => {
    try {
      const token = getAuthToken();
      if (!token) {
        return {
          success: false,
          error: 'No autorizado - token requerido',
        };
      }

      const response = await fetch(`${API_BASE_URL}/api/admin/registrations/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          registrationId,
          reason
        }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        error: 'Error de conexión',
      };
    }
  },
};

export default authService;