/**
 * Servicio para gestión de noticias/blog
 * ACA Chile Frontend
 */

import { buildAuthHeaders } from '../utils/authToken';
import { API_BASE_URL } from '../config/env';

export interface NewsArticle {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image?: string;
  gallery?: string[]; // Array de URLs de imágenes para el carrusel (máx 20)
  video_url?: string; // URL del video embebido (YouTube, Vimeo, etc.)
  author_id: number;
  author_name: string;
  category_id: number;
  category: {
    id: number;
    name: string;
    slug: string;
    color: string;
  };
  tags: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
  status: 'draft' | 'published' | 'archived';
  is_featured: boolean;
  view_count: number;
  published_at: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null; // Fecha de eliminación (soft delete), se elimina permanentemente después de 30 días
}

export interface NewsCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface NewsTag {
  id: number;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

export interface NewsPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface NewsListResponse {
  success: boolean;
  data: NewsArticle[];
  pagination: NewsPagination;
  error?: string;
}

export interface NewsResponse {
  success: boolean;
  data?: NewsArticle;
  error?: string;
}

export interface CategoriesResponse {
  success: boolean;
  data: NewsCategory[];
  error?: string;
}

export interface TagsResponse {
  success: boolean;
  data: NewsTag[];
  error?: string;
}

class NewsService {
  private getAuthHeaders() {
    return buildAuthHeaders({ 'Content-Type': 'application/json' });
  }

  // Obtener lista de noticias
  async getNews(params?: {
    page?: number;
    limit?: number;
    category?: string;
    tag?: string;
    featured?: boolean;
  }): Promise<NewsListResponse> {
    try {
      const searchParams = new URLSearchParams();
      
      if (params?.page) searchParams.append('page', params.page.toString());
      if (params?.limit) searchParams.append('limit', params.limit.toString());
      if (params?.category) searchParams.append('category', params.category);
      if (params?.tag) searchParams.append('tag', params.tag);
      if (params?.featured) searchParams.append('featured', 'true');

      const response = await fetch(
        `${API_BASE_URL}/api/noticias${searchParams.toString() ? `?${searchParams.toString()}` : ''}`,
        {
          method: 'GET',
          headers: this.getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting news:', error);
      throw error;
    }
  }

  // Obtener noticia por slug
  async getNewsBySlug(slug: string): Promise<NewsResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/noticias/${slug}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting news by slug:', error);
      throw error;
    }
  }

  // Crear nueva noticia (requiere admin/editor)
  async createNews(newsData: {
    title: string;
    content: string;
    excerpt: string;
    category_id: number;
    tags?: string[];
    featured_image?: string;
    is_featured?: boolean;
    status?: 'draft' | 'published';
  }): Promise<NewsResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/noticias`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(newsData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating news:', error);
      throw error;
    }
  }

  // Actualizar noticia (requiere admin/editor)
  async updateNews(id: number, newsData: Partial<{
    title: string;
    content: string;
    excerpt: string;
    category_id: number;
    tags: string[];
    featured_image: string;
    is_featured: boolean;
    status: 'draft' | 'published' | 'archived';
  }>): Promise<NewsResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/noticias/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(newsData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating news:', error);
      throw error;
    }
  }

  // Eliminar noticia (requiere admin)
  async deleteNews(id: number): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/noticias/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting news:', error);
      throw error;
    }
  }

  // Obtener categorías
  async getCategories(): Promise<CategoriesResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/noticias/categorias`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting categories:', error);
      throw error;
    }
  }

  // Obtener tags
  async getTags(): Promise<TagsResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/noticias/tags`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting tags:', error);
      throw error;
    }
  }
}

export const newsService = new NewsService();
