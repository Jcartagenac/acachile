import { useState, useEffect } from 'react';
import { BookOpen, Send, Facebook, Instagram, Twitter, Linkedin, User, MessageSquare, Image as ImageIcon, Loader2 } from 'lucide-react';
import { useImageService } from '../hooks/useImageService';

interface GuestbookEntry {
  id: number;
  name: string;
  email: string;
  social_network: string;
  social_handle: string | null;
  title: string;
  message: string;
  image_url: string | null;
  created_at: string;
}

const SOCIAL_NETWORKS = [
  { value: 'none', label: 'No tengo redes sociales', icon: User },
  { value: 'facebook', label: 'Facebook', icon: Facebook },
  { value: 'instagram', label: 'Instagram', icon: Instagram },
  { value: 'twitter', label: 'Twitter / X', icon: Twitter },
  { value: 'linkedin', label: 'LinkedIn', icon: Linkedin },
];

export default function GuestbookPage() {
  const [entries, setEntries] = useState<GuestbookEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const imageService = useImageService();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    social_network: '',
    social_handle: '',
    title: '',
    message: '',
    image_url: ''
  });

  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/guestbook?limit=50');
      const data = await response.json();
      
      if (data.success) {
        setEntries(data.data || []);
      }
    } catch (error) {
      console.error('Error loading guestbook:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    try {
      setUploadingImage(true);
      const result = await imageService.uploadGalleryImage(file);
      
      if (result.success && result.data) {
        setFormData(prev => ({ ...prev, image_url: result.data!.publicUrl }));
      } else {
        alert('Error al subir la imagen');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Error al subir la imagen');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Por favor ingresa tu nombre');
      return;
    }

    if (!formData.email.trim()) {
      alert('Por favor ingresa tu email');
      return;
    }

    if (!formData.social_network) {
      alert('Por favor selecciona una red social');
      return;
    }

    if (formData.social_network !== 'none' && !formData.social_handle.trim()) {
      alert('Por favor ingresa tu usuario de la red social seleccionada');
      return;
    }

    if (!formData.title.trim()) {
      alert('Por favor ingresa un título');
      return;
    }

    if (!formData.message.trim()) {
      alert('Por favor ingresa tu mensaje');
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch('/api/guestbook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Error al enviar el mensaje');
      }

      alert('¡Gracias por tu mensaje! Se ha publicado correctamente.');
      
      // Limpiar formulario
      setFormData({
        name: '',
        email: '',
        social_network: '',
        social_handle: '',
        title: '',
        message: '',
        image_url: ''
      });
      setShowForm(false);
      
      // Recargar entradas
      loadEntries();

    } catch (error) {
      console.error('Error submitting:', error);
      alert(error instanceof Error ? error.message : 'Error al enviar el mensaje');
    } finally {
      setSubmitting(false);
    }
  };

  const getSocialIcon = (network: string) => {
    const social = SOCIAL_NETWORKS.find(s => s.value === network);
    return social ? social.icon : User;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <BookOpen className="h-12 w-12 text-red-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Libro de Visitas</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Comparte tus experiencias, comentarios y mensajes con nuestra comunidad de asadores
          </p>
        </div>

        {/* Botón para mostrar formulario */}
        {!showForm && (
          <div className="text-center mb-8">
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-8 py-4 bg-red-600 text-white text-lg font-semibold rounded-lg hover:bg-red-700 transition-colors shadow-lg"
            >
              <Send className="h-6 w-6 mr-2" />
              Dejar un Mensaje
            </button>
          </div>
        )}

        {/* Formulario */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-8 mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Deja tu mensaje</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre completo <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Tu nombre"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-red-600">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="tu@email.com"
                  required
                />
                <p className="mt-1 text-sm text-gray-500">No será compartido públicamente</p>
              </div>

              {/* Red Social */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Red Social <span className="text-red-600">*</span>
                </label>
                <select
                  value={formData.social_network}
                  onChange={(e) => setFormData({...formData, social_network: e.target.value, social_handle: ''})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  required
                >
                  <option value="">Selecciona una opción</option>
                  {SOCIAL_NETWORKS.map(network => (
                    <option key={network.value} value={network.value}>
                      {network.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Usuario de Red Social */}
              {formData.social_network && formData.social_network !== 'none' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Usuario de {SOCIAL_NETWORKS.find(n => n.value === formData.social_network)?.label} <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.social_handle}
                    onChange={(e) => setFormData({...formData, social_handle: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="@usuario"
                    required
                  />
                </div>
              )}

              {/* Título */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Título de tu mensaje"
                  maxLength={100}
                  required
                />
              </div>

              {/* Mensaje */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mensaje <span className="text-red-600">*</span>
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  rows={5}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Comparte tu experiencia, comentarios o mensaje..."
                  required
                />
              </div>

              {/* Imagen opcional */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Imagen (opcional)
                </label>
                {formData.image_url ? (
                  <div className="relative">
                    <img 
                      src={formData.image_url} 
                      alt="Preview" 
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, image_url: ''})}
                      className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file);
                      }}
                      className="hidden"
                      id="image-upload"
                    />
                    <label htmlFor="image-upload" className="cursor-pointer">
                      {uploadingImage ? (
                        <Loader2 className="h-12 w-12 mx-auto text-gray-400 animate-spin" />
                      ) : (
                        <ImageIcon className="h-12 w-12 mx-auto text-gray-400" />
                      )}
                      <p className="mt-2 text-sm text-gray-600">
                        {uploadingImage ? 'Subiendo...' : 'Click para subir una imagen'}
                      </p>
                    </label>
                  </div>
                )}
              </div>

              {/* Botones */}
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5 mr-2" />
                      Publicar Mensaje
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de entradas */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-12 w-12 text-red-600 animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Aún no hay mensajes
            </h3>
            <p className="text-gray-600">
              ¡Sé el primero en dejar un mensaje en nuestro libro de visitas!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {entries.map((entry) => {
              const SocialIcon = getSocialIcon(entry.social_network);
              
              return (
                <div key={entry.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-4">
                    {/* Imagen opcional */}
                    {entry.image_url && (
                      <img 
                        src={entry.image_url} 
                        alt={entry.title}
                        className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                      />
                    )}
                    
                    <div className="flex-1">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 mb-1">
                            {entry.title}
                          </h3>
                          <div className="flex items-center gap-3 text-sm text-gray-600">
                            <span className="font-medium">{entry.name}</span>
                            {entry.social_network !== 'none' && entry.social_handle && (
                              <span className="flex items-center gap-1">
                                <SocialIcon className="h-4 w-4" />
                                @{entry.social_handle}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-sm text-gray-500">
                          {formatDate(entry.created_at)}
                        </span>
                      </div>

                      {/* Mensaje */}
                      <p className="text-gray-700 whitespace-pre-wrap">
                        {entry.message}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
