# Problema de Noticias - Diagnóstico

## Problema Identificado

El sistema de noticias actualmente usa **Cloudflare KV** (Key-Value storage) en lugar de **D1** (base de datos SQL). Esto causa:

### 1. **Pérdida de Datos (TTL)**
- Las noticias se guardan con `expirationTtl: 86400` (24 horas)
- Después de 24 horas, las noticias **se borran automáticamente**
- Por eso parece que "desaparecen" o se "eliminan"

### 2. **Posible Duplicación/Sobrescritura**
- Al crear una noticia nueva:
  1. Lee TODAS las noticias de KV (`noticias:all`)
  2. Agrega la nueva al array
  3. Guarda TODO el array de nuevo
- Si hay un problema de sincronización (2 usuarios creando al mismo tiempo), se pueden sobrescribir datos

### 3. **No hay Soft Delete**
- La tabla `news_articles` en D1 **no tiene** columna `deleted_at`
- No se puede hacer "eliminación suave" (soft delete)

## Estado Actual

### En D1 (Base de Datos - CORRECTO):
```
- 3 noticias publicadas
- Tabla: news_articles (14 columnas, SIN deleted_at)
- Persistente y confiable
```

### En KV (Storage Temporal - PROBLEMÁTICO):
```
- Cantidad desconocida de noticias
- TTL de 24 horas - SE BORRAN AUTOMÁTICAMENTE
- Usado actualmente por el API
```

## Solución Requerida

### Fase 1: Migración de KV a D1 (URGENTE)
1. Agregar columna `deleted_at` a `news_articles`
2. Migrar código del API de KV a D1
3. Exportar noticias de KV antes que expiren
4. Importar noticias a D1

### Fase 2: Actualizar Frontend
1. Actualizar AdminNews.tsx para usar D1
2. Implementar soft delete
3. Agregar papelera de noticias

## Archivos Afectados

```
/frontend/functions/api/noticias/index.js
  - Línea 139-316: handleCreateNoticia() usa KV
  - Línea 205-316: createNoticia() usa env.ACA_KV
  
/frontend/src/components/admin/AdminNews.tsx
  - Llama a /api/noticias que usa KV
```

## Recomendación Inmediata

**NO CREAR MÁS NOTICIAS** hasta migrar a D1, porque:
- Se perderán en 24 horas
- Pueden sobrescribirse entre sí
- No hay respaldo automático

## Próximos Pasos

¿Quieres que:
1. Exporte las noticias actuales de KV antes que expiren?
2. Migre el sistema completo de KV a D1?
3. Agregue la columna deleted_at y soft delete?
