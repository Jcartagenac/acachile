# 🚀 Configuración Automática de Cloudflare R2

## ✅ Estado Actual

**TODO ESTÁ PREPARADO** para migrar las imágenes a Cloudflare R2 de forma completamente automática.

## 📦 ¿Qué tienes disponible?

### 🎯 **Scripts Principales:**

1. **`./setup-r2-master.sh`** - 🎬 **Script maestro que hace todo automáticamente**
2. **`./test-r2-setup.js`** - 🧪 **Validar configuración sin hacer cambios**
3. **`./setup-r2-complete.js`** - 🔧 **Configurar R2 y subir imágenes**  
4. **`./update-urls-to-r2.js`** - 🔄 **Actualizar URLs en el código**

### 📁 **Recursos:**
- ✅ **10 imágenes descargadas** en `temp-images/` (633KB total)
- ✅ **Estructura organizada** (eventos/ y noticias/)
- ✅ **Configuración R2** preparada en `wrangler.toml`
- ✅ **Endpoint `/api/images/`** para gestión futura

## 🚀 Migración en 3 Pasos

### **Paso 1: Obtener Credenciales de Cloudflare**

1. Ve a [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Copia tu **Account ID** (sidebar derecho)
3. Ve a **R2 Object Storage** → **"Manage R2 API tokens"**
4. Crea un token:
   - **Name:** `ACA Chile Images`
   - **Permissions:** `Object Read & Write`
   - **Bucket:** `All buckets`
5. Copia **Access Key ID** y **Secret Access Key**

### **Paso 2: Configurar Variables de Entorno**

```bash
export CLOUDFLARE_ACCOUNT_ID="tu_account_id_aquí"
export R2_ACCESS_KEY_ID="tu_access_key_aquí"
export R2_SECRET_ACCESS_KEY="tu_secret_key_aquí"
```

### **Paso 3: Ejecutar Migración Automática**

```bash
# Opción A: Todo automático (recomendado)
./setup-r2-master.sh

# Opción B: Paso a paso
node test-r2-setup.js          # 1. Validar configuración
node setup-r2-complete.js      # 2. Configurar R2 y subir imágenes
node update-urls-to-r2.js      # 3. Actualizar URLs en código
```

## 🎯 ¿Qué hace la migración automática?

### **Configuración R2:**
- ✅ Crea bucket `aca-chile-images`
- ✅ Configura CORS para acceso web
- ✅ Sube las 10 imágenes con estructura de carpetas

### **Actualización de Código:**
- ✅ Reemplaza URLs de Unsplash con URLs de R2
- ✅ Actualiza `frontend/functions/api/eventos/init.js`
- ✅ Actualiza `frontend/functions/api/noticias/index.js`
- ✅ Verifica compilación exitosa

### **URLs Finales:**
```
Antes: https://images.unsplash.com/photo-xxx...
Después: https://pub-ACCOUNT_ID.r2.dev/aca-chile-images/eventos/xxx.jpg
```

## 📊 Resultado Final

Tendrás:
- 🎯 **Imágenes propias** alojadas en R2
- 🚀 **CDN global** de Cloudflare
- 💰 **Costo mínimo** ($0.015/GB/mes)
- 🔒 **Control total** sobre las imágenes
- ⚡ **Carga rápida** sin dependencias externas

## 🔧 Opcional: Custom Domain

Después de la migración, puedes configurar un dominio personalizado:

1. En R2 bucket → **Settings** → **Custom Domains**
2. Agregar: `images.acachile.com`
3. URLs cambiarían a: `https://images.acachile.com/eventos/xxx.jpg`

## 📋 Después de la Migración

```bash
# Hacer commit y deploy
git add .
git commit -m "feat: Migrar imágenes a Cloudflare R2"
git push origin main

# Verificar en producción
# https://beta.acachile.com
```

## 💡 ¿Necesitas ayuda?

Ejecuta el modo de prueba primero:
```bash
node test-r2-setup.js
```

¡Todo está listo para una migración perfecta! 🔥