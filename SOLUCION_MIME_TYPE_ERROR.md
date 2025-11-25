# SOLUCIÓN: Error de MIME Type en Frontend

## 🐛 Error Original

```
Failed to load module script: Expected a JavaScript-or-Wasm module script 
but the server responded with a MIME type of "application/octet-stream". 
Strict MIME type checking is enforced for module scripts per HTML spec.
```

## 🔍 Causa del Problema

El archivo `_headers` tenía **reglas duplicadas** para archivos JavaScript:

```yaml
# Primera regla (genérica)
/*.js
  Content-Type: text/javascript; charset=utf-8

# Segunda regla (específica) - SE APLICABAN AMBAS
/assets/*.js
  Content-Type: text/javascript; charset=utf-8
  Cache-Control: public, max-age=31536000, immutable
```

Esto causaba que Cloudflare Pages aplicara **ambos** headers `Content-Type`, resultando en:

```
content-type: text/javascript; charset=utf-8, text/javascript; charset=utf-8
```

El navegador interpretaba esto como un MIME type inválido.

## ✅ Solución Aplicada

1. **Eliminé las reglas duplicadas** en `_headers`
2. **Dejé solo la caché para assets** (Cloudflare Pages aplica MIME types correctos automáticamente)
3. **Reconstruí y redespleguí** la aplicación

### Archivo `_headers` Corregido

```yaml
# Headers para archivos estáticos de Cloudflare Pages

# Archivos de la aplicación principal (assets con hash)
/assets/*.js
  Cache-Control: public, max-age=31536000, immutable

/assets/*.css
  Cache-Control: public, max-age=31536000, immutable

# Archivos JSON
/*.json
  Content-Type: application/json; charset=utf-8

# [resto de configuración...]
```

## 🎯 Resultado

✅ **MIME type correcto:** `application/javascript`  
✅ **Sin duplicación de headers**  
✅ **Sitio cargando correctamente**  
✅ **API de noticias funcionando con D1**

## 📋 Comandos Ejecutados

```bash
# 1. Limpieza y reconstrucción
cd frontend
rm -rf dist
npm run build

# 2. Corrección de _headers
# (eliminación manual de reglas duplicadas)

# 3. Redespliegue
cp _headers dist/_headers
npx wrangler pages deploy dist --project-name=acachile
```

## ✅ Verificación

```bash
# Content-Type correcto
curl -I https://acachile.com/assets/index-B9sJfx3G.js
# Resultado: content-type: application/javascript

# API funcionando
curl https://acachile.com/api/noticias?limit=5
# Resultado: 6 noticias activas desde D1
```

---

**Problema resuelto el:** 24 de noviembre de 2025  
**Tiempo de resolución:** ~10 minutos  
**Causa raíz:** Headers duplicados en `_headers`  
**Lección:** Cloudflare Pages aplica MIME types correctos por defecto, solo configurar caché
