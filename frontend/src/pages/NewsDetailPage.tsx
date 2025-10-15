/**
 * Página de detalle de noticia con comentarios
 * ACA Chile Frontend
 */

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { newsService, NewsArticle } from '../services/newsService';
import { commentsService, Comment, LikesState } from '../services/commentsService';
import { searchService } from '../services/searchService';
import { 
  Calendar, 
  User, 
  Eye, 
  Heart, 
  Share2, 
  MessageCircle, 
  ArrowLeft,
  Facebook,
  Twitter,
  MessageSquare
} from 'lucide-react';

const NewsDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [likes, setLikes] = useState<LikesState>({ totalLikes: 0, userLiked: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estado del formulario de comentarios
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [commentForm, setCommentForm] = useState({
    author_name: '',
    author_email: '',
    content: '',
    parent_id: undefined as number | undefined
  });
  const [submittingComment, setSubmittingComment] = useState(false);
  
  // Estado de compartir
  const [showShareMenu, setShowShareMenu] = useState(false);

  useEffect(() => {
    if (slug && slug !== undefined && slug.trim() !== '') {
      loadArticle();
    } else {
      setError('Slug del artículo no encontrado');
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (article) {
      loadComments();
      loadLikes();
    }
  }, [article]);

  const loadArticle = async () => {
    try {
      setLoading(true);
      const response = await newsService.getNewsBySlug(slug!);
      
      if (response.success && response.data) {
        setArticle(response.data);
      } else {
        setError(response.error || 'Artículo no encontrado');
      }
    } catch (err) {
      setError('Error cargando el artículo');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    if (!article) return;
    
    try {
      const response = await commentsService.getComments(article.slug, 'noticia');
      if (response.success && response.data) {
        setComments(response.data);
      }
    } catch (err) {
      console.error('Error cargando comentarios:', err);
    }
  };

  const loadLikes = async () => {
    // TODO: Implementar likes de artículos cuando esté disponible el endpoint
    setLikes({ totalLikes: 0, userLiked: false });
  };

  const handleLike = async () => {
    // TODO: Implementar toggle de likes de artículos
    console.log('Like functionality not implemented yet');
  };

  const handleShare = async (platform: 'facebook' | 'twitter' | 'whatsapp' | 'copy') => {
    if (!article) return;
    
    const url = `${window.location.origin}/noticias/${article.slug}`;
    const title = article.title;
    
    try {
      // Registrar el compartido
      await commentsService.shareArticle(article.id, platform);
      
      switch (platform) {
        case 'facebook':
          window.open(searchService.getShareUrl('facebook', url, title), '_blank');
          break;
        case 'twitter':
          window.open(searchService.getShareUrl('twitter', url, title), '_blank');
          break;
        case 'whatsapp':
          window.open(searchService.getShareUrl('whatsapp', url, title), '_blank');
          break;
        case 'copy':
          const copied = await searchService.copyToClipboard(url);
          if (copied) {
            alert('Enlace copiado al portapapeles');
          } else {
            alert('No se pudo copiar el enlace');
          }
          break;
      }
      
      setShowShareMenu(false);
    } catch (err) {
      console.error('Error compartiendo:', err);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!article || submittingComment) return;
    
    if (!commentForm.author_name.trim() || !commentForm.author_email.trim() || !commentForm.content.trim()) {
      alert('Por favor completa todos los campos');
      return;
    }
    
    try {
      setSubmittingComment(true);
      const response = await commentsService.createComment({
        article_id: article.slug,
        type: 'noticia',
        ...commentForm
      });
      
      if (response.success) {
        setCommentForm({
          author_name: '',
          author_email: '',
          content: '',
          parent_id: undefined
        });
        setShowCommentForm(false);
        loadComments(); // Recargar comentarios
        alert('Comentario enviado. Será revisado antes de publicarse.');
      } else {
        alert(response.error || 'Error enviando comentario');
      }
    } catch (err) {
      console.error('Error enviando comentario:', err);
      alert('Error enviando comentario');
    } finally {
      setSubmittingComment(false);
    }
  };

  const renderComment = (comment: Comment, depth = 0) => (
    <div key={comment.id} className={`${depth > 0 ? 'ml-8 mt-4' : 'mb-6'} bg-gray-50 rounded-lg p-4`}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <h4 className="font-medium text-gray-900">{comment.author_name}</h4>
          <p className="text-sm text-gray-500">
            {new Date(comment.created_at).toLocaleDateString('es-CL', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
        {comment.status === 'pending' && (
          <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded">
            Pendiente
          </span>
        )}
      </div>
      <p className="text-gray-700 mb-3">{comment.content}</p>
      
      {/* Respuestas anidadas */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-4">
          {comment.replies.map(reply => renderComment(reply, depth + 1))}
        </div>
      )}
    </div>
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded mb-6"></div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-4/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {error || 'Artículo no encontrado'}
          </h1>
          <Link to="/noticias" className="text-red-600 hover:text-red-800">
            Volver a noticias
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navegación */}
        <div className="mb-6">
          <Link 
            to="/noticias" 
            className="inline-flex items-center text-red-600 hover:text-red-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a noticias
          </Link>
        </div>

        {/* Artículo */}
        <article className="bg-white rounded-lg shadow-lg overflow-hidden mb-8">
          {/* Imagen destacada */}
          {article.featured_image && (
            <div className="h-64 md:h-96 overflow-hidden">
              <img
                src={article.featured_image}
                alt={article.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="p-6 md:p-8">
            {/* Header del artículo */}
            <div className="mb-6">
              <div className="flex items-center mb-4">
                <span
                  className="inline-block px-3 py-1 rounded-full text-sm font-medium text-white mr-4"
                  style={{ backgroundColor: article.category.color }}
                >
                  {article.category.name}
                </span>
                {article.is_featured && (
                  <span className="bg-yellow-100 text-yellow-800 text-sm font-medium px-2 py-1 rounded">
                    Destacada
                  </span>
                )}
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {article.title}
              </h1>

              <div className="flex items-center justify-between text-sm text-gray-500 mb-6">
                <div className="flex items-center space-x-6">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    {formatDate(article.published_at)}
                  </div>
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    {article.author_name}
                  </div>
                  <div className="flex items-center">
                    <Eye className="h-4 w-4 mr-2" />
                    {article.view_count} vistas
                  </div>
                </div>
              </div>

              {/* Acciones de interacción */}
              <div className="flex items-center space-x-4 border-t border-b border-gray-200 py-4">
                <button
                  onClick={handleLike}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    likes.userLiked
                      ? 'bg-red-100 text-red-700'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  <Heart className={`h-5 w-5 ${likes.userLiked ? 'fill-current' : ''}`} />
                  <span>{likes.totalLikes}</span>
                </button>

                <button
                  onClick={() => setShowCommentForm(!showCommentForm)}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                >
                  <MessageCircle className="h-5 w-5" />
                  <span>{comments.length} Comentarios</span>
                </button>

                <div className="relative">
                  <button
                    onClick={() => setShowShareMenu(!showShareMenu)}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                  >
                    <Share2 className="h-5 w-5" />
                    <span>Compartir</span>
                  </button>

                  {showShareMenu && (
                    <div className="absolute top-full left-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                      <button
                        onClick={() => handleShare('facebook')}
                        className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-50"
                      >
                        <Facebook className="h-4 w-4 mr-3 text-blue-600" />
                        Facebook
                      </button>
                      <button
                        onClick={() => handleShare('twitter')}
                        className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-50"
                      >
                        <Twitter className="h-4 w-4 mr-3 text-blue-400" />
                        Twitter
                      </button>
                      <button
                        onClick={() => handleShare('whatsapp')}
                        className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-50"
                      >
                        <MessageSquare className="h-4 w-4 mr-3 text-green-600" />
                        WhatsApp
                      </button>
                      <button
                        onClick={() => handleShare('copy')}
                        className="flex items-center w-full px-4 py-2 text-left hover:bg-gray-50 border-t border-gray-100"
                      >
                        Copiar enlace
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Contenido del artículo */}
            <div 
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />

            {/* Tags */}
            {article.tags && article.tags.length > 0 && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Tags:</h3>
                <div className="flex flex-wrap gap-2">
                  {article.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="inline-block px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full hover:bg-gray-200 cursor-pointer"
                    >
                      #{tag.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </article>

        {/* Sección de comentarios */}
        <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Comentarios ({comments.length})
          </h2>

          {/* Formulario de comentarios */}
          {showCommentForm && (
            <form onSubmit={handleCommentSubmit} className="mb-8 p-6 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Agregar comentario</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <input
                  type="text"
                  placeholder="Tu nombre"
                  value={commentForm.author_name}
                  onChange={(e) => setCommentForm({...commentForm, author_name: e.target.value})}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
                <input
                  type="email"
                  placeholder="Tu email"
                  value={commentForm.author_email}
                  onChange={(e) => setCommentForm({...commentForm, author_email: e.target.value})}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              
              <textarea
                placeholder="Escribe tu comentario..."
                value={commentForm.content}
                onChange={(e) => setCommentForm({...commentForm, content: e.target.value})}
                required
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent mb-4"
              />
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCommentForm(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submittingComment}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {submittingComment ? 'Enviando...' : 'Enviar comentario'}
                </button>
              </div>
            </form>
          )}

          {/* Lista de comentarios */}
          {comments.length > 0 ? (
            <div className="space-y-6">
              {comments.map(comment => renderComment(comment))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <MessageCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No hay comentarios aún. ¡Sé el primero en comentar!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewsDetailPage;