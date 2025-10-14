# Configuraciones Recomendadas en Cloudflare Dashboard

## 🎯 Configuraciones OBLIGATORIAS

### 1. Variables de Entorno Secretas
Ya configurado:
- ✅ `JWT_SECRET` - Para autenticación segura

### 2. Configuraciones Pendientes por Hacer

#### En el Dashboard de Cloudflare:

**A) Workers & Pages → acachile-api-staging → Settings → Variables**
Agregar estas variables:
```
ADMIN_EMAIL = tu-email@acachile.com
CORS_ORIGIN = https://acachile.pages.dev,http://localhost:5173
```

**B) Workers & Pages → acachile-api-staging → Settings → Triggers → Custom Domains**
Para el frontend en Cloudflare Pages:
- Frontend URL: `https://acachile.pages.dev`
- API Staging: `https://acachile-api-staging.juecart.workers.dev`
- API Producción: `https://acachile-api-production.juecart.workers.dev`

**C) Workers & Pages → acachile-api-staging → Settings → General → Usage Model**
- Cambiar a "Bundled" si esperas mucho tráfico
- Dejar en "Unbound" para desarrollo

---

## 🚀 Configuraciones OPCIONALES pero Recomendadas

### 1. Analytics y Monitoring
- **Habilitar Real-time Logs**: Workers & Pages → Analytics
- **Configurar Alertas**: Cuando hay errores o uso alto

### 2. Security Headers
- **Rate Limiting**: Configurar límites de requests por IP
- **DDoS Protection**: Ya incluido automáticamente

### 3. Caching y Performance
- **Edge Caching**: Para respuestas estáticas
- **Compression**: Ya habilitado automáticamente

---

## ⚙️ Para Producción (Cuando depliegues)

### Variables de Entorno para Producción:
```bash
# Configurar secrets para producción
wrangler secret put JWT_SECRET --env production
wrangler secret put DATABASE_URL --env production  # Si usas base de datos
```

### URLs del Proyecto:
- **Frontend**: `https://acachile.pages.dev`
- **API Staging**: `https://acachile-api-staging.juecart.workers.dev`
- **API Producción**: `https://acachile-api-production.juecart.workers.dev`
- **Desarrollo Local**: `http://localhost:5173`

---

## 🔧 Comandos Útiles

```bash
# Ver logs en tiempo real
wrangler tail acachile-api-staging

# Ver variables configuradas
wrangler secret list --env staging

# Ver deployments
wrangler deployments list --env staging

# Rollback si algo sale mal
wrangler rollback [version-id] --env staging
```

---

## ✅ Estado Actual

**Lo que YA está configurado:**
- ✅ Worker desplegado en staging
- ✅ KV Namespaces creados
- ✅ JWT_SECRET configurado
- ✅ Script de despliegue funcionando

**Lo que PUEDES configurar opcional:**
- 🔄 Dominio personalizado (si tienes acachile.com)
- 🔄 Variables adicionales (ADMIN_EMAIL, CORS_ORIGIN)
- 🔄 Analytics y monitoreo
- 🔄 Rate limiting

**¡Tu Worker está 100% funcional ahora mismo!** 🎉