# Configuración de Emails con Resend

## 🚀 ¿Qué es Resend?

Resend es un servicio moderno de envío de emails diseñado para desarrolladores. Es perfecto para Cloudflare Workers porque:

- ✅ **Súper ligero** - Solo ~2MB en el bundle
- ✅ **Compatible con Workers** - Funciona nativamente  
- ✅ **Dominios personalizados** - Fácil configuración de tu propio dominio
- ✅ **Plan gratuito generoso** - 3,000 emails/mes gratis
- ✅ **Excelente deliverability** - Alta tasa de entrega

## 📋 Configuración Paso a Paso

### 1. Crear cuenta en Resend

1. Ve a [resend.com](https://resend.com)
2. Regístrate con el email `juecart@gmail.com`
3. Confirma tu email

### 2. Obtener API Key

1. En el dashboard de Resend, ve a **API Keys**
2. Clic en **Create API Key**
3. Nombre: `ACA Chile Production`
4. Permisos: **Sending access**
5. Copia la API key (empieza con `re_...`)

### 3. Configurar Variables de Entorno en Cloudflare

**Para Desarrollo:**
```bash
cd worker
npx wrangler secret put RESEND_API_KEY
# Pega tu API key cuando te lo pida
```

**Para Producción:**
```bash
cd worker  
npx wrangler secret put RESEND_API_KEY --env production
# Pega tu API key cuando te lo pida
```

### 4. Configurar Dominio Personalizado (Opcional pero Recomendado)

#### Configuración Actual (Temporal)
1. En Resend dashboard, ve a **Domains**
2. Clic **Add Domain**
3. Agrega: `mail.juancartagena.cl` *(temporal hasta tener control de acachile.com)*
4. Configura los registros DNS en Cloudflare para juancartagena.cl:
   ```
   Type: MX
   Name: mail.juancartagena.cl
   Value: feedback-smtp.us-east-1.amazonses.com
   Priority: 10
   
   Type: TXT  
   Name: mail.juancartagena.cl
   Value: "v=spf1 include:_spf.resend.com ~all"
   
   Type: CNAME
   Name: rs1._domainkey.mail.juancartagena.cl
   Value: [valor que te dé Resend]
   
   Type: CNAME  
   Name: rs2._domainkey.mail.juancartagena.cl
   Value: [valor que te dé Resend]
   
   Type: TXT
   Name: _dmarc.mail.juancartagena.cl  
   Value: "v=DMARC1; p=quarantine; rua=mailto:dmarc@juancartagena.cl"
   ```

#### Opción B: Usar dominio principal
Si prefieres usar `acachile.com` directamente, los pasos son similares pero afecta todo el dominio.

### 5. Actualizar Variables en Cloudflare

Una vez configurado el dominio, actualiza las variables:

```bash
# Ya está configurado en wrangler.toml como:
# FROM_EMAIL = "noreply@mail.juancartagena.cl"
# 
# Cuando migres a acachile.com, solo cambia esta variable en wrangler.toml
```

## 📧 Emails Implementados

### 1. Recuperación de Contraseña
- **Trigger**: Usuario solicita reset de password
- **Contenido**: Link seguro con token de 1 hora
- **Template**: HTML responsivo con branding ACA Chile

### 2. Bienvenida (Próximamente)
- **Trigger**: Nuevo usuario registrado
- **Contenido**: Información de la plataforma y primeros pasos

### 3. Aprobación de Registro (Próximamente)  
- **Trigger**: Admin aprueba registro pendiente
- **Contenido**: Confirmación de acceso completo

## 🔧 Testing

### Desarrollo (Sin API Key)
Si no tienes API key configurada, el sistema:
- ✅ Genera el token de reset correctamente
- ✅ Guarda en KV 
- ❌ No envía email real
- ✅ Muestra token en logs y respuesta (solo desarrollo)

### Producción (Con API Key)
Con API key configurada:
- ✅ Genera token de reset
- ✅ Guarda en KV
- ✅ Envía email real con Resend
- ✅ Template profesional con branding

## 💰 Costos

**Plan Gratuito Resend:**
- 3,000 emails/mes - **Gratis**
- 100 emails/día máximo
- Soporte estándar

**Plan Paid (si creces):**
- $20/mes por 50,000 emails
- Sin límite diario
- Soporte prioritario

## 🚨 Seguridad

- API keys se guardan como **secrets** en Cloudflare (encriptadas)
- Tokens de reset expiran automáticamente en 1 hora
- Validación de emails para prevenir spam
- Rate limiting incorporado

## 📝 Próximos Pasos

1. **¡Configura Resend ahora!** - Sigue los pasos de arriba
2. **Testa el sistema** - Prueba forgot password
3. **Configura dominio** - Para emails profesionales  
4. **Personaliza templates** - Ajusta colores/contenido si quieres

## 🔗 Enlaces Útiles

- [Resend Dashboard](https://resend.com/dashboard)
- [Documentación Resend](https://resend.com/docs)
- [Configuración DNS](https://resend.com/docs/dashboard/domains/introduction)