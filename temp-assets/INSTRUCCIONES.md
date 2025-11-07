# Instrucciones para subir el logo ACA

## Opción 1: Usar el panel de administración

1. Ve a https://beta.acachile.com/panel-admin/content
2. Haz clic en la pestaña "Inicio"
3. En cualquier sección, usa el campo de "Imagen" y sube el archivo del logo
4. Una vez subido, copia la URL que aparece
5. Usa esa URL en el paso siguiente

## Opción 2: Usar la API directamente con curl

```bash
# Primero obtén tu token JWT del navegador
# Ve a https://beta.acachile.com/panel-admin
# Abre DevTools (F12) > Console
# Ejecuta: localStorage.getItem('token') || sessionStorage.getItem('token')
# Copia el token

# Luego ejecuta este comando (reemplaza YOUR_TOKEN y la ruta del archivo):
curl -X POST https://beta.acachile.com/api/admin/content/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/ruta/al/logo-aca.png"
```

## Archivo a subir

El logo está adjunto en el mensaje. Guárdalo como `logo-aca.png` y súbelo usando cualquiera de las opciones anteriores.

La URL resultante debería ser algo como:
`https://images.acachile.com/XXXXX/logo-aca.png`
