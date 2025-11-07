# Guía de Migración Completa - Cloudflare Account Transfer

## 📋 Resumen

Este paquete de migración permite transferir completamente el proyecto ACA Chile de una cuenta de Cloudflare a otra, incluyendo:

- ✅ **D1 Database** - Estructura y datos completos
- ✅ **R2 Bucket** - Todas las imágenes y archivos
- ✅ **KV Namespace** - Configuraciones y caché
- ✅ **Cloudflare Pages** - Configuración del proyecto
- ✅ **Variables y Secrets** - Configuración de entorno

---

## 🚀 Proceso Completo de Migración

### FASE 1: Preparación y Exportación (Cuenta Actual)

#### 1.1 Verificar cuenta actual

```bash
wrangler whoami
```

Asegúrate de estar en la cuenta **ACTUAL** (origen).

#### 1.2 Guardar API Keys y Secrets

⚠️ **IMPORTANTE**: Guarda estos valores antes de continuar:

```bash
# Listar secrets actuales (no mostrará valores)
wrangler pages secret list --project-name=acachile

# Debes tener guardados:
# - RESEND_API_KEY
# - GOOGLE_MAPS_API_KEY
```

Guarda estos valores en un lugar seguro (gestor de contraseñas).

#### 1.3 Ejecutar exportación completa

```bash
chmod +x migration-installer.sh
./migration-installer.sh
```

Este script:
- ✅ Exporta estructura de D1 Database
- ✅ Exporta datos de todas las tablas
- ✅ Lista objetos en R2 Bucket
- ✅ Exporta configuración de KV
- ✅ Guarda toda la configuración
- ✅ Genera scripts de instalación

**Tiempo estimado**: 5-10 minutos

#### 1.4 Exportación detallada de base de datos (Opcional)

Para una exportación más completa con SQL dumps:

```bash
chmod +x export-database-complete.sh
./export-database-complete.sh
```

---

### FASE 2: Cambio de Cuenta

#### 2.1 Cerrar sesión en cuenta actual

```bash
wrangler logout
```

#### 2.2 Autenticarse en cuenta nueva

```bash
wrangler login
```

Se abrirá tu navegador. Inicia sesión con la cuenta **NUEVA** (destino).

#### 2.3 Verificar cuenta nueva

```bash
wrangler whoami
```

Confirma que estás en la cuenta **NUEVA**.

---

### FASE 3: Instalación en Cuenta Nueva

#### 3.1 Navegar al directorio de exportación

```bash
cd cloudflare-export
```

#### 3.2 Ejecutar instalador

```bash
chmod +x install-in-new-account.sh
./install-in-new-account.sh
```

Este script creará automáticamente:
1. ✅ Nueva D1 Database con el mismo nombre
2. ✅ Nuevo R2 Bucket
3. ✅ Nuevo KV Namespace (producción y preview)
4. ✅ Archivo `wrangler.toml` actualizado con nuevos IDs
5. ✅ Aplicación de migraciones SQL

**Tiempo estimado**: 3-5 minutos

#### 3.3 Actualizar configuración del proyecto

```bash
cd ../frontend

# Respaldar configuración antigua
cp wrangler.toml wrangler.toml.backup

# Usar nueva configuración
cp wrangler.toml.new wrangler.toml
```

---

### FASE 4: Importación de Datos

#### 4.1 Importar datos a D1 Database

Opción A - Automática (si hay SQL dumps):
```bash
cd ../cloudflare-export

# Importar datos de cada tabla
for sql_file in ./database/sql-dumps/*.sql; do
    echo "Importando: $sql_file"
    wrangler d1 execute acachile-db --remote --file="$sql_file"
done
```

Opción B - Manual (revisar y ejecutar):
```bash
# Ver datos exportados
cat ./database/usuarios_full.json
cat ./database/socios_full.json
cat ./database/noticias_full.json

# Importar usando el script helper
./import-database-data.sh
```

#### 4.2 Verificar datos importados

```bash
# Contar registros en cada tabla
wrangler d1 execute acachile-db --remote \
  --command="SELECT name, (SELECT COUNT(*) FROM sqlite_master s2 WHERE s2.name=s1.name) as count FROM sqlite_master s1 WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%'"
```

---

### FASE 5: Migración de Imágenes R2

#### 5.1 Instalar Rclone (si no está instalado)

```bash
# macOS
brew install rclone

# Verificar instalación
rclone version
```

#### 5.2 Configurar Rclone para ambas cuentas

```bash
rclone config
```

Configurar dos perfiles:
- `cloudflare-old`: Cuenta antigua
- `cloudflare-new`: Cuenta nueva

Necesitarás para cada una:
- Account ID
- Access Key ID (R2 API Token)
- Secret Access Key

[Ver guía oficial](https://developers.cloudflare.com/r2/examples/rclone/)

#### 5.3 Migrar imágenes

```bash
# Sync completo de bucket
rclone sync cloudflare-old:aca-chile-images cloudflare-new:aca-chile-images -P --checksum

# Verificar migración
rclone ls cloudflare-new:aca-chile-images
```

**Alternativa sin Rclone**: Descargar y volver a subir

```bash
# Descargar todas las imágenes
cd ../temp-images
wrangler r2 object get aca-chile-images --remote --file=./

# Cambiar a cuenta nueva y subir
# (requiere script adicional para bulk upload)
```

---

### FASE 6: Configurar Variables y Secrets

#### 6.1 Configurar Secrets en Pages

```bash
cd ../frontend

# RESEND_API_KEY
wrangler pages secret put RESEND_API_KEY --project-name=acachile
# Ingresa el valor guardado

# GOOGLE_MAPS_API_KEY
wrangler pages secret put GOOGLE_MAPS_API_KEY --project-name=acachile
# Ingresa el valor guardado
```

#### 6.2 Verificar variables de entorno

Las variables en `wrangler.toml` se configuran automáticamente:
- `ENVIRONMENT`
- `CORS_ORIGIN`
- `FRONTEND_URL`
- `FROM_EMAIL`
- `ADMIN_EMAIL`

---

### FASE 7: Despliegue y Verificación

#### 7.1 Instalar dependencias

```bash
cd frontend
npm install
```

#### 7.2 Build del proyecto

```bash
npm run build
```

#### 7.3 Desplegar a Cloudflare Pages

```bash
npm run deploy
```

O usando Wrangler directamente:
```bash
wrangler pages deploy dist --project-name=acachile
```

#### 7.4 Verificar deployment

```bash
# Verificar health endpoint
curl https://beta.acachile.com/api/health | jq .

# Verificar bindings
curl https://beta.acachile.com/api/bindings | jq .
```

Respuesta esperada:
```json
{
  "status": "healthy",
  "bindings": {
    "DB": "connected",
    "IMAGES": "connected",
    "ACA_KV": "connected"
  }
}
```

---

### FASE 8: Configuración de Dominio (Opcional)

#### 8.1 Añadir dominio personalizado

En Cloudflare Dashboard:
1. Ve a **Pages** > **acachile** > **Custom domains**
2. Añade tu dominio: `www.acachile.cl`
3. Configura registros DNS

#### 8.2 Configurar DNS

Añade estos registros en tu zona DNS:

```
Type: CNAME
Name: www
Target: beta.acachile.com
Proxy: Enabled (orange cloud)
```

```
Type: CNAME
Name: @
Target: beta.acachile.com
Proxy: Enabled (orange cloud)
```

#### 8.3 Configurar SSL/TLS

En Cloudflare Dashboard:
1. Ve a **SSL/TLS** > **Overview**
2. Selecciona: **Full (strict)**

---

## ✅ Checklist de Migración

### Pre-migración
- [ ] Backup de API keys y secrets guardado
- [ ] Cuenta actual verificada con `wrangler whoami`
- [ ] Script de exportación ejecutado
- [ ] Todos los datos exportados correctamente

### Durante migración
- [ ] Cambio de cuenta completado
- [ ] Nueva cuenta verificada
- [ ] Recursos creados en cuenta nueva:
  - [ ] D1 Database
  - [ ] R2 Bucket
  - [ ] KV Namespace
- [ ] `wrangler.toml` actualizado

### Post-migración
- [ ] Datos importados a D1
- [ ] Imágenes migradas a R2
- [ ] Secrets configurados en Pages
- [ ] Proyecto desplegado
- [ ] Health check pasando
- [ ] Dominio configurado (si aplica)
- [ ] SSL/TLS configurado

---

## 🔍 Verificación de Componentes

### Verificar D1 Database

```bash
# Listar bases de datos
wrangler d1 list

# Verificar tablas
wrangler d1 execute acachile-db --remote \
  --command="SELECT name FROM sqlite_master WHERE type='table'"

# Contar registros
wrangler d1 execute acachile-db --remote \
  --command="SELECT COUNT(*) FROM usuarios"
```

### Verificar R2 Bucket

```bash
# Listar buckets
wrangler r2 bucket list

# Contar objetos en bucket
wrangler r2 object list aca-chile-images | wc -l

# Ver archivos específicos
wrangler r2 object list aca-chile-images --prefix="eventos/"
```

### Verificar KV Namespace

```bash
# Listar namespaces
wrangler kv:namespace list

# Listar claves (si hay)
wrangler kv:key list --namespace-id=YOUR_NEW_KV_ID
```

### Verificar Pages Deployment

```bash
# Listar deployments
wrangler pages deployment list --project-name=acachile

# Ver logs
wrangler pages deployment tail --project-name=acachile
```

---

## 🆘 Troubleshooting

### Error: "Database not found"

```bash
# Verificar que la DB existe
wrangler d1 list

# Verificar ID en wrangler.toml
grep -A 2 "d1_databases" frontend/wrangler.toml
```

### Error: "Bucket not found"

```bash
# Listar buckets disponibles
wrangler r2 bucket list

# Verificar nombre en wrangler.toml
grep -A 2 "r2_buckets" frontend/wrangler.toml
```

### Error: "Failed to fetch" en frontend

Verificar CORS en R2:
```bash
wrangler r2 bucket cors get aca-chile-images
```

### Error de autenticación

```bash
# Re-autenticar
wrangler logout
wrangler login
wrangler whoami
```

### Deployment falla

```bash
# Verificar build localmente
npm run build

# Ver logs detallados
wrangler pages deploy dist --project-name=acachile --verbose
```

---

## 📊 Comparación Cuenta Antigua vs Nueva

### IDs Originales (Cuenta Antigua)

```toml
# D1 Database
database_id = "086f0530-48b6-41db-95ab-77bce733f0df"

# KV Namespace
id = "60fff9f10819406cad241e326950f056"
preview_id = "deda506587a1476a96578cb545f0128e"

# R2 Bucket
bucket_name = "aca-chile-images"
```

### IDs Nuevos (Cuenta Nueva)

Los IDs nuevos se generan automáticamente y se guardan en:
- `./cloudflare-export/database/new-db-id.txt`
- `./cloudflare-export/kv/new-kv-id.txt`
- `./cloudflare-export/kv/new-kv-preview-id.txt`

---

## 📚 Recursos Adicionales

- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
- [Cloudflare R2 Documentation](https://developers.cloudflare.com/r2/)
- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler/)
- [Rclone with R2](https://developers.cloudflare.com/r2/examples/rclone/)

---

## 🎯 Comandos Rápidos de Referencia

```bash
# Exportar datos
./migration-installer.sh
./export-database-complete.sh

# Cambiar cuenta
wrangler logout && wrangler login

# Instalar en nueva cuenta
cd cloudflare-export && ./install-in-new-account.sh

# Importar datos
cd cloudflare-export
for f in ./database/sql-dumps/*.sql; do wrangler d1 execute acachile-db --remote --file="$f"; done

# Migrar imágenes
rclone sync cloudflare-old:aca-chile-images cloudflare-new:aca-chile-images -P

# Configurar secrets
cd frontend
wrangler pages secret put RESEND_API_KEY --project-name=acachile
wrangler pages secret put GOOGLE_MAPS_API_KEY --project-name=acachile

# Desplegar
npm run build && npm run deploy

# Verificar
curl https://beta.acachile.com/api/health | jq .
```

---

## ⏱️ Tiempo Estimado Total

- Exportación: **5-10 minutos**
- Cambio de cuenta: **2 minutos**
- Instalación: **3-5 minutos**
- Importación de datos: **5-10 minutos**
- Migración de imágenes: **10-30 minutos** (depende del tamaño)
- Configuración y deploy: **5-10 minutos**

**Total**: **30-67 minutos** aproximadamente

---

## ✨ ¡Migración Completa!

Una vez completados todos los pasos, tu proyecto ACA Chile estará funcionando completamente en la nueva cuenta de Cloudflare con:

- ✅ Base de datos migrada
- ✅ Imágenes migradas
- ✅ Configuración actualizada
- ✅ Aplicación desplegada
- ✅ Todo funcionando correctamente

**¡Felicitaciones!** 🎉
