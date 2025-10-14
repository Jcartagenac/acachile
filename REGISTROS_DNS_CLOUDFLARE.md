# Registros DNS EXACTOS para Cloudflare - juancartagena.cl

## 🎯 PASOS PREVIOS (OBLIGATORIOS)

### 1. Crear cuenta en Resend
- Ve a: https://resend.com
- Regístrate con: `juecart@gmail.com`
- Confirma tu email

### 2. Agregar dominio en Resend
- Dashboard → **Domains** → **Add Domain**
- Ingresa: `mail.juancartagena.cl`
- **¡IMPORTANTE!** Copia los valores DNS que te dé Resend

---

## 📋 REGISTROS DNS EN CLOUDFLARE

### Acceso a Cloudflare DNS
1. Ve a: https://dash.cloudflare.com
2. Selecciona el dominio: **juancartagena.cl**
3. Pestaña: **DNS** → **Records**

---

## 🔧 REGISTROS A AGREGAR

### Registro 1: MX (Mail Exchange)
```
Tipo: MX
Nombre: mail
Destino: feedback-smtp.us-east-1.amazonses.com
Prioridad: 10
TTL: Auto
Proxy: 🔘 DNS only (gray cloud)
```

### Registro 2: TXT - SPF (Sender Policy Framework)
```
Tipo: TXT
Nombre: mail
Contenido: v=spf1 include:_spf.resend.com ~all
TTL: Auto
```

### Registro 3: CNAME - DKIM 1
```
Tipo: CNAME  
Nombre: rs1._domainkey.mail
Destino: [VALOR DE RESEND - algo como rs1.rsnd.net]
TTL: Auto
Proxy: 🔘 DNS only (gray cloud)
```

### Registro 4: CNAME - DKIM 2  
```
Tipo: CNAME
Nombre: rs2._domainkey.mail  
Destino: [VALOR DE RESEND - algo como rs2.rsnd.net]
TTL: Auto
Proxy: 🔘 DNS only (gray cloud)
```

### Registro 5: TXT - DMARC
```
Tipo: TXT
Nombre: _dmarc.mail
Contenido: v=DMARC1; p=quarantine; rua=mailto:dmarc@juancartagena.cl
TTL: Auto
```

---

## ⚠️ VALORES IMPORTANTES DE RESEND

Los valores para DKIM (rs1 y rs2) **DEBES copiarlos desde tu dashboard de Resend**.

**En Resend Dashboard verás algo así:**

```
DKIM Records:
rs1._domainkey.mail.juancartagena.cl → rs1.abc123def456.resend.com
rs2._domainkey.mail.juancartagena.cl → rs2.abc123def456.resend.com
```

**USA ESOS VALORES**, no los genéricos que puse arriba.

---

## 📱 PROCESO PASO A PASO EN CLOUDFLARE

### Para cada registro:
1. Clic **+ Add record**
2. Selecciona el **Tipo** (MX, TXT, CNAME)
3. En **Name** pon el nombre (ej: `mail`, `rs1._domainkey.mail`)
4. En **Target/Content** pon el destino/contenido
5. **Proxy status**: Siempre **DNS only** (nube gris) para emails
6. Clic **Save**

---

## ✅ VERIFICACIÓN

### Paso 1: Esperar propagación DNS (5-30 minutos)
```bash
# Ejecutar desde tu terminal:
cd /Users/jcartagenac/Documents/poroto
./verify-dns.sh
```

### Paso 2: Verificar en Resend Dashboard
- Ve a **Domains** en Resend
- `mail.juancartagena.cl` debe mostrar **✅ Verified**

### Paso 3: Configurar API Key en Worker
```bash
cd /Users/jcartagenac/Documents/poroto/worker
npx wrangler secret put RESEND_API_KEY --env production
# Pega tu API key de Resend cuando te lo pida
```

---

## 🔍 VERIFICACIÓN MANUAL

Puedes verificar cada registro con estos comandos:

```bash
# MX Record
dig MX mail.juancartagena.cl

# SPF Record  
dig TXT mail.juancartagena.cl

# DKIM Records
dig CNAME rs1._domainkey.mail.juancartagena.cl
dig CNAME rs2._domainkey.mail.juancartagena.cl

# DMARC Record
dig TXT _dmarc.mail.juancartagena.cl
```

---

## 🚨 ERRORES COMUNES

❌ **Error 1**: Usar proxy (nube naranja) en registros de email
✅ **Solución**: Siempre usar "DNS only" (nube gris)

❌ **Error 2**: No usar los valores exactos de Resend para DKIM
✅ **Solución**: Copiar valores exactos del dashboard de Resend

❌ **Error 3**: Poner el dominio completo en "Name"
✅ **Solución**: Solo poner la parte antes del dominio principal
   - ❌ `mail.juancartagena.cl`
   - ✅ `mail`

---

## 📞 SI NECESITAS AYUDA

1. **Screenshots**: Toma capturas de tu dashboard de Resend con los valores DNS
2. **Verifica**: Que todos los registros estén con "DNS only" (nube gris)
3. **Espera**: La propagación DNS puede tomar hasta 30 minutos
4. **Prueba**: Usa el script `verify-dns.sh` para verificar

---

## 🎯 RESULTADO ESPERADO

Después de configurar todo correctamente:

1. ✅ Resend dashboard muestra dominio verificado
2. ✅ Script `verify-dns.sh` muestra todos los registros
3. ✅ Emails de reset password se envían correctamente
4. ✅ Emails no caen en spam

¿Te ayudo con algún paso específico una vez que hagas la configuración?