# 📸 Configuración de Cloudflare R2 para Imágenes ACA Chile

## 🎯 Objetivo
Migrar todas las imágenes del sitio a Cloudflare R2 para mejor rendimiento, control y costos.

## 📋 Pasos de Configuración

### 1. Crear Bucket R2 en Cloudflare

1. Ve a **Cloudflare Dashboard** → **R2 Object Storage**
2. Haz clic en **"Create bucket"**
3. Nombre: `aca-chile-images`
4. Ubicación: **Automatic** (recomendado)
5. Haz clic en **"Create bucket"**

### 2. Generar API Token para R2

1. En R2 Dashboard, haz clic en **"Manage R2 API tokens"**
2. Haz clic en **"Create API token"**
3. Configuración:
   - **Token name**: `ACA-Images-Upload`
   - **Permissions**: `Object Read & Write`
   - **Bucket**: `aca-chile-images`
4. Copia las credenciales generadas

### 3. Configurar Variables de Entorno

Agrega estas variables en **Cloudflare Pages → Settings → Environment Variables**:

```bash
# Production Environment
CLOUDFLARE_ACCOUNT_ID=tu_account_id_aquí
R2_ACCESS_KEY_ID=tu_access_key_aquí  
R2_SECRET_ACCESS_KEY=tu_secret_key_aquí
R2_BUCKET_NAME=aca-chile-images
R2_PUBLIC_URL=https://pub-TU_ACCOUNT_ID.r2.dev/aca-chile-images
```

### 4. Configurar Custom Domain (Recomendado)

1. En el bucket `aca-chile-images` → **Settings** → **Custom Domains**
2. Haz clic en **"Connect Domain"**
3. Dominio: `images.acachile.com`
4. Cloudflare configurará automáticamente el DNS
5. Actualizar `R2_PUBLIC_URL` a: `https://images.acachile.com`

### 5. Subir Imágenes Existentes

**Opción A: Manual (Cloudflare Dashboard)**
1. Ve al bucket `aca-chile-images`
2. Crea carpetas: `eventos/` y `noticias/`
3. Sube manualmente los archivos de `temp-images/`

**Opción B: Script automatizado**
```bash
# Configurar variables locales
export CLOUDFLARE_ACCOUNT_ID="tu_account_id"
export R2_ACCESS_KEY_ID="tu_access_key"  
export R2_SECRET_ACCESS_KEY="tu_secret_key"

# Ejecutar script de subida
node upload-to-r2.js
```

### 6. Actualizar URLs en el Código

Una vez subidas las imágenes, actualizar en:

**frontend/functions/api/eventos/init.js**:
```javascript
image: "https://images.acachile.com/eventos/campeonato-nacional-asado.jpg"
```

**frontend/functions/api/noticias/index.js**:
```javascript
image: "https://images.acachile.com/noticias/mundial-barbacoa-2024.jpg"
```

## 📁 Estructura Final en R2

```
aca-chile-images/
├── eventos/
│   ├── campeonato-nacional-asado.jpg
│   ├── taller-principiantes-asado.jpg
│   ├── encuentro-asadores.jpg
│   ├── competencia-rapida.jpg
│   └── masterclass-parrilla.jpg
└── noticias/
    ├── mundial-barbacoa-2024.jpg
    ├── curso-basico-asado.jpg
    ├── campeonato-regional-asadores.jpg
    ├── centro-excelencia-valparaiso.jpg
    └── masterclass-patagonico.jpg
```

## 🔄 URLs Antes vs Después

**Antes (Unsplash - temporal):**
```
https://images.unsplash.com/photo-xxx?w=600&h=400...
```

**Después (R2 con custom domain):**
```
https://images.acachile.com/eventos/campeonato-nacional-asado.jpg
```

## 💰 Beneficios

- ✅ **Costo**: R2 es muy económico ($0.015/GB/mes)
- ✅ **Rendimiento**: CDN global de Cloudflare
- ✅ **Control**: Imágenes propias, no dependencia externa
- ✅ **Escalabilidad**: Sin límites de ancho de banda
- ✅ **Integración**: Nativa con Cloudflare Pages

## 🚀 Próximos Pasos

1. **Configurar R2** según pasos arriba
2. **Subir imágenes** manualmente o con script
3. **Actualizar URLs** en el código
4. **Hacer commit y deploy**
5. **Verificar** que todo funciona correctamente

## 📝 Notas

- Las imágenes ya están descargadas en `temp-images/`
- El endpoint `/api/images/` está preparado para manejar R2
- Se puede configurar cache headers y optimizaciones adicionales
- Se puede agregar upload directo desde el admin panel