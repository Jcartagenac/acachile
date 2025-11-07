# Configuración de Variables de Entorno en Cloudflare Pages

## 🎯 Variables Críticas para Cambio de Dominio

Para cambiar el dominio del sitio, **solo necesitas actualizar estas variables en Cloudflare Pages Dashboard**. No es necesario modificar el código.

### Ubicación en Cloudflare Pages

1. Ve a tu proyecto en Cloudflare Pages
2. **Settings** → **Environment variables**
3. Configura las siguientes variables para **Production** y **Preview**

---

## 📋 Variables Requeridas

### Frontend (Variables Vite - prefijo `VITE_`)

Estas variables son inyectadas en el build del frontend por Vite:

```bash
# URL principal del sitio (usado por servicios API)
VITE_API_BASE_URL=https://beta.acachile.com

# Dominio sin protocolo (usado para validaciones)
VITE_DOMAIN=beta.acachile.com

# URL pública del bucket R2 para imágenes
VITE_R2_PUBLIC_URL=https://images.acachile.com

# Entorno (production/preview/development)
VITE_ENVIRONMENT=production
```

### Backend (Pages Functions)

Estas variables son usadas por las funciones de Cloudflare Pages:

```bash
# URL del frontend (usado en emails, redirects, etc.)
FRONTEND_URL=https://beta.acachile.com

# Origen permitido para CORS
CORS_ORIGIN=https://beta.acachile.com

# URL pública del bucket R2 (para generar URLs de imágenes)
R2_PUBLIC_URL=https://images.acachile.com

# Email configuration
FROM_EMAIL=noreply@mail.juancartagena.cl
ADMIN_EMAIL=admin@acachile.cl
```

---

## 🔄 Cómo Cambiar el Dominio

### Opción 1: Cambiar a un nuevo dominio (ej: www.acachile.com)

En Cloudflare Pages Dashboard, actualiza **todas** estas variables:

```bash
# Frontend
VITE_API_BASE_URL=https://www.acachile.com
VITE_DOMAIN=www.acachile.com
VITE_R2_PUBLIC_URL=https://images.acachile.com

# Backend
FRONTEND_URL=https://www.acachile.com
CORS_ORIGIN=https://www.acachile.com
R2_PUBLIC_URL=https://images.acachile.com
```

### Opción 2: Volver a Pages URL (ej: acachile.pages.dev)

```bash
# Frontend
VITE_API_BASE_URL=https://acachile.pages.dev
VITE_DOMAIN=acachile.pages.dev
VITE_R2_PUBLIC_URL=https://images.acachile.pages.dev

# Backend
FRONTEND_URL=https://acachile.pages.dev
CORS_ORIGIN=https://acachile.pages.dev
R2_PUBLIC_URL=https://images.acachile.pages.dev
```

---

## ⚙️ Pasos Completos para Cambiar Dominio

### 1. Configurar Custom Domain en Cloudflare Pages

```bash
# En Cloudflare Pages:
Settings → Custom domains → Add custom domain
# Agrega: www.acachile.com (o tu dominio preferido)
```

### 2. Configurar DNS

Si tu dominio está en Cloudflare DNS, se configurará automáticamente.
Si está en otro proveedor, agrega un CNAME:

```
www.acachile.com → acachile.pages.dev
```

### 3. Actualizar Variables de Entorno

En Cloudflare Pages → Settings → Environment variables:

**Para Production:**
- Actualiza todas las variables listadas arriba con el nuevo dominio

**Para Preview (opcional):**
- Puedes usar el mismo dominio o uno diferente para previews

### 4. Configurar R2 Custom Domain (para imágenes)

```bash
# En Cloudflare R2:
R2 → aca-chile-images → Settings → Public access → Custom domain
# Agrega: images.acachile.com
```

### 5. Forzar Rebuild

```bash
# En Cloudflare Pages:
Deployments → View details → Retry deployment
```

---

## 🧪 Verificar la Configuración

Después del deploy, verifica que todo funcione:

```bash
# Health check
curl https://TU-DOMINIO.com/api/health | jq .

# Verificar bindings
curl https://TU-DOMINIO.com/api/bindings | jq .

# Verificar que las imágenes carguen
curl -I https://images.TU-DOMINIO.com/eventos/test.jpg
```

---

## 📝 Variables de Entorno Adicionales (Secrets)

Estas variables **NO deben estar en .env** por seguridad:

```bash
# JWT Secret (REQUERIDO)
JWT_SECRET=tu-secret-super-seguro-minimo-32-caracteres

# Cloudflare API (para purge de cache)
CLOUDFLARE_API_TOKEN=tu-api-token
CLOUDFLARE_ZONE_ID=tu-zone-id

# Email (Resend API)
RESEND_API_KEY=re_xxxxxxxxxxxxx
```

---

## 🔍 Troubleshooting

### Problema: El sitio sigue usando el dominio antiguo

**Solución:**
1. Verifica que las variables estén configuradas en Cloudflare Pages (no solo en .env local)
2. Fuerza un nuevo deployment
3. Limpia la caché del navegador (Ctrl+Shift+R o Cmd+Shift+R)

### Problema: Las imágenes no cargan

**Solución:**
1. Verifica que `VITE_R2_PUBLIC_URL` y `R2_PUBLIC_URL` estén actualizados
2. Verifica que el custom domain esté configurado en R2
3. Verifica que el CORS esté configurado en el bucket R2

### Problema: CORS errors

**Solución:**
1. Actualiza `CORS_ORIGIN` en Cloudflare Pages
2. Si usas múltiples dominios, configura `CORS_ORIGIN=*` temporalmente para testing

---

## 📚 Archivos de Configuración

Los siguientes archivos **NO necesitan ser modificados** para cambiar el dominio:

- ✅ `frontend/src/config/env.ts` - Lee automáticamente las variables de entorno
- ✅ `frontend/src/services/*.ts` - Usan la configuración centralizada
- ✅ `frontend/wrangler.toml` - Solo para desarrollo local
- ✅ `frontend/.env.production` - Solo fallbacks, las reales están en Cloudflare Pages

---

## 🎉 Resumen

**Para cambiar el dominio en producción:**

1. Configura el custom domain en Cloudflare Pages
2. Actualiza las 6 variables de entorno en Cloudflare Pages Dashboard
3. Configura el custom domain en R2 (para imágenes)
4. Fuerza un rebuild
5. ¡Listo! 🚀

No es necesario tocar el código ni hacer commits para cambiar el dominio.
