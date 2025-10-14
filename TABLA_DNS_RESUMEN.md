# TABLA RESUMEN - Registros DNS Cloudflare

## 📋 COPIAR Y PEGAR EN CLOUDFLARE

| # | Tipo | Nombre | Contenido/Destino | Prioridad | Proxy |
|---|------|--------|-------------------|-----------|-------|
| 1 | **MX** | `mail` | `feedback-smtp.us-east-1.amazonses.com` | 10 | 🔘 DNS only |
| 2 | **TXT** | `mail` | `v=spf1 include:_spf.resend.com ~all` | - | 🔘 DNS only |
| 3 | **CNAME** | `rs1._domainkey.mail` | `[COPIAR DE RESEND]` | - | 🔘 DNS only |
| 4 | **CNAME** | `rs2._domainkey.mail` | `[COPIAR DE RESEND]` | - | 🔘 DNS only |
| 5 | **TXT** | `_dmarc.mail` | `v=DMARC1; p=quarantine; rua=mailto:dmarc@juancartagena.cl` | - | 🔘 DNS only |

## 🔑 VALORES IMPORTANTES

### ⚠️ OBTENER DE RESEND DASHBOARD:
- Los valores para **rs1._domainkey** y **rs2._domainkey**
- Tu **API Key** personal

### 📍 CONFIGURACIÓN EN CLOUDFLARE:
1. **Dominio**: `juancartagena.cl`
2. **Proxy Status**: SIEMPRE "DNS only" (nube gris)
3. **TTL**: Auto para todos

## 🎯 ORDEN DE CONFIGURACIÓN:

### 1️⃣ PRIMERO - Crear cuenta Resend
- URL: https://resend.com
- Email: `juecart@gmail.com`

### 2️⃣ SEGUNDO - Agregar dominio en Resend  
- Dashboard → Domains → Add Domain
- Dominio: `mail.juancartagena.cl`

### 3️⃣ TERCERO - Copiar valores DNS de Resend

### 4️⃣ CUARTO - Configurar en Cloudflare
- Usar la tabla de arriba
- Reemplazar `[COPIAR DE RESEND]` con valores reales

### 5️⃣ QUINTO - Configurar API Key
```bash
cd /Users/jcartagenac/Documents/poroto/worker
npx wrangler secret put RESEND_API_KEY --env production
```

### 6️⃣ SEXTO - Verificar
```bash
./verify-dns.sh
```

## ✅ LISTO PARA USAR
Una vez configurado, el sistema enviará emails automáticamente desde `noreply@mail.juancartagena.cl`