/**
 * Utilidad para envío de emails usando Resend
 * Resend es compatible con Cloudflare Workers y no requiere configuración DNS compleja
 */

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

/**
 * Envía un email usando la API de Resend
 * @param params - Parámetros del email
 * @param env - Environment de Cloudflare con RESEND_API_KEY
 * @returns Promise<boolean> - true si el email se envió correctamente
 */
export async function sendEmail(params: SendEmailParams, env: any): Promise<boolean> {
  try {
    const resendApiKey = env.RESEND_API_KEY;
    
    if (!resendApiKey) {
      console.warn('[email] RESEND_API_KEY no está configurado. Email no enviado.');
      // En desarrollo, solo loggeamos pero no fallamos
      return false;
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: params.from || 'ACA Chile <noreply@acachile.com>',
        to: [params.to],
        subject: params.subject,
        html: params.html,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[email] Error enviando email:', errorData);
      return false;
    }

    const data = await response.json();
    console.log('[email] Email enviado exitosamente:', data.id);
    return true;
  } catch (error) {
    console.error('[email] Error al enviar email:', error);
    return false;
  }
}

/**
 * Genera el HTML para el email de asignación de revisor
 */
export function generateReviewerAssignmentEmail(params: {
  reviewerName: string;
  postulanteName: string;
  postulacionId: number;
  assignedByName: string;
}): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #7c3aed; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
    .content { background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background-color: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .info-box { background-color: white; padding: 15px; border-left: 4px solid #7c3aed; margin: 20px 0; }
    .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎯 Nueva Asignación de Revisión</h1>
    </div>
    <div class="content">
      <p>Hola <strong>${params.reviewerName}</strong>,</p>
      
      <p>Se te ha asignado como revisor de una nueva postulación en ACA Chile.</p>
      
      <div class="info-box">
        <p><strong>📋 Detalles de la asignación:</strong></p>
        <ul>
          <li><strong>Postulante:</strong> ${params.postulanteName}</li>
          <li><strong>ID de postulación:</strong> #${params.postulacionId}</li>
          <li><strong>Asignado por:</strong> ${params.assignedByName}</li>
        </ul>
      </div>
      
      <p>Como revisor, tus responsabilidades son:</p>
      <ul>
        <li>✅ Revisar la información del postulante</li>
        <li>💬 Dejar tu feedback detallado</li>
        <li>👍 Aprobar o rechazar la postulación</li>
      </ul>
      
      <p style="text-align: center;">
        <a href="https://acachile.com/panel-admin/postulantes" class="button">
          Ver Postulación
        </a>
      </p>
      
      <p><em>Recuerda que solo los revisores asignados pueden aprobar esta postulación.</em></p>
      
      <div class="footer">
        <p>ACA Chile - Asociación Chilena de Ajedrez</p>
        <p>Este es un email automático, por favor no responder.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}
