# Configuraciones para Cloudflare Pages

## 🚀 URLs de Producción

- **Frontend**: https://acachile.pages.dev
- **API**: https://acachile-api-production.juecart.workers.dev

## ⚙️ Variables de Entorno para Pages

En el dashboard de Cloudflare Pages, configura:

### Production Environment Variables:
```
VITE_API_BASE_URL=https://acachile-api-production.juecart.workers.dev
```

### Preview Environment Variables:
```
VITE_API_BASE_URL=https://acachile-api-staging.juecart.workers.dev
```

## 📦 Build Settings para Pages

```bash
# Build command
npm run build

# Build output directory
frontend/dist

# Root directory
frontend/

# Node.js version
20.x
```

## 🔧 Deploy a Pages

1. Conectar repositorio GitHub a Cloudflare Pages
2. Configurar variables de entorno
3. Cada push a `main` despliega automáticamente

## 🌐 Estructura de URLs

- **Producción**: https://acachile.pages.dev
- **Preview**: https://[hash].acachile.pages.dev
- **API Staging**: https://acachile-api-staging.juecart.workers.dev  
- **API Production**: https://acachile-api-production.juecart.workers.dev