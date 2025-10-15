/**
 * Servicio para gestión de comentarios
 * ACA Chile Frontend
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://4ea0451b.acachile-prod.pages.dev';

export interface Comment {
  id: string;
  article_id: string;
  author_name: string;
  author_email: string;
  content: string;
  status: 'pending' | 'approved' | 'spam' | 'rejected';
  parent_id?: string;
  created_at: string;
  replies?: Comment[];
  likes?: number;
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
  async getComments(articleId: string, type: string = 'noticia'): Promise<CommentsResponse> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/comments?article_id=${articleId}&type=${type}`,
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
        data: result.data?.comments || []
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
    article_id: string;
    type?: string;
    author_name: string;
    author_email: string;
    content: string;
    parent_id?: number;
  }): Promise<CommentResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/comments`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          ...commentData,
          type: commentData.type || 'noticia'
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return {
        success: result.success,
        data: result.data?.comment
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
    commentId: string, 
    action: 'approve' | 'reject',
    articleId: string,
    type: string = 'noticia'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/comments/moderate`, {
        method: 'PATCH',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ 
          comment_id: commentId,
          action,
          article_id: articleId,
          type 
        }),
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
  async deleteComment(commentId: string, articleId: string, type: string = 'noticia'): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/comments/moderate`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          comment_id: commentId,
          article_id: articleId,
          type
        }),
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

  // Toggle like en un comentario
  async toggleCommentLike(commentId: string, articleId: string, type: string = 'noticia'): Promise<LikesResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/comments/like`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          comment_id: commentId,
          article_id: articleId,
          type
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return {
        success: result.success,
        data: {
          totalLikes: result.data?.likes_count || 0,
          userLiked: result.data?.liked || false
        }
      };
    } catch (error) {
      console.error('Error toggling comment like:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error procesando like'
      };
    }
  }

  // Obtener estadísticas de comentarios
  async getCommentsStats(articleId: string, type: string = 'noticia'): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/comments/stats?article_id=${articleId}&type=${type}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting comments stats:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error obteniendo estadísticas'
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