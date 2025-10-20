import React, { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { REGIONES_CHILE } from '@shared/index';
import {
  postulacionesService,
  AvailabilityOption,
  ExperienceLevel,
  JoinApplicationPayload,
} from '../../services/postulacionesService';
import { Check, Loader2, Sparkles, ClipboardCheck } from 'lucide-react';

const availabilityOptions: Array<{
  id: AvailabilityOption;
  label: string;
  description: string;
}> = [
  {
    id: 'eventos_publicos',
    label: 'Eventos públicos',
    description: 'Participar en activaciones y demostraciones abiertas al público.',
  },
  {
    id: 'talleres_formativos',
    label: 'Talleres formativos',
    description: 'Compartir conocimientos en clases y sesiones educativas.',
  },
  {
    id: 'competencias',
    label: 'Competencias',
    description: 'Representar a ACA en campeonatos y circuitos competitivos.',
  },
  {
    id: 'voluntariado_social',
    label: 'Voluntariado social',
    description: 'Apoyar iniciativas solidarias y colaborativas de la comunidad.',
  },
  {
    id: 'mentoria_miembros',
    label: 'Mentoría a miembros',
    description: 'Acompañar el desarrollo de nuevos socios y equipos.',
  },
];

const experienceLevels: Array<{ id: ExperienceLevel; label: string; description: string }> = [
  {
    id: 'principiante',
    label: 'Principiante',
    description: 'Recién estás comenzando y quieres aprender de la comunidad.',
  },
  {
    id: 'entusiasta',
    label: 'Entusiasta',
    description: 'Llevas tiempo practicando y buscas perfeccionar tu técnica.',
  },
  {
    id: 'experto',
    label: 'Experto',
    description: 'Posees una amplia experiencia y dominas diferentes estilos.',
  },
  {
    id: 'competitivo',
    label: 'Competitivo',
    description: 'Participas activamente en campeonatos y circuitos profesionales.',
  },
];

const rutRegex = /^(\d{1,2}\.?\d{3}\.?\d{3}-[\dkK])$/;
const phoneRegex = /^\+?\d{8,15}$/;

const joinApplicationSchema = z
  .object({
    fullName: z.string().min(3, 'Ingresa tu nombre completo'),
    email: z.string().email('Email inválido'),
    phone: z
      .string()
      .min(8, 'Ingresa un número de contacto válido')
      .regex(phoneRegex, 'Formato inválido. Ej: +56912345678'),
    rut: z
      .string()
      .regex(rutRegex, 'Formato RUT inválido. Ej: 12.345.678-9')
      .optional()
      .or(z.literal('')),
    birthdate: z.string().optional().or(z.literal('')),
    region: z.enum([...REGIONES_CHILE] as [typeof REGIONES_CHILE[number], ...typeof REGIONES_CHILE]),
    city: z.string().min(2, 'Ingresa tu ciudad de residencia'),
    occupation: z.string().max(120, 'Máximo 120 caracteres').optional().or(z.literal('')),
    experienceLevel: z.enum(['principiante', 'entusiasta', 'experto', 'competitivo']),
    specialties: z.string().max(300, 'Máximo 300 caracteres').optional().or(z.literal('')),
    motivation: z.string().min(40, 'Cuéntanos un poco más sobre tu motivación (mínimo 40 caracteres)'),
    contribution: z
      .string()
      .min(40, 'Describe cómo te gustaría aportar a la asociación (mínimo 40 caracteres)'),
    availability: z
      .array(
        z.enum([
          'eventos_publicos',
          'talleres_formativos',
          'competencias',
          'voluntariado_social',
          'mentoria_miembros',
        ]),
      )
      .min(1, 'Selecciona al menos una forma de participación'),
    hasCompetitionExperience: z.boolean(),
    competitionDetails: z
      .string()
      .max(500, 'Máximo 500 caracteres')
      .optional()
      .or(z.literal('')),
    instagram: z
      .string()
      .max(120, 'Máximo 120 caracteres')
      .optional()
      .or(z.literal('')),
    otherNetworks: z.string().max(200, 'Máximo 200 caracteres').optional().or(z.literal('')),
    references: z.string().max(500, 'Máximo 500 caracteres').optional().or(z.literal('')),
  })
  .refine(
    (data) => {
      if (!data.hasCompetitionExperience) return true;
      return !!data.competitionDetails && data.competitionDetails.trim().length >= 10;
    },
    {
      path: ['competitionDetails'],
      message: 'Cuéntanos brevemente tu experiencia competitiva.',
    },
  );

type JoinApplicationFormData = z.infer<typeof joinApplicationSchema>;

interface JoinApplicationFormProps {
  onSuccess?: () => void;
}

export const JoinApplicationForm: React.FC<JoinApplicationFormProps> = ({ onSuccess }) => {
  const [submissionState, setSubmissionState] = useState<
    { status: 'idle' } | { status: 'success'; id: number } | { status: 'error'; message: string }
  >({ status: 'idle' });

  const {
    handleSubmit,
    register,
    watch,
    setValue,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<JoinApplicationFormData>({
    resolver: zodResolver(joinApplicationSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      rut: '',
      birthdate: '',
      region: REGIONES_CHILE[6],
      city: '',
      occupation: '',
      experienceLevel: 'entusiasta',
      specialties: '',
      motivation: '',
      contribution: '',
      availability: [],
      hasCompetitionExperience: false,
      competitionDetails: '',
      instagram: '',
      otherNetworks: '',
      references: '',
    },
  });

  const availabilityWatch = watch('availability');
  const hasCompetitionExperience = watch('hasCompetitionExperience');

  const toggleAvailability = (option: AvailabilityOption) => {
    const current = new Set(availabilityWatch);
    if (current.has(option)) {
      current.delete(option);
    } else {
      current.add(option);
    }
    setValue('availability', Array.from(current), { shouldValidate: true });
  };

  const experienceLabel = useMemo(() => {
    return experienceLevels.find((item) => item.id === watch('experienceLevel'))?.label ?? '';
  }, [watch('experienceLevel')]);

  const onSubmit = async (data: JoinApplicationFormData) => {
    setSubmissionState({ status: 'idle' });

    const payload: JoinApplicationPayload = {
      fullName: data.fullName.trim(),
      email: data.email.trim().toLowerCase(),
      phone: data.phone.trim(),
      rut: data.rut?.trim() || null,
      birthdate: data.birthdate || null,
      region: data.region,
      city: data.city.trim(),
      occupation: data.occupation?.trim() || null,
      experienceLevel: data.experienceLevel,
      specialties: data.specialties?.trim() || null,
      motivation: data.motivation.trim(),
      contribution: data.contribution.trim(),
      availability: data.availability,
      hasCompetitionExperience: data.hasCompetitionExperience,
      competitionDetails: data.competitionDetails?.trim() || null,
      instagram: data.instagram?.trim() || null,
      otherNetworks: data.otherNetworks?.trim() || null,
      references: data.references?.trim() || null,
    };

    const result = await postulacionesService.submitApplication(payload);

    if (result.success && result.data) {
      setSubmissionState({ status: 'success', id: result.data.id });
      reset();
      onSuccess?.();
    } else {
      setSubmissionState({
        status: 'error',
        message: result.error || 'Ocurrió un error al enviar tu postulación.',
      });
    }
  };

  return (
    <div className="relative mx-auto w-full max-w-4xl">
      <div className="absolute inset-x-8 inset-y-0 -z-10 blur-3xl bg-gradient-to-br from-primary-500/10 via-orange-400/10 to-primary-500/5" />
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="relative overflow-hidden rounded-3xl border border-primary-100 bg-white/90 shadow-soft-xl backdrop-blur"
      >
        <div className="border-b border-primary-100 bg-primary-50/70 px-8 py-10 sm:px-12">
          <div className="flex items-start gap-4">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-500 text-white shadow-lg shadow-primary-500/40">
              <Sparkles className="h-7 w-7" />
            </span>
            <div>
              <h1 className="text-3xl font-semibold text-neutral-900">Postulación a ACA Chile</h1>
              <p className="mt-2 max-w-3xl text-neutral-600">
                Completa este formulario para iniciar tu proceso de incorporación. Necesitaremos la
                aprobación de dos miembros del directorio para activar tu membresía como socio oficial.
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-10 sm:px-12 space-y-10">
          <section className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-neutral-900">Datos personales</h2>
              <p className="text-sm text-neutral-500">
                Información básica para contactar y registrar tu postulación.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-neutral-700">Nombre completo *</label>
                <input
                  type="text"
                  placeholder="Nombre y apellidos"
                  {...register('fullName')}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white/50 px-4 py-3 text-sm text-neutral-900 transition focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                />
                {errors.fullName && (
                  <p className="mt-2 text-sm text-primary-600">{errors.fullName.message}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-700">Correo electrónico *</label>
                <input
                  type="email"
                  placeholder="tu-email@ejemplo.com"
                  {...register('email')}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white/50 px-4 py-3 text-sm text-neutral-900 transition focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                />
                {errors.email && <p className="mt-2 text-sm text-primary-600">{errors.email.message}</p>}
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-700">Teléfono de contacto *</label>
                <input
                  type="tel"
                  placeholder="+56912345678"
                  {...register('phone')}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white/50 px-4 py-3 text-sm text-neutral-900 transition focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                />
                {errors.phone && <p className="mt-2 text-sm text-primary-600">{errors.phone.message}</p>}
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-700">RUT</label>
                <input
                  type="text"
                  placeholder="12.345.678-9"
                  {...register('rut')}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white/50 px-4 py-3 text-sm text-neutral-900 transition focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                />
                {errors.rut && <p className="mt-2 text-sm text-primary-600">{errors.rut.message}</p>}
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-700">Fecha de nacimiento</label>
                <input
                  type="date"
                  {...register('birthdate')}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white/50 px-4 py-3 text-sm text-neutral-900 transition focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                />
                {errors.birthdate && (
                  <p className="mt-2 text-sm text-primary-600">{errors.birthdate.message}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-700">Ocupación</label>
                <input
                  type="text"
                  placeholder="¿A qué te dedicas?"
                  {...register('occupation')}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white/50 px-4 py-3 text-sm text-neutral-900 transition focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                />
                {errors.occupation && (
                  <p className="mt-2 text-sm text-primary-600">{errors.occupation.message}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-700">Región *</label>
                <select
                  {...register('region')}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white/50 px-4 py-3 text-sm text-neutral-900 transition focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                >
                  {REGIONES_CHILE.map((region) => (
                    <option key={region} value={region}>
                      {region}
                    </option>
                  ))}
                </select>
                {errors.region && <p className="mt-2 text-sm text-primary-600">{errors.region.message}</p>}
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-700">Ciudad *</label>
                <input
                  type="text"
                  placeholder="Ciudad o comuna"
                  {...register('city')}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white/50 px-4 py-3 text-sm text-neutral-900 transition focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                />
                {errors.city && <p className="mt-2 text-sm text-primary-600">{errors.city.message}</p>}
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-neutral-900">Tu experiencia</h2>
              <p className="text-sm text-neutral-500">
                Queremos conocerte mejor para acompañarte en el proceso.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <label className="text-sm font-medium text-neutral-700">Nivel de experiencia *</label>
                <div className="space-y-3">
                  {experienceLevels.map((option) => (
                    <label
                      key={option.id}
                      className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 transition ${
                        watch('experienceLevel') === option.id
                          ? 'border-primary-400 bg-primary-50/60'
                          : 'border-slate-200 bg-white/50 hover:border-primary-200'
                      }`}
                    >
                      <input
                        type="radio"
                        value={option.id}
                        {...register('experienceLevel')}
                        className="mt-1"
                      />
                      <span>
                        <span className="block font-semibold text-neutral-900">{option.label}</span>
                        <span className="text-sm text-neutral-500">{option.description}</span>
                      </span>
                    </label>
                  ))}
                </div>
                {errors.experienceLevel && (
                  <p className="text-sm text-primary-600">{errors.experienceLevel.message}</p>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-neutral-700">
                    Especialidades o estilos favoritos
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Parrilla argentina, ahumados, cocina al palo, etc."
                    {...register('specialties')}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white/50 px-4 py-3 text-sm text-neutral-900 transition focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                  />
                  {errors.specialties && (
                    <p className="mt-2 text-sm text-primary-600">{errors.specialties.message}</p>
                  )}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white/50 px-4 py-4">
                  <div className="flex items-start gap-3">
                    <ClipboardCheck className="mt-1 h-5 w-5 text-primary-500" />
                    <div>
                      <p className="text-sm font-semibold text-neutral-800">
                        Nivel seleccionado: {experienceLabel}
                      </p>
                      <p className="mt-1 text-xs text-neutral-500">
                        Usaremos esta información para asignarte actividades acordes a tu perfil.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-neutral-700">
                  ¿Qué te motiva a unirte a ACA Chile? *
                </label>
                <textarea
                  rows={5}
                  placeholder="Comparte tus motivaciones, expectativas y qué significa la cultura del asado para ti."
                  {...register('motivation')}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white/50 px-4 py-3 text-sm text-neutral-900 transition focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                />
                {errors.motivation && (
                  <p className="mt-2 text-sm text-primary-600">{errors.motivation.message}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-700">
                  ¿Cómo te gustaría aportar a la comunidad? *
                </label>
                <textarea
                  rows={5}
                  placeholder="Cuéntanos cómo imaginas tu participación y qué habilidades aportarías."
                  {...register('contribution')}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white/50 px-4 py-3 text-sm text-neutral-900 transition focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                />
                {errors.contribution && (
                  <p className="mt-2 text-sm text-primary-600">{errors.contribution.message}</p>
                )}
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-neutral-900">Disponibilidad y redes</h2>
              <p className="text-sm text-neutral-500">
                Define dónde te gustaría participar y comparte enlaces relevantes.
              </p>
            </div>

            <div className="space-y-4">
              <label className="text-sm font-medium text-neutral-700">
                ¿En qué iniciativas te gustaría participar? *
              </label>
              <div className="grid gap-4 lg:grid-cols-2">
                {availabilityOptions.map((option) => {
                  const active = availabilityWatch?.includes(option.id);
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => toggleAvailability(option.id)}
                      className={`flex h-full w-full items-start gap-3 rounded-2xl border px-4 py-4 text-left transition ${
                        active
                          ? 'border-primary-400 bg-primary-50/60 shadow-soft-lg'
                          : 'border-slate-200 bg-white/50 hover:border-primary-200'
                      }`}
                    >
                      <span
                        className={`mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full border ${
                          active
                            ? 'border-primary-500 bg-primary-500 text-white'
                            : 'border-slate-300 bg-white text-transparent'
                        }`}
                      >
                        <Check className="h-3 w-3" />
                      </span>
                      <span>
                        <span className="block font-semibold text-neutral-900">{option.label}</span>
                        <span className="text-sm text-neutral-500">{option.description}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
              {errors.availability && (
                <p className="text-sm text-primary-600">{errors.availability.message}</p>
              )}
            </div>

            <div className="space-y-4 rounded-2xl border border-slate-200 bg-white/50 px-4 py-5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-neutral-700">
                  ¿Tienes experiencia en competencias profesionales?
                </label>
                <button
                  type="button"
                  onClick={() => setValue('hasCompetitionExperience', !hasCompetitionExperience)}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                    hasCompetitionExperience
                      ? 'bg-primary-500 text-white'
                      : 'bg-slate-100 text-neutral-600'
                  }`}
                >
                  {hasCompetitionExperience ? 'Sí' : 'No'}
                </button>
              </div>
              {hasCompetitionExperience ? (
                <div>
                  <textarea
                    rows={4}
                    placeholder="Cuéntanos qué campeonatos has disputado, logros o equipos con los que has trabajado."
                    {...register('competitionDetails')}
                    className="mt-3 w-full rounded-2xl border border-slate-200 bg-white/70 px-4 py-3 text-sm text-neutral-900 transition focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                  />
                  {errors.competitionDetails && (
                    <p className="mt-2 text-sm text-primary-600">{errors.competitionDetails.message}</p>
                  )}
                </div>
              ) : null}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-neutral-700">Instagram</label>
                <input
                  type="text"
                  placeholder="@usuario"
                  {...register('instagram')}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white/50 px-4 py-3 text-sm text-neutral-900 transition focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                />
                {errors.instagram && (
                  <p className="mt-2 text-sm text-primary-600">{errors.instagram.message}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-700">Otras redes</label>
                <input
                  type="text"
                  placeholder="Facebook, TikTok, YouTube, etc."
                  {...register('otherNetworks')}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white/50 px-4 py-3 text-sm text-neutral-900 transition focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                />
                {errors.otherNetworks && (
                  <p className="mt-2 text-sm text-primary-600">{errors.otherNetworks.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-neutral-700">
                Referencias o recomendaciones
              </label>
              <textarea
                rows={4}
                placeholder="Puedes incluir contactos dentro de ACA u otras referencias relevantes."
                {...register('references')}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white/50 px-4 py-3 text-sm text-neutral-900 transition focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
              />
              {errors.references && (
                <p className="mt-2 text-sm text-primary-600">{errors.references.message}</p>
              )}
            </div>
          </section>
        </div>

        <div className="border-t border-primary-100 bg-primary-50/60 px-6 py-6 sm:px-12">
          {submissionState.status === 'error' ? (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {submissionState.message}
            </div>
          ) : null}
          {submissionState.status === 'success' ? (
            <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-700">
              <Check className="h-5 w-5" />
              <span>
                ¡Gracias por tu postulación! Nuestro directorio revisará tu solicitud y te
                contactaremos cuando obtengas las dos aprobaciones necesarias.
              </span>
            </div>
          ) : null}
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <p className="text-sm text-neutral-500">
              Al enviar este formulario autorizas a ACA Chile a contactarte y gestionar tu postulación.
            </p>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-primary-200/70 transition hover:from-primary-600 hover:to-primary-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Enviando postulación...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  Enviar postulación
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
