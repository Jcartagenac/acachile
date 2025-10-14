/**
 * Servicio para gestión de comentarios
 * ACA Chile Frontend
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://acachile-api-production.juecart.workers.dev';

export interface Comment {
  id: number;
  article_id: number;
  author_name: string;
  author_email: string;
  content: string;
  status: 'pending' | 'approved' | 'spam' | 'rejected';
  parent_id?: number;
  created_at: string;
  replies?: Comment[];
}

export interface CommentResponse {
  success: boolean;
  data?: Comment;
  error?: string;
}

export interface CommentsResponse {
  success: boolean;
  data?: Comment[];
  error?: string;
}

export interface LikesState {
  totalLikes: number;
  userLiked: boolean;
}

export interface LikesResponse {
  success: boolean;
  data?: LikesState;
  error?: string;
}

class CommentsService {
  private getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }

  // Obtener comentarios de un artículo
  async getComments(articleId: number): Promise<CommentsResponse> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/comentarios?article_id=${articleId}`,
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
        success: true,
        data: result.comentarios || []
      };
    } catch (error) {
      console.error('Error getting comments:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  // Crear nuevo comentario
  async createComment(commentData: {
    article_id: number;
    author_name: string;
    author_email: string;
    content: string;
    parent_id?: number;
  }): Promise<CommentResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/comentarios`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(commentData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return {
        success: true,
        data: result.comentario
      };
    } catch (error) {
      console.error('Error creating comment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error creando comentario'
      };
    }
  }

  // Moderar comentario (admin)
  async moderateComment(
    commentId: number, 
    status: 'approved' | 'rejected' | 'spam'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/comentarios/${commentId}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error moderating comment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error moderando comentario'
      };
    }
  }

  // Eliminar comentario (admin)
  async deleteComment(commentId: number): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/comentarios/${commentId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting comment:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error eliminando comentario'
      };
    }
  }

  // Obtener estado de likes de un artículo
  async getLikes(articleId: number): Promise<LikesResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/likes/${articleId}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error getting likes:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error obteniendo likes'
      };
    }
  }

  // Toggle like en un artículo
  async toggleLike(articleId: number): Promise<LikesResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/likes/${articleId}`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error('Error toggling like:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error procesando like'
      };
    }
  }

  // Registrar compartido
  async shareArticle(
    articleId: number, 
    platform: 'facebook' | 'twitter' | 'whatsapp' | 'email' | 'copy'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/compartir/${articleId}`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ platform }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error sharing article:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error registrando compartido'
      };
    }
  }
}

export const commentsService = new CommentsService();