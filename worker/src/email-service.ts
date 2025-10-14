/**
 * Sistema de Envío de Emails con Resend
 * ACA Chile - Integración ligera para Cloudflare Workers
 */

import { Resend } from 'resend';

export interface Env {
  RESEND_API_KEY?: string;
  FROM_EMAIL?: string;
  FRONTEND_URL?: string;
}

export interface EmailService {
  sendPasswordResetEmail(to: string, resetToken: string, frontendUrl?: string): Promise<boolean>;
  sendWelcomeEmail(to: string, name: string): Promise<boolean>;
  sendRegistrationApprovalEmail(to: string, name: string): Promise<boolean>;
}

export class ResendEmailService implements EmailService {
  private resend: Resend;
  private fromEmail: string;
  private frontendUrl: string;

  constructor(apiKey: string, fromEmail?: string, frontendUrl?: string) {
    this.resend = new Resend(apiKey);
    this.fromEmail = fromEmail || 'noreply@mail.juancartagena.cl';
    this.frontendUrl = frontendUrl || 'https://acachile.pages.dev';
  }

  async sendPasswordResetEmail(to: string, resetToken: string, frontendUrl?: string): Promise<boolean> {
    try {
      const resetUrl = `${frontendUrl || this.frontendUrl}/reset-password?token=${resetToken}`;
      
      const { error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: [to],
        subject: 'Recuperar Contraseña - ACA Chile',
        html: `
          <!DOCTYPE html>
          <html lang="es">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Recuperar Contraseña</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .logo { color: #d97706; font-size: 24px; font-weight: bold; }
              .content { background: #f8f9fa; padding: 30px; border-radius: 8px; }
              .button { 
                display: inline-block; 
                padding: 12px 30px; 
                background: #d97706; 
                color: white; 
                text-decoration: none; 
                border-radius: 5px; 
                margin: 20px 0;
              }
              .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
              .warning { background: #fef3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">🔥 ACA Chile</div>
                <h2>Recuperación de Contraseña</h2>
              </div>
              
              <div class="content">
                <h3>¡Hola!</h3>
                <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en ACA Chile.</p>
                
                <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>
                
                <div style="text-align: center;">
                  <a href="${resetUrl}" class="button">Restablecer Contraseña</a>
                </div>
                
                <div class="warning">
                  <strong>⚠️ Importante:</strong>
                  <ul>
                    <li>Este enlace expira en <strong>1 hora</strong></li>
                    <li>Solo puede ser usado una vez</li>
                    <li>Si no solicitaste este cambio, puedes ignorar este email</li>
                  </ul>
                </div>
                
                <p>Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
                <p style="word-break: break-all; color: #666; font-size: 14px;">${resetUrl}</p>
              </div>
              
              <div class="footer">
                <p>Este email fue enviado por la Asociación Chilena de Asadores (ACA Chile)</p>
                <p>Si tienes problemas, contáctanos a admin@acachile.com</p>
              </div>
            </div>
          </body>
          </html>
        `,
        text: `
          Recuperación de Contraseña - ACA Chile
          
          Hola,
          
          Recibimos una solicitud para restablecer tu contraseña.
          
          Haz clic en este enlace para crear una nueva contraseña:
          ${resetUrl}
          
          Este enlace expira en 1 hora y solo puede ser usado una vez.
          
          Si no solicitaste este cambio, puedes ignorar este email.
          
          ¡Saludos!
          Equipo ACA Chile
        `
      });

      if (error) {
        console.error('Error enviando email de recuperación:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error en sendPasswordResetEmail:', error);
      return false;
    }
  }

  async sendWelcomeEmail(to: string, name: string): Promise<boolean> {
    try {
      const { error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: [to],
        subject: '¡Bienvenido a ACA Chile! 🔥',
        html: `
          <!DOCTYPE html>
          <html lang="es">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Bienvenido a ACA Chile</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .logo { color: #d97706; font-size: 28px; font-weight: bold; }
              .content { background: #f8f9fa; padding: 30px; border-radius: 8px; }
              .button { 
                display: inline-block; 
                padding: 12px 30px; 
                background: #d97706; 
                color: white; 
                text-decoration: none; 
                border-radius: 5px; 
                margin: 20px 0;
              }
              .features { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
              .feature { margin: 10px 0; }
              .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">🔥 ACA Chile</div>
                <h2>¡Bienvenido a la Asociación!</h2>
              </div>
              
              <div class="content">
                <h3>¡Hola ${name}!</h3>
                <p>¡Nos alegra mucho tenerte como parte de la Asociación Chilena de Asadores!</p>
                
                <div class="features">
                  <h4>¿Qué puedes hacer ahora?</h4>
                  <div class="feature">🏆 Participar en competencias y torneos</div>
                  <div class="feature">📚 Acceder a talleres exclusivos</div>
                  <div class="feature">🤝 Conectar con otros asadores</div>
                  <div class="feature">📰 Recibir noticias y actualizaciones</div>
                  <div class="feature">🎯 Registrarte en eventos especiales</div>
                </div>
                
                <div style="text-align: center;">
                  <a href="${this.frontendUrl}" class="button">Explorar la Plataforma</a>
                </div>
                
                <p>Si tienes alguna pregunta, no dudes en contactarnos. ¡Estamos aquí para ayudarte!</p>
              </div>
              
              <div class="footer">
                <p><strong>Asociación Chilena de Asadores (ACA Chile)</strong></p>
                <p>Uniendo a los amantes del asado en todo Chile</p>
                <p>Contacto: admin@acachile.com</p>
              </div>
            </div>
          </body>
          </html>
        `
      });

      if (error) {
        console.error('Error enviando email de bienvenida:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error en sendWelcomeEmail:', error);
      return false;
    }
  }

  async sendRegistrationApprovalEmail(to: string, name: string): Promise<boolean> {
    try {
      const { error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: [to],
        subject: '¡Tu registro ha sido aprobado! - ACA Chile 🔥',
        html: `
          <!DOCTYPE html>
          <html lang="es">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Registro Aprobado</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .logo { color: #d97706; font-size: 28px; font-weight: bold; }
              .content { background: #f8f9fa; padding: 30px; border-radius: 8px; }
              .button { 
                display: inline-block; 
                padding: 12px 30px; 
                background: #28a745; 
                color: white; 
                text-decoration: none; 
                border-radius: 5px; 
                margin: 20px 0;
              }
              .success { background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin: 20px 0; }
              .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">🔥 ACA Chile</div>
                <h2>¡Registro Aprobado!</h2>
              </div>
              
              <div class="content">
                <div class="success">
                  <h3>¡Felicitaciones ${name}!</h3>
                  <p>Tu solicitud de registro ha sido <strong>aprobada</strong> por nuestro equipo administrativo.</p>
                </div>
                
                <p>Ya puedes acceder a todas las funcionalidades de la plataforma ACA Chile:</p>
                
                <ul>
                  <li>Participar en eventos y competencias</li>
                  <li>Acceder a talleres exclusivos</li>
                  <li>Conectar con otros miembros</li>
                  <li>Recibir noticias y actualizaciones</li>
                </ul>
                
                <div style="text-align: center;">
                  <a href="${this.frontendUrl}" class="button">Ingresar a la Plataforma</a>
                </div>
                
                <p>¡Bienvenido oficialmente a la familia ACA Chile! 🎉</p>
              </div>
              
              <div class="footer">
                <p><strong>Asociación Chilena de Asadores (ACA Chile)</strong></p>
                <p>Contacto: admin@acachile.com</p>
              </div>
            </div>
          </body>
          </html>
        `
      });

      if (error) {
        console.error('Error enviando email de aprobación:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error en sendRegistrationApprovalEmail:', error);
      return false;
    }
  }
}

// Factory function para crear el servicio de email
export function createEmailService(env: any): EmailService | null {
  if (!env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY no configurado, emails deshabilitados');
    return null;
  }

  return new ResendEmailService(
    env.RESEND_API_KEY,
    env.FROM_EMAIL,
    env.FRONTEND_URL
  );
}