import { z } from 'zod';
import { jsonResponse, errorResponse } from '../../_middleware';
import { ensurePostulacionesSchema, AVAILABILITY_OPTIONS } from '../_utils/postulaciones';
import { REGIONES_CHILE } from '../../../../shared/index';

const AVAILABILITY_ENUM = z.enum(AVAILABILITY_OPTIONS);
const REGION_ENUM = z.enum([...REGIONES_CHILE] as [typeof REGIONES_CHILE[number], ...typeof REGIONES_CHILE]);

const applicationSchema = z
  .object({
    fullName: z.string().trim().min(3, 'El nombre es obligatorio'),
    email: z.string().trim().email('Email inválido'),
    phone: z.string().trim().min(8, 'Número de contacto requerido'),
    rut: z.string().trim().min(8).max(20).optional().or(z.literal('')).nullable(),
    birthdate: z.string().trim().optional().or(z.literal('')).nullable(),
    region: REGION_ENUM,
    city: z.string().trim().min(2, 'Ciudad requerida'),
    occupation: z.string().trim().max(120).optional().or(z.literal('')).nullable(),
    experienceLevel: z.string().trim().min(3),
    specialties: z.string().trim().max(300).optional().or(z.literal('')).nullable(),
    motivation: z.string().trim().min(40, 'Cuéntanos tu motivación (mínimo 40 caracteres)'),
    contribution: z.string().trim().min(40, 'Describe cómo aportarás a la comunidad'),
    availability: z.array(AVAILABILITY_ENUM).min(1, 'Selecciona al menos una forma de participación'),
    hasCompetitionExperience: z.boolean(),
    competitionDetails: z.string().trim().max(500).optional().or(z.literal('')).nullable(),
    instagram: z.string().trim().max(120).optional().or(z.literal('')).nullable(),
    otherNetworks: z.string().trim().max(200).optional().or(z.literal('')).nullable(),
    references: z.string().trim().max(500).optional().or(z.literal('')).nullable(),
    photoUrl: z.string().trim().url().optional().or(z.literal('')).nullable(),
  })
  .refine(
    (data) => {
      if (!data.hasCompetitionExperience) {
        return true;
      }
      return Boolean(data.competitionDetails && data.competitionDetails.trim().length >= 10);
    },
    {
      path: ['competitionDetails'],
      message: 'Cuéntanos brevemente tu experiencia competitiva.',
    },
  );

export const onRequestPost = async ({ request, env }) => {
  try {
    const rawBody = await request.json();
    const parseResult = applicationSchema.safeParse(rawBody);

    if (!parseResult.success) {
      const firstError = parseResult.error.errors[0];
      return errorResponse(firstError?.message || 'Datos inválidos en la postulación', 400);
    }

    const data = parseResult.data;
    await ensurePostulacionesSchema(env.DB);

    const email = data.email.toLowerCase();
    const phone = data.phone.replace(/\s+/g, '');

    const duplicate = await env.DB.prepare(
      `
      SELECT id, status 
      FROM postulaciones 
      WHERE email = ? 
      ORDER BY created_at DESC 
      LIMIT 1
    `,
    )
      .bind(email)
      .first();

    if (duplicate && duplicate.status !== 'rechazada') {
      return errorResponse(
        'Ya existe una postulación asociada a este correo. Nuestro equipo la revisará y te contactará.',
        409,
      );
    }

    const result = await env.DB.prepare(
      `
      INSERT INTO postulaciones (
        full_name,
        email,
        phone,
        rut,
        birthdate,
        region,
        city,
        occupation,
        experience_level,
        specialties,
        motivation,
        contribution,
        availability,
        has_competition_experience,
        competition_details,
        instagram,
        other_networks,
        references,
        photo_url,
        status,
        approvals_required,
        approvals_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pendiente', 2, 0)
    `,
    )
      .bind(
        data.fullName.trim(),
        email,
        phone,
        data.rut ? data.rut : null,
        data.birthdate && data.birthdate.length > 0 ? data.birthdate : null,
        data.region,
        data.city.trim(),
        data.occupation && data.occupation.length > 0 ? data.occupation : null,
        data.experienceLevel,
        data.specialties && data.specialties.length > 0 ? data.specialties : null,
        data.motivation.trim(),
        data.contribution.trim(),
        JSON.stringify(data.availability),
        data.hasCompetitionExperience ? 1 : 0,
        data.competitionDetails && data.competitionDetails.length > 0 ? data.competitionDetails : null,
        data.instagram && data.instagram.length > 0 ? data.instagram : null,
        data.otherNetworks && data.otherNetworks.length > 0 ? data.otherNetworks : null,
        data.references && data.references.length > 0 ? data.references : null,
        data.photoUrl && data.photoUrl.length > 0 ? data.photoUrl : null,
      )
      .run();

    if (!result.success) {
      console.error('[unete] Error inserting postulacion:', result.error);
      return errorResponse('No pudimos registrar tu postulación en este momento', 500);
    }

    const postulacionId = result.meta?.last_row_id;
    const record = await env.DB.prepare(
      `
      SELECT id, status, created_at 
      FROM postulaciones 
      WHERE id = ?
    `,
    )
      .bind(postulacionId)
      .first();

    return jsonResponse(
      {
        success: true,
        data: {
          id: record?.id ?? postulacionId,
          status: record?.status ?? 'pendiente',
          createdAt: record?.created_at ?? new Date().toISOString(),
        },
      },
      201,
    );
  } catch (error) {
    console.error('[unete] Error procesando postulación:', error);
    return errorResponse('Tuvimos un problema al procesar tu postulación', 500);
  }
};
