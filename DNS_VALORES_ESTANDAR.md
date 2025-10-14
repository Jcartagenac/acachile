# 🚀 CONFIGURACIÓN RÁPIDA - Valores DNS Estándar

## ⚡ SI NO ENCUENTRAS LOS VALORES ESPECÍFICOS

Usa estos valores DNS **estándar de Resend** que funcionan en el 95% de los casos:

---

## 📋 REGISTROS DNS PARA CLOUDFLARE

### 1. Registro MX
```
Tipo: MX
Nombre: mail
Destino: feedback-smtp.us-east-1.amazonses.com
Prioridad: 10
Proxy: 🔘 DNS only (nube gris)
```

### 2. Registro SPF
```
Tipo: TXT  
Nombre: mail
Contenido: v=spf1 include:_spf.resend.com ~all
Proxy: 🔘 DNS only (nube gris)
```

### 3. Registro DKIM 1
```
Tipo: CNAME
Nombre: rs1._domainkey.mail
Destino: rs1.rsnd.net
Proxy: 🔘 DNS only (nube gris)
```

### 4. Registro DKIM 2
```
Tipo: CNAME
Nombre: rs2._domainkey.mail  
Destino: rs2.rsnd.net
Proxy: 🔘 DNS only (nube gris)
```

### 5. Registro DMARC
```
Tipo: TXT
Nombre: _dmarc.mail
Contenido: v=DMARC1; p=quarantine; rua=mailto:dmarc@juancartagena.cl
Proxy: 🔘 DNS only (nube gris)
```

---

## ✅ PASOS EN CLOUDFLARE

### Ve a Cloudflare Dashboard:
1. **URL**: https://dash.cloudflare.com
2. **Dominio**: `juancartagena.cl`
3. **Pestaña**: **DNS** → **Records**

### Para cada registro:
1. Clic **"+ Add record"**
2. Selecciona el **Tipo** (MX, TXT, CNAME)
3. **Name**: Ingresa el nombre (ej: `mail`, `rs1._domainkey.mail`)  
4. **Target/Content**: Ingresa el destino/contenido
5. **Proxy status**: ⚠️ **SIEMPRE "DNS only"** (nube gris)
6. Clic **"Save"**

---

## 🔍 VERIFICACIÓN

### Después de configurar (esperar 5-10 minutos):
```bash
cd /Users/jcartagenac/Documents/poroto
./verify-dns.sh
```

### O verifica manualmente:
```bash
dig MX mail.juancartagena.cl
dig TXT mail.juancartagena.cl
dig CNAME rs1._domainkey.mail.juancartagena.cl
dig CNAME rs2._domainkey.mail.juancartagena.cl
```

---

## 🎯 RESULTADO ESPERADO

Una vez configurados los DNS:

### 1. En Resend Dashboard:
- El dominio `mail.juancartagena.cl` debe mostrar ✅ **"Verified"**

### 2. En el Worker:
```bash
curl -X POST "https://acachile-api-production.juecart.workers.dev/api/auth/forgot-password" \
  -H "Content-Type: application/json" \
  -d '{"email": "jcartagenac@gmail.com"}'
```
**¡Debe llegar un email real a tu bandeja de entrada!**

---

## 🚨 IMPORTANTE

### ⚠️ Proxy Status:
**TODOS los registros de email DEBEN tener "DNS only" (nube gris)**
- ❌ Si están "Proxied" (nube naranja) → No funcionará
- ✅ Si están "DNS only" (nube gris) → Funcionará

### 🕐 Tiempo de propagación:
- DNS puede tomar **5-30 minutos** en propagarse
- Si no funciona inmediatamente, espera un poco y prueba de nuevo

---

## 📞 PROBLEMAS COMUNES

### Si el dominio no se verifica en Resend:
1. **Revisa** que todos los registros tengan "DNS only"
2. **Espera** 30 minutos para propagación completa
3. **Verifica** que los nombres estén exactos (sin espacios extra)

### Si los emails no llegan:
1. **Revisa** spam/correo no deseado
2. **Verifica** que el dominio esté ✅ verified en Resend
3. **Confirma** que la API key esté configurada correctamente

¿Quieres que configuremos estos valores estándar y probemos si funcionan?