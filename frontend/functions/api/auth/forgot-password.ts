import type { PagesFunction, Env } from '../../types';
import { jsonResponse, errorResponse } from '../../_middleware';

/**
 * Handler de forgot password
 * Migrado desde worker/src/auth-system.ts
 */

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

async function sendEmail(env: Env, payload: EmailPayload): Promise<boolean> {
  if (!env.RESEND_API_KEY || !env.FROM_EMAIL) {
    console.error('[EMAIL] Missing RESEND_API_KEY or FROM_EMAIL');
    return false;
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.FROM_EMAIL,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('[EMAIL] Resend API error:', response.status, errorData);
      return false;
    }

    console.log('[EMAIL] Email sent successfully to:', payload.to);
    return true;
  } catch (error) {
    console.error('[EMAIL] Error sending email:', error);
    return false;
  }
}

function generateResetToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Handler principal de forgot password
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  
  try {
    console.log('[AUTH/FORGOT-PASSWORD] Processing forgot password request');
    
    // Parsear body
    const body = await request.json() as { email: string };
    const { email } = body;

    // Validaciones
    if (!email) {
      console.log('[AUTH/FORGOT-PASSWORD] Missing email');
      return errorResponse('Email es requerido');
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('[AUTH/FORGOT-PASSWORD] Invalid email format:', email);
      return errorResponse('Formato de email inválido');
    }

    console.log('[AUTH/FORGOT-PASSWORD] Processing request for:', email);

    // Buscar usuario
    const user = await env.DB.prepare(`
      SELECT id, email, nombre, apellido FROM usuarios WHERE email = ? AND activo = 1
    `).bind(email.toLowerCase()).first();

    // Por seguridad, siempre devolvemos el mismo mensaje
    const successMessage = 'Si el email existe, recibirás un enlace para restablecer tu contraseña';

    if (!user) {
      console.log('[AUTH/FORGOT-PASSWORD] User not found:', email);
      // Por seguridad, no revelamos que el usuario no existe
      return jsonResponse({
        success: true,
        message: successMessage
      });
    }

    // Generar token de reset
    const resetToken = generateResetToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    console.log('[AUTH/FORGOT-PASSWORD] Generated reset token for user:', user.id);

    // Guardar token en la base de datos
    await env.DB.prepare(`
      INSERT OR REPLACE INTO password_resets (user_id, token, expires_at)
      VALUES (?, ?, ?)
    `).bind(user.id, resetToken, expiresAt.toISOString()).run();

    // Preparar email
    const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    const emailHtml = `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #EF4444; margin: 0;">ACA Chile</h1>
          <p style="color: #666; margin: 5px 0;">Asociación Chilena de Asadores</p>
        </div>
        
        <h2 style="color: #333;">Restablece tu contraseña</h2>
        
        <p>Hola ${user.nombre} ${user.apellido},</p>
        
        <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta. Si no fuiste tú, puedes ignorar este email.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background-color: #EF4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Restablecer Contraseña
          </a>
        </div>
        
        <p style="color: #666; font-size: 14px;">
          Este enlace expirará en 1 hora. Si no puedes hacer clic en el botón, copia y pega este enlace en tu navegador:
        </p>
        <p style="word-break: break-all; color: #666; font-size: 14px;">
          ${resetUrl}
        </p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        
        <p style="color: #999; font-size: 12px; text-align: center;">
          ACA Chile - Asociación Chilena de Asadores<br>
          Este es un email automático, no respondas a este mensaje.
        </p>
      </div>
    `;

    // Enviar email
    const emailSent = await sendEmail(env, {
      to: user.email as string,
      subject: 'Restablece tu contraseña - ACA Chile',
      html: emailHtml
    });

    if (!emailSent) {
      console.error('[AUTH/FORGOT-PASSWORD] Failed to send email to:', email);
      return errorResponse('Error enviando email de recuperación', 500);
    }

    console.log('[AUTH/FORGOT-PASSWORD] Reset email sent successfully to:', email);

    return jsonResponse({
      success: true,
      message: successMessage
    });

  } catch (error) {
    console.error('[AUTH/FORGOT-PASSWORD] Error:', error);
    return errorResponse(
      'Error interno del servidor',
      500,
      env.ENVIRONMENT === 'development' ? { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      } : undefined
    );
  }
};