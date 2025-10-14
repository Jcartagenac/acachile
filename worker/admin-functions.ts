// Funciones de administración de registros
async function handlePendingRegistrations(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'GET') {
    return new Response('Method not allowed', {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    // Verificar que el usuario es admin
    const authResult = await verifyAuth(request, env);
    if (!authResult.success || !authResult.user) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No autorizado'
      }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    // TODO: Verificar que tiene permisos de admin
    if (authResult.user.email !== 'admin@acachile.com') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Permisos insuficientes'
      }), {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    // Obtener registros pendientes
    const pendingRegistrations = await env.ACA_KV.get('registrations:pending');
    const pending = pendingRegistrations ? JSON.parse(pendingRegistrations) : [];

    return new Response(JSON.stringify({
      success: true,
      data: pending
    }), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Error interno del servidor'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
  }
}

// Función auxiliar para verificar autenticación
async function verifyAuth(request: Request, env: Env): Promise<{ success: boolean; user?: any; error?: string }> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { success: false, error: 'Token no proporcionado' };
  }

  const token = authHeader.substring(7);
  
  try {
    // Decodificar token simple (en producción usar JWT real)
    const decoded = JSON.parse(atob(token));
    
    // Verificar expiración
    if (decoded.exp < Date.now()) {
      return { success: false, error: 'Token expirado' };
    }

    // Buscar usuario (primero en usuarios demo, luego en KV)
    const demoUsers = [
      {
        id: 1,
        email: 'admin@acachile.com',
        name: 'Administrador ACA',
        membershipType: 'vip',
        roles: ['super_admin'],
        region: 'Metropolitana',
        joinDate: '2024-01-01',
        active: true
      },
      {
        id: 2,
        email: 'usuario@acachile.com',
        name: 'Usuario Demo',
        membershipType: 'basic',
        roles: ['user'],
        region: 'Valparaíso',
        joinDate: '2024-06-15',
        active: true
      }
    ];

    let user = demoUsers.find(u => u.id === decoded.userId);
    
    if (!user) {
      // Buscar en KV
      const existingUsers = await env.ACA_KV.get('users:all');
      if (existingUsers) {
        const users = JSON.parse(existingUsers);
        user = users.find((u: any) => u.id === decoded.userId);
      }
    }

    if (!user) {
      return { success: false, error: 'Usuario no encontrado' };
    }

    return { success: true, user };
    
  } catch (error) {
    return { success: false, error: 'Token inválido' };
  }
}
