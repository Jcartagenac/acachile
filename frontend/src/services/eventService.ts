import {
  Evento,
  EventoForm,
  EventInscription,
  ApiResponse,
  PaginatedResponse,
  EventParticipantsPayload,
  EventInscriptionStatus,
} from '@shared/index';
import { buildAuthHeaders } from '../utils/authToken';

class EventService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://acachile.pages.dev';
  }

  private mapInscriptionStatus(status?: string): EventInscriptionStatus {
    if (!status) return 'pending';

    const normalized = status.toLowerCase();
    switch (normalized) {
      case 'confirmed':
      case 'confirmada':
        return 'confirmed';
      case 'waitlist':
      case 'lista_espera':
      case 'lista-espera':
        return 'waitlist';
      case 'cancelled':
      case 'cancelada':
        return 'cancelled';
      default:
        return 'pending';
    }
  }

  private normalizeInscription(raw: any): EventInscription {
    if (!raw) {
      const now = new Date().toISOString();
      return {
        id: '',
        eventId: 0,
        eventoId: 0,
        userId: 0,
        status: 'pending',
        createdAt: now,
        evento: null,
      };
    }

    const eventId =
      typeof raw.eventId === 'number'
        ? raw.eventId
        : typeof raw.eventoId === 'number'
          ? raw.eventoId
          : Number(raw.eventId ?? raw.eventoId ?? 0);

    const createdAt =
      typeof raw.createdAt === 'string'
        ? raw.createdAt
        : typeof raw.fechaInscripcion === 'string'
          ? raw.fechaInscripcion
          : new Date().toISOString();

    return {
      id: String(raw.id ?? `${raw.userId ?? 'user'}_${eventId}`),
      eventId,
      eventoId: typeof raw.eventoId === 'number' ? raw.eventoId : eventId,
      userId: Number(raw.userId ?? raw.usuarioId ?? raw.usuario?.id ?? 0),
      status: this.mapInscriptionStatus(
        typeof raw.status === 'string' ? raw.status : raw.estado,
      ),
      estado: typeof raw.estado === 'string' ? raw.estado : undefined,
      notes: raw.notes ?? raw.notas ?? undefined,
      createdAt,
      fechaInscripcion:
        typeof raw.fechaInscripcion === 'string' ? raw.fechaInscripcion : undefined,
      updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : undefined,
      evento: raw.evento ?? null,
    };
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: buildAuthHeaders(options?.headers, 'application/json'),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Error de conexión' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Obtener todos los eventos con filtros
  async getEventos(filters?: {
    type?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Evento>> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, value.toString());
        }
      });
    }

    const queryString = params.toString();
    return this.request<PaginatedResponse<Evento>>(
      `/api/eventos${queryString ? `?${queryString}` : ''}`
    );
  }

  // Obtener un evento por ID
  async getEvento(id: number): Promise<ApiResponse<Evento>> {
    return this.request<ApiResponse<Evento>>(`/api/eventos/${id}`);
  }

  // Crear nuevo evento
  async createEvento(eventoData: EventoForm): Promise<ApiResponse<Evento>> {
    return this.request<ApiResponse<Evento>>('/api/eventos', {
      method: 'POST',
      body: JSON.stringify(eventoData),
    });
  }

  // Actualizar evento
  async updateEvento(id: number, eventoData: Partial<EventoForm>): Promise<ApiResponse<Evento>> {
    return this.request<ApiResponse<Evento>>(`/api/eventos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(eventoData),
    });
  }

  // Eliminar evento
  async deleteEvento(id: number): Promise<ApiResponse<null>> {
    return this.request<ApiResponse<null>>(`/api/eventos/${id}`, {
      method: 'DELETE',
    });
  }

  // Inscribirse en evento
  async inscribirseEvento(eventId: number, notes?: string): Promise<ApiResponse<EventInscription>> {
    const response = await this.request<ApiResponse<any>>(`/api/eventos/${eventId}/inscribirse`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });

    if (response.success && response.data) {
      return {
        ...response,
        data: this.normalizeInscription(response.data),
      };
    }

    return response as ApiResponse<EventInscription>;
  }

  // Cancelar inscripción
  async cancelarInscripcion(inscriptionId: string): Promise<ApiResponse<null>> {
    return this.request<ApiResponse<null>>(`/api/inscripciones/${inscriptionId}`, {
      method: 'DELETE',
    });
  }

  // Obtener inscripciones del usuario
  async getMyInscripciones(): Promise<ApiResponse<EventInscription[]>> {
    const response = await this.request<ApiResponse<any[]>>('/api/mis-inscripciones');

    if (response.success && Array.isArray(response.data)) {
      return {
        ...response,
        data: response.data.map((item) => this.normalizeInscription(item)),
      };
    }

    return response as ApiResponse<EventInscription[]>;
  }

  // Obtener participantes de un evento (solo organizadores)
  async getEventParticipants(eventId: number): Promise<ApiResponse<EventParticipantsPayload>> {
    const response = await this.request<ApiResponse<any>>(
      `/api/eventos/${eventId}/inscripciones`,
    );

    if (response.success && response.data) {
      const participants: EventParticipantsPayload = {
        evento: response.data.evento ?? null,
        inscripciones: Array.isArray(response.data.inscripciones)
          ? response.data.inscripciones.map((item: any) => this.normalizeInscription(item))
          : [],
        stats: (response as any).stats ?? undefined,
      };

      return {
        success: true,
        data: participants,
        message: response.message,
        error: response.error,
      };
    }

    return {
      success: response.success,
      message: response.message,
      error: response.error,
    };
  }

  // Subir imagen de evento
  async uploadEventImage(file: File): Promise<ApiResponse<{ url: string }>> {
    const formData = new FormData();
    formData.append('image', file);

    const token = this.getAuthToken();
    
    const response = await fetch(`${this.baseUrl}/api/eventos/upload-image`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Error al subir imagen' }));
      throw new Error(error.error || 'Error al subir imagen');
    }

    return response.json();
  }
}

export const eventService = new EventService();
