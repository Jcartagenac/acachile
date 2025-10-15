# CONFIGURACIÓN DE SECRETOS EN CLOUDFLARE PAGES

## 🎯 Problema Identificado

Solo ves directorios `events/` y `news/` en R2 porque:
1. **Falta configurar R2_PUBLIC_URL** como variable de entorno en Pages
2. **No se han creado las carpetas** `avatars/`, `home/`, `gallery/`
3. **El binding R2 existe** pero necesita configuración adicional

## 🔧 Configuración Requerida

### 1. Variables de Entorno en Cloudflare Pages

Ir a: **Cloudflare Dashboard > Pages > acachile > Settings > Environment Variables**

**Agregar estas variables:**

#### Para Production:
```
R2_PUBLIC_URL = https://pub-85ac8c62baca4966b2ac0b16e1b9b6c6.r2.dev
```

#### Para Preview (opcional):
```
R2_PUBLIC_URL = https://pub-85ac8c62baca4966b2ac0b16e1b9b6c6.r2.dev
```

### 2. Verificar Binding R2

En `wrangler.toml` ya tienes configurado:
```toml
[[r2_buckets]]
binding = "IMAGES"
bucket_name = "aca-chile-images"
```

✅ **Esto está correcto**

### 3. Configurar Acceso Público del Bucket

1. Ir a **Cloudflare Dashboard > R2 Object Storage**
2. Seleccionar bucket `aca-chile-images`
3. Ir a **Settings** 
4. Habilitar **"Allow Access"** para Custom Domains
5. Copiar la URL pública generada

## 🚀 Crear Estructura de Carpetas

### Opción A: Usar la API (Recomendado)

Una vez desplegado, hacer:

```bash
# Crear todas las carpetas
curl -X POST https://acachile.pages.dev/api/init-folders

# Verificar que se crearon
curl -X GET https://acachile.pages.dev/api/init-folders
```

### Opción B: Manual en Cloudflare Dashboard

1. Ir a R2 Object Storage > aca-chile-images
2. Crear archivos placeholder:
   - `avatars/.gitkeep`
   - `home/.gitkeep` 
   - `events/.gitkeep` (ya existe)
   - `news/.gitkeep` (ya existe)
   - `gallery/.gitkeep`

## 📁 Estructura Final Esperada

```
aca-chile-images/
├── avatars/           # 🆕 Para fotos de perfil (200x200px)
│   └── .gitkeep
├── home/              # 🆕 Para banners del home (1200x800px)
│   └── .gitkeep
├── events/            # ✅ Ya existe - eventos (800x600px)
│   └── [archivos existentes]
├── news/              # ✅ Ya existe - noticias (600x400px)
│   └── [archivos existentes]
└── gallery/           # 🆕 Para galería general
    └── .gitkeep
```

## 🔍 Troubleshooting

### Si no ves las carpetas nuevas:

1. **Verificar variables de entorno:**
   ```bash
   # En Pages Functions, verificar que env.R2_PUBLIC_URL existe
   console.log('R2_PUBLIC_URL:', env.R2_PUBLIC_URL);
   ```

2. **Verificar binding:**
   ```bash
   # En Pages Functions, verificar que env.IMAGES existe
   console.log('IMAGES binding:', !!env.IMAGES);
   ```

3. **Probar API manualmente:**
   ```bash
   # Después del deploy
   curl https://acachile.pages.dev/api/init-folders
   ```

### Si las imágenes no se suben:

1. **Verificar CORS en el bucket**
2. **Confirmar que R2_PUBLIC_URL es correcta**
3. **Revisar logs de Cloudflare Pages Functions**

## ⚡ Próximos Pasos

1. **Deploy** los cambios de Functions
2. **Configurar** R2_PUBLIC_URL en Pages Settings
3. **Ejecutar** `/api/init-folders` para crear carpetas
4. **Probar** subida de avatar desde el perfil

## 🎉 Resultado Esperado

- ✅ **5 carpetas** en R2 (avatars, home, events, news, gallery)
- ✅ **URLs permanentes** para todas las imágenes
- ✅ **No más pérdida** de fotos al refrescar (F5)
- ✅ **Organización limpia** por tipo de contenido

---

**🚨 IMPORTANTE**: Una vez configurado R2_PUBLIC_URL en Pages, las imágenes serán completamente persistentes y organizadas.