import { REGIONES_CHILE } from '@shared/index';
import { buildAuthHeaders } from '../utils/authToken';

const API_BASE_URL = '/api';

export type AvailabilityOption =
  | 'eventos_publicos'
  | 'talleres_formativos'
  | 'competencias'
  | 'voluntariado_social'
  | 'mentoria_miembros';

export type ExperienceLevel = 'principiante' | 'entusiasta' | 'experto' | 'competitivo';

export interface JoinApplicationPayload {
  fullName: string;
  email: string;
  phone: string;
  rut?: string | null;
  birthdate?: string | null;
  region: (typeof REGIONES_CHILE)[number];
  city: string;
  occupation?: string | null;
  experienceLevel: ExperienceLevel;
  specialties?: string | null;
  motivation: string;
  contribution: string;
  availability: AvailabilityOption[];
  hasCompetitionExperience: boolean;
  competitionDetails?: string | null;
  instagram?: string | null;
  otherNetworks?: string | null;
  references?: string | null;
  photoUrl?: string | null;
}

export interface JoinApplicationResponse {
  success: boolean;
  data?: {
    id: number;
    status: 'pendiente';
    createdAt: string;
  };
  error?: string;
}

export interface PostulacionApproval {
  id: number;
  approverId: number;
  approverRole: string;
  comment: string | null;
  createdAt: string;
  approverName: string | null;
}

export interface PostulacionReviewer {
  id: number;
  reviewerId: number;
  reviewerName: string;
  reviewerEmail: string;
  reviewerRole: string;
  feedback: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface PostulanteSummary {
  id: number;
  fullName: string;
  email: string;
  phone: string | null;
  rut: string | null;
  birthdate: string | null;
  region: string | null;
  city: string | null;
  occupation: string | null;
  experienceLevel: string;
  specialties: string | null;
  motivation: string;
  contribution: string;
  availability: AvailabilityOption[];
  hasCompetitionExperience: boolean;
  competitionDetails: string | null;
  instagram: string | null;
  otherNetworks: string | null;
  references: string | null;
  photoUrl: string | null;
  status: 'pendiente' | 'en_revision' | 'aprobada' | 'rechazada';
  approvalsRequired: number;
  approvalsCount: number;
  pendingApprovals: number;
  rejectionReason: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  socioId: number | null;
  createdAt: string;
  updatedAt: string;
  approvals?: PostulacionApproval[];
  reviewers?: PostulacionReviewer[];
}

export interface PostulacionesListResponse {
  success: boolean;
  data?: PostulanteSummary[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext?: boolean;
    hasPrev?: boolean;
  };
  error?: string;
}

export const postulacionesService = {
  async submitApplication(payload: JoinApplicationPayload): Promise<JoinApplicationResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/unete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('[postulacionesService] Error enviando postulación:', error);
      return {
        success: false,
        error: 'No pudimos enviar tu postulación. Intenta nuevamente en unos minutos.',
      };
    }
  },

  async getAdminPostulantes(params?: {
    status?: PostulanteSummary['status'];
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<PostulacionesListResponse> {
    try {
      const query = new URLSearchParams();
      if (params?.status) query.append('status', params.status);
      if (params?.search) query.append('search', params.search);
      if (params?.page) query.append('page', params.page.toString());
      if (params?.limit) query.append('limit', params.limit.toString());

      const response = await fetch(`${API_BASE_URL}/admin/postulantes?${query.toString()}`, {
        headers: buildAuthHeaders(),
      });

      const data = await response.json();
      if (!response.ok) {
        return {
          success: false,
          error: data?.error || 'Error al cargar postulaciones',
        };
      }

      return {
        success: true,
        data: data.data,
        pagination: data.pagination,
      };
    } catch (error) {
      console.error('[postulacionesService] Error obteniendo postulantes:', error);
      return {
        success: false,
        error: 'No pudimos cargar las postulaciones',
      };
    }
  },

  async getAdminPostulante(id: number): Promise<{ success: boolean; data?: PostulanteSummary; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/postulantes/${id}`, {
        headers: buildAuthHeaders(),
      });

      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data?.error || 'Error al obtener la postulación' };
      }

      return { success: true, data: data.data };
    } catch (error) {
      console.error('[postulacionesService] Error obteniendo postulación:', error);
      return { success: false, error: 'No pudimos obtener la postulación' };
    }
  },

  async approvePostulante(id: number, comment?: string): Promise<{
    success: boolean;
    data?: { postulacion: PostulanteSummary; generatedPassword: string | null; socioId: number | null };
    error?: string;
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/postulantes/${id}/approve`, {
        method: 'POST',
        headers: buildAuthHeaders(undefined, 'application/json'),
        body: JSON.stringify({ comment }),
      });

      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data?.error || 'No pudimos registrar la aprobación' };
      }

      return { success: true, data: data.data };
    } catch (error) {
      console.error('[postulacionesService] Error aprobando postulación:', error);
      return { success: false, error: 'No pudimos registrar la aprobación' };
    }
  },

  async rejectPostulante(id: number, reason: string): Promise<{ success: boolean; data?: PostulanteSummary; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/postulantes/${id}/reject`, {
        method: 'POST',
        headers: buildAuthHeaders(undefined, 'application/json'),
        body: JSON.stringify({ reason }),
      });

      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data?.error || 'No pudimos rechazar la postulación' };
      }

      return { success: true, data: data.data };
    } catch (error) {
      console.error('[postulacionesService] Error rechazando postulación:', error);
      return { success: false, error: 'No pudimos rechazar la postulación' };
    }
  },

  async assignReviewer(
    postulacionId: number,
    reviewerId: number,
  ): Promise<{ success: boolean; data?: { postulacionId: number; reviewers: PostulacionReviewer[] }; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/postulantes/${postulacionId}/assign-reviewer`, {
        method: 'POST',
        headers: buildAuthHeaders(undefined, 'application/json'),
        body: JSON.stringify({ reviewerId }),
      });

      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data?.error || 'No pudimos asignar el revisor' };
      }

      return { success: true, data: data.data };
    } catch (error) {
      console.error('[postulacionesService] Error asignando revisor:', error);
      return { success: false, error: 'No pudimos asignar el revisor' };
    }
  },

  async removeReviewer(postulacionId: number, reviewerId: number): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/postulantes/${postulacionId}/assign-reviewer?reviewerId=${reviewerId}`, {
        method: 'DELETE',
        headers: buildAuthHeaders(),
      });

      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data?.error || 'No pudimos remover el revisor' };
      }

      return { success: true };
    } catch (error) {
      console.error('[postulacionesService] Error removiendo revisor:', error);
      return { success: false, error: 'No pudimos remover el revisor' };
    }
  },

  async updateReviewerFeedback(
    postulacionId: number,
    feedback: string,
  ): Promise<{ success: boolean; data?: { postulacionId: number; reviewers: PostulacionReviewer[] }; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/postulantes/${postulacionId}/feedback`, {
        method: 'PUT',
        headers: buildAuthHeaders(undefined, 'application/json'),
        body: JSON.stringify({ feedback }),
      });

      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data?.error || 'No pudimos actualizar el feedback' };
      }

      return { success: true, data: data.data };
    } catch (error) {
      console.error('[postulacionesService] Error actualizando feedback:', error);
      return { success: false, error: 'No pudimos actualizar el feedback' };
    }
  },
};
