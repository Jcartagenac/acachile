import type { PagesFunction, Env } from '../../types';
import { jsonResponse, errorResponse, requireAdmin, authErrorResponse } from './_middleware';
import { hashPassword } from '../../utils/password';

interface ResetSociosPasswordsRequest {
  dryRun?: boolean;
  includeInactive?: boolean;
  onlyRuts?: string[];
  excludeRuts?: string[];
}

interface SocioPasswordRow {
  id: number;
  email: string | null;
  nombre: string | null;
  apellido: string | null;
  rut: string | null;
  role: string | null;
  activo: number;
}

interface ResetCandidate {
  id: number;
  rut: string | null;
  email: string | null;
  nombreCompleto: string;
  role: string | null;
  activo: number;
  initialPassword: string;
}

interface SkippedUser {
  id: number;
  rut: string | null;
  email: string | null;
  nombreCompleto?: string;
  motivo: string;
}

const PROTECTED_ADMIN_EMAILS = new Set([
  'jcartagenac@gmail.com',
  'pauliina.v@gmail.com',
]);

const PROTECTED_ADMIN_NAMES = new Set([
  'juan cartagena',
  'paulina sandoval',
]);

function normalizeEmail(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function normalizeName(nombre: unknown, apellido: unknown): string {
  return `${typeof nombre === 'string' ? nombre.trim() : ''} ${typeof apellido === 'string' ? apellido.trim() : ''}`
    .trim()
    .toLowerCase();
}

function rutDigits(value: unknown): string {
  return typeof value === 'string' ? value.replace(/\D/g, '') : '';
}

function deriveInitialPasswordFromRut(rut: unknown): string | null {
  const digits = rutDigits(rut);
  return digits.length >= 6 ? digits.slice(0, 6) : null;
}

function isProtectedAdmin(user: SocioPasswordRow): boolean {
  const email = normalizeEmail(user.email);
  const fullName = normalizeName(user.nombre, user.apellido);
  const role = typeof user.role === 'string' ? user.role.trim().toLowerCase() : '';

  return role === 'admin' || PROTECTED_ADMIN_EMAILS.has(email) || PROTECTED_ADMIN_NAMES.has(fullName);
}

function buildFullName(user: SocioPasswordRow): string {
  return `${user.nombre || ''} ${user.apellido || ''}`.trim();
}

function buildSkippedUser(user: SocioPasswordRow, motivo: string, includeFullName: boolean = false): SkippedUser {
  return {
    id: user.id,
    rut: user.rut,
    email: user.email,
    ...(includeFullName ? { nombreCompleto: buildFullName(user) } : {}),
    motivo,
  };
}

function buildCandidate(user: SocioPasswordRow, initialPassword: string): ResetCandidate {
  return {
    id: user.id,
    rut: user.rut,
    email: user.email,
    nombreCompleto: buildFullName(user),
    role: user.role,
    activo: user.activo,
    initialPassword,
  };
}

function normalizeRutFilter(values?: string[]): Set<string> {
  return new Set((values || []).map(rutDigits).filter(Boolean));
}

function classifyUser(
  user: SocioPasswordRow,
  onlyRutKeys: Set<string>,
  excludeRutKeys: Set<string>,
): { candidate?: ResetCandidate; skipped?: SkippedUser } {
  const rutKey = rutDigits(user.rut);

  if (onlyRutKeys.size > 0 && !onlyRutKeys.has(rutKey)) {
    return {};
  }

  if (excludeRutKeys.has(rutKey)) {
    return { skipped: buildSkippedUser(user, 'RUT excluido explícitamente') };
  }

  if (isProtectedAdmin(user)) {
    return { skipped: buildSkippedUser(user, 'Administrador protegido', true) };
  }

  const initialPassword = deriveInitialPasswordFromRut(user.rut);
  if (!initialPassword) {
    return { skipped: buildSkippedUser(user, 'RUT sin suficientes dígitos para generar contraseña inicial') };
  }

  return { candidate: buildCandidate(user, initialPassword) };
}

function serializeCandidates(candidates: ResetCandidate[]) {
  return candidates.map(({ initialPassword, ...user }) => ({
    ...user,
    passwordPreview: initialPassword,
  }));
}

async function applyPasswordUpdates(env: Env, candidates: ResetCandidate[]) {
  const statement = env.DB.prepare(`
    UPDATE usuarios
    SET password_hash = ?, updated_at = datetime('now')
    WHERE id = ?
  `);

  const updates = await Promise.all(
    candidates.map(async (candidate) => {
      const passwordHash = await hashPassword(candidate.initialPassword);
      return statement.bind(passwordHash, candidate.id);
    })
  );

  if (updates.length > 0) {
    await env.DB.batch(updates);
  }
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  try {
    try {
      await requireAdmin(request, env);
    } catch (error) {
      return authErrorResponse(error, env);
    }

    if (!env.DB) {
      return errorResponse('Database not available', 500);
    }

    const body = await request.json().catch(() => ({})) as ResetSociosPasswordsRequest;
    const dryRun = body.dryRun !== false;
    const includeInactive = body.includeInactive === true;
    const onlyRutKeys = normalizeRutFilter(body.onlyRuts);
    const excludeRutKeys = normalizeRutFilter(body.excludeRuts);

    const query = `
      SELECT id, email, nombre, apellido, rut, role, activo
      FROM usuarios
      WHERE rut IS NOT NULL
        AND TRIM(rut) != ''
        ${includeInactive ? '' : 'AND activo = 1'}
      ORDER BY id ASC
    `;

    const result = await env.DB.prepare(query).all();
    const users = (Array.isArray(result.results) ? result.results : []) as SocioPasswordRow[];

    const candidates: ResetCandidate[] = [];
    const skipped: SkippedUser[] = [];

    for (const user of users) {
      const classified = classifyUser(user, onlyRutKeys, excludeRutKeys);
      if (classified.candidate) {
        candidates.push(classified.candidate);
      }
      if (classified.skipped) {
        skipped.push(classified.skipped);
      }
    }

    if (dryRun) {
      return jsonResponse({
        success: true,
        message: 'Dry run completado. No se modificó la base de datos.',
        data: {
          dryRun: true,
          includeInactive,
          totalEvaluados: users.length,
          totalActualizar: candidates.length,
          totalOmitidos: skipped.length,
          candidatos: serializeCandidates(candidates),
          omitidos: skipped,
        },
      });
    }

    await applyPasswordUpdates(env, candidates);

    return jsonResponse({
      success: true,
      message: 'Contraseñas de socios actualizadas exitosamente',
      data: {
        dryRun: false,
        includeInactive,
        totalEvaluados: users.length,
        totalActualizados: candidates.length,
        totalOmitidos: skipped.length,
        actualizados: serializeCandidates(candidates),
        omitidos: skipped,
      },
    });
  } catch (error) {
    console.error('[ADMIN/RESET-SOCIOS-PASSWORDS] Error:', error);
    return errorResponse('Error procesando reset masivo de contraseñas', 500);
  }
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
};
