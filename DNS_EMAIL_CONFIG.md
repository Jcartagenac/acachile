# Configuración DNS para Emails - juancartagena.cl

## 🎯 Objetivo
Configurar `mail.juancartagena.cl` como dominio de envío temporal para ACA Chile mientras no tengas control de `acachile.com`.

## 📧 Configuración en Resend

### 1. Agregar Dominio en Resend
1. Ve a [resend.com/dashboard](https://resend.com/dashboard)
2. Sección **"Domains"** → **"Add Domain"**
3. Ingresa: `mail.juancartagena.cl`
4. Resend te dará registros DNS específicos

## ⚙️ Configuración DNS en Cloudflare

### Paso 1: Acceder a la zona DNS
1. Ve a [dash.cloudflare.com](https://dash.cloudflare.com)
2. Selecciona el dominio `juancartagena.cl`
3. Ve a la pestaña **DNS**

### Paso 2: Agregar Registros DNS (Valores de ejemplo - usa los que te dé Resend)

#### A) Registro MX (Mail Exchange)
```
Type: MX
Name: mail.juancartagena.cl
Value: feedback-smtp.us-east-1.amazonses.com
Priority: 10
TTL: Auto
```

#### B) Registro SPF (Sender Policy Framework)
```
Type: TXT
Name: mail.juancartagena.cl
Value: "v=spf1 include:_spf.resend.com ~all"
TTL: Auto
```

#### C) Registro DKIM 1 (DomainKeys Identified Mail)
```
Type: CNAME
Name: rs1._domainkey.mail.juancartagena.cl
Value: rs1.rsnd.net
TTL: Auto
```

#### D) Registro DKIM 2
```
Type: CNAME  
Name: rs2._domainkey.mail.juancartagena.cl
Value: rs2.rsnd.net
TTL: Auto
```

#### E) Registro DMARC (Domain-based Message Authentication)
```
Type: TXT
Name: _dmarc.mail.juancartagena.cl
Value: "v=DMARC1; p=quarantine; rua=mailto:dmarc@juancartagena.cl"
TTL: Auto
```

## 🔧 Configuración Específica por Registro

### 1. Registro MX
- **Qué hace**: Indica qué servidor maneja emails para el dominio
- **Valor**: Resend te dará el servidor específico
- **Prioridad**: Normalmente 10

### 2. Registro SPF  
- **Qué hace**: Autoriza a Resend a enviar emails desde tu dominio
- **Formato**: `"v=spf1 include:_spf.resend.com ~all"`
- **Importante**: Las comillas son necesarias

### 3. Registros DKIM
- **Qué hace**: Firma criptográfica para autenticar emails
- **Cantidad**: Siempre son 2 registros (rs1 y rs2)
- **Valores**: Resend te dará los valores exactos

### 4. Registro DMARC
- **Qué hace**: Política de qué hacer con emails no autenticados
- **Opciones**: `none` (solo monitorear), `quarantine` (spam), `reject` (rechazar)
- **Recomendado**: Empezar con `quarantine`

## 🛠️ Pasos de Implementación

### Paso 1: Configurar Resend (HACER PRIMERO)
```bash
# 1. Regístrate en resend.com con juecart@gmail.com
# 2. Agrega dominio: mail.juancartagena.cl  
# 3. Copia los valores DNS que te dé Resend
```

### Paso 2: Configurar DNS en Cloudflare
```bash
# Usar los valores EXACTOS que te dé Resend, no los de ejemplo de arriba
# Cada cuenta de Resend tiene valores únicos
```

### Paso 3: Configurar API Key en Worker
```bash
cd /Users/jcartagenac/Documents/poroto/worker

# Para desarrollo
npx wrangler secret put RESEND_API_KEY
# Pega tu API key cuando te lo pida

# Para producción  
npx wrangler secret put RESEND_API_KEY --env production
# Pega la misma API key
```

### Paso 4: Verificar Configuración
```bash
# Desplegar cambios
npx wrangler deploy --env production

# Probar email
curl -X POST "https://acachile-api-production.juecart.workers.dev/api/auth/forgot-password" \
  -H "Content-Type: application/json" \
  -d '{"email": "jcartagenac@gmail.com"}'
```

## ✅ Verificación de Configuración

### 1. Verificar DNS
```bash
# Verificar MX
dig MX mail.juancartagena.cl

# Verificar SPF
dig TXT mail.juancartagena.cl

# Verificar DKIM
dig CNAME rs1._domainkey.mail.juancartagena.cl
dig CNAME rs2._domainkey.mail.juancartagena.cl
```

### 2. Verificar en Resend Dashboard
- Ve a **Domains** en Resend
- `mail.juancartagena.cl` debe mostrar **✅ Verified**
- Todos los registros DNS deben estar ✅

### 3. Verificar Deliverability
- Herramientas online: [mail-tester.com](https://www.mail-tester.com)
- Envía un email de prueba y verifica el score

## 🎯 Migración Futura a acachile.com

Cuando tengas control de `acachile.com`:

### 1. Actualizar Variables de Entorno
```bash
# Cambiar FROM_EMAIL en wrangler.toml
FROM_EMAIL = "noreply@acachile.com"  # o mail.acachile.com
```

### 2. Configurar Nuevo Dominio en Resend
```bash
# Agregar acachile.com en Resend dashboard
# Repetir configuración DNS para el nuevo dominio
```

### 3. Desplegar Cambios
```bash
npx wrangler deploy --env production
```

## 🚨 Importante - Deliverability

Para evitar que los emails caigan en spam:

1. **✅ Configurar todos los registros DNS** (MX, SPF, DKIM, DMARC)
2. **✅ Verificar dominio en Resend** antes de enviar
3. **✅ Usar subdomain dedicado** (`mail.juancartagena.cl` en lugar de `juancartagena.cl`)
4. **✅ Empezar con pocos emails** para construir reputación
5. **✅ Monitorear bounces y complaints**

## 📋 Lista de Verificación

- [ ] Crear cuenta Resend con `juecart@gmail.com`
- [ ] Agregar dominio `mail.juancartagena.cl` en Resend
- [ ] Copiar valores DNS de Resend dashboard
- [ ] Configurar registros DNS en Cloudflare
- [ ] Esperar propagación DNS (5-30 minutos)
- [ ] Verificar dominio en Resend (debe mostrar ✅)
- [ ] Configurar RESEND_API_KEY en Cloudflare Worker
- [ ] Desplegar worker actualizado
- [ ] Probar envío de email de reset password
- [ ] Verificar que email no cae en spam

## 🔗 Enlaces Útiles

- [Resend Dashboard](https://resend.com/dashboard)
- [Cloudflare DNS](https://dash.cloudflare.com)
- [Verificador DNS](https://dnschecker.org/)
- [Test Deliverability](https://www.mail-tester.com/)