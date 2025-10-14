/**
 * Funciones de Autenticación Avanzada y Administración
 * ACA Chile Worker - Sistema completo de gestión de usuarios
 */

export interface Env {
  ACA_KV: KVNamespace;
  ENVIRONMENT: string;
  JWT_SECRET?: string;
  ADMIN_EMAIL?: string;
  CORS_ORIGIN?: string;
  RESEND_API_KEY?: string;
  FROM_EMAIL?: string;
  FRONTEND_URL?: string;
}

// Importamos las funciones de gestión de usuarios
import {
  findUserByEmail as findUserByEmailKV,
  findUserById as findUserByIdKV,
  verifyUserPassword as verifyUserPasswordKV,
  updateUserPassword as updateUserPasswordKV,
  getAllUsers
} from './user-migration';

// Importamos el servicio de email
import { createEmailService } from './email-service';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// ===== FUNCIONES DE RECUPERACIÓN DE CONTRASEÑAS =====

export async function handleForgotPassword(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    const body = await request.json() as { email: string };
    const { email } = body;

    if (!email) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Email es requerido'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    // Buscar usuario en KV
    const user = await findUserByEmailKV(email, env);
    
    if (!user) {
      // Por seguridad, no revelamos si el email existe o no
      return new Response(JSON.stringify({
        success: true,
        message: 'Si el email existe en nuestro sistema, recibirás un enlace de recuperación'
      }), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    // Generar token de recuperación
    const resetToken = generateSecureToken();
    const resetExpires = Date.now() + (1 * 60 * 60 * 1000); // 1 hora

    // Guardar token en KV
    await env.ACA_KV.put(`reset_token:${resetToken}`, JSON.stringify({
      userId: user.id,
      email: user.email,
      expires: resetExpires,
      used: false
    }), {
      expirationTtl: 3600 // 1 hora en segundos
    });

    // Enviar email de recuperación
    const emailService = createEmailService(env);
    let emailSent = false;
    
    if (emailService) {
      try {
        emailSent = await emailService.sendPasswordResetEmail(
          user.email, 
          resetToken,
          env.FRONTEND_URL || env.CORS_ORIGIN
        );
        console.log(`Email de recuperación ${emailSent ? 'enviado' : 'falló'} para ${email}`);
      } catch (error) {
        console.error('Error enviando email de recuperación:', error);
      }
    } else {
      console.log(`Reset token for ${email} (email service not configured): ${resetToken}`);
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Si el email existe en nuestro sistema, recibirás un enlace de recuperación',
      // Solo para desarrollo - mostrar info adicional
      ...(env.ENVIRONMENT === 'development' && { 
        resetToken,
        resetUrl: `${env.FRONTEND_URL || env.CORS_ORIGIN}/reset-password?token=${resetToken}`,
        emailSent
      })
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

export async function handleResetPassword(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    const body = await request.json() as { 
      token: string;
      newPassword: string;
    };
    const { token, newPassword } = body;

    if (!token || !newPassword) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Token y nueva contraseña son requeridos'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    if (newPassword.length < 6) {
      return new Response(JSON.stringify({
        success: false,
        error: 'La contraseña debe tener al menos 6 caracteres'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    // Verificar token
    const tokenData = await env.ACA_KV.get(`reset_token:${token}`);
    
    if (!tokenData) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Token inválido o expirado'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    const resetInfo = JSON.parse(tokenData);
    
    if (resetInfo.used || resetInfo.expires < Date.now()) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Token inválido o expirado'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    // Actualizar contraseña del usuario
    await updateUserPasswordKV(resetInfo.userId, newPassword, env);

    // Marcar token como usado
    await env.ACA_KV.put(`reset_token:${token}`, JSON.stringify({
      ...resetInfo,
      used: true,
      usedAt: new Date().toISOString()
    }), {
      expirationTtl: 86400 // Mantener por 24h para auditoría
    });

    return new Response(JSON.stringify({
      success: true,
      message: 'Contraseña actualizada exitosamente'
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

export async function handleChangePassword(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    // Verificar autenticación
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

    const body = await request.json() as { 
      currentPassword: string;
      newPassword: string;
    };
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Contraseña actual y nueva contraseña son requeridas'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    if (newPassword.length < 6) {
      return new Response(JSON.stringify({
        success: false,
        error: 'La nueva contraseña debe tener al menos 6 caracteres'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    // Verificar contraseña actual
    const isCurrentPasswordValid = await verifyUserPasswordKV(authResult.user.id, currentPassword, env);
    
    if (!isCurrentPasswordValid) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Contraseña actual incorrecta'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    // Actualizar contraseña
    await updateUserPasswordKV(authResult.user.id, newPassword, env);

    return new Response(JSON.stringify({
      success: true,
      message: 'Contraseña cambiada exitosamente'
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

// ===== FUNCIONES DE ADMINISTRACIÓN =====

export async function handlePendingRegistrations(request: Request, env: Env): Promise<Response> {
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

    // Verificar permisos de admin
    if (!hasAdminPermissions(authResult.user)) {
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

export async function handleApproveRegistration(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    // Verificar autenticación y permisos
    const authResult = await verifyAuth(request, env);
    if (!authResult.success || !authResult.user || !hasAdminPermissions(authResult.user)) {
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

    const body = await request.json() as { 
      registrationId: string;
      assignedRole?: 'user' | 'organizer';
      membershipType?: 'basic' | 'premium' | 'vip';
      notes?: string;
    };
    const { registrationId, assignedRole, membershipType, notes } = body;

    if (!registrationId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'ID de registro requerido'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    // Obtener y procesar registro pendiente
    const registrationResult = await processRegistrationApproval(
      registrationId, 
      authResult.user.id, 
      { assignedRole, membershipType, notes }, 
      env
    );

    if (!registrationResult.success) {
      return new Response(JSON.stringify({
        success: false,
        error: registrationResult.error
      }), {
        status: registrationResult.status || 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Registro aprobado exitosamente',
      data: registrationResult.data
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

export async function handleRejectRegistration(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    // Verificar autenticación y permisos
    const authResult = await verifyAuth(request, env);
    if (!authResult.success || !authResult.user || !hasAdminPermissions(authResult.user)) {
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

    const body = await request.json() as { 
      registrationId: string;
      reason?: string;
    };
    const { registrationId, reason } = body;

    if (!registrationId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'ID de registro requerido'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    // Procesar rechazo de registro
    const rejectionResult = await processRegistrationRejection(
      registrationId, 
      authResult.user.id, 
      reason, 
      env
    );

    if (!rejectionResult.success) {
      return new Response(JSON.stringify({
        success: false,
        error: rejectionResult.error
      }), {
        status: rejectionResult.status || 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Registro rechazado',
      data: rejectionResult.data
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

// ===== FUNCIONES AUXILIARES =====

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

    // Buscar usuario
    const user = await findUserByIdKV(decoded.userId, env);
    
    if (!user) {
      return { success: false, error: 'Usuario no encontrado' };
    }

    return { success: true, user };
    
  } catch (error) {
    return { success: false, error: 'Token inválido' };
  }
}

// Funciones duplicadas eliminadas - ahora se usan las de user-migration.ts

function hasAdminPermissions(user: any): boolean {
  if (!user || !user.roles) return false;
  
  const adminRoles = ['admin', 'super_admin'];
  return user.roles.some((role: string) => adminRoles.includes(role));
}

function generateSecureToken(): string {
  // Generar token seguro aleatorio
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function processRegistrationApproval(
  registrationId: string, 
  approverId: number, 
  options: { assignedRole?: string; membershipType?: string; notes?: string }, 
  env: Env
): Promise<{ success: boolean; data?: any; error?: string; status?: number }> {
  
  try {
    // Obtener registros pendientes
    const pendingRegistrations = await env.ACA_KV.get('registrations:pending');
    const pending = pendingRegistrations ? JSON.parse(pendingRegistrations) : [];
    
    const registrationIndex = pending.findIndex((p: any) => p.id === registrationId);
    if (registrationIndex === -1) {
      return {
        success: false,
        error: 'Registro no encontrado',
        status: 404
      };
    }

    const registration = pending[registrationIndex];

    // Crear usuario nuevo
    const newUser = {
      id: Date.now(),
      email: registration.userData.email,
      name: registration.userData.name,
      phone: registration.userData.phone,
      region: registration.userData.region,
      membershipType: options.membershipType || 'basic',
      roles: [options.assignedRole || 'user'],
      status: 'active',
      emailVerified: true,
      joinDate: new Date().toISOString().split('T')[0],
      active: true,
      createdBy: approverId,
      approvedBy: approverId,
      approvedAt: new Date().toISOString()
    };

    // Guardar usuario en KV
    const existingUsers = await env.ACA_KV.get('users:all');
    const users = existingUsers ? JSON.parse(existingUsers) : [];
    users.push(newUser);
    await env.ACA_KV.put('users:all', JSON.stringify(users));

    // Guardar contraseña por separado
    await env.ACA_KV.put(`user:${newUser.id}:password`, registration.userData.password);

    // Crear índices para búsqueda rápida
    await env.ACA_KV.put(`user:email:${newUser.email}`, JSON.stringify(newUser));
    await env.ACA_KV.put(`user:id:${newUser.id}`, JSON.stringify(newUser));

    // Remover de registros pendientes
    pending.splice(registrationIndex, 1);
    await env.ACA_KV.put('registrations:pending', JSON.stringify(pending));

    // Guardar registro aprobado para auditoría
    const approvedRegistrations = await env.ACA_KV.get('registrations:approved');
    const approved = approvedRegistrations ? JSON.parse(approvedRegistrations) : [];
    approved.push({
      ...registration,
      status: 'approved',
      reviewedBy: approverId,
      reviewedAt: new Date().toISOString(),
      reviewNotes: options.notes,
      createdUser: newUser
    });
    await env.ACA_KV.put('registrations:approved', JSON.stringify(approved));

    return {
      success: true,
      data: {
        user: newUser,
        registrationId
      }
    };

  } catch (error) {
    return {
      success: false,
      error: 'Error procesando aprobación',
      status: 500
    };
  }
}

async function processRegistrationRejection(
  registrationId: string, 
  rejectorId: number, 
  reason: string | undefined, 
  env: Env
): Promise<{ success: boolean; data?: any; error?: string; status?: number }> {
  
  try {
    // Obtener registros pendientes
    const pendingRegistrations = await env.ACA_KV.get('registrations:pending');
    const pending = pendingRegistrations ? JSON.parse(pendingRegistrations) : [];
    
    const registrationIndex = pending.findIndex((p: any) => p.id === registrationId);
    if (registrationIndex === -1) {
      return {
        success: false,
        error: 'Registro no encontrado',
        status: 404
      };
    }

    const registration = pending[registrationIndex];

    // Remover de registros pendientes
    pending.splice(registrationIndex, 1);
    await env.ACA_KV.put('registrations:pending', JSON.stringify(pending));

    // Guardar registro rechazado para auditoría
    const rejectedRegistrations = await env.ACA_KV.get('registrations:rejected');
    const rejected = rejectedRegistrations ? JSON.parse(rejectedRegistrations) : [];
    rejected.push({
      ...registration,
      status: 'rejected',
      reviewedBy: rejectorId,
      reviewedAt: new Date().toISOString(),
      reviewNotes: reason
    });
    await env.ACA_KV.put('registrations:rejected', JSON.stringify(rejected));

    return {
      success: true,
      data: {
        registrationId,
        reason
      }
    };

  } catch (error) {
    return {
      success: false,
      error: 'Error procesando rechazo',
      status: 500
    };
  }
}