# Variables de Entorno - AcaChile

## 📋 Resumen

Este documento describe la configuración completa de variables de entorno y secretos para el proyecto AcaChile desplegado en Cloudflare Pages.

## 🛠️ Estado Actual

### ✅ Variables Configuradas

| Variable | Tipo | Estado | Descripción |
|----------|------|---------|-------------|
| `ENVIRONMENT` | Pública | ✅ Configurada | Entorno de ejecución (production) |
| `FRONTEND_URL` | Pública | ✅ Configurada | URL del frontend (https://acachile.pages.dev) |
| `CORS_ORIGIN` | Pública | ✅ Configurada | Origen permitido para CORS |
| `FROM_EMAIL` | Pública | ✅ Configurada | Email remitente del sistema |
| `ADMIN_EMAIL` | Pública | ✅ Configurada | Email del administrador |
| `JWT_SECRET` | Secreto | ✅ Configurado | Clave secreta para JWT (32 caracteres hex) |
| `RESEND_API_KEY` | Secreto | ⚠️ Temporal | API key de Resend (actualmente temporal) |

### 🔗 Bindings Automáticos

| Binding | Tipo | Estado | Descripción |
|---------|------|---------|-------------|
| `DB` | D1 Database | ✅ Funcionando | Base de datos SQLite |
| `ACA_KV` | KV Namespace | ✅ Funcionando | Almacenamiento clave-valor |

## 📁 Archivos de Configuración

### Frontend (Variables VITE_*)
```bash
# .env.production
VITE_API_BASE_URL=https://acachile.pages.dev
VITE_ENVIRONMENT=production
FRONTEND_URL=https://acachile.pages.dev
CORS_ORIGIN=https://acachile.pages.dev

# .env.development  
VITE_API_BASE_URL=http://localhost:8787
VITE_ENVIRONMENT=development
FRONTEND_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173

# .env.local
VITE_API_BASE_URL=http://localhost:8787
VITE_ENVIRONMENT=development
FRONTEND_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173
```

### Backend (wrangler.toml)
```toml
[env.production.vars]
ENVIRONMENT = "production"
CORS_ORIGIN = "https://acachile.pages.dev"
FRONTEND_URL = "https://acachile.pages.dev"
FROM_EMAIL = "noreply@mail.juancartagena.cl"
ADMIN_EMAIL = "admin@acachile.cl"
```

## 🚀 Comandos de Configuración

### Listar Secretos Actuales
```bash
cd frontend
wrangler pages secret list --project-name acachile
```

### Configurar JWT_SECRET
```bash
# Generar clave segura
openssl rand -hex 32

# Configurar en Cloudflare Pages
echo "tu_jwt_secret_de_32_caracteres" | wrangler pages secret put JWT_SECRET --project-name acachile
```

### Configurar RESEND_API_KEY
```bash
# Obtener API key de https://resend.com/api-keys
# Configurar en Cloudflare Pages
echo "re_tu_resend_api_key" | wrangler pages secret put RESEND_API_KEY --project-name acachile
```

## 🧪 Verificación

### API de Bindings
```bash
curl https://acachile.pages.dev/api/bindings
```

### Health Check
```bash
curl https://acachile.pages.dev/api/health
```

### Búsqueda (Verificar funcionamiento)
```bash
curl "https://acachile.pages.dev/api/search?q=ajedrez&type=all&limit=5"
```

## 📈 Entornos

### Producción
- **URL**: https://acachile.pages.dev
- **Variables**: Configuradas en Cloudflare Pages
- **Secretos**: JWT_SECRET, RESEND_API_KEY

### Desarrollo Local
- **URL**: http://localhost:8787 (backend) + http://localhost:5173 (frontend)
- **Variables**: Desde .env.local
- **Secretos**: No necesarios para desarrollo básico

### Staging (Futuro)
- **URL**: https://staging-acachile.pages.dev
- **Variables**: Copiar configuración de producción
- **Secretos**: Usar mismos secretos o generar nuevos

## 🔐 Seguridad

### Secretos Configurados
- ✅ `JWT_SECRET`: 32 caracteres hexadecimales generados con OpenSSL
- ⚠️ `RESEND_API_KEY`: Temporal, reemplazar con clave real de Resend

### URLs Configurables
- ✅ Todas las URLs ahora usan variables de entorno
- ✅ No hay URLs hardcodeadas en el código
- ✅ Fácil cambio entre entornos

### Variables Públicas vs Secretos
- **Variables Públicas**: Se incluyen en el bundle del frontend (VITE_*)
- **Secretos**: Solo disponibles en el backend (JWT_SECRET, RESEND_API_KEY)

## 🚧 Próximos Pasos

1. **Obtener RESEND_API_KEY real**:
   - Crear cuenta en https://resend.com
   - Generar API key
   - Configurar con: `echo "re_real_key" | wrangler pages secret put RESEND_API_KEY --project-name acachile`

2. **Configurar Staging**:
   - Crear branch de staging
   - Configurar variables para staging
   - Probar funcionalidad completa

3. **Monitoreo**:
   - Verificar logs en Cloudflare Pages Dashboard
   - Configurar alertas para errores de API
   - Monitorear uso de bindings

## 📚 Referencias

- [Cloudflare Pages Environment Variables](https://developers.cloudflare.com/pages/functions/bindings/)
- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler/)
- [Resend API Documentation](https://resend.com/docs)

---

**Última actualización**: Octubre 15, 2025  
**Estado**: ✅ Configuración básica completa, funcionalidad verificada