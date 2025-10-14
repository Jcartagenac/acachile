# API Documentation - ACA Chile

## Base URL
- **Desarrollo:** `https://your-worker.your-subdomain.workers.dev`
- **Producción:** `https://api.acachile.cl`

---

## Autenticación

### POST /api/auth/login
Iniciar sesión con email y contraseña.

**Request Body:**
```json
{
  "email": "usuario@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login exitoso",
  "user": {
    "id": 1,
    "email": "usuario@example.com",
    "nombre": "Juan",
    "apellido": "Pérez",
    "role": "user"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### POST /api/auth/registro
Registrar nuevo usuario.

**Request Body:**
```json
{
  "email": "usuario@example.com",
  "nombre": "Juan",
  "apellido": "Pérez",
  "password": "password123",
  "telefono": "+56912345678",
  "rut": "12345678-9",
  "ciudad": "Santiago"
}
```

### GET /api/auth/perfil
Obtener perfil del usuario autenticado.

**Headers:**
```
Authorization: Bearer {token}
```

### PUT /api/auth/perfil
Actualizar perfil del usuario.

**Headers:**
```
Authorization: Bearer {token}
```

**Request Body:**
```json
{
  "nombre": "Juan Carlos",
  "apellido": "Pérez",
  "telefono": "+56912345678",
  "ciudad": "Valparaíso"
}
```

### POST /api/auth/verificar-token
Verificar validez de un token JWT.

**Request Body:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### POST /api/auth/logout
Cerrar sesión (invalidar token del lado del cliente).

---

## Eventos

### GET /api/eventos
Obtener lista de eventos.

**Query Parameters:**
- `page` (opcional): Número de página (default: 1)
- `limit` (opcional): Resultados por página (default: 10)
- `upcoming` (opcional): Solo eventos futuros (true/false)

**Response:**
```json
{
  "eventos": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "pages": 5
  }
}
```

### POST /api/eventos
Crear nuevo evento (requiere autenticación admin).

**Headers:**
```
Authorization: Bearer {admin_token}
```

**Request Body:**
```json
{
  "titulo": "Gran Asado de Primavera",
  "descripcion": "Evento anual de la ACA",
  "fecha_evento": "2024-10-15",
  "hora_evento": "12:00",
  "ubicacion": "Parque O'Higgins",
  "precio": 15000,
  "capacidad_maxima": 100
}
```

### GET /api/eventos/{id}
Obtener evento por ID.

### PUT /api/eventos/{id}
Actualizar evento (requiere admin).

### DELETE /api/eventos/{id}
Eliminar evento (requiere admin).

### POST /api/eventos/{id}/inscribirse
Inscribirse a un evento.

**Headers:**
```
Authorization: Bearer {token}
```

### GET /api/eventos/{id}/inscripciones
Obtener inscripciones de un evento (requiere admin).

---

## Noticias/Blog

### GET /api/noticias
Obtener lista de noticias publicadas.

**Query Parameters:**
- `page` (opcional): Número de página
- `limit` (opcional): Resultados por página
- `category` (opcional): Filtrar por categoría
- `tag` (opcional): Filtrar por tag

**Response:**
```json
{
  "noticias": [...],
  "pagination": {...}
}
```

### POST /api/noticias
Crear nueva noticia (requiere editor/admin).

**Headers:**
```
Authorization: Bearer {editor_token}
```

**Request Body:**
```json
{
  "title": "Título de la noticia",
  "content": "Contenido completo...",
  "excerpt": "Resumen corto",
  "category_id": 1,
  "tags": ["asado", "técnicas"],
  "featured_image": "url_imagen",
  "status": "published"
}
```

### GET /api/noticias/{slug}
Obtener noticia por slug.

### PUT /api/noticias/{id}
Actualizar noticia (requiere editor/admin).

### DELETE /api/noticias/{id}
Eliminar noticia (requiere admin).

### GET /api/noticias/categorias
Obtener categorías de noticias.

### GET /api/noticias/tags
Obtener tags disponibles.

---

## Comentarios

### GET /api/comentarios
Obtener comentarios de un artículo.

**Query Parameters:**
- `article_id` (requerido): ID del artículo

### POST /api/comentarios
Crear nuevo comentario.

**Request Body:**
```json
{
  "article_id": 1,
  "author_name": "Juan Pérez",
  "author_email": "juan@example.com",
  "content": "Excelente artículo sobre técnicas de asado",
  "parent_id": null
}
```

### PUT /api/admin/comentarios/{id}
Moderar comentario (requiere admin).

**Headers:**
```
Authorization: Bearer {admin_token}
```

**Request Body:**
```json
{
  "status": "approved"
}
```

### DELETE /api/admin/comentarios/{id}
Eliminar comentario (requiere admin).

---

## Likes y Compartir

### GET /api/likes/{article_id}
Obtener estado de likes de un artículo.

**Response:**
```json
{
  "totalLikes": 25,
  "userLiked": false
}
```

### POST /api/likes/{article_id}
Alternar like en un artículo.

### POST /api/compartir/{article_id}
Registrar compartido de un artículo.

**Request Body:**
```json
{
  "platform": "facebook"
}
```

---

## Búsqueda

### GET /api/busqueda
Búsqueda global en la plataforma.

**Query Parameters:**
- `q` (requerido): Término de búsqueda
- `type` (opcional): Tipo (eventos/noticias/usuarios/all)
- `dateFrom` (opcional): Fecha desde (YYYY-MM-DD)
- `dateTo` (opcional): Fecha hasta (YYYY-MM-DD)
- `category` (opcional): Categoría
- `location` (opcional): Ubicación
- `limit` (opcional): Límite de resultados
- `offset` (opcional): Desplazamiento

**Response:**
```json
{
  "query": "asado",
  "resultados": [...],
  "total": 15,
  "filters": {...}
}
```

### GET /api/busqueda/sugerencias
Obtener sugerencias para autocompletar.

**Query Parameters:**
- `q` (requerido): Término parcial
- `type` (opcional): eventos/noticias

### POST /api/busqueda/avanzada
Búsqueda avanzada con filtros múltiples.

**Request Body:**
```json
{
  "query": "asado",
  "tipo": "eventos",
  "fechaDesde": "2024-01-01",
  "fechaHasta": "2024-12-31",
  "categoria": "concursos",
  "ubicacion": "Santiago",
  "ordenarPor": "fecha",
  "orden": "desc",
  "page": 1,
  "limit": 20
}
```

### GET /api/busqueda/populares
Obtener búsquedas y contenido popular.

---

## Administración

### GET /api/admin/dashboard
Obtener estadísticas del dashboard (requiere admin).

**Headers:**
```
Authorization: Bearer {admin_token}
```

**Response:**
```json
{
  "estadisticas": {
    "usuarios": {
      "total": 150,
      "activos": 140,
      "nuevos_mes": 12
    },
    "eventos": {
      "total": 25,
      "activos": 8,
      "inscripciones_mes": 45
    },
    "noticias": {
      "total": 80,
      "publicadas": 75,
      "vistas_mes": 1250
    },
    "comentarios": {
      "total": 120,
      "pendientes": 5,
      "aprobados_mes": 35
    }
  }
}
```

### GET /api/admin/usuarios
Obtener lista de usuarios (requiere admin).

**Query Parameters:**
- `page` (opcional): Página
- `limit` (opcional): Límite
- `search` (opcional): Término de búsqueda

### PUT /api/admin/usuarios/{id}
Actualizar usuario (requiere admin).

### DELETE /api/admin/usuarios/{id}
Desactivar usuario (requiere admin).

### GET /api/admin/comentarios
Obtener comentarios pendientes de moderación.

### GET /api/admin/actividad
Obtener actividad reciente del sistema.

### POST /api/admin/herramientas
Ejecutar herramientas administrativas.

**Request Body:**
```json
{
  "action": "clear_cache"
}
```

---

## Inscripciones

### GET /api/mis-inscripciones
Obtener inscripciones del usuario autenticado.

**Headers:**
```
Authorization: Bearer {token}
```

### DELETE /api/inscripciones/{id}
Cancelar inscripción.

---

## Códigos de Estado HTTP

- **200**: OK
- **201**: Creado
- **400**: Bad Request - Datos inválidos
- **401**: Unauthorized - Token inválido o faltante
- **403**: Forbidden - Sin permisos
- **404**: Not Found - Recurso no encontrado
- **405**: Method Not Allowed - Método HTTP no permitido
- **500**: Internal Server Error - Error del servidor

---

## Autenticación JWT

Todos los endpoints que requieren autenticación esperan un token JWT en el header:

```
Authorization: Bearer {token}
```

El token se obtiene del endpoint `/api/auth/login` y contiene:

- `userId`: ID del usuario
- `email`: Email del usuario  
- `role`: Rol (admin/editor/user)
- `isAdmin`: Boolean indicando si es admin
- `exp`: Timestamp de expiración
- `iat`: Timestamp de creación

---

## Paginación

Los endpoints que devuelven listas incluyen información de paginación:

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

---

## CORS

La API permite CORS desde cualquier origen en desarrollo. En producción debe configurarse apropiadamente.

---

## Rate Limiting

Actualmente no hay rate limiting implementado, pero se recomienda implementarlo en producción.

---

## Ejemplos de Uso

### JavaScript/Fetch

```javascript
// Login
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'usuario@example.com',
    password: 'password123'
  })
});

const { token } = await response.json();

// Usar token en requests autenticados
const eventos = await fetch('/api/eventos', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### cURL

```bash
# Login
curl -X POST https://api.acachile.cl/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"usuario@example.com","password":"password123"}'

# Obtener eventos con token
curl -X GET https://api.acachile.cl/api/eventos \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

---

## Datos de Prueba

### Usuario Admin por Defecto
- **Email**: admin@acachile.cl
- **Contraseña**: admin123
- **Role**: admin

### Usuario Regular
- **Email**: usuario@acachile.cl  
- **Contraseña**: user123
- **Role**: user

---

## Base de Datos

La aplicación usa **Cloudflare D1** como base de datos principal y **Cloudflare KV** para cache.

### Esquemas principales:
- `usuarios`: Información de usuarios
- `eventos`: Eventos y actividades
- `inscripciones`: Inscripciones a eventos
- `news_articles`: Artículos del blog
- `news_categories`: Categorías de noticias
- `news_tags`: Tags de noticias
- `news_comments`: Comentarios en noticias

Para ver el esquema completo, consultar los archivos de migración en el repositorio.