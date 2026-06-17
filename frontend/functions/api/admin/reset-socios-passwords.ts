import type { PagesFunction, Env } from '../../types';
import { jsonResponse, errorResponse, requireAdmin, authErrorResponse } from './_middleware';
import { hashPassword } from '../../utils/password';

interface ResetSociosPasswordsRequest {
  dryRun?: boolean;
  includeInactive?: boolean;
  onlyRuts?: string[];
  excludeRuts?: string[];
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

function isProtectedAdmin(user: Record<string, unknown>): boolean {
  const email = normalizeEmail(user.email);
  const fullName = normalizeName(user.nombre, user.apellido);
  const role = typeof user.role === 'string' ? user.role.trim().toLowerCase() : '';

  return role === 'admin' || PROTECTED_ADMIN_EMAILS.has(email) || PROTECTED_ADMIN_NAMES.has(fullName);
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
    const onlyRutKeys = new Set((body.onlyRuts || []).map(rutDigits).filter(Boolean));
    const excludeRutKeys = new Set((body.excludeRuts || []).map(rutDigits).filter(Boolean));

    const query = `
      SELECT id, email, nombre, apellido, rut, role, activo
      FROM usuarios
      WHERE rut IS NOT NULL
        AND TRIM(rut) != ''
        ${includeInactive ? '' : 'AND activo = 1'}
      ORDER BY id ASC
    `;

    const result = await env.DB.prepare(query).all();
    const users = Array.isArray(result.results) ? result.results : [];

    const candidates: Array<Record<string, unknown>> = [];
    const skipped: Array<Record<string, unknown>> = [];

    for (const user of users) {
      const rutKey = rutDigits(user.rut);
      const initialPassword = deriveInitialPasswordFromRut(user.rut);
      const protectedAdmin = isProtectedAdmin(user);

      if (onlyRutKeys.size > 0 && !onlyRutKeys.has(rutKey)) {
        continue;
      }

      if (excludeRutKeys.has(rutKey)) {
        skipped.push({
          id: user.id,
          rut: user.rut,
          email: user.email,
          motivo: 'RUT excluido explícitamente',
        });
        continue;
      }

      if (protectedAdmin) {
        skipped.push({
          id: user.id,
          rut: user.rut,
          email: user.email,
          nombreCompleto: `${user.nombre || ''} ${user.apellido || ''}`.trim(),
          motivo: 'Administrador protegido',
        });
        continue;
      }

      if (!initialPassword) {
        skipped.push({
          id: user.id,
          rut: user.rut,
          email: user.email,
          motivo: 'RUT sin suficientes dígitos para generar contraseña inicial',
        });
        continue;
      }

      candidates.push({
        id: user.id,
        rut: user.rut,
        email: user.email,
        nombreCompleto: `${user.nombre || ''} ${user.apellido || ''}`.trim(),
        role: user.role,
        activo: user.activo,
        initialPassword,
      });
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
          candidatos: candidates.map(({ initialPassword, ...user }) => ({
            ...user,
            passwordPreview: initialPassword,
          })),
          omitidos: skipped,
        },
      });
    }

    const statement = env.DB.prepare(`
      UPDATE usuarios
      SET password_hash = ?, updated_at = datetime('now')
      WHERE id = ?
    `);

    const updates = await Promise.all(
      candidates.map(async (candidate) => {
        const passwordHash = await hashPassword(String(candidate.initialPassword));
        return statement.bind(passwordHash, candidate.id);
      })
    );

    if (updates.length > 0) {
      await env.DB.batch(updates);
    }

    return jsonResponse({
      success: true,
      message: 'Contraseñas de socios actualizadas exitosamente',
      data: {
        dryRun: false,
        includeInactive,
        totalEvaluados: users.length,
        totalActualizados: candidates.length,
        totalOmitidos: skipped.length,
        actualizados: candidates.map(({ initialPassword, ...user }) => ({
          ...user,
          passwordPreview: initialPassword,
        })),
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
