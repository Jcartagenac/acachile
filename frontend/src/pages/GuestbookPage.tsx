import { useState, useEffect } from 'react';
import { Send, Facebook, Instagram, Twitter, Linkedin, User, MessageSquare, Image as ImageIcon, Loader2 } from 'lucide-react';
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

interface TranslatedEntry extends GuestbookEntry {
  translatedTitle?: string;
  translatedMessage?: string;
}

type Language = 'es' | 'en' | 'de' | 'pt';

const TRANSLATIONS = {
  es: {
    title: 'Libro de Visitas',
    subtitle: 'Comparte tus experiencias, comentarios y mensajes con nuestra comunidad de asadores',
    leaveMessage: 'Dejar un Mensaje',
    writeMessage: 'Deja tu mensaje',
    name: 'Nombre completo',
    email: 'Email',
    emailNote: 'No será compartido públicamente',
    socialNetwork: 'Red Social',
    selectOption: 'Selecciona una opción',
    noSocial: 'No tengo redes sociales',
    socialUser: 'Usuario de',
    titleField: 'Título',
    titlePlaceholder: 'Título de tu mensaje',
    message: 'Mensaje',
    messagePlaceholder: 'Comparte tu experiencia, comentarios o mensaje...',
    optionalImage: 'Imagen (opcional)',
    uploading: 'Subiendo...',
    clickUpload: 'Click para subir una imagen',
    cancel: 'Cancelar',
    sending: 'Enviando...',
    publish: 'Publicar Mensaje',
    noMessages: 'Aún no hay mensajes',
    beFirst: '¡Sé el primero en dejar un mensaje en nuestro libro de visitas!',
    required: '*',
    alertName: 'Por favor ingresa tu nombre',
    alertEmail: 'Por favor ingresa tu email',
    alertSocial: 'Por favor selecciona una red social',
    alertSocialHandle: 'Por favor ingresa tu usuario de la red social seleccionada',
    alertTitle: 'Por favor ingresa un título',
    alertMessage: 'Por favor ingresa tu mensaje',
    alertImageError: 'Error al subir la imagen',
    successMessage: '¡Gracias por tu mensaje! Se ha publicado correctamente.',
  },
  en: {
    title: 'Guestbook',
    subtitle: 'Share your experiences, comments and messages with our BBQ community',
    leaveMessage: 'Leave a Message',
    writeMessage: 'Write your message',
    name: 'Full name',
    email: 'Email',
    emailNote: 'Will not be shared publicly',
    socialNetwork: 'Social Network',
    selectOption: 'Select an option',
    noSocial: "I don't have social media",
    socialUser: 'Username on',
    titleField: 'Title',
    titlePlaceholder: 'Your message title',
    message: 'Message',
    messagePlaceholder: 'Share your experience, comments or message...',
    optionalImage: 'Image (optional)',
    uploading: 'Uploading...',
    clickUpload: 'Click to upload an image',
    cancel: 'Cancel',
    sending: 'Sending...',
    publish: 'Publish Message',
    noMessages: 'No messages yet',
    beFirst: 'Be the first to leave a message in our guestbook!',
    required: '*',
    alertName: 'Please enter your name',
    alertEmail: 'Please enter your email',
    alertSocial: 'Please select a social network',
    alertSocialHandle: 'Please enter your social media username',
    alertTitle: 'Please enter a title',
    alertMessage: 'Please enter your message',
    alertImageError: 'Error uploading image',
    successMessage: 'Thank you for your message! It has been published successfully.',
  },
  de: {
    title: 'Gästebuch',
    subtitle: 'Teilen Sie Ihre Erfahrungen, Kommentare und Nachrichten mit unserer Grill-Community',
    leaveMessage: 'Nachricht Hinterlassen',
    writeMessage: 'Schreiben Sie Ihre Nachricht',
    name: 'Vollständiger Name',
    email: 'E-Mail',
    emailNote: 'Wird nicht öffentlich geteilt',
    socialNetwork: 'Soziales Netzwerk',
    selectOption: 'Wählen Sie eine Option',
    noSocial: 'Ich habe keine sozialen Medien',
    socialUser: 'Benutzername auf',
    titleField: 'Titel',
    titlePlaceholder: 'Titel Ihrer Nachricht',
    message: 'Nachricht',
    messagePlaceholder: 'Teilen Sie Ihre Erfahrungen, Kommentare oder Nachricht...',
    optionalImage: 'Bild (optional)',
    uploading: 'Hochladen...',
    clickUpload: 'Klicken Sie, um ein Bild hochzuladen',
    cancel: 'Abbrechen',
    sending: 'Senden...',
    publish: 'Nachricht Veröffentlichen',
    noMessages: 'Noch keine Nachrichten',
    beFirst: 'Seien Sie der Erste, der eine Nachricht in unserem Gästebuch hinterlässt!',
    required: '*',
    alertName: 'Bitte geben Sie Ihren Namen ein',
    alertEmail: 'Bitte geben Sie Ihre E-Mail ein',
    alertSocial: 'Bitte wählen Sie ein soziales Netzwerk',
    alertSocialHandle: 'Bitte geben Sie Ihren Social-Media-Benutzernamen ein',
    alertTitle: 'Bitte geben Sie einen Titel ein',
    alertMessage: 'Bitte geben Sie Ihre Nachricht ein',
    alertImageError: 'Fehler beim Hochladen des Bildes',
    successMessage: 'Vielen Dank für Ihre Nachricht! Sie wurde erfolgreich veröffentlicht.',
  },
  pt: {
    title: 'Livro de Visitas',
    subtitle: 'Compartilhe suas experiências, comentários e mensagens com nossa comunidade de churrasqueiros',
    leaveMessage: 'Deixar uma Mensagem',
    writeMessage: 'Escreva sua mensagem',
    name: 'Nome completo',
    email: 'Email',
    emailNote: 'Não será compartilhado publicamente',
    socialNetwork: 'Rede Social',
    selectOption: 'Selecione uma opção',
    noSocial: 'Não tenho redes sociais',
    socialUser: 'Usuário em',
    titleField: 'Título',
    titlePlaceholder: 'Título da sua mensagem',
    message: 'Mensagem',
    messagePlaceholder: 'Compartilhe sua experiência, comentários ou mensagem...',
    optionalImage: 'Imagem (opcional)',
    uploading: 'Enviando...',
    clickUpload: 'Clique para enviar uma imagem',
    cancel: 'Cancelar',
    sending: 'Enviando...',
    publish: 'Publicar Mensagem',
    noMessages: 'Ainda não há mensagens',
    beFirst: 'Seja o primeiro a deixar uma mensagem em nosso livro de visitas!',
    required: '*',
    alertName: 'Por favor, insira seu nome',
    alertEmail: 'Por favor, insira seu email',
    alertSocial: 'Por favor, selecione uma rede social',
    alertSocialHandle: 'Por favor, insira seu usuário da rede social',
    alertTitle: 'Por favor, insira um título',
    alertMessage: 'Por favor, insira sua mensagem',
    alertImageError: 'Erro ao enviar a imagem',
    successMessage: 'Obrigado pela sua mensagem! Foi publicada com sucesso.',
  }
};

const LANGUAGES = [
  { code: 'es' as Language, label: 'Español', flag: '🇪🇸' },
  { code: 'en' as Language, label: 'English', flag: '🇬🇧' },
  { code: 'de' as Language, label: 'Deutsch', flag: '🇩🇪' },
  { code: 'pt' as Language, label: 'Português', flag: '🇵🇹' },
];

const getSocialNetworks = (lang: Language) => [
  { value: 'none', label: TRANSLATIONS[lang].noSocial, icon: User },
  { value: 'facebook', label: 'Facebook', icon: Facebook },
  { value: 'instagram', label: 'Instagram', icon: Instagram },
  { value: 'twitter', label: 'Twitter / X', icon: Twitter },
  { value: 'linkedin', label: 'LinkedIn', icon: Linkedin },
];

export default function GuestbookPage() {
  const [entries, setEntries] = useState<TranslatedEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [language, setLanguage] = useState<Language>('es');
  const [translating, setTranslating] = useState(false);
  const imageService = useImageService();

  const t = TRANSLATIONS[language];
  const SOCIAL_NETWORKS = getSocialNetworks(language);

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

  useEffect(() => {
    if (language !== 'es' && entries.length > 0 && !entries[0]?.translatedTitle) {
      translateEntries();
    } else if (language === 'es' && entries.length > 0 && entries[0]?.translatedTitle) {
      // Clear translations when switching back to Spanish
      setEntries(prev => prev.map(entry => ({
        ...entry,
        translatedTitle: undefined,
        translatedMessage: undefined
      })));
    }
  }, [language]);

  const translateText = async (text: string, targetLang: Language): Promise<string> => {
    if (targetLang === 'es') return text;
    if (!text || text.trim().length === 0) return text;
    
    const MAX_CHUNK_SIZE = 450; // Limit to 450 chars per chunk (safe margin)
    
    try {
      // If text is short enough, translate directly
      if (text.length <= MAX_CHUNK_SIZE) {
        const langPair = `es|${targetLang}`;
        const response = await fetch(
          `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair}`
        );
        const data = await response.json();
        
        if (data.responseData && data.responseData.translatedText) {
          return data.responseData.translatedText;
        }
        return text;
      }
      
      // Split long text into chunks by sentences or paragraphs
      const sentences = text.match(/[^.!?\n]+[.!?\n]+/g) || [text];
      const chunks: string[] = [];
      let currentChunk = '';
      
      for (const sentence of sentences) {
        if ((currentChunk + sentence).length <= MAX_CHUNK_SIZE) {
          currentChunk += sentence;
        } else {
          if (currentChunk) chunks.push(currentChunk);
          currentChunk = sentence;
        }
      }
      if (currentChunk) chunks.push(currentChunk);
      
      // Translate each chunk with delay to avoid rate limiting
      const translatedChunks: string[] = [];
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        if (!chunk) continue;
        
        if (i > 0) {
          // Add delay between requests
          await new Promise(resolve => setTimeout(resolve, 300));
        }
        
        const langPair = `es|${targetLang}`;
        const response = await fetch(
          `https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunk)}&langpair=${langPair}`
        );
        const data = await response.json();
        
        if (data.responseData && data.responseData.translatedText) {
          translatedChunks.push(data.responseData.translatedText);
        } else {
          translatedChunks.push(chunk);
        }
      }
      
      return translatedChunks.join('');
    } catch (error) {
      console.error('Translation error:', error);
      return text;
    }
  };

  const translateEntries = async () => {
    setTranslating(true);
    
    try {
      const translatedEntries = await Promise.all(
        entries.map(async (entry) => {
          // Translate title and message
          const [translatedTitle, translatedMessage] = await Promise.all([
            translateText(entry.title, language),
            translateText(entry.message, language)
          ]);

          return {
            ...entry,
            translatedTitle,
            translatedMessage
          };
        })
      );

      setEntries(translatedEntries);
    } catch (error) {
      console.error('Error translating entries:', error);
    } finally {
      setTranslating(false);
    }
  };

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
        alert(t.alertImageError);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert(t.alertImageError);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert(t.alertName);
      return;
    }

    if (!formData.email.trim()) {
      alert(t.alertEmail);
      return;
    }

    if (!formData.social_network) {
      alert(t.alertSocial);
      return;
    }

    if (formData.social_network !== 'none' && !formData.social_handle.trim()) {
      alert(t.alertSocialHandle);
      return;
    }

    if (!formData.title.trim()) {
      alert(t.alertTitle);
      return;
    }

    if (!formData.message.trim()) {
      alert(t.alertMessage);
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

      alert(t.successMessage);
      
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
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <img 
              src="https://images.acachile.com/home/img-1764027992246-i023ig.jpg" 
              alt={t.title} 
              className="h-48 w-48 sm:h-56 sm:w-56 object-cover rounded-full shadow-lg"
            />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">{t.title}</h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto mb-6">
            {t.subtitle}
          </p>
        </div>

        {/* Language Selector - Flags Only */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-full shadow-md border border-gray-200">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={`relative group transition-all duration-200 ${
                  language === lang.code 
                    ? 'scale-125' 
                    : 'scale-100 opacity-60 hover:opacity-100 hover:scale-110'
                }`}
                title={lang.label}
              >
                <span className="text-3xl sm:text-4xl cursor-pointer">
                  {lang.flag}
                </span>
                {language === lang.code && (
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-red-600 rounded-full"></div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Botón para mostrar formulario */}
        {!showForm && (
          <div className="text-center mb-8">
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-8 py-4 bg-red-600 text-white text-lg font-semibold rounded-lg hover:bg-red-700 transition-colors shadow-lg"
            >
              <Send className="h-6 w-6 mr-2" />
              {t.leaveMessage}
            </button>
          </div>
        )}

        {/* Formulario */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-8 mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{t.writeMessage}</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Nombre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.name} <span className="text-red-600">{t.required}</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder={t.name}
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.email} <span className="text-red-600">{t.required}</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder={t.email}
                  required
                />
                <p className="mt-1 text-sm text-gray-500">{t.emailNote}</p>
              </div>

              {/* Red Social */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.socialNetwork} <span className="text-red-600">{t.required}</span>
                </label>
                <select
                  value={formData.social_network}
                  onChange={(e) => setFormData({...formData, social_network: e.target.value, social_handle: ''})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  required
                >
                  <option value="">{t.selectOption}</option>
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
                    {t.socialUser} {SOCIAL_NETWORKS.find(n => n.value === formData.social_network)?.label} <span className="text-red-600">{t.required}</span>
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
                  {t.titleField} <span className="text-red-600">{t.required}</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder={t.titlePlaceholder}
                  maxLength={100}
                  required
                />
              </div>

              {/* Mensaje */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.message} <span className="text-red-600">{t.required}</span>
                </label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  rows={5}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder={t.messagePlaceholder}
                  required
                />
              </div>

              {/* Imagen opcional */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.optionalImage}
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
                        {uploadingImage ? t.uploading : t.clickUpload}
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
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      {t.sending}
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5 mr-2" />
                      {t.publish}
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
              {t.noMessages}
            </h3>
            <p className="text-gray-600">
              {t.beFirst}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {entries.map((entry) => {
              const SocialIcon = getSocialIcon(entry.social_network);
              
              return (
                <div key={entry.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Header con título y metadata */}
                  <div className="p-4 sm:p-6 border-b border-gray-100">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 break-words">
                          {entry.translatedTitle || entry.title}
                          {translating && language !== 'es' && !entry.translatedTitle && (
                            <Loader2 className="inline h-5 w-5 ml-2 text-gray-400 animate-spin" />
                          )}
                        </h3>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-sm text-gray-600">
                          <span className="font-medium truncate">{entry.name}</span>
                          {entry.social_network !== 'none' && entry.social_handle && (
                            <span className="flex items-center gap-1">
                              <SocialIcon className="h-4 w-4 flex-shrink-0" />
                              <span className="truncate">@{entry.social_handle}</span>
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-sm text-gray-500 flex-shrink-0">
                        {formatDate(entry.created_at)}
                      </span>
                    </div>
                  </div>

                  {/* Imagen en tamaño completo */}
                  {entry.image_url && (
                    <div className="w-full bg-gray-100">
                      <img 
                        src={entry.image_url} 
                        alt={entry.translatedTitle || entry.title}
                        className="w-full h-auto object-contain"
                      />
                    </div>
                  )}

                  {/* Mensaje */}
                  <div className="p-4 sm:p-6">
                    <p className="text-gray-700 text-base sm:text-lg leading-relaxed whitespace-pre-wrap break-words">
                      {entry.translatedMessage || entry.message}
                      {translating && language !== 'es' && !entry.translatedMessage && (
                        <Loader2 className="inline h-5 w-5 ml-2 text-gray-400 animate-spin" />
                      )}
                    </p>
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
