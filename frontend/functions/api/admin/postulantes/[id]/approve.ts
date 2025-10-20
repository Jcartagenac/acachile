import { jsonResponse, errorResponse, requireAuth } from '../../../../_middleware';
import { ensurePostulacionesSchema, isDirectorRole, mapPostulacionRow } from '../../../_utils/postulaciones';

const randomPassword = (length = 12) => {
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let password = '';
  const cryptoObj = crypto || (globalThis as any).crypto;

  if (cryptoObj?.getRandomValues) {
    const values = new Uint32Array(length);
    cryptoObj.getRandomValues(values);
    for (let i = 0; i < length; i++) {
      password += charset[values[i] % charset.length];
    }
  } else {
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
  }

  return password;
};

const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'salt_aca_chile_2024');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
};

const createOrActivateSocio = async (env, postulacionRow, generatedBy) => {
  const now = new Date().toISOString();
  const email = postulacionRow.email.toLowerCase();

  const fullName = (postulacionRow.full_name || '').trim();
  const nameParts = fullName.split(/\s+/);
  const firstName = nameParts.shift() || email;
  const lastName = nameParts.join(' ') || firstName;

  const plainPassword = randomPassword();
  const passwordHash = await hashPassword(plainPassword);

  const existingUser = await env.DB.prepare(
    `SELECT id, activo FROM usuarios WHERE email = ?`,
  )
    .bind(email)
    .first();

  if (existingUser) {
    if (existingUser.activo === 1) {
      return {
        socioId: existingUser.id,
        password: null,
        reusedExisting: true,
      };
    }

    const updateResult = await env.DB.prepare(
      `
      UPDATE usuarios 
      SET nombre = ?, 
          apellido = ?, 
          telefono = ?, 
          rut = ?, 
          ciudad = ?, 
          password_hash = ?, 
          role = ?, 
          estado_socio = 'activo',
          fecha_ingreso = COALESCE(fecha_ingreso, ?),
          activo = 1,
          updated_at = ?
      WHERE id = ?
    `,
    )
      .bind(
        firstName,
        lastName,
        postulacionRow.phone || null,
        postulacionRow.rut || null,
        postulacionRow.city || null,
        passwordHash,
        'user',
        now,
        now,
        existingUser.id,
      )
      .run();

    if (!updateResult.success) {
      throw new Error(updateResult.error || 'No fue posible actualizar el usuario existente');
    }

    return {
      socioId: existingUser.id,
      password: plainPassword,
      reusedExisting: false,
    };
  }

  const insertResult = await env.DB.prepare(
    `
    INSERT INTO usuarios (
      email,
      nombre,
      apellido,
      telefono,
      rut,
      ciudad,
      direccion,
      foto_url,
      valor_cuota,
      estado_socio,
      fecha_ingreso,
      lista_negra,
      motivo_lista_negra,
      password_hash,
      role,
      activo,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, NULL, NULL, 6500, 'activo', ?, 0, NULL, ?, 'user', 1, ?, ?)
  `,
  )
    .bind(
      email,
      firstName,
      lastName,
      postulacionRow.phone || null,
      postulacionRow.rut || null,
      postulacionRow.city || null,
      now,
      passwordHash,
      now,
      now,
    )
    .run();

  if (!insertResult.success) {
    throw new Error(insertResult.error || 'No fue posible crear el usuario socio');
  }

  return {
    socioId: insertResult.meta.last_row_id,
    password: plainPassword,
    reusedExisting: false,
  };
};

export const onRequestPost = async ({ request, env, params }) => {
  try {
    const auth = await requireAuth(request, env);
    const approver = await env.DB.prepare(
      `SELECT id, role FROM usuarios WHERE id = ?`,
    )
      .bind(auth.userId)
      .first();

    if (!approver || !isDirectorRole(approver.role)) {
      return errorResponse('No tienes permisos para aprobar postulaciones', 403);
    }

    const body = await request.json().catch(() => ({}));
    const comment =
      typeof body?.comment === 'string' && body.comment.trim().length > 0
        ? body.comment.trim().slice(0, 500)
        : null;

    await ensurePostulacionesSchema(env.DB);

    const postulacionId = Number(params.id);
    if (Number.isNaN(postulacionId)) {
      return errorResponse('Identificador de postulación inválido', 400);
    }

    const postulacionRow = await env.DB.prepare(
      `
      SELECT *
      FROM postulaciones
      WHERE id = ?
    `,
    )
      .bind(postulacionId)
      .first();

    if (!postulacionRow) {
      return errorResponse('Postulación no encontrada', 404);
    }

    if (postulacionRow.status === 'rechazada') {
      return errorResponse('La postulación fue rechazada previamente', 400);
    }

    if (postulacionRow.status === 'aprobada') {
      return errorResponse('La postulación ya fue aprobada', 400);
    }

    try {
      await env.DB.prepare(
        `
        INSERT INTO postulacion_aprobaciones (
          postulacion_id,
          approver_id,
          approver_role,
          comment
        ) VALUES (?, ?, ?, ?)
      `,
      )
        .bind(postulacionId, approver.id, approver.role, comment)
        .run();
    } catch (error) {
      if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
        return errorResponse('Ya registraste tu aprobación para esta postulación', 409);
      }
      throw error;
    }

    const approvalsResult = await env.DB.prepare(
      `
      SELECT 
        a.id,
        a.approver_id,
        a.approver_role,
        a.comment,
        a.created_at,
        COALESCE(u.nombre || ' ' || u.apellido, u.email) as approver_name
      FROM postulacion_aprobaciones a
      LEFT JOIN usuarios u ON u.id = a.approver_id
      WHERE a.postulacion_id = ?
      ORDER BY a.created_at ASC
    `,
    )
      .bind(postulacionId)
      .all();

    const approvals = (approvalsResult.results || []).map((row: any) => ({
      id: row.id,
      approverId: row.approver_id,
      approverRole: row.approver_role,
      comment: row.comment,
      createdAt: row.created_at,
      approverName: row.approver_name,
    }));

    const approvalsRequired = postulacionRow.approvals_required || 2;
    const approvalsCount = approvals.length;
    let newStatus: 'en_revision' | 'aprobada' = approvalsCount >= approvalsRequired ? 'aprobada' : 'en_revision';
    let socioId = postulacionRow.socio_id;
    let generatedPassword: string | null = null;

    if (newStatus === 'aprobada') {
      const creationResult = await createOrActivateSocio(env, postulacionRow, approver);
      socioId = creationResult.socioId;
      generatedPassword = creationResult.password;
    }

    await env.DB.prepare(
      `
      UPDATE postulaciones
      SET 
        status = ?,
        approvals_count = ?,
        approved_at = CASE WHEN ? = 'aprobada' THEN CURRENT_TIMESTAMP ELSE approved_at END,
        socio_id = CASE WHEN ? = 'aprobada' THEN ? ELSE socio_id END
      WHERE id = ?
    `,
    )
      .bind(newStatus, approvalsCount, newStatus, newStatus, socioId, postulacionId)
      .run();

    const refreshedRow = await env.DB.prepare(
      `
      SELECT 
        p.*,
        json_group_array(
          CASE 
            WHEN a.id IS NULL THEN NULL
            ELSE json_object(
              'id', a.id,
              'approverId', a.approver_id,
              'approverRole', a.approver_role,
              'comment', a.comment,
              'createdAt', a.created_at,
              'approverName', COALESCE(u.nombre || ' ' || u.apellido, u.email)
            )
          END
        ) as approvals_json
      FROM postulaciones p
      LEFT JOIN postulacion_aprobaciones a ON a.postulacion_id = p.id
      LEFT JOIN usuarios u ON u.id = a.approver_id
      WHERE p.id = ?
      GROUP BY p.id
    `,
    )
      .bind(postulacionId)
      .first();

    const postulacion = mapPostulacionRow(refreshedRow);

    let parsedApprovals: typeof approvals = approvals;
    if (refreshedRow?.approvals_json) {
      try {
        const parsed = JSON.parse(refreshedRow.approvals_json);
        if (Array.isArray(parsed)) {
          parsedApprovals = parsed
            .filter(Boolean)
            .map((item) => ({
              id: Number(item.id),
              approverId: Number(item.approverId),
              approverRole: item.approverRole,
              comment: item.comment ?? null,
              createdAt: item.createdAt,
              approverName: item.approverName ?? null,
            }));
        }
      } catch (error) {
        console.error('[postulaciones] Error parsing approvals_json', error);
      }
    }

    return jsonResponse({
      success: true,
      data: {
        postulacion: {
          ...postulacion,
          approvals: parsedApprovals,
          approvalsCount: parsedApprovals.length,
          pendingApprovals: Math.max(0, (postulacion?.approvalsRequired ?? approvalsRequired) - parsedApprovals.length),
        },
        generatedPassword: generatedPassword,
        socioId,
      },
    });
  } catch (error) {
    console.error('[admin/postulantes/:id/approve] Error approving postulacion:', error);
    return errorResponse('No pudimos registrar tu aprobación', 500);
  }
};
