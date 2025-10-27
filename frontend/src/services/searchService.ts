/**
 * Servicio para búsqueda avanzada
 * ACA Chile Frontend
 */

import { buildAuthHeaders } from '../utils/authToken';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://acachile.pages.dev';

export type SearchResultType = 'evento' | 'noticia' | 'usuario' | 'section';

export interface SearchResult {
  type: SearchResultType;
  id: number | string;
  title: string;
  description?: string;
  url: string;
  date?: string;
  relevance?: number;
  image?: string;
  location?: string;
  avatar?: string;
  category?: string;
  metadata?: Record<string, string | undefined>;
  privacy?: Record<string, boolean>;
}

export interface SearchResponse {
  success: boolean;
  data?: {
    query: string;
    total: number;
    eventos?: SearchResult[];
    noticias?: SearchResult[];
    usuarios?: SearchResult[];
    secciones?: SearchResult[];
    combined?: SearchResult[];
  };
  error?: string;
}

export interface SuggestionsResponse {
  success: boolean;
  data?: string[];
  error?: string;
}

export interface PopularSearchesResponse {
  success: boolean;
  data?: {
    eventos: Array<{ titulo: string; popularidad: number }>;
    noticias: Array<{ titulo: string; vistas: number }>;
    terminos: string[];
  };
  error?: string;
}

export interface AdvancedSearchFilters {
  query?: string;
  tipo?: 'eventos' | 'noticias' | 'usuarios' | 'secciones' | 'all';
  fechaDesde?: string;
  fechaHasta?: string;
  categoria?: string;
  ubicacion?: string;
  estado?: string;
  ordenarPor?: 'fecha' | 'relevancia' | 'titulo';
  orden?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface AdvancedSearchResponse {
  success: boolean;
  data?: {
    results: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
    filters: AdvancedSearchFilters;
  };
  error?: string;
}

class SearchService {
  private getAuthHeaders() {
    return buildAuthHeaders({ 'Content-Type': 'application/json' });
  }

  // Utilidades para compartir en redes sociales
  getShareUrl(platform: 'facebook' | 'twitter' | 'whatsapp', url: string, title: string): string {
    switch (platform) {
      case 'facebook':
        return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
      case 'twitter':
        return `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
      case 'whatsapp':
        return `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`;
      default:
        return url;
    }
  }

  // Utilidad para copiar al portapapeles
  async copyToClipboard(text: string): Promise<boolean> {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        // Fallback para navegadores sin soporte de clipboard API
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        return document.execCommand('copy');
      }
    } catch (err) {
      console.error('Error copiando al portapapeles:', err);
      return false;
    }
  }

  // Búsqueda global
  async search(params: {
    query: string;
    type?: 'eventos' | 'noticias' | 'usuarios' | 'secciones' | 'all';
    dateFrom?: string;
    dateTo?: string;
    category?: string;
    location?: string;
    limit?: number;
    offset?: number;
  }): Promise<SearchResponse> {
    try {
      const searchParams = new URLSearchParams();
      searchParams.append('q', params.query);
      
      if (params.type) searchParams.append('type', params.type);
      if (params.dateFrom) searchParams.append('dateFrom', params.dateFrom);
      if (params.dateTo) searchParams.append('dateTo', params.dateTo);
      if (params.category) searchParams.append('category', params.category);
      if (params.location) searchParams.append('location', params.location);
      if (params.limit) searchParams.append('limit', params.limit.toString());
      if (params.offset) searchParams.append('offset', params.offset.toString());

      const response = await fetch(
        `${API_BASE_URL}/api/search?${searchParams.toString()}`,
        {
          method: 'GET',
          headers: this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return {
        success: result.success,
        data: result.data
      };
    } catch (error) {
      console.error('Error searching:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error en búsqueda'
      };
    }
  }

  // Obtener sugerencias de autocompletado
  async getSuggestions(query: string, limit?: number): Promise<SuggestionsResponse> {
    try {
      const searchParams = new URLSearchParams();
      searchParams.append('q', query);
      if (limit) searchParams.append('limit', limit.toString());

      const response = await fetch(
        `${API_BASE_URL}/api/search/suggestions?${searchParams.toString()}`,
        {
          method: 'GET',
          headers: this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return {
        success: result.success,
        data: result.data || []
      };
    } catch (error) {
      console.error('Error getting suggestions:', error);
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : 'Error obteniendo sugerencias'
      };
    }
  }

  // Búsqueda avanzada
  async advancedSearch(filters: AdvancedSearchFilters): Promise<AdvancedSearchResponse> {
    try {
      const searchParams = new URLSearchParams();
      if (filters.query) searchParams.append('q', filters.query);
      if (filters.tipo) searchParams.append('type', filters.tipo);
      if (filters.limit) searchParams.append('limit', filters.limit.toString());
      if (filters.page) {
        const offset = (filters.page - 1) * (filters.limit || 10);
        searchParams.append('offset', offset.toString());
      }

      const response = await fetch(`${API_BASE_URL}/api/search?${searchParams.toString()}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Adaptar la respuesta al formato esperado
      const total = result.data?.total || 0;
      const limit = filters.limit || 10;
      const page = filters.page || 1;
      
      return {
        success: true,
        data: {
          results: result.data?.combined || [],
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          },
          filters
        }
      };
    } catch (error) {
      console.error('Error in advanced search:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error en búsqueda avanzada'
      };
    }
  }

  // Obtener búsquedas populares
  async getPopularSearches(): Promise<PopularSearchesResponse> {
    try {
      // Por ahora, devolvemos datos simulados hasta implementar el endpoint
      return {
        success: true,
        data: {
          eventos: [
            { titulo: "Campeonato Nacional de Asado", popularidad: 95 },
            { titulo: "Competencia de Asado Rápido", popularidad: 78 },
            { titulo: "Encuentro de Asadores", popularidad: 65 }
          ],
          noticias: [
            { titulo: "Campeonato Mundial de Barbacoa 2024", vistas: 1250 },
            { titulo: "Curso de Técnicas Básicas de Asado", vistas: 890 },
            { titulo: "Masterclass: Secretos del Asado Patagónico", vistas: 650 }
          ],
          terminos: ["asado", "parrilla", "campeonato", "barbacoa", "técnicas"]
        }
      };
    } catch (error) {
      console.error('Error getting popular searches:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error obteniendo búsquedas populares'
      };
    }
  }

  // Utilidades para URLs de compartir
  static getShareUrl(platform: 'facebook' | 'twitter' | 'whatsapp', url: string, title: string): string {
    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);

    switch (platform) {
      case 'facebook':
        return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
      case 'twitter':
        return `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
      case 'whatsapp':
        return `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`;
      default:
        return url;
    }
  }

  // Copiar al portapapeles
  static async copyToClipboard(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      // Fallback para navegadores más antiguos
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        return successful;
      } catch (err) {
        document.body.removeChild(textArea);
        return false;
      }
    }
  }
}

export const searchService = new SearchService();
