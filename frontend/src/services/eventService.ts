import { Evento, EventoForm, EventInscription, ApiResponse, PaginatedResponse } from '@shared/index';

class EventService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787';
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const token = this.getAuthToken();
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Error de conexión' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  private getAuthToken(): string | null {
    // Obtener token de las cookies
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'auth_token') {
        return value || null;
      }
    }
    return null;
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
    return this.request<ApiResponse<EventInscription>>(`/api/eventos/${eventId}/inscribirse`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  }

  // Cancelar inscripción
  async cancelarInscripcion(inscriptionId: string): Promise<ApiResponse<null>> {
    return this.request<ApiResponse<null>>(`/api/inscripciones/${inscriptionId}`, {
      method: 'DELETE',
    });
  }

  // Obtener inscripciones del usuario
  async getMyInscripciones(): Promise<ApiResponse<EventInscription[]>> {
    return this.request<ApiResponse<EventInscription[]>>('/api/mis-inscripciones');
  }

  // Obtener participantes de un evento (solo organizadores)
  async getEventParticipants(eventId: number): Promise<ApiResponse<EventInscription[]>> {
    return this.request<ApiResponse<EventInscription[]>>(`/api/eventos/${eventId}/inscripciones`);
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