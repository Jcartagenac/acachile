# Configuración de imágenes para R2

## URLs de imágenes en R2 (usando dominio público temporal)
# Formato: https://pub-[account-id].r2.dev/[bucket-name]/[path]

# Una vez configurado R2, las URLs serán:
# https://pub-ACCOUNT_ID.r2.dev/aca-chile-images/eventos/...
# https://pub-ACCOUNT_ID.r2.dev/aca-chile-images/noticias/...

# Para producción, se puede configurar un custom domain:
# https://images.acachile.pages.dev/eventos/...
# https://images.acachile.pages.dev/noticias/...

## Mapeo de archivos:

### Eventos:
- eventos/campeonato-nacional-asado.jpg
- eventos/taller-principiantes-asado.jpg  
- eventos/encuentro-asadores.jpg
- eventos/competencia-rapida.jpg
- eventos/masterclass-parrilla.jpg

### Noticias:
- noticias/mundial-barbacoa-2024.jpg
- noticias/curso-basico-asado.jpg
- noticias/campeonato-regional-asadores.jpg
- noticias/centro-excelencia-valparaiso.jpg
- noticias/masterclass-patagonico.jpg

## Configuración recomendada:

1. Crear bucket R2: aca-chile-images
2. Configurar custom domain: images.acachile.pages.dev
3. Subir imágenes con estructura de carpetas
4. Actualizar URLs en código

## Para configurar custom domain:
1. Cloudflare R2 → aca-chile-images → Settings
2. Custom Domains → Connect Domain  
3. Usar: images.acachile.pages.dev
4. Configurar DNS record automáticamente