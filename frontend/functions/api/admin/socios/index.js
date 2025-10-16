// Endpoint para gestión de socios
// GET /api/admin/socios - Obtener lista de socios
// POST /api/admin/socios - Crear nuevo socio

// Función para hashear contraseñas (SHA-256 + salt)
async function hashPassword(password) {
  const salt = 'salt_aca_chile_2024';
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

export async function onRequestGet(context) {
  const { request, env } = context;

  try {
    console.log('[ADMIN SOCIOS] Obteniendo lista de socios');

    // TODO: Validar que el usuario es administrador
    // const user = requireAuth(request, env);
    // if (!user || user.role !== 'admin') {
    //   return errorResponse('Acceso denegado', 403);
    // }

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page')) || 1;
    const limit = parseInt(url.searchParams.get('limit')) || 20;
    const search = url.searchParams.get('search') || '';
    const estado = url.searchParams.get('estado') || '';

    // Construir query con filtros
    let query = `
      SELECT 
        u.id,
        u.email,
        u.nombre,
        u.apellido,
        u.telefono,
        u.rut,
        u.ciudad,
        u.direccion,
        u.foto_url,
        u.valor_cuota,
        u.fecha_ingreso,
        u.estado_socio,
        u.created_at,
        u.last_login,
        -- Estadísticas de cuotas del año actual
        COUNT(c.id) as total_cuotas_año,
        SUM(CASE WHEN c.pagado = 1 THEN 1 ELSE 0 END) as cuotas_pagadas_año,
        SUM(CASE WHEN c.pagado = 0 THEN 1 ELSE 0 END) as cuotas_pendientes_año,
        -- Última cuota pagada
        MAX(CASE WHEN c.pagado = 1 THEN c.fecha_pago END) as ultimo_pago
      FROM usuarios u
      LEFT JOIN cuotas c ON u.id = c.usuario_id AND c.año = ?
      WHERE u.activo = 1
    `;

    const params = [new Date().getFullYear()];

    // Filtro por búsqueda
    if (search) {
      query += ` AND (u.nombre LIKE ? OR u.apellido LIKE ? OR u.email LIKE ? OR u.rut LIKE ?)`;
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam, searchParam);
    }

    // Filtro por estado
    if (estado) {
      query += ` AND u.estado_socio = ?`;
      params.push(estado);
    }

    // Agrupar y ordenar
    query += `
      GROUP BY u.id
      ORDER BY u.apellido ASC, u.nombre ASC
    `;

    // Ejecutar query principal
    const { results } = await env.DB.prepare(query).bind(...params).all();

    // Contar total para paginación
    let countQuery = `
      SELECT COUNT(DISTINCT u.id) as total
      FROM usuarios u
      WHERE u.activo = 1
    `;
    const countParams = [];

    if (search) {
      countQuery += ` AND (u.nombre LIKE ? OR u.apellido LIKE ? OR u.email LIKE ? OR u.rut LIKE ?)`;
      const searchParam = `%${search}%`;
      countParams.push(searchParam, searchParam, searchParam, searchParam);
    }

    if (estado) {
      countQuery += ` AND u.estado_socio = ?`;
      countParams.push(estado);
    }

    const totalResult = await env.DB.prepare(countQuery).bind(...countParams).first();
    const total = totalResult?.total || 0;

    // Aplicar paginación a los resultados
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedResults = results.slice(startIndex, endIndex);

    // Formatear resultados
    const socios = paginatedResults.map(socio => ({
      id: socio.id,
      email: socio.email,
      nombre: socio.nombre,
      apellido: socio.apellido,
      nombreCompleto: `${socio.nombre} ${socio.apellido}`,
      telefono: socio.telefono,
      rut: socio.rut,
      ciudad: socio.ciudad,
      direccion: socio.direccion,
      fotoUrl: socio.foto_url,
      valorCuota: socio.valor_cuota || 6500,
      fechaIngreso: socio.fecha_ingreso || socio.created_at,
      estadoSocio: socio.estado_socio || 'activo',
      ultimoLogin: socio.last_login,
      // Estadísticas del año
      estadisticasAño: {
        totalCuotas: socio.total_cuotas_año || 0,
        cuotasPagadas: socio.cuotas_pagadas_año || 0,
        cuotasPendientes: socio.cuotas_pendientes_año || 0,
        ultimoPago: socio.ultimo_pago,
        porcentajePago: socio.total_cuotas_año > 0 
          ? Math.round((socio.cuotas_pagadas_año / socio.total_cuotas_año) * 100)
          : 0
      }
    }));

    const totalPages = Math.ceil(total / limit);

    console.log(`[ADMIN SOCIOS] Devolviendo ${socios.length} socios (página ${page}/${totalPages})`);

    return new Response(JSON.stringify({
      success: true,
      data: {
        socios,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[ADMIN SOCIOS] Error obteniendo socios:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: `Error obteniendo socios: ${error.message}`
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    console.log('[ADMIN SOCIOS] Creando nuevo socio');

    // TODO: Validar que el usuario es administrador
    // const user = requireAuth(request, env);
    // if (!user || user.role !== 'admin') {
    //   return errorResponse('Acceso denegado', 403);
    // }

    const body = await request.json();
    console.log('[ADMIN SOCIOS] Datos recibidos:', JSON.stringify(body, null, 2));
    
    const { 
      email, 
      nombre, 
      apellido, 
      telefono, 
      rut, 
      ciudad, 
      direccion, 
      fotoUrl, 
      valorCuota = 6500,
      estadoSocio = 'activo',
      password, // Password enviado desde el frontend
      rol = 'usuario' // Rol/perfil del usuario
    } = body;

    // Validaciones
    if (!email || !nombre || !apellido || !password) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Campos obligatorios: email, nombre, apellido, password'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validar que el rol sea válido
    const rolesValidos = ['admin', 'director', 'director_editor', 'usuario'];
    if (!rolesValidos.includes(rol)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Rol inválido. Debe ser: admin, director, director_editor o usuario'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (password.length < 6) {
      return new Response(JSON.stringify({
        success: false,
        error: 'La contraseña debe tener al menos 6 caracteres'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verificar si el email ya existe (activo o inactivo)
    const existingUser = await env.DB.prepare(`
      SELECT id, activo FROM usuarios WHERE email = ?
    `).bind(email.toLowerCase()).first();

    // Hash de la contraseña con SHA-256 + salt
    const passwordHash = await hashPassword(password);
    const now = new Date().toISOString();

    let socioId;
    let newSocio;

    if (existingUser) {
      if (existingUser.activo === 1) {
        // Usuario activo ya existe
        return new Response(JSON.stringify({
          success: false,
          error: 'Ya existe un socio activo con este email'
        }), {
          status: 409,
          headers: { 'Content-Type': 'application/json' }
        });
      } else {
        // Usuario existe pero está inactivo - REACTIVAR
        console.log('[ADMIN SOCIOS] Reactivando socio eliminado:', email);
        
        const updateResult = await env.DB.prepare(`
          UPDATE usuarios 
          SET nombre = ?, apellido = ?, telefono = ?, rut = ?, ciudad = ?, direccion = ?,
              foto_url = ?, valor_cuota = ?, estado_socio = ?, fecha_ingreso = ?,
              password_hash = ?, role = ?, activo = 1, updated_at = ?
          WHERE id = ?
        `).bind(
          nombre,
          apellido,
          telefono || null,
          rut || null,
          ciudad || null,
          direccion || null,
          fotoUrl || null,
          valorCuota,
          estadoSocio,
          now,
          passwordHash,
          rol,
          now,
          existingUser.id
        ).run();

        console.log('[ADMIN SOCIOS] Resultado de UPDATE:', JSON.stringify(updateResult));

        if (!updateResult.success) {
          throw new Error('Error reactivando socio en la base de datos');
        }

        socioId = existingUser.id;
      }
    } else {
      // Usuario no existe - CREAR NUEVO
      const result = await env.DB.prepare(`
        INSERT INTO usuarios (
          email, nombre, apellido, telefono, rut, ciudad, direccion, 
          foto_url, valor_cuota, estado_socio, fecha_ingreso,
          password_hash, role, activo, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
      `).bind(
        email.toLowerCase(),
        nombre,
        apellido,
        telefono || null,
        rut || null,
        ciudad || null,
        direccion || null,
        fotoUrl || null,
        valorCuota,
        estadoSocio,
        now,
        passwordHash,
        rol,
        now
      ).run();

      console.log('[ADMIN SOCIOS] Resultado de INSERT:', JSON.stringify(result));

      if (!result.success) {
        throw new Error('Error creando socio en la base de datos');
      }

      socioId = result.meta.last_row_id;
    }

    // Obtener socio creado o reactivado
    newSocio = await env.DB.prepare(`
      SELECT 
        id, email, nombre, apellido, telefono, rut, ciudad, direccion,
        foto_url, valor_cuota, fecha_ingreso, estado_socio, created_at
      FROM usuarios 
      WHERE id = ?
    `).bind(socioId).first();

    console.log(`[ADMIN SOCIOS] Socio creado exitosamente con ID: ${socioId}`);

    return new Response(JSON.stringify({
      success: true,
      message: 'Socio creado exitosamente',
      data: {
        id: newSocio.id,
        email: newSocio.email,
        nombre: newSocio.nombre,
        apellido: newSocio.apellido,
        nombreCompleto: `${newSocio.nombre} ${newSocio.apellido}`,
        telefono: newSocio.telefono,
        rut: newSocio.rut,
        ciudad: newSocio.ciudad,
        direccion: newSocio.direccion,
        fotoUrl: newSocio.foto_url,
        valorCuota: newSocio.valor_cuota,
        fechaIngreso: newSocio.fecha_ingreso,
        estadoSocio: newSocio.estado_socio,
        createdAt: newSocio.created_at
      }
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[ADMIN SOCIOS] Error creando socio:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: `Error creando socio: ${error.message}`
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}