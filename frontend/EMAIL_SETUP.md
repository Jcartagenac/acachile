# Sistema de Notificaciones por Email - ACA Chile

## 📧 Configuración de Resend

Este proyecto usa [Resend](https://resend.com) para enviar notificaciones por email a los revisores cuando son asignados a una postulación.

### ¿Por qué Resend?

- ✅ Compatible con Cloudflare Workers
- ✅ No requiere configuración DNS compleja
- ✅ API simple y moderna
- ✅ Gratis hasta 3,000 emails/mes
- ✅ Dominio de prueba incluido (resend.dev)

## 🚀 Configuración Paso a Paso

### 1. Crear cuenta en Resend

1. Ve a [resend.com](https://resend.com) y crea una cuenta
2. Verifica tu email

### 2. Obtener API Key

1. En el dashboard de Resend, ve a **API Keys**
2. Click en **Create API Key**
3. Dale un nombre: `ACA Chile Production`
4. Copia la key (empieza con `re_`)

### 3. Configurar en Cloudflare Pages

#### Para Producción:

1. Ve a **Cloudflare Dashboard** → **Pages** → **acachile**
2. Ve a **Settings** → **Environment variables**
3. En la sección **Production**, agrega:
   - **Variable name:** `RESEND_API_KEY`
   - **Value:** `re_xxxxxxxxxxxxxxxxxxxx` (tu API key)
   - ✅ Marca como **Encrypted** (esto la convierte en Secret)
4. Click **Save**

#### Para Preview/Development:

1. En la misma página, ve a la sección **Preview**
2. Agrega la misma variable `RESEND_API_KEY`
3. Puedes usar la misma key o una diferente para testing

### 4. Configurar Dominio de Envío (Opcional pero Recomendado)

Por defecto, los emails se envían desde `resend.dev`, pero es mejor usar tu propio dominio.

#### Opción A: Usar resend.dev (Testing)

- No requiere configuración
- Los emails se envían desde `onboarding@resend.dev`
- Perfecto para desarrollo y pruebas

#### Opción B: Usar tu dominio (Producción)

1. En Resend Dashboard, ve a **Domains**
2. Click **Add Domain**
3. Ingresa `acachile.com` (o un subdominio como `mail.acachile.com`)
4. Resend te dará registros DNS para agregar:
   - **SPF** (TXT record)
   - **DKIM** (TXT record)
   - **DMARC** (TXT record) - opcional
5. Agrega estos registros en Cloudflare DNS
6. Espera verificación (puede tomar minutos u horas)
7. Una vez verificado, actualiza el parámetro `from` en `/api/_utils/email.ts`:
   ```typescript
   from: params.from || 'ACA Chile <noreply@acachile.com>',
   ```

## 📨 Tipos de Notificaciones Implementadas

### 1. Asignación de Revisor

**Trigger:** Cuando un admin asigna un revisor a una postulación

**Destinatario:** El revisor asignado

**Contenido:**
- Nombre del postulante
- ID de la postulación
- Quién lo asignó
- Link directo al panel de postulantes

**Código:** `/api/admin/postulantes/[id]/assign-reviewer.ts`

## 🧪 Testing

### Testing Local

Para probar localmente sin enviar emails reales:

1. **NO** configures `RESEND_API_KEY` en tu `.dev.vars`
2. El sistema solo loggeará en consola sin enviar emails
3. Verás en logs: `[email] RESEND_API_KEY no está configurado. Email no enviado.`

### Testing en Preview

1. Configura `RESEND_API_KEY` en Preview environment
2. Usa el dominio `resend.dev`
3. Asigna un revisor de prueba
4. Verifica que llegue el email

### Testing en Producción

1. Configura `RESEND_API_KEY` en Production
2. Idealmente usa tu dominio verificado
3. Asigna un revisor real
4. Verifica recepción del email

## 📊 Monitoreo

### Ver Logs de Emails

En Resend Dashboard:
1. Ve a **Emails** en el sidebar
2. Verás lista de todos los emails enviados
3. Click en uno para ver detalles (status, opens, clicks, etc.)

### Ver Logs en Cloudflare

En Cloudflare Pages:
1. Ve a tu proyecto → **Functions**
2. Click en **Real-time Logs**
3. Busca por `[email]` para ver logs de envío

## 🔧 Troubleshooting

### Email no se envía

1. **Verifica API Key:**
   ```bash
   # En Cloudflare Dashboard → Pages → Settings → Environment variables
   # Debe existir RESEND_API_KEY
   ```

2. **Verifica logs:**
   ```
   [email] Error enviando email: {...}
   ```

3. **Verifica en Resend Dashboard:**
   - Ve a Emails → busca el email por destinatario
   - Si aparece como "Failed", click para ver el error

### Email va a Spam

1. **Sin dominio verificado:** Normal que vaya a spam
2. **Con dominio verificado:**
   - Verifica SPF record
   - Verifica DKIM record
   - Agrega DMARC record
   - Pide a destinatarios marcar como "No spam"

### Rate Limits

Plan gratuito de Resend:
- ✅ 3,000 emails/mes
- ✅ 100 emails/día

Si necesitas más, actualiza tu plan en Resend.

## 🎨 Personalizar Plantillas de Email

Las plantillas están en `/api/_utils/email.ts`:

```typescript
export function generateReviewerAssignmentEmail(params: {...}): string {
  return `<!DOCTYPE html>...`;
}
```

Puedes:
- Cambiar colores
- Agregar logo
- Modificar texto
- Agregar más información

## 📚 Recursos

- [Resend Docs](https://resend.com/docs)
- [Resend API Reference](https://resend.com/docs/api-reference/emails/send-email)
- [Cloudflare Workers + Resend](https://resend.com/docs/send-with-cloudflare-workers)

## 🔐 Seguridad

- ✅ API Key almacenada como Secret en Cloudflare (encriptada)
- ✅ No se expone en código
- ✅ No se incluye en logs
- ✅ Solo accesible en runtime de Workers

## 💡 Futuras Mejoras

- [ ] Notificación cuando se completa revisión
- [ ] Notificación al postulante cuando es aprobado/rechazado
- [ ] Recordatorios para revisores pendientes
- [ ] Dashboard de estadísticas de emails
- [ ] Templates más avanzados con React Email
