# Configuración de Secretos para Workers

## 🔐 Secretos Configurados

### CORS_ORIGIN
**Valor**: `https://beta.acachile.com,http://localhost:5173,http://localhost:5174`
**Propósito**: Define qué dominios pueden hacer requests CORS a la API
**Status**: ✅ Configurado en staging

### JWT_SECRET  
**Valor**: `[secret-value-for-jwt-tokens]`
**Propósito**: Clave secreta para firmar/verificar tokens JWT
**Status**: ✅ Configurado en staging

## 🚀 Para configurar en PRODUCCIÓN:

```bash
cd worker

# JWT Secret (usa una clave diferente y más segura)
wrangler secret put JWT_SECRET --env production

# CORS Origins (solo el dominio de producción)
wrangler secret put CORS_ORIGIN --env production
# Valor: https://beta.acachile.com
```

## 🔧 Opcional - Secretos adicionales:

```bash
# Email del administrador
wrangler secret put ADMIN_EMAIL --env staging
wrangler secret put ADMIN_EMAIL --env production
# Valor: admin@acachile.com

# Base de datos (si usas una)
wrangler secret put DATABASE_URL --env production
```

## ✅ Verificar secretos:
```bash
wrangler secret list --env staging
wrangler secret list --env production
```