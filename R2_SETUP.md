# CONFIGURACIÓN DE CLOUDFLARE R2 PARA ACACHILE
# =============================================

## PASO 1: Crear Bucket en Cloudflare R2

1. Ir a Cloudflare Dashboard > R2 Object Storage
2. Crear nuevo bucket: `acachile-images`
3. Configurar región: Auto (recomendado)

## PASO 2: Configurar Acceso Público

1. En el bucket `acachile-images` > Settings
2. Habilitar "Public URL access"
3. Copiar la URL pública generada (ej: https://pub-xxxxx.r2.dev)

## PASO 3: Crear API Token

1. Ir a Cloudflare Dashboard > R2 > Manage R2 API tokens
2. Crear token con permisos:
   - Object Read
   - Object Write
   - Object Delete
3. Scope: Apply to specific bucket (`acachile-images`)
4. Guardar Access Key ID y Secret Access Key

## PASO 4: Configurar Variables de Entorno

Agregar a tu archivo `.env.local`:

```bash
CLOUDFLARE_ACCOUNT_ID=tu-account-id
R2_ACCESS_KEY_ID=tu-access-key-id  
R2_SECRET_ACCESS_KEY=tu-secret-access-key
R2_BUCKET_NAME=acachile-images
R2_PUBLIC_URL=https://pub-xxxxx.r2.dev
```

## PASO 5: Instalar Dependencias

```bash
npm install @aws-sdk/client-s3
npm install --save-dev @types/node
```

## ESTRUCTURA DE CARPETAS EN R2

```
acachile-images/
├── avatars/           # Avatares de usuario (200x200px)
├── home/              # Imágenes del home (1200x800px)  
├── events/            # Imágenes de eventos (800x600px)
├── news/              # Imágenes de noticias (600x400px)
└── gallery/           # Galería general (alta calidad)
```

## LIMITACIONES Y OPTIMIZACIONES

- **Tamaño máximo**: 20MB por imagen
- **Formatos soportados**: JPG, PNG, WebP
- **Compresión automática**: Avatares a 90% calidad
- **CDN**: R2 incluye CDN global automático
- **Cache**: Headers configurados para 1 año de cache

## MONITOREO Y COSTOS

- **Almacenamiento**: $0.015 por GB/mes
- **Transferencia**: Gratis hasta 10GB/mes por cuenta
- **Operaciones**: $4.50 por millón de operaciones

## TROUBLESHOOTING

1. **Error de CORS**: Configurar CORS en el bucket
2. **403 Forbidden**: Verificar permisos del API token
3. **URL no accesible**: Confirmar que el bucket tiene acceso público
4. **Lentitud**: R2 puede tomar hasta 1 minuto para propagar cambios

## PRODUCCIÓN vs DESARROLLO

- **Desarrollo**: Usar bucket de test
- **Staging**: Bucket separado para testing
- **Producción**: Bucket principal con backup configurado

## BACKUP Y SEGURIDAD

- Habilitar versioning en el bucket
- Configurar lifecycle rules para archivos antiguos
- Monitorear accesos inusuales
- Rotar API keys cada 90 días