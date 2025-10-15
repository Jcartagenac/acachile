/**
 * Servicio para búsqueda avanzada
 * ACA Chile Frontend
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://acachile.pages.dev';

export interface SearchResult {
  type: 'evento' | 'noticia' | 'usuario';
  id: number;
  title: string;
  description: string;
  url: string;
  date: string;
  relevance: number;
}

export interface SearchResponse {
  success: boolean;
  data?: {
    query: string;
    resultados: SearchResult[];
    total: number;
    filters: any;
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
  tipo?: 'eventos' | 'noticias';
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
    const token = localStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
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
    type?: 'eventos' | 'noticias' | 'usuarios' | 'all';
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
  async getSuggestions(query: string, type?: 'eventos' | 'noticias'): Promise<SuggestionsResponse> {
    try {
      const searchParams = new URLSearchParams();
      searchParams.append('q', query);
      if (type) searchParams.append('type', type);

      const response = await fetch(
        `${API_BASE_URL}/api/search/suggestions?query=${encodeURIComponent(query)}${type ? `&type=${type}` : ''}`,
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
      const response = await fetch(`${API_BASE_URL}/api/busqueda/avanzada`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(filters),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return {
        success: true,
        data: result
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
      const response = await fetch(`${API_BASE_URL}/api/busqueda/populares`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return {
        success: true,
        data: result
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