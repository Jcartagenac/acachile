# 📋 INSTRUCCIONES: Subir Logo ACA al R2

## 🎯 Objetivo
Subir el nuevo logo de ACA Chile al bucket R2 y configurarlo como logo oficial del sitio.

## 📝 Pasos a seguir:

### 1. Acceder al panel de administración
- Ve a: https://beta.acachile.com/panel-admin/content
- Inicia sesión si es necesario

### 2. Subir el logo al R2
- Haz clic en la pestaña **"Inicio"**
- En cualquier sección (por ejemplo "hero"), busca el campo **"Imagen (URL)"**
- Debajo verás un botón **"Elegir archivo"**
- Selecciona el archivo del logo que te adjunté (el de los cuchillos cruzados con "ACA")
- Espera a que se suba (verás una barra de progreso)
- Una vez subido, verás la URL en el campo de texto

### 3. Renombrar/mover el archivo en R2
La URL que obtuviste probablemente será algo como:
```
https://images.acachile.com/TIMESTAMP/archivo.png
```

**Necesitamos que sea:**
```
https://images.acachile.com/assets/logo-aca-oficial.png
```

**Opciones:**
- **Opción A (Recomendada)**: Usa la consola de Cloudflare R2 para renombrar/mover el archivo a `assets/logo-aca-oficial.png`
- **Opción B**: Vuelve a subir el archivo pero usando un script que lo nombre correctamente

### 4. Verificar que funciona
Una vez que el archivo esté en la ubicación correcta:
1. Refresca https://beta.acachile.com
2. Deberías ver el nuevo logo en el header
3. El favicon de la pestaña también debería cambiar

## 🔧 Alternativa: Subir directamente vía API

Si prefieres usar la terminal:

```bash
# 1. Obtén tu token JWT
# Ve a https://beta.acachile.com/panel-admin
# Abre DevTools (F12) > Console > ejecuta:
# localStorage.getItem('token')

# 2. Guarda el logo como 'logo-aca.png' en alguna carpeta

# 3. Súbelo al R2:
curl -X POST https://beta.acachile.com/api/admin/content/upload \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
  -F "file=@/ruta/a/logo-aca.png"

# 4. Copia la URL que devuelve y renombra el archivo en Cloudflare R2
```

## ✅ Cambios ya aplicados en el código

He actualizado estos archivos para que apunten a la nueva ubicación:
- `frontend/src/components/layout/Header.tsx` - Logo del header
- `frontend/index.html` - Favicon

**La URL esperada es:** `https://images.acachile.com/assets/logo-aca-oficial.png`

Una vez que subas el logo a esa ubicación, todo debería funcionar automáticamente.
