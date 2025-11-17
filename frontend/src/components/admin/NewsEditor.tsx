/**
 * Editor de Noticias - Crear y editar noticias desde el panel admin
 * ACA Chile Frontend
 */

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Eye, Upload, Image as ImageIcon } from 'lucide-react';
import type { NewsArticle } from '../../services/newsService';
import { ImageGalleryUploader } from './ImageGalleryUploader';

interface NewsEditorProps {
  articleSlug?: string;
  onBack: () => void;
  onSave: () => void;
}

export default function NewsEditor({ articleSlug, onBack, onSave }: NewsEditorProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<Array<{ id: number; name: string; color: string }>>([]);
  const [showImageUploader, setShowImageUploader] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    category_id: '',
    featured_image: '',
    gallery: [] as string[],
    video_url: '',
    is_featured: false,
    status: 'draft' as 'draft' | 'published',
    tags: [] as string[]
  });

  const [showGallery, setShowGallery] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    loadCategories();
    if (articleSlug) {
      loadArticle(articleSlug);
    }
  }, [articleSlug]);

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/noticias/categories');
      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setCategories(data.data);
      }
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  const loadArticle = async (slug: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/noticias/${slug}`);
      const data = await response.json();
      
      if (data.success && data.data) {
        const article = data.data;
        setFormData({
          title: article.title,
          slug: article.slug,
          excerpt: article.excerpt || '',
          content: article.content,
          category_id: typeof article.category === 'object' ? article.category.id.toString() : '',
          featured_image: article.featured_image || '',
          gallery: article.gallery || [],
          video_url: article.video_url || '',
          is_featured: article.is_featured || false,
          status: article.status || 'draft',
          tags: article.tags?.map((t: any) => t.name) || []
        });
        
        // Activar checkboxes si ya tienen contenido
        if (article.gallery && article.gallery.length > 0) {
          setShowGallery(true);
        }
        if (article.video_url) {
          setShowVideo(true);
        }
      }
    } catch (err) {
      console.error('Error loading article:', err);
      setError('Error al cargar el artículo');
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      slug: articleSlug ? prev.slug : generateSlug(title)
    }));
  };

  const handleImageUpload = async (file: File) => {
    try {
      setUploadingImage(true);
      const token = localStorage.getItem('auth_token');
      
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);

      const response = await fetch('/api/admin/content/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataUpload
      });

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al subir la imagen');
      }

      // Actualizar la URL de la imagen en el formulario
      setFormData(prev => ({
        ...prev,
        featured_image: data.url
      }));
      
      setShowImageUploader(false);
      alert('Imagen subida correctamente');
    } catch (err) {
      console.error('Error uploading image:', err);
      alert(`Error al subir la imagen: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Por favor selecciona un archivo de imagen válido');
        return;
      }
      handleImageUpload(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      alert('El título es requerido');
      return;
    }
    
    if (!formData.content.trim()) {
      alert('El contenido es requerido');
      return;
    }
    
    if (!formData.category_id) {
      alert('Debes seleccionar una categoría');
      return;
    }

    try {
      setSaving(true);
      
      const url = articleSlug 
        ? `/api/noticias/${articleSlug}`
        : '/api/noticias';
      
      const method = articleSlug ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          ...formData,
          category_id: parseInt(formData.category_id)
        })
      });

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al guardar la noticia');
      }

      alert(articleSlug ? 'Noticia actualizada correctamente' : 'Noticia creada correctamente');
      onSave();
    } catch (err) {
      console.error('Error saving article:', err);
      alert(`Error: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <button
          onClick={onBack}
          className="inline-flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Volver a la lista
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {articleSlug ? 'Editar Noticia' : 'Nueva Noticia'}
        </h2>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Título */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Título *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Título de la noticia"
              required
            />
          </div>

          {/* Slug */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Slug (URL)
            </label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-gray-50"
              placeholder="slug-de-la-noticia"
              readOnly={!!articleSlug}
            />
            <p className="text-sm text-gray-500 mt-1">
              Se genera automáticamente del título
            </p>
          </div>

          {/* Extracto */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Extracto
            </label>
            <textarea
              value={formData.excerpt}
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Breve descripción de la noticia (opcional)"
            />
          </div>

          {/* Contenido */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contenido *
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={12}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent font-mono text-sm"
              placeholder="Contenido HTML de la noticia"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              Puedes usar HTML para dar formato al contenido
            </p>
          </div>

          {/* Categoría */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoría *
            </label>
            <select
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              required
            >
              <option value="">Seleccionar categoría</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Imagen destacada */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Imagen Destacada
            </label>
            
            <div className="space-y-4">
              {/* Vista previa de la imagen */}
              {formData.featured_image && (
                <div className="relative inline-block">
                  <img
                    src={formData.featured_image}
                    alt="Preview"
                    className="h-48 w-auto rounded-lg object-cover border border-gray-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, featured_image: '' })}
                    className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
              
              {/* Uploader */}
              {!showImageUploader ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowImageUploader(true)}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Subir Imagen al R2
                  </button>
                  
                  <span className="text-gray-500 self-center">o</span>
                  
                  <input
                    type="url"
                    value={formData.featured_image}
                    onChange={(e) => setFormData({ ...formData, featured_image: e.target.value })}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Ingresa una URL externa"
                  />
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <div className="text-center">
                    <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                    <label className="cursor-pointer">
                      <span className="text-sm text-gray-600">
                        {uploadingImage ? 'Subiendo...' : 'Haz clic para seleccionar una imagen'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        disabled={uploadingImage}
                        className="hidden"
                      />
                    </label>
                    <p className="text-xs text-gray-500 mt-2">
                      PNG, JPG, GIF hasta 10MB
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowImageUploader(false)}
                      className="mt-3 text-sm text-gray-600 hover:text-gray-900"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Galería de fotos */}
          <div className="mb-6">
            <label className="flex items-center mb-4">
              <input
                type="checkbox"
                checked={showGallery}
                onChange={(e) => {
                  setShowGallery(e.target.checked);
                  if (!e.target.checked) {
                    setFormData({ ...formData, gallery: [] });
                  }
                }}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm font-medium text-gray-700">
                Incluir galería de fotos (hasta 20 imágenes)
              </span>
            </label>

            {showGallery && (
              <ImageGalleryUploader
                images={formData.gallery}
                onChange={(newGallery) => setFormData({ ...formData, gallery: newGallery })}
                maxImages={20}
              />
            )}
          </div>

          {/* Video embebido */}
          <div className="mb-6">
            <label className="flex items-center mb-4">
              <input
                type="checkbox"
                checked={showVideo}
                onChange={(e) => {
                  setShowVideo(e.target.checked);
                  if (!e.target.checked) {
                    setFormData({ ...formData, video_url: '' });
                  }
                }}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm font-medium text-gray-700">
                Incluir video embebido
              </span>
            </label>

            {showVideo && (
              <div className="space-y-2">
                <input
                  type="url"
                  value={formData.video_url}
                  onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="URL del video (YouTube, Vimeo, o enlace directo)"
                />
                <p className="text-xs text-gray-500">
                  Ejemplos: https://www.youtube.com/watch?v=VIDEO_ID o https://vimeo.com/VIDEO_ID
                </p>
              </div>
            )}
          </div>

          {/* Opciones */}
          <div className="mb-6 space-y-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_featured}
                onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">
                Marcar como noticia destacada
              </span>
            </label>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as 'draft' | 'published' })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="draft">Borrador</option>
                <option value="published">Publicado</option>
              </select>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onBack}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            
            {formData.slug && (
              <a
                href={`/noticias/${formData.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Eye className="h-4 w-4 mr-2" />
                Vista Previa
              </a>
            )}
            
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Guardando...' : (articleSlug ? 'Actualizar' : 'Crear Noticia')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
