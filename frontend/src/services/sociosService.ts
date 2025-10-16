/**
 * Servicio para gestión de socios y cuotas
 * ACA Chile Frontend
 */

const API_BASE_URL = '/api';

export interface Socio {
  id: number;
  nombre: string;
  apellido: string;
  nombreCompleto: string;
  email: string;
  telefono: string | null;
  rut: string | null;
  direccion: string | null;
  fotoUrl: string | null;
  valorCuota: number;
  estadoSocio: 'activo' | 'inactivo' | 'suspendido';
  fechaIngreso: string;
  createdAt: string;
  estadisticasCuotas?: {
    totalCuotas: number;
    cuotasPagadas: number;
    cuotasPendientes: number;
    totalDeuda: number;
  };
}

export interface Cuota {
  id: number;
  usuarioId: number;
  año: number;
  mes: number;
  valor: number;
  pagado: boolean;
  fechaPago: string | null;
  metodoPago: 'transferencia' | 'efectivo' | 'tarjeta' | null;
  comprobanteUrl: string | null;
  notas: string | null;
  estado: 'PENDIENTE' | 'PAGADO' | 'VENCIDO';
  createdAt: string;
  socio?: {
    id: number;
    nombre: string;
    apellido: string;
    nombreCompleto: string;
    email: string;
  };
}

export interface CreateSocioData {
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  rut?: string;
  direccion?: string;
  valorCuota?: number;
  password: string;
}

class SociosService {
  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }

  // Gestión de socios
  async getSocios(params?: {
    page?: number;
    limit?: number;
    search?: string;
    estado?: string;
  }): Promise<{ success: boolean; data?: { socios: Socio[]; pagination: any }; error?: string }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.search) queryParams.append('search', params.search);
      if (params?.estado) queryParams.append('estado', params.estado);

      console.log('[sociosService] Llamando a:', `${API_BASE_URL}/admin/socios?${queryParams}`);

      const response = await fetch(`${API_BASE_URL}/admin/socios?${queryParams}`, {
        headers: this.getAuthHeaders(),
      });

      console.log('[sociosService] Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[sociosService] Error response:', errorText);
        throw new Error(`Error al obtener socios: ${response.status}`);
      }

      const json = await response.json();
      console.log('[sociosService] Response JSON:', json);
      
      // El API devuelve { success: true, data: { socios: [], pagination: {} } }
      // Necesitamos devolver solo el data
      if (json.success && json.data) {
        return { success: true, data: json.data };
      } else {
        return { success: false, error: json.error || 'Error desconocido' };
      }
    } catch (error) {
      console.error('[sociosService] Error fetching socios:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  async getSocio(socioId: number): Promise<{ success: boolean; data?: Socio; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/socios/${socioId}`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Error al obtener socio');
      }

      const data = await response.json();
      return { success: true, data: data.data };
    } catch (error) {
      console.error('Error fetching socio:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  async createSocio(socioData: CreateSocioData): Promise<{ success: boolean; data?: Socio; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/socios`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(socioData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear socio');
      }

      const data = await response.json();
      return { success: true, data: data.data };
    } catch (error) {
      console.error('Error creating socio:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  async updateSocio(socioId: number, updates: Partial<Socio>): Promise<{ success: boolean; data?: Socio; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/socios/${socioId}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar socio');
      }

      const data = await response.json();
      return { success: true, data: data.data };
    } catch (error) {
      console.error('Error updating socio:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  // Gestión de cuotas
  async getCuotas(params?: {
    año?: number;
    mes?: number;
    socioId?: number;
    estado?: string;
    page?: number;
    limit?: number;
  }): Promise<{ success: boolean; data?: { cuotas: Cuota[]; pagination: any }; error?: string }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.año) queryParams.append('año', params.año.toString());
      if (params?.mes) queryParams.append('mes', params.mes.toString());
      if (params?.socioId) queryParams.append('socioId', params.socioId.toString());
      if (params?.estado) queryParams.append('estado', params.estado);
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());

      console.log('[sociosService] Llamando a cuotas:', `${API_BASE_URL}/admin/cuotas?${queryParams}`);

      const response = await fetch(`${API_BASE_URL}/admin/cuotas?${queryParams}`, {
        headers: this.getAuthHeaders(),
      });

      console.log('[sociosService] Cuotas response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[sociosService] Error response cuotas:', errorText);
        throw new Error(`Error al obtener cuotas: ${response.status}`);
      }

      const json = await response.json();
      console.log('[sociosService] Cuotas response JSON:', json);
      
      // El API devuelve { success: true, data: { cuotas: [], pagination: {} } }
      if (json.success && json.data) {
        return { success: true, data: json.data };
      } else {
        return { success: false, error: json.error || 'Error desconocido' };
      }
    } catch (error) {
      console.error('[sociosService] Error fetching cuotas:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  async crearCuotaIndividual(usuarioId: number, año: number, mes: number, valor?: number): Promise<{ success: boolean; data?: { cuota: Cuota }; error?: string }> {
    try {
      console.log('[sociosService] Creando cuota individual:', { usuarioId, año, mes, valor });
      
      // Filtrar valores undefined para evitar errores en D1
      const payload: any = { usuarioId, año, mes };
      if (valor !== undefined) payload.valor = valor;
      
      const response = await fetch(`${API_BASE_URL}/admin/cuotas`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      console.log('[sociosService] Respuesta crear cuota status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[sociosService] Error response crear cuota:', errorData);
        throw new Error(errorData.error || 'Error al crear cuota');
      }

      const data = await response.json();
      console.log('[sociosService] Cuota creada exitosamente:', data);
      return { success: true, data: data.data };
    } catch (error) {
      console.error('[sociosService] Error creando cuota individual:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  async generarCuotas(año: number, mes: number, sobreescribir: boolean = false, valorDefault?: number): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      // Filtrar valores undefined para evitar errores en D1
      const payload: any = { año, mes, sobreescribir };
      if (valorDefault !== undefined) payload.valorDefault = valorDefault;
      
      const response = await fetch(`${API_BASE_URL}/admin/cuotas/generar`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al generar cuotas');
      }

      const data = await response.json();
      return { success: true, data: data.data };
    } catch (error) {
      console.error('Error generating cuotas:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  async marcarCuotaPagada(cuotaId: number, datos: {
    metodoPago: 'transferencia' | 'efectivo' | 'tarjeta';
    fechaPago?: string;
    comprobanteUrl?: string;
    notas?: string;
  }): Promise<{ success: boolean; data?: Cuota; error?: string }> {
    try {
      // Filtrar valores undefined para evitar errores en D1
      const payload: any = { cuotaId, metodoPago: datos.metodoPago };
      if (datos.fechaPago) payload.fechaPago = datos.fechaPago;
      if (datos.comprobanteUrl) payload.comprobanteUrl = datos.comprobanteUrl;
      if (datos.notas) payload.notas = datos.notas;
      
      console.log('[sociosService] Marcando cuota como pagada:', cuotaId, payload);
      
      const response = await fetch(`${API_BASE_URL}/admin/cuotas/marcar-pago`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      console.log('[sociosService] Respuesta status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[sociosService] Error response:', errorText);
        
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.error || 'Error al marcar cuota como pagada');
        } catch {
          throw new Error(`Error ${response.status}: ${errorText || 'Error al marcar cuota como pagada'}`);
        }
      }

      const data = await response.json();
      console.log('[sociosService] Cuota marcada exitosamente:', data);
      return { success: true, data: data.data };
    } catch (error) {
      console.error('[sociosService] Error marking cuota as paid:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  async eliminarCuota(cuotaId: number): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('[sociosService] Eliminando cuota:', cuotaId);
      
      const response = await fetch(`${API_BASE_URL}/admin/cuotas/${cuotaId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      console.log('[sociosService] Respuesta eliminar status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[sociosService] Error response:', errorText);
        
        try {
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.error || 'Error al eliminar cuota');
        } catch {
          throw new Error(`Error ${response.status}: ${errorText || 'Error al eliminar cuota'}`);
        }
      }

      const data = await response.json();
      console.log('[sociosService] Cuota eliminada exitosamente:', data);
      return { success: true };
    } catch (error) {
      console.error('[sociosService] Error eliminando cuota:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  // Upload de comprobante
  async subirComprobante(file: File, cuotaId: number): Promise<{ success: boolean; data?: { url: string }; error?: string }> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('cuotaId', cuotaId.toString());

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/cuotas/subir-comprobante`, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Error al subir comprobante');
      }

      const data = await response.json();
      return { success: true, data: data.data };
    } catch (error) {
      console.error('Error uploading comprobante:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  // Upload de foto de socio
  async subirFotoSocio(file: File, socioId: number): Promise<{ success: boolean; data?: { url: string }; error?: string }> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('socioId', socioId.toString());
      formData.append('tipo', 'foto-socio');

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/upload/imagen`, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Error al subir foto');
      }

      const data = await response.json();
      return { success: true, data: { url: data.data.url } };
    } catch (error) {
      console.error('Error uploading foto:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  // Configuración global
  async getConfiguracion(): Promise<{ success: boolean; data?: Record<string, any>; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/configuracion`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Error al obtener configuración');
      }

      const data = await response.json();
      return { success: true, data: data.data };
    } catch (error) {
      console.error('Error fetching configuracion:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  async updateConfiguracion(clave: string, valor: any): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/configuracion`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ clave, valor }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar configuración');
      }

      const data = await response.json();
      return { success: true, data: data.data };
    } catch (error) {
      console.error('Error updating configuracion:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }
}

export const sociosService = new SociosService();
