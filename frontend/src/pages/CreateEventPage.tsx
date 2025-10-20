import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { Container } from '../components/layout/Container';
import { useEvents } from '../contexts/EventContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  Calendar, 
  MapPin, 
  Users, 
  DollarSign,
  Upload,
  Eye,
  Save,
  ArrowLeft
} from 'lucide-react';

// Schema de validación para el formulario de evento
const eventSchema = z.object({
  title: z.string()
    .min(5, 'El título debe tener al menos 5 caracteres')
    .max(100, 'El título no puede exceder 100 caracteres'),
  
  description: z.string()
    .min(20, 'La descripción debe tener al menos 20 caracteres')
    .max(1000, 'La descripción no puede exceder 1000 caracteres'),
  
  date: z.string()
    .min(1, 'La fecha es requerida')
    .refine((date) => {
      const eventDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return eventDate >= today;
    }, 'La fecha debe ser hoy o en el futuro'),
  
  endDate: z.string().optional(),
  
  time: z.string().min(1, 'La hora es requerida'),
  
  location: z.string()
    .min(5, 'La ubicación debe tener al menos 5 caracteres')
    .max(100, 'La ubicación no puede exceder 100 caracteres'),
  
  type: z.enum(['campeonato', 'taller', 'encuentro', 'competencia', 'masterclass'], {
    errorMap: () => ({ message: 'Selecciona un tipo de evento válido' })
  }),
  
  maxParticipants: z.number()
    .min(1, 'Debe permitir al menos 1 participante')
    .max(1000, 'No puede exceder 1000 participantes')
    .optional(),
  
  price: z.number()
    .min(0, 'El precio no puede ser negativo')
    .max(1000000, 'El precio es demasiado alto'),
  
  registrationOpen: z.boolean(),
  
  requirements: z.string().optional(),
  
  tags: z.string().optional(),
  
  contactEmail: z.string()
    .email('Debe ser un email válido')
    .optional().or(z.literal('')),
  
  contactPhone: z.string().optional(),
  
  contactWebsite: z.string().url('Debe ser una URL válida').optional().or(z.literal(''))
}).superRefine((data, ctx) => {
  if (data.endDate && data.date) {
    const start = new Date(data.date);
    const end = new Date(data.endDate);
    if (end < start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'La fecha de fin debe ser posterior o igual a la fecha de inicio',
        path: ['endDate']
      });
    }
  }
});

type EventFormData = z.infer<typeof eventSchema>;

export const CreateEventPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createEvento, isLoading } = useEvents();
  const [showPreview, setShowPreview] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
    reset
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    mode: 'onChange',
    defaultValues: {
      price: 0,
      registrationOpen: true
    }
  });

  const watchedValues = watch();

  // Redireccionar si no hay usuario logueado
  React.useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('La imagen no puede superar 5MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: EventFormData) => {
    if (!user) return;

    try {
      // Procesar requirements y tags
      const requirements = data.requirements 
        ? data.requirements.split('\n').filter(req => req.trim())
        : [];
      
      const tags = data.tags 
        ? data.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
        : [];

      // Preparar contactInfo
      const contactInfo: { email?: string; phone?: string; website?: string } = {};
      if (data.contactEmail && data.contactEmail.trim()) {
        contactInfo.email = data.contactEmail.trim();
      }
      if (data.contactPhone && data.contactPhone.trim()) {
        contactInfo.phone = data.contactPhone.trim();
      }
      if (data.contactWebsite && data.contactWebsite.trim()) {
        contactInfo.website = data.contactWebsite.trim();
      }

      // Crear el objeto que coincide con EventoForm
      const eventData = {
        title: data.title,
        description: data.description,
        date: data.date,
        time: data.time,
        location: data.location,
        type: data.type,
        maxParticipants: data.maxParticipants,
        price: data.price,
        registrationOpen: data.registrationOpen,
        status: 'published' as const, // Eventos creados desde el panel se publican automáticamente
        image: selectedImage || 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500&h=300&fit=crop',
        requirements,
        tags,
        contactInfo: Object.keys(contactInfo).length > 0 ? contactInfo : undefined
      };

  await createEvento(eventData);
  navigate('/eventos');
    } catch (error) {
      console.error('Error al crear evento:', error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#e8ecf4' }}>
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Acceso requerido</h2>
          <p>Debes iniciar sesión para crear eventos</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-pastel-purple-50 to-neutral-100 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-gradient-to-r from-primary-200/20 to-pastel-blue-200/20 rounded-full blur-3xl animate-soft-pulse"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-pastel-pink-200/20 to-primary-200/20 rounded-full blur-3xl animate-soft-pulse delay-1000"></div>
      
      <Container>
        <div className="py-12 relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/events')}
                className="p-3 rounded-xl transition-all duration-300"
                style={{ 
                  backgroundColor: '#e8ecf4',
                  boxShadow: '8px 8px 16px #bec8d7, -8px -8px 16px #ffffff'
                }}
              >
                <ArrowLeft className="w-5 h-5" style={{ color: '#374151' }} />
              </button>
              
              <div>
                <h1 className="text-3xl font-bold" style={{ color: '#374151' }}>
                  Crear Nuevo Evento
                </h1>
                <p className="text-lg mt-2" style={{ color: '#6B7280' }}>
                  Comparte tu pasión por el asado con la comunidad
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="px-6 py-3 rounded-xl font-medium transition-all duration-300 flex items-center space-x-2"
                style={{ 
                  backgroundColor: showPreview ? '#3B82F6' : '#e8ecf4',
                  color: showPreview ? '#fff' : '#374151',
                  boxShadow: showPreview 
                    ? '0 4px 15px rgba(59, 130, 246, 0.3)' 
                    : '8px 8px 16px #bec8d7, -8px -8px 16px #ffffff'
                }}
              >
                <Eye className="w-5 h-5" />
                <span>{showPreview ? 'Ocultar Vista Previa' : 'Vista Previa'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Formulario */}
            <div 
              className="rounded-3xl p-8"
              style={{ 
                backgroundColor: '#e8ecf4',
                boxShadow: '20px 20px 40px #bec8d7, -20px -20px 40px #ffffff'
              }}
            >
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Información Básica */}
                <div>
                  <h3 className="text-xl font-bold mb-6" style={{ color: '#374151' }}>
                    Información Básica
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                        Título del Evento *
                      </label>
                      <input
                        {...register('title')}
                        className="w-full px-4 py-3 rounded-xl border-0 outline-0"
                        style={{ 
                          backgroundColor: '#e8ecf4',
                          boxShadow: 'inset 8px 8px 16px #bec8d7, inset -8px -8px 16px #ffffff',
                          color: '#374151'
                        }}
                        placeholder="Ej: Campeonato Nacional de Asadores 2025"
                      />
                      {errors.title && (
                        <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                        Descripción *
                      </label>
                      <textarea
                        {...register('description')}
                        rows={4}
                        className="w-full px-4 py-3 rounded-xl border-0 outline-0 resize-none"
                        style={{ 
                          backgroundColor: '#e8ecf4',
                          boxShadow: 'inset 8px 8px 16px #bec8d7, inset -8px -8px 16px #ffffff',
                          color: '#374151'
                        }}
                        placeholder="Describe tu evento: objetivos, actividades, qué pueden esperar los participantes..."
                      />
                      {errors.description && (
                        <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                          Tipo de Evento *
                        </label>
                        <select
                          {...register('type')}
                          className="w-full px-4 py-3 rounded-xl border-0 outline-0"
                          style={{ 
                            backgroundColor: '#e8ecf4',
                            boxShadow: 'inset 8px 8px 16px #bec8d7, inset -8px -8px 16px #ffffff',
                            color: '#374151'
                          }}
                        >
                          <option value="">Selecciona un tipo</option>
                          <option value="campeonato">Campeonato</option>
                          <option value="taller">Taller</option>
                          <option value="encuentro">Encuentro</option>
                          <option value="competencia">Competencia</option>
                          <option value="masterclass">Masterclass</option>
                        </select>
                        {errors.type && (
                          <p className="text-red-500 text-sm mt-1">{errors.type.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                          Ubicación *
                        </label>
                        <input
                          {...register('location')}
                          className="w-full px-4 py-3 rounded-xl border-0 outline-0"
                          style={{ 
                            backgroundColor: '#e8ecf4',
                            boxShadow: 'inset 8px 8px 16px #bec8d7, inset -8px -8px 16px #ffffff',
                            color: '#374151'
                          }}
                          placeholder="Ej: Parque O'Higgins, Santiago"
                        />
                        {errors.location && (
                          <p className="text-red-500 text-sm mt-1">{errors.location.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                          Fecha de Inicio *
                        </label>
                        <input
                          type="date"
                          {...register('date')}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full px-4 py-3 rounded-xl border-0 outline-0"
                          style={{ 
                            backgroundColor: '#e8ecf4',
                            boxShadow: 'inset 8px 8px 16px #bec8d7, inset -8px -8px 16px #ffffff',
                            color: '#374151'
                          }}
                        />
                        {errors.date && (
                          <p className="text-red-500 text-sm mt-1">{errors.date.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                          Fecha de Fin (opcional)
                        </label>
                        <input
                          type="date"
                          {...register('endDate')}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full px-4 py-3 rounded-xl border-0 outline-0"
                          style={{ 
                            backgroundColor: '#e8ecf4',
                            boxShadow: 'inset 8px 8px 16px #bec8d7, inset -8px -8px 16px #ffffff',
                            color: '#374151'
                          }}
                        />
                        {errors.endDate && (
                          <p className="text-red-500 text-sm mt-1">{errors.endDate.message}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Configuración del Evento */}
                <div className="border-t pt-6" style={{ borderColor: '#D1D5DB' }}>
                  <h3 className="text-xl font-bold mb-6" style={{ color: '#374151' }}>
                    Configuración del Evento
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                          Máximo de Participantes
                        </label>
                        <input
                          type="number"
                          {...register('maxParticipants', { valueAsNumber: true })}
                          min="1"
                          className="w-full px-4 py-3 rounded-xl border-0 outline-0"
                          style={{ 
                            backgroundColor: '#e8ecf4',
                            boxShadow: 'inset 8px 8px 16px #bec8d7, inset -8px -8px 16px #ffffff',
                            color: '#374151'
                          }}
                          placeholder="Ej: 50"
                        />
                        {errors.maxParticipants && (
                          <p className="text-red-500 text-sm mt-1">{errors.maxParticipants.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                          Precio (CLP)
                        </label>
                        <input
                          type="number"
                          {...register('price', { valueAsNumber: true })}
                          min="0"
                          className="w-full px-4 py-3 rounded-xl border-0 outline-0"
                          style={{ 
                            backgroundColor: '#e8ecf4',
                            boxShadow: 'inset 8px 8px 16px #bec8d7, inset -8px -8px 16px #ffffff',
                            color: '#374151'
                          }}
                          placeholder="0 para evento gratuito"
                        />
                        {errors.price && (
                          <p className="text-red-500 text-sm mt-1">{errors.price.message}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          {...register('registrationOpen')}
                          className="w-5 h-5 rounded"
                          style={{ accentColor: '#EF4444' }}
                        />
                        <span className="text-sm font-medium" style={{ color: '#374151' }}>
                          Inscripciones abiertas
                        </span>
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                        Requisitos (uno por línea)
                      </label>
                      <textarea
                        {...register('requirements')}
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl border-0 outline-0 resize-none"
                        style={{ 
                          backgroundColor: '#e8ecf4',
                          boxShadow: 'inset 8px 8px 16px #bec8d7, inset -8px -8px 16px #ffffff',
                          color: '#374151'
                        }}
                        placeholder="Parrilla propia&#10;Implementos de cocina&#10;Delantal"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                        Etiquetas (separadas por comas)
                      </label>
                      <input
                        {...register('tags')}
                        className="w-full px-4 py-3 rounded-xl border-0 outline-0"
                        style={{ 
                          backgroundColor: '#e8ecf4',
                          boxShadow: 'inset 8px 8px 16px #bec8d7, inset -8px -8px 16px #ffffff',
                          color: '#374151'
                        }}
                        placeholder="campeonato, asado, nacional"
                      />
                    </div>
                  </div>
                </div>

                {/* Imagen del Evento */}
                <div className="border-t pt-6" style={{ borderColor: '#D1D5DB' }}>
                  <h3 className="text-xl font-bold mb-6" style={{ color: '#374151' }}>
                    Imagen del Evento
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                        Subir Imagen
                      </label>
                      <div 
                        className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-300"
                        style={{ 
                          borderColor: '#D1D5DB',
                          backgroundColor: selectedImage ? '#F3F4F6' : 'transparent'
                        }}
                      >
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          id="imageUpload"
                        />
                        <label htmlFor="imageUpload" className="cursor-pointer">
                          {selectedImage ? (
                            <div>
                              <img 
                                src={selectedImage} 
                                alt="Preview" 
                                className="w-32 h-32 object-cover rounded-xl mx-auto mb-2"
                              />
                              <p className="text-sm" style={{ color: '#6B7280' }}>
                                Click para cambiar imagen
                              </p>
                            </div>
                          ) : (
                            <div>
                              <Upload className="w-12 h-12 mx-auto mb-2" style={{ color: '#9CA3AF' }} />
                              <p className="text-sm" style={{ color: '#6B7280' }}>
                                Click para subir imagen o arrastra aquí
                              </p>
                              <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>
                                PNG, JPG hasta 5MB
                              </p>
                            </div>
                          )}
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Información de Contacto */}
                <div className="border-t pt-6" style={{ borderColor: '#D1D5DB' }}>
                  <h3 className="text-xl font-bold mb-6" style={{ color: '#374151' }}>
                    Información de Contacto
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                        Email de Contacto
                      </label>
                      <input
                        type="email"
                        {...register('contactEmail')}
                        className="w-full px-4 py-3 rounded-xl border-0 outline-0"
                        style={{ 
                          backgroundColor: '#e8ecf4',
                          boxShadow: 'inset 8px 8px 16px #bec8d7, inset -8px -8px 16px #ffffff',
                          color: '#374151'
                        }}
                        placeholder="contacto@evento.com"
                      />
                      {errors.contactEmail && (
                        <p className="text-red-500 text-sm mt-1">{errors.contactEmail.message}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                          Teléfono de Contacto
                        </label>
                        <input
                          {...register('contactPhone')}
                          className="w-full px-4 py-3 rounded-xl border-0 outline-0"
                          style={{ 
                            backgroundColor: '#e8ecf4',
                            boxShadow: 'inset 8px 8px 16px #bec8d7, inset -8px -8px 16px #ffffff',
                            color: '#374151'
                          }}
                          placeholder="+56912345678"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                          Sitio Web
                        </label>
                        <input
                          type="url"
                          {...register('contactWebsite')}
                          className="w-full px-4 py-3 rounded-xl border-0 outline-0"
                          style={{ 
                            backgroundColor: '#e8ecf4',
                            boxShadow: 'inset 8px 8px 16px #bec8d7, inset -8px -8px 16px #ffffff',
                            color: '#374151'
                          }}
                          placeholder="https://miempresa.com"
                        />
                        {errors.contactWebsite && (
                          <p className="text-red-500 text-sm mt-1">{errors.contactWebsite.message}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Botones de Acción */}
                <div className="border-t pt-6 flex flex-col sm:flex-row gap-4" style={{ borderColor: '#D1D5DB' }}>
                  <button
                    type="button"
                    onClick={() => reset()}
                    className="flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-300"
                    style={{ 
                      backgroundColor: '#e8ecf4',
                      color: '#6B7280',
                      boxShadow: '8px 8px 16px #bec8d7, -8px -8px 16px #ffffff'
                    }}
                  >
                    Limpiar Formulario
                  </button>
                  
                  <button
                    type="submit"
                    disabled={!isValid || isLoading}
                    className="flex-1 py-3 px-6 rounded-xl font-medium transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ 
                      background: isValid && !isLoading 
                        ? 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)'
                        : '#9CA3AF',
                      color: '#fff',
                      boxShadow: isValid && !isLoading 
                        ? '0 4px 15px rgba(239, 68, 68, 0.3)' 
                        : 'none'
                    }}
                  >
                    {isLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Creando...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        <span>Crear Evento</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>

            {/* Vista Previa */}
            {showPreview && (
              <div className="lg:sticky lg:top-8">
                <EventPreview 
                  data={watchedValues} 
                  image={selectedImage}
                />
              </div>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
};

// Componente de Vista Previa
interface EventPreviewProps {
  data: EventFormData;
  image?: string;
}

const EventPreview: React.FC<EventPreviewProps> = ({ data, image }) => {
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Fecha no especificada';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-CL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'campeonato': return '#EF4444';
      case 'taller': return '#3B82F6';
      case 'encuentro': return '#10B981';
      case 'competencia': return '#F59E0B';
      case 'masterclass': return '#8B5CF6';
      default: return '#6B7280';
    }
  };

  return (
    <div 
      className="rounded-3xl overflow-hidden"
      style={{ 
        backgroundColor: '#e8ecf4',
        boxShadow: '20px 20px 40px #bec8d7, -20px -20px 40px #ffffff'
      }}
    >
      <div className="p-6">
        <h3 className="text-xl font-bold mb-4" style={{ color: '#374151' }}>
          Vista Previa del Evento
        </h3>

        {/* Imagen */}
        <div className="relative mb-4">
          <img
            src={image || 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=500&h=300&fit=crop'}
            alt="Preview"
            className="w-full h-48 object-cover rounded-xl"
          />
          
          {data.type && (
            <div className="absolute top-4 left-4">
              <span 
                className="px-3 py-1 rounded-full text-white text-sm font-medium"
                style={{ backgroundColor: getEventTypeColor(data.type) }}
              >
                {data.type?.charAt(0)?.toUpperCase() + data.type?.slice(1) || 'Evento'}
              </span>
            </div>
          )}
        </div>

        {/* Contenido */}
        <div className="space-y-3">
          <h4 className="text-lg font-bold" style={{ color: '#374151' }}>
            {data.title || 'Título del evento'}
          </h4>

          {data.description && (
            <p className="text-sm" style={{ color: '#6B7280' }}>
              {data.description}
            </p>
          )}

          <div className="space-y-2 text-sm" style={{ color: '#6B7280' }}>
            {data.date && (
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(data.date)}</span>
                {data.time && <span>a las {data.time}</span>}
              </div>
            )}

            {data.location && (
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4" />
                <span>{data.location}</span>
              </div>
            )}

            {data.maxParticipants && (
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>Máximo {data.maxParticipants} participantes</span>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <DollarSign className="w-4 h-4" />
              <span>
                {data.price === 0 ? 'Gratuito' : `$${data.price?.toLocaleString('es-CL')}`}
              </span>
            </div>
          </div>

          {data.tags && (
            <div className="flex flex-wrap gap-2 mt-4">
              {data.tags.split(',').map((tag, index) => (
                <span 
                  key={index}
                  className="px-2 py-1 rounded-full text-xs"
                  style={{ 
                    backgroundColor: '#F3F4F6',
                    color: '#374151'
                  }}
                >
                  #{tag.trim()}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};