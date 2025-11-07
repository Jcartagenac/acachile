import React, { useMemo, useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useParams } from 'react-router-dom';
import { useEvents } from '../contexts/EventContext';
import { useAuth } from '../contexts/AuthContext';
import { Evento } from '@shared/index';
import {
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Upload,
  Eye,
  Save,
  ArrowLeft,
  Loader2
} from 'lucide-react';

const eventSchema = z
  .object({
    title: z
      .string()
      .min(5, 'El título debe tener al menos 5 caracteres')
      .max(100, 'El título no puede exceder 100 caracteres'),
    description: z
      .string()
      .min(20, 'La descripción debe tener al menos 20 caracteres')
      .max(1000, 'La descripción no puede exceder 1000 caracteres'),
    date: z
      .string()
      .min(1, 'La fecha es requerida'),
    endDate: z.string().optional(),
    time: z.string().min(1, 'La hora es requerida'),
    location: z
      .string()
      .min(5, 'La ubicación debe tener al menos 5 caracteres')
      .max(100, 'La ubicación no puede exceder 100 caracteres'),
    type: z.enum(['campeonato', 'taller', 'encuentro', 'competencia', 'masterclass'], {
      errorMap: () => ({ message: 'Selecciona un tipo de evento válido' })
    }),
    maxParticipants: z
      .number()
      .min(1, 'Debe permitir al menos 1 participante')
      .max(1000, 'No puede exceder 1000 participantes')
      .optional(),
    price: z
      .number()
      .min(0, 'El precio no puede ser negativo')
      .max(1_000_000, 'El precio es demasiado alto'),
    registrationOpen: z.boolean(),
    isPublic: z.boolean().optional(),
    paymentLink: z
      .string()
      .url('Debe ser una URL válida')
      .optional()
      .or(z.literal('')),
    requirements: z.string().optional(),
    tags: z.string().optional(),
    contactEmail: z
      .string()
      .email('Debe ser un email válido')
      .optional()
      .or(z.literal('')),
    contactPhone: z.string().optional(),
    contactWebsite: z
      .string()
      .url('Debe ser una URL válida')
      .optional()
      .or(z.literal(''))
  })
  .superRefine((data, ctx) => {
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

export const EditEventPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { updateEvento, isLoading } = useEvents();
  const [showPreview, setShowPreview] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [evento, setEvento] = useState<Evento | null>(null);
  const [loadingEvento, setLoadingEvento] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
    reset,
    setValue
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    mode: 'onChange',
    defaultValues: {
      price: 0,
      registrationOpen: true,
      isPublic: true
    }
  });

  const watchedValues = watch();

  // Definir heroStats antes de los returns condicionales (regla de hooks)
  const heroStats = useMemo(
    () => [
      { icon: <Calendar className="w-4 h-4" />, label: 'Fecha inicio', value: watchedValues.date || '—' },
      {
        icon: <Users className="w-4 h-4" />,
        label: 'Cupos máximos',
        value: watchedValues.maxParticipants ? watchedValues.maxParticipants : 'Ilimitado'
      },
      {
        icon: <DollarSign className="w-4 h-4" />,
        label: 'Precio',
        value: watchedValues.price ? `$${watchedValues.price}` : 'Gratis'
      },
      {
        icon: <MapPin className="w-4 h-4" />,
        label: 'Ubicación',
        value: watchedValues.location || 'Por definir'
      }
    ],
    [watchedValues]
  );

  // Cargar datos del evento
  useEffect(() => {
    const loadEvento = async () => {
      if (!id) {
        setError('ID de evento no encontrado');
        setLoadingEvento(false);
        return;
      }

      try {
        const response = await fetch(`/api/eventos/${id}`);
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Error al cargar evento');
        }

        const eventoData = data.data;
        setEvento(eventoData);
        setSelectedImage(eventoData.image || '');

        // Llenar el formulario con los datos existentes
        setValue('title', eventoData.title);
        setValue('description', eventoData.description);
        setValue('date', eventoData.date?.split('T')[0] || eventoData.date);
        setValue('time', eventoData.time || '');
        setValue('location', eventoData.location);
        setValue('type', eventoData.type);
        setValue('maxParticipants', eventoData.maxParticipants || undefined);
        setValue('price', eventoData.price || 0);
        setValue('registrationOpen', eventoData.registrationOpen);
        setValue('isPublic', eventoData.isPublic ?? true);
        setValue('paymentLink', eventoData.paymentLink || '');
        
        if (eventoData.requirements && Array.isArray(eventoData.requirements)) {
          setValue('requirements', eventoData.requirements.join('\n'));
        }
        
        if (eventoData.tags && Array.isArray(eventoData.tags)) {
          setValue('tags', eventoData.tags.join(', '));
        }

        if (eventoData.contactInfo) {
          setValue('contactEmail', eventoData.contactInfo.email || '');
          setValue('contactPhone', eventoData.contactInfo.phone || '');
          setValue('contactWebsite', eventoData.contactInfo.website || '');
        }

        setLoadingEvento(false);
      } catch (err) {
        console.error('Error loading evento:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar evento');
        setLoadingEvento(false);
      }
    };

    loadEvento();
  }, [id, setValue]);

  // Verificar permisos
  useEffect(() => {
    if (!user) {
      navigate('/auth');
    } else if (evento && evento.organizerId !== user.id && user.role !== 'admin') {
      navigate('/eventos');
    }
  }, [user, evento, navigate]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('La imagen no puede superar 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => setSelectedImage(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const onSubmit = async (data: EventFormData) => {
    if (!user || !id) return;
    
    try {
      const requirements = data.requirements
        ? data.requirements.split('\n').map((item) => item.trim()).filter(Boolean)
        : [];
      const tags = data.tags
        ? data.tags.split(',').map((item) => item.trim()).filter(Boolean)
        : [];

      const contactInfo: { email?: string; phone?: string; website?: string } = {};
      if (data.contactEmail?.trim()) contactInfo.email = data.contactEmail.trim();
      if (data.contactPhone?.trim()) contactInfo.phone = data.contactPhone.trim();
      if (data.contactWebsite?.trim()) contactInfo.website = data.contactWebsite.trim();

      await updateEvento(parseInt(id), {
        title: data.title,
        description: data.description,
        date: data.date,
        time: data.time,
        location: data.location,
        type: data.type,
        maxParticipants: data.maxParticipants,
        price: data.price,
        registrationOpen: data.registrationOpen,
        isPublic: data.isPublic,
        paymentLink: data.paymentLink?.trim() || undefined,
        image: selectedImage || evento?.image,
        requirements,
        tags,
        contactInfo: Object.keys(contactInfo).length > 0 ? contactInfo : undefined
      });

      navigate(`/eventos/${id}`);
    } catch (error) {
      console.error('Error al actualizar evento:', error);
      alert('Error al actualizar el evento');
    }
  };

  if (loadingEvento) {
    return (
      <div className="min-h-screen bg-soft-gradient-light flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary-500 mx-auto mb-4" />
          <p className="text-neutral-600">Cargando evento...</p>
        </div>
      </div>
    );
  }

  if (error || !evento) {
    return (
      <div className="min-h-screen bg-soft-gradient-light flex items-center justify-center">
        <div className="rounded-3xl bg-white/70 backdrop-blur-md border border-white/60 shadow-soft-xl px-10 py-12 text-center">
          <h2 className="text-2xl font-semibold text-neutral-900 mb-3">Error</h2>
          <p className="text-neutral-600 mb-6">{error || 'Evento no encontrado'}</p>
          <button
            onClick={() => navigate('/eventos')}
            className="px-6 py-3 bg-primary-500 text-white rounded-2xl hover:bg-primary-600 transition"
          >
            Volver a eventos
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-soft-gradient-light flex items-center justify-center">
        <div className="rounded-3xl bg-white/70 backdrop-blur-md border border-white/60 shadow-soft-xl px-10 py-12 text-center">
          <h2 className="text-2xl font-semibold text-neutral-900 mb-3">Acceso requerido</h2>
          <p className="text-neutral-600">Debes iniciar sesión para editar eventos.</p>
        </div>
      </div>
    );
  }

  const inputClass =
    'w-full px-4 py-3 rounded-2xl bg-white/80 border border-white/40 text-neutral-800 shadow-soft-sm focus:outline-none focus:ring-2 focus:ring-primary-400 transition';
  const labelClass = 'block text-sm font-medium text-neutral-500 mb-2';

  return (
    <div className="min-h-screen bg-soft-gradient-light relative overflow-hidden py-12">
      <div className="absolute inset-y-0 left-0 w-72 bg-primary-500/10 blur-3xl" />
      <div className="absolute right-10 top-10 w-80 h-80 bg-pastel-blue/20 rounded-full blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/eventos/${id}`)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/70 border border-white/60 text-neutral-600 shadow-soft-sm hover:shadow-soft-xl transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver
            </button>
            <div>
              <h1 className="text-3xl font-bold text-neutral-900">Editar evento</h1>
              <p className="text-sm text-neutral-500">Actualiza la información de tu evento</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowPreview((value) => !value)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-semibold transition ${
              showPreview
                ? 'bg-primary-500 text-white shadow-soft-colored-red'
                : 'bg-white/70 text-neutral-600 border border-white/60'
            }`}
          >
            <Eye className="w-4 h-4" />
            {showPreview ? 'Ocultar vista previa' : 'Vista previa'}
          </button>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] items-start">
          <div className="rounded-3xl bg-white/70 backdrop-blur-md border border-white/60 shadow-soft-xl px-6 sm:px-8 py-8 space-y-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-primary-500/10 text-primary-600">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-neutral-900">Información básica</h3>
                    <p className="text-sm text-neutral-500">Completa los datos principales del evento</p>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Título del evento *</label>
                  <input
                    {...register('title')}
                    className={inputClass}
                    placeholder="Ej: Campeonato Nacional de Asadores 2025"
                  />
                  {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
                </div>
                <div>
                  <label className={labelClass}>Descripción *</label>
                  <textarea
                    {...register('description')}
                    rows={4}
                    className={`${inputClass} resize-none`}
                    placeholder="Describe tu evento, objetivos y actividades destacadas"
                  />
                  {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className={labelClass}>Tipo de evento *</label>
                    <select {...register('type')} className={inputClass}>
                      <option value="">Selecciona un tipo</option>
                      <option value="campeonato">Campeonato</option>
                      <option value="taller">Taller</option>
                      <option value="encuentro">Encuentro</option>
                      <option value="competencia">Competencia</option>
                      <option value="masterclass">Masterclass</option>
                    </select>
                    {errors.type && <p className="text-red-500 text-sm mt-1">{errors.type.message}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Ubicación *</label>
                    <input {...register('location')} className={inputClass} placeholder="Ej: Sporting Club, Viña del Mar" />
                    {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location.message}</p>}
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className={labelClass}>Fecha de inicio *</label>
                    <input
                      type="date"
                      {...register('date')}
                      className={inputClass}
                    />
                    {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date.message}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Fecha de fin (opcional)</label>
                    <input
                      type="date"
                      {...register('endDate')}
                      className={inputClass}
                    />
                    {errors.endDate && <p className="text-red-500 text-sm mt-1">{errors.endDate.message}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Hora *</label>
                    <input type="time" {...register('time')} className={inputClass} />
                    {errors.time && <p className="text-red-500 text-sm mt-1">{errors.time.message}</p>}
                  </div>
                </div>
              </div>

              <div className="border-t border-white/60 pt-6 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-primary-500/10 text-primary-600">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-neutral-900">Configuración del evento</h3>
                    <p className="text-sm text-neutral-500">Define cupos, precio e inscripción</p>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className={labelClass}>Cupos máximos</label>
                    <input
                      type="number"
                      {...register('maxParticipants', { valueAsNumber: true })}
                      className={inputClass}
                      placeholder="Ej: 80"
                    />
                    {errors.maxParticipants && <p className="text-red-500 text-sm mt-1">{errors.maxParticipants.message}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Precio CLP *</label>
                    <input
                      type="number"
                      {...register('price', { valueAsNumber: true })}
                      className={inputClass}
                      placeholder="Ej: 20000"
                    />
                    {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price.message}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-white/70 border border-white/60 rounded-2xl px-4 py-3">
                  <input
                    type="checkbox"
                    {...register('registrationOpen')}
                    id="registration-open"
                    className="h-4 w-4 text-primary-500 rounded border-neutral-300"
                  />
                  <label htmlFor="registration-open" className="text-sm text-neutral-600">
                    Permitir inscripciones en línea para este evento
                  </label>
                </div>

                <div className="flex items-center gap-3 bg-white/70 border border-white/60 rounded-2xl px-4 py-3">
                  <input
                    type="checkbox"
                    {...register('isPublic')}
                    id="is-public"
                    className="h-4 w-4 text-primary-500 rounded border-neutral-300"
                  />
                  <label htmlFor="is-public" className="text-sm text-neutral-600">
                    Evento público (permite inscripción sin autenticación)
                  </label>
                </div>

                <div>
                  <label className={labelClass}>Enlace de Pago/Entradas (opcional)</label>
                  <input
                    {...register('paymentLink')}
                    className={inputClass}
                    placeholder="https://ejemplo.com/pagar"
                  />
                  {errors.paymentLink && (
                    <p className="text-red-500 text-sm mt-1">{errors.paymentLink.message}</p>
                  )}
                  <p className="text-xs text-neutral-500 mt-1">
                    URL para completar pago o generar entradas después de la inscripción
                  </p>
                </div>
              </div>

              <div className="border-t border-white/60 pt-6 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-primary-500/10 text-primary-600">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-neutral-900">Material adicional</h3>
                    <p className="text-sm text-neutral-500">Define imagen de portada, tags y requisitos</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="event-image" />
                  <label
                    htmlFor="event-image"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-primary-500 text-white text-sm font-semibold shadow-soft-sm cursor-pointer hover:bg-primary-600 transition"
                  >
                    <Upload className="w-4 h-4" />
                    Cambiar imagen
                  </label>
                  <span className="text-xs text-neutral-500">PNG o JPG hasta 5MB</span>
                </div>
                {selectedImage && (
                  <div className="relative w-full h-48 rounded-2xl overflow-hidden">
                    <img src={selectedImage} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
                <div>
                  <label className={labelClass}>Requisitos (uno por línea)</label>
                  <textarea
                    {...register('requirements')}
                    rows={3}
                    className={`${inputClass} resize-none`}
                    placeholder={'Ej:\nDelantal obligatorio\nTraer propio set de cuchillos'}
                  />
                </div>
                <div>
                  <label className={labelClass}>Tags (separados por coma)</label>
                  <input {...register('tags')} className={inputClass} placeholder="parrilla, campeonato, costillar" />
                </div>
              </div>

              <div className="border-t border-white/60 pt-6 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-primary-500/10 text-primary-600">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-neutral-900">Información de contacto</h3>
                    <p className="text-sm text-neutral-500">Opcional para consultas directas</p>
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className={labelClass}>Correo electrónico</label>
                    <input {...register('contactEmail')} className={inputClass} placeholder="contacto@acachile.cl" />
                    {errors.contactEmail && <p className="text-red-500 text-sm mt-1">{errors.contactEmail.message}</p>}
                  </div>
                  <div>
                    <label className={labelClass}>Teléfono (opcional)</label>
                    <input {...register('contactPhone')} className={inputClass} placeholder="+56 9 1234 5678" />
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelClass}>Sitio web / Link de registro</label>
                    <input {...register('contactWebsite')} className={inputClass} placeholder="https://" />
                    {errors.contactWebsite && <p className="text-red-500 text-sm mt-1">{errors.contactWebsite.message}</p>}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={!isValid || isLoading}
                  className={`inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-white font-semibold transition shadow-soft-colored-red ${
                    isValid && !isLoading ? 'bg-primary-500 hover:bg-primary-600' : 'bg-neutral-400 cursor-not-allowed'
                  }`}
                >
                  <Save className="w-4 h-4" />
                  {isLoading ? 'Guardando…' : 'Guardar cambios'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/eventos/${id}`)}
                  className="px-5 py-3 rounded-2xl border border-white/60 bg-white/70 text-neutral-600 font-semibold shadow-soft-sm hover:shadow-soft-xl transition"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl bg-white/70 backdrop-blur-md border border-white/60 shadow-soft-xl p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-neutral-900">Resumen del evento</h3>
                <span className="text-xs text-neutral-500 uppercase">Vista previa</span>
              </div>
              <div className="space-y-3">
                {heroStats.map((item) => (
                  <div key={item.label} className="flex items-center gap-3 rounded-2xl bg-white/80 border border-white/60 px-4 py-3">
                    <span className="text-primary-500">{item.icon}</span>
                    <div>
                      <p className="text-xs uppercase text-neutral-400">{item.label}</p>
                      <p className="text-sm font-semibold text-neutral-800">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl bg-neutral-900 text-neutral-100 p-5">
                <p className="text-xs uppercase text-neutral-400 mb-2">Nombre</p>
                <p className="text-lg font-semibold mb-3">{watchedValues.title || 'Evento ACA'}</p>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  {watchedValues.description || 'Describe aquí tu evento para motivar a la comunidad.'}
                </p>
              </div>
            </div>

            {(showPreview || selectedImage) && (
              <div className="rounded-3xl bg-white/70 backdrop-blur-md border border-white/60 shadow-soft-xl overflow-hidden">
                <div className="relative h-48 bg-neutral-200">
                  <img
                    src={
                      selectedImage ||
                      'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=1000&q=80'
                    }
                    alt="preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  <div className="absolute bottom-4 left-4 text-white">
                    <p className="text-xs uppercase tracking-wide text-white/80">Avance visual</p>
                    <h4 className="text-lg font-semibold">{watchedValues.title || 'Evento'}</h4>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-3 text-neutral-600 text-sm">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {watchedValues.date
                        ? new Date(watchedValues.date).toLocaleDateString('es-CL', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })
                        : 'Define una fecha para tu evento'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-neutral-600 text-sm">
                    <MapPin className="w-4 h-4" />
                    <span>{watchedValues.location || 'Agrega una ubicación'}</span>
                  </div>
                  <p className="text-neutral-500 text-sm leading-relaxed">
                    {watchedValues.description || 'Incluye una descripción atractiva para motivar la participación.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditEventPage;
