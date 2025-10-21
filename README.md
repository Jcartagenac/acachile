# 🔥 ACA Chile - Asociación Chilena de Asadores

> **Sistema completo de gestión para asociación de socios con panel administrativo, gestión de cuotas, comunicados y más.**

[![Cloudflare Pages](https://img.shields.io/badge/Cloudflare-Pages-orange)](https://acachile.pages.dev)
[![React](https://img.shields.io/badge/React-18.3.1-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6.2-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4.1-38bdf8)](https://tailwindcss.com/)

---

## 📋 Tabla de Contenidos

- [Descripción General](#-descripción-general)
- [Funcionalidades Completas](#-funcionalidades-completas)
- [Stack Tecnológico](#-stack-tecnológico)
- [Arquitectura del Proyecto](#️-arquitectura-del-proyecto)
- [Esquema de Base de Datos](#️-esquema-de-base-de-datos)
- [APIs Implementadas](#-apis-implementadas)
- [Configuración de Infraestructura](#️-configuración-de-infraestructura)
- [Setup y Despliegue](#-setup-y-despliegue)
- [Guía para Continuación](#-guía-para-continuación)

---

## 🎯 Descripción General

**ACA Chile** es una plataforma web completa para la gestión de una asociación de socios, desarrollada con tecnologías modernas y desplegada en Cloudflare Pages.

### Estado Actual del Proyecto
✅ **Funcional en producción (actualizaciones en curso)**
- URL de Producción: https://acachile.pages.dev
- Repositorio: https://github.com/Jcartagenac/acachile
- Branch: `main`
- Última actualización: 16 de octubre de 2025

---

## 🆕 Cambios recientes (18 de febrero de 2026)

Durante los últimos sprints se consolidó una versión “todo en uno” orientada a operaciones y continuidad a largo plazo. Estas son las mejoras más relevantes que ya están en producción:

### Principales adiciones y correcciones

- **feat: Búsqueda global 2.0 (frontend + Pages Functions)**
  - `/api/search` ahora combina eventos, noticias, secciones CMS y perfiles públicos de socios en una sola respuesta.
  - `/api/search/suggestions` aprovecha KV + D1 para sugerencias contextualizadas (títulos, etiquetas, ciudades, nombres de socios) con debounce y orden inteligente.
  - El componente `<SearchBar />` muestra vista previa enriquecida, iconografía por tipo, recordatorio de búsquedas recientes y scrolling responsivo.
  - La página de resultados (`/buscar`) se rediseñó con metadatos, enlaces externos y soporte de filtros multi tipo.

- **feat: Privacidad de perfil y búsqueda segura**
  - Nuevo endpoint `/api/auth/privacy` (GET/PUT) persiste preferencias en D1 (`user_privacy_settings`).
  - El módulo de configuración (`Perfil > Configuración > Privacidad`) permite decidir si se muestran email, teléfono, dirección, RUT y fecha de nacimiento en el perfil público.
  - Las funciones de búsqueda y sugerencias respetan estas banderas antes de exponer la información.

- **feat: Editor de contenido institucional mejorado**
  - `Panel → Contenido` ahora separa Inicio, Quiénes Somos y Contacto en pestañas dedicadas con carga diferida del editor (`AdminHomeEditor`).
  - Cada pestaña escribe en D1 + KV (cache) y refleja inmediatamente los cambios en el sitio público.

- **feat: Postulación con foto y revisión centralizada**
  - El formulario `/unete` permite subir una foto de perfil (valida 5 MB, recorta y sube a R2 carpeta `postulaciones/`).
  - El panel `Admin → Postulaciones` muestra miniaturas, acceso rápido a la foto original y estado de aprobación.
  - Se amplió el esquema `postulaciones` (columna `photo_url`) y el payload `JoinApplicationPayload`.

### Cómo probar las novedades

1. **Búsqueda global**
   - Abre la barra de búsqueda global y escribe “asado” o el nombre de un socio.
   - Verifica las sugerencias, la vista previa y los resultados en `/buscar?q=` con filtros por tipo.

2. **Privacidad de perfil**
   - Inicia sesión como socio, ve a `Perfil > Configuración > Privacidad`.
   - Activa/desactiva email, teléfono, dirección, RUT y cumpleaños; luego búscate desde una sesión separada para confirmar los cambios.

3. **Postulación con foto**
   - Completa el formulario en `/unete`, sube una imagen (JPG/PNG/WebP).
   - Revisa en `Admin → Postulaciones` la miniatura, el enlace “Ver foto en tamaño completo” y el flujo de aprobación/rechazo.

4. **Gestión de contenido institucional**
   - Ingresa a `Panel → Contenido`, edita bloques en las pestañas “Quiénes Somos” o “Contacto” y comprueba que los cambios aparezcan en el sitio público tras limpiar cache.

---

---

## ✨ Funcionalidades Completas

### 🔐 Sistema de Autenticación
- ✅ Registro de usuarios con validación
- ✅ Login con JWT (implementación personalizada)
- ✅ Recuperación de contraseña vía email
- ✅ Gestión de sesiones
- ✅ Roles y permisos (admin, director, director_editor, usuario)

### 👥 Gestión de Socios
- ✅ **CRUD completo de socios**
  - Crear nuevos socios con todos los datos
  - Editar información completa (nombre, email, teléfono, RUT, ciudad, dirección)
  - Cambiar rol/permisos de administrador
  - Eliminar socios (soft delete)
  - Subir y editar foto de perfil
- ✅ **Lista de socios con:**
  - Búsqueda por nombre, email, RUT
  - Filtros por estado (activo/inactivo)
  - Paginación
  - Estadísticas de cuotas por socio
- ✅ **Perfil de socio individual**
  - Visualización de datos completos
  - Historial de pagos
  - Foto de perfil con crop automático

### 💰 Sistema de Cuotas
- ✅ **Gestión de cuotas mensuales**
  - Generación automática de cuotas por año/mes
  - Valor personalizable por socio
  - Marcar pagos con método de pago
  - Subir comprobantes de pago a R2
  - Estadísticas de pagos por socio
- ✅ **Panel de cuotas**
  - Vista por año con totales
  - Estado de cada cuota (pagado/pendiente)
  - Fecha de último pago
  - Métodos de pago: transferencia, efectivo, tarjeta

### 📢 Sistema de Comunicados
- ✅ **CRUD de comunicados**
  - Crear comunicados con título, contenido y tipo
  - Tipos: importante, corriente, urgente
  - Destinatarios configurables (todos, morosos, activos, administradores)
  - Estado: borrador o enviado
- ✅ **Lista de comunicados**
  - Filtros por tipo y estado
  - Búsqueda por título/contenido

### 📊 Panel Administrativo
- ✅ **Dashboard con métricas**
  - Total de socios activos/inactivos
  - Estadísticas de cuotas del año
  - Últimos comunicados enviados
- ✅ **Gestión completa del sistema**
  - Administración de usuarios
  - Configuración de valores
  - Monitoreo de sistema

### 🖼️ Gestión de Imágenes (Cloudflare R2)
- ✅ **Subida de fotos de perfil**
  - Resize automático con aspect ratio preservado
  - Crop centrado para avatares cuadrados (400x400px)
  - Compresión optimizada (92% quality)
  - Almacenamiento en R2 bucket
  - URLs públicas con CDN
- ✅ **Rutas de imágenes:**
  - Fotos de socios: `socios/{id}/foto.{ext}`
  - Comprobantes: `comprobantes/{año}/{mes}/{socioId}/{filename}`

### 🔎 Búsqueda Global Inteligente
- ✅ Búsqueda unificada (eventos, noticias, secciones institucionales y perfiles públicos de socios) con relevancia ponderada.
- ✅ API `/api/search` con soporte para filtros, paginación y respuesta combinada (`combined`).
- ✅ Sugerencias en tiempo real (`/api/search/suggestions`) alimentadas desde D1 + KV.
- ✅ Barra de búsqueda con vista previa, rescate de búsquedas recientes y atajos de teclado.
- ✅ Página `/buscar` con metadatos por tipo, paginación, filtros responsivos y enlaces externos seguros.

### 🔐 Privacidad y Perfiles Públicos
- ✅ Preferencias de visibilidad configurables por socio (`/api/auth/privacy`).
- ✅ Controles UI en `Perfil → Configuración → Privacidad` con toggles para email, teléfono, dirección, RUT y cumpleaños.
- ✅ Persistencia en D1 (`user_privacy_settings`) y verificación antes de responder desde la API de búsqueda/sugerencias.
- ✅ Mensajería contextual en resultados de búsqueda cuando un dato está oculto por privacidad.

### 🧾 Postulaciones y Onboarding
- ✅ Formulario `/unete` extendido con subida de foto (validación 5 MB, resize 900×900 @85 % quality, carpeta `postulaciones/` en R2).
- ✅ Persistencia de `photo_url` en la tabla `postulaciones` y servicio `postulacionesService`.
- ✅ Panel `Admin → Postulaciones` con miniaturas, acceso a la foto original y estado/contador de aprobaciones.
- ✅ Flujo de aprobación/rechazo que mantiene coherencia con los nuevos campos.

---

## 🛠️ Stack Tecnológico

### Frontend
- **react**: 18.3.1 - Biblioteca UI principal
- **react-dom**: 18.3.1 - Renderizado DOM
- **react-router-dom**: 7.1.1 - Enrutamiento SPA
- **typescript**: 5.6.2 - Tipado estático
- **vite**: 5.4.20 - Build tool y dev server
- **tailwindcss**: 3.4.1 - Framework CSS utility-first
- **lucide-react**: 0.468.0 - Iconos SVG optimizados

### Backend (Cloudflare Pages Functions)
- **Runtime**: Cloudflare Workers (V8 JavaScript Runtime)
- **Database**: Cloudflare D1 (SQLite)
- **Storage**: Cloudflare R2 (S3-compatible)
- **Cache**: Cloudflare KV
- **Email**: Resend API

### Herramientas de Desarrollo
- **@types/react**: 18.3.12 - Tipos TypeScript para React
- **@types/react-dom**: 18.3.1 - Tipos TypeScript para React DOM
- **eslint**: 9.17.0 - Linter para código JavaScript/TypeScript
- **postcss**: 8.4.49 - Procesador CSS
- **autoprefixer**: 10.4.20 - Prefijos CSS automáticos

---

## 🏗️ Arquitectura del Proyecto

### Estructura de Carpetas
```
acachile/
├── frontend/                           # Aplicación principal
│   ├── src/
│   │   ├── components/                # Componentes React
│   │   │   ├── layout/               # Layout, Header, Footer
│   │   │   ├── profile/              # ProfileModule, AdminModule
│   │   │   ├── auth/                 # Login, Register
│   │   │   └── common/               # Componentes reutilizables
│   │   ├── pages/                    # Páginas
│   │   │   ├── HomePage.tsx
│   │   │   ├── ProfilePage.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   └── RegisterPage.tsx
│   │   ├── services/                 # Servicios API
│   │   │   └── imageService.ts       # Gestión de imágenes
│   │   ├── contexts/                 # Contextos React
│   │   │   └── AuthContext.tsx       # Autenticación global
│   │   └── hooks/                    # Custom Hooks
│   │       └── useAdminService.ts    # Hook para panel admin
│   │
│   ├── functions/                     # Cloudflare Pages Functions (Backend)
│   │   ├── api/
│   │   │   ├── auth/                 # Autenticación
│   │   │   │   ├── login.ts
│   │   │   │   ├── register.ts
│   │   │   │   ├── me.ts             # Perfil usuario
│   │   │   │   ├── forgot-password.ts
│   │   │   │   └── change-password.ts
│   │   │   │
│   │   │   ├── admin/                # Panel administrativo
│   │   │   │   ├── socios/
│   │   │   │   │   ├── index.js      # GET/POST /api/admin/socios
│   │   │   │   │   └── [id]/
│   │   │   │   │       ├── index.js  # GET/PUT/DELETE /api/admin/socios/:id
│   │   │   │   │       └── foto.js   # POST /api/admin/socios/:id/foto
│   │   │   │   ├── cuotas/
│   │   │   │   │   ├── index.js      # GET /api/admin/cuotas
│   │   │   │   │   ├── generar.js    # POST /api/admin/cuotas/generar
│   │   │   │   │   └── marcar-pago.js # PUT /api/admin/cuotas/marcar-pago
│   │   │   │   ├── comunicados/
│   │   │   │   │   └── index.js      # GET/POST /api/admin/comunicados
│   │   │   │   ├── dashboard.js      # GET /api/admin/dashboard
│   │   │   │   └── configuracion.js  # GET/PUT /api/admin/configuracion
│   │   │   │
│   │   │   ├── cuotas/
│   │   │   │   └── subir-comprobante.js  # POST /api/cuotas/subir-comprobante
│   │   │   │
│   │   │   ├── upload-image.ts       # POST /api/upload-image (R2)
│   │   │   └── images.js             # GET /api/images?path=... (R2)
│   │   │
│   │   └── database/                 # Esquemas de BD
│   │       ├── schema.sql            # Esquema principal
│   │       └── socios-cuotas-schema.sql  # Esquema socios/cuotas
│   │
│   ├── public/                       # Assets estáticos
│   ├── dist/                         # Build de producción
│   ├── wrangler.toml                 # Configuración Cloudflare
│   ├── package.json
│   └── tsconfig.json
│
├── shared/                           # Tipos compartidos
│   └── index.ts                     # Interfaces TypeScript
│
└── README.md                        # Este archivo

---

## 🧪 Cómo probar los cambios localmente

1. Clonar el repositorio y moverse al directorio frontend:

```bash
git clone https://github.com/Jcartagenac/acachile.git
cd acachile/frontend
```

2. Instalar dependencias:

```bash
npm install
```

3. Ejecutar validación de TypeScript (opcional):

```bash
npx tsc --noEmit
```

4. Iniciar servidor de desarrollo:

```bash
npm run dev
```

5. Abrir en el navegador: http://localhost:5173 (por defecto con Vite)

### Probar la importación CSV

- Ir a `Gestión de Socios` (requiere rol admin)
- Hacer click en `Importar CSV` y seleccionar el archivo usando la plantilla (ver carpeta raíz `plantilla_socios_aca.csv` si existe)
- Revisar la vista previa y lanzar la importación
- Ver resultados: número de filas importadas y lista de errores por fila

### Probar creación de eventos

- Ir a `Eventos` → `Crear Evento` (usuario autenticado requerido)
- Completar el formulario y crear el evento
- Después de crear, la app redirecciona a `/eventos` y el EventContext agrega el evento a la lista y también realiza fetch de la API si es necesario para sincronizar (maneja paginación y filtros)

---

## 🚀 Notas de despliegue

- El frontend está desplegado en Cloudflare Pages. Los cambios en `main` se despliegan automáticamente si pasan la pipeline.
- Variables de entorno y bindings clave:
  - **Frontend (`.env.local` / Pages → VITE_*)**
    - `VITE_API_BASE_URL` → URL base de las Functions (`https://acachile.pages.dev`)
    - `VITE_ENVIRONMENT` → `development | staging | production`
  - **Backend (Pages Functions / wrangler.toml)**
    - `IMAGES` (R2) → Bucket `aca-chile-images`
    - `ACA_KV` (KV) → Cache de contenidos y sugerencias
    - `DB` (D1) → Base de datos relacional
    - `ENVIRONMENT`, `CORS_ORIGIN`, `FRONTEND_URL`
    - `FROM_EMAIL`, `ADMIN_EMAIL`
    - `R2_PUBLIC_URL` → Endpoint público de R2 (ej: `https://pub-85ac8c62baca4966b2ac0b16e1b9b6c6.r2.dev`)
  - **Secretos (Pages Secrets)**
    - `JWT_SECRET`
    - `RESEND_API_KEY`

---

## 🧾 Notas técnicas y recomendaciones

- Asegúrate de que la API devuelva correctamente los datos de cuotas y eventos filtrados por año/paginación si no ves inmediatamente nuevos registros después de crear o importar.
- Para debugging, el frontend incluye logs en consola (AdminCuotas, AdminSocios) que muestran respuestas completas de las llamadas a la API para facilitar diagnóstico.

---
```

---

## 🗄️ Esquema de Base de Datos

### Cloudflare D1 Database: `ACA_DB`

#### Tabla: `usuarios`
```sql
CREATE TABLE usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    nombre TEXT NOT NULL,
    apellido TEXT NOT NULL,
    telefono TEXT,
    rut TEXT,
    ciudad TEXT,
    direccion TEXT,
    foto_url TEXT,
    role TEXT DEFAULT 'usuario' CHECK (role IN ('admin', 'director', 'director_editor', 'usuario')),
    valor_cuota INTEGER DEFAULT 6500,
    fecha_ingreso DATETIME DEFAULT CURRENT_TIMESTAMP,
    estado_socio TEXT DEFAULT 'activo' CHECK (estado_socio IN ('activo', 'inactivo', 'suspendido')),
    activo BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME
);

CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_rut ON usuarios(rut);
CREATE INDEX idx_usuarios_role ON usuarios(role);
CREATE INDEX idx_usuarios_estado ON usuarios(estado_socio);
```

#### Tabla: `cuotas`
```sql
CREATE TABLE cuotas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    año INTEGER NOT NULL,
    mes INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
    valor INTEGER NOT NULL,
    pagado BOOLEAN DEFAULT FALSE,
    fecha_pago DATETIME NULL,
    metodo_pago TEXT CHECK (metodo_pago IN ('transferencia', 'efectivo', 'tarjeta')),
    comprobante_url TEXT NULL,
    notas TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios (id),
    UNIQUE(usuario_id, año, mes)
);

CREATE INDEX idx_cuotas_usuario_año ON cuotas(usuario_id, año);
CREATE INDEX idx_cuotas_año_mes ON cuotas(año, mes);
CREATE INDEX idx_cuotas_pagado ON cuotas(pagado);
```

#### Tabla: `comunicados`
```sql
CREATE TABLE comunicados (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    contenido TEXT NOT NULL,
    tipo TEXT DEFAULT 'corriente' CHECK (tipo IN ('importante', 'corriente', 'urgente')),
    destinatarios TEXT NOT NULL, -- JSON array: ["todos", "morosos", "activos", "administradores"]
    estado TEXT DEFAULT 'borrador' CHECK (estado IN ('borrador', 'enviado')),
    fecha_envio DATETIME,
    creado_por INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (creado_por) REFERENCES usuarios (id)
);

CREATE INDEX idx_comunicados_tipo ON comunicados(tipo);
CREATE INDEX idx_comunicados_estado ON comunicados(estado);
```

#### Tabla: `configuracion_global`
```sql
CREATE TABLE configuracion_global (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clave TEXT UNIQUE NOT NULL,
    valor TEXT NOT NULL,
    descripcion TEXT,
    tipo TEXT DEFAULT 'string' CHECK (tipo IN ('string', 'number', 'boolean', 'json')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Valores por defecto
INSERT INTO configuracion_global (clave, valor, descripcion, tipo) VALUES 
('cuota_default', '6500', 'Valor de cuota mensual por defecto (CLP)', 'number'),
('año_inicio_cuotas', '2025', 'Año de inicio del sistema de cuotas', 'number'),
('moneda', 'CLP', 'Moneda utilizada en el sistema', 'string');
```

---

## 🌐 APIs Implementadas

### 🔐 Autenticación (`/api/auth/`)

#### `POST /api/auth/login`
Login con email y contraseña.

**Request:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response 200:**
```json
{
  "success": true,
  "token": "string (JWT)",
  "user": {
    "id": "number",
    "email": "string",
    "nombre": "string",
    "apellido": "string",
    "role": "string"
  }
}
```

---

#### `POST /api/auth/register`
Registro de nuevo usuario.

**Request:**
```json
{
  "email": "string",
  "password": "string",
  "nombre": "string",
  "apellido": "string"
}
```

**Response 201:**
```json
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "userId": "number"
}
```

---

#### `GET /api/auth/me`
Obtiene el perfil del usuario autenticado.

**Headers:** `Authorization: Bearer {token}`

**Response 200:**
```json
{
  "success": true,
  "user": {
    "id": "number",
    "email": "string",
    "nombre": "string",
    "apellido": "string",
    "telefono": "string | null",
    "rut": "string | null",
    "ciudad": "string | null",
    "direccion": "string | null",
    "foto_url": "string | null",
    "role": "admin | director | director_editor | usuario",
    "estado_socio": "activo | inactivo | suspendido",
    "created_at": "string (ISO)",
    "last_login": "string | null"
  }
}
```

---

#### `PUT /api/auth/me`
Actualiza el perfil del usuario autenticado.

**Headers:** `Authorization: Bearer {token}`

**Request:**
```json
{
  "nombre": "string (opcional)",
  "apellido": "string (opcional)",
  "telefono": "string (opcional)",
  "rut": "string (opcional)",
  "ciudad": "string (opcional)",
  "direccion": "string (opcional)",
  "foto_url": "string (opcional)"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Perfil actualizado correctamente"
}
```

---

#### `GET /api/auth/privacy`
Obtiene las preferencias de privacidad del usuario autenticado.

**Headers:** `Authorization: Bearer {token}`

**Response 200:**
```json
{
  "success": true,
  "data": {
    "showEmail": true,
    "showPhone": false,
    "showRut": false,
    "showAddress": true,
    "showBirthdate": false
  }
}
```

---

#### `PUT /api/auth/privacy`
Actualiza las preferencias de privacidad del usuario autenticado.

**Headers:** `Authorization: Bearer {token}`

**Request:**
```json
{
  "showEmail": true,
  "showPhone": true,
  "showRut": false,
  "showAddress": true,
  "showBirthdate": false
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Preferencias de privacidad actualizadas",
  "data": {
    "showEmail": true,
    "showPhone": true,
    "showRut": false,
    "showAddress": true,
    "showBirthdate": false
  }
}
```

---

### 🔎 Búsqueda Global (`/api/search`)

#### `GET /api/search`
Devuelve resultados combinados de eventos, noticias, secciones institucionales y perfiles públicos (según sus preferencias de privacidad).

**Query Params:**
- `q` (string, requerido): Término de búsqueda (mínimo 2 caracteres).
- `type` (string, opcional): `eventos | noticias | usuarios | secciones | all` (default `all`).
- `limit` (number, opcional): Máximo de resultados por grupo (default 10, máximo sugerido 50).
- `offset` (number, opcional): Desplazamiento para paginación (se calcula con `page` en el frontend).

**Response 200 (resumen):**
```json
{
  "success": true,
  "data": {
    "query": "asado",
    "total": 8,
    "eventos": [{ "id": 42, "title": "Campeonato de Asado", "url": "/eventos/42", "relevance": 0.92 }],
    "noticias": [{ "id": 5, "title": "Entrevista a maestros parrilleros", "url": "/noticias/la-entrevista", "relevance": 0.81 }],
    "usuarios": [{ "id": 7, "title": "María González", "metadata": { "city": "Santiago" }, "url": "/socios/7" }],
    "secciones": [{ "id": "about-hero", "title": "Quiénes Somos", "url": "/quienes-somos#about-hero" }],
    "combined": [
      { "type": "evento", "title": "Campeonato de Asado", "url": "/eventos/42", "relevance": 0.92 },
      { "type": "usuario", "title": "María González", "url": "/socios/7", "relevance": 0.87 }
    ]
  }
}
```

---

#### `GET /api/search/suggestions`
Entrega sugerencias inteligentes para autocompletado.

**Query Params:**
- `q` (string, requerido): Prefijo de la búsqueda.
- `limit` (number, opcional): Cantidad máxima de sugerencias (default 8).

**Response 200:**
```json
{
  "success": true,
  "data": [
    "Campeonato Nacional de Asado",
    "María González (Santiago)",
    "Quiénes Somos (Sección institucional)"
  ]
}
```

---

### 👥 Gestión de Socios (`/api/admin/socios/`)

#### `GET /api/admin/socios`
Lista todos los socios con filtros y paginación.

**Query Params:**
- `page` (número): Página actual (default: 1)
- `limit` (número): Resultados por página (default: 20)
- `search` (string): Búsqueda por nombre, email o RUT
- `estado` (string): Filtro por estado (activo/inactivo)

**Response 200:**
```json
{
  "success": true,
  "data": {
    "socios": [
      {
        "id": "number",
        "email": "string",
        "nombre": "string",
        "apellido": "string",
        "nombreCompleto": "string",
        "telefono": "string | null",
        "rut": "string | null",
        "ciudad": "string | null",
        "direccion": "string | null",
        "fotoUrl": "string | null",
        "valorCuota": "number",
        "fechaIngreso": "string (ISO)",
        "estadoSocio": "string",
        "role": "string",
        "estadisticasAño": {
          "totalCuotas": "number",
          "cuotasPagadas": "number",
          "cuotasPendientes": "number",
          "ultimoPago": "string | null"
        }
      }
    ],
    "pagination": {
      "total": "number",
      "page": "number",
      "limit": "number",
      "totalPages": "number"
    }
  }
}
```

---

#### `POST /api/admin/socios`
Crea un nuevo socio.

**Request:**
```json
{
  "email": "string",
  "nombre": "string",
  "apellido": "string",
  "telefono": "string (opcional)",
  "rut": "string (opcional)",
  "ciudad": "string (opcional)",
  "direccion": "string (opcional)",
  "password": "string",
  "valorCuota": "number (opcional, default: 6500)",
  "rol": "usuario | director_editor | director | admin (opcional)",
  "estadoSocio": "activo | inactivo (opcional)"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "message": "Socio creado exitosamente",
    "socioId": "number",
    "socio": { /* datos del socio creado */ }
  }
}
```

---

#### `GET /api/admin/socios/:id`
Obtiene los datos completos de un socio específico.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "socio": {
      "id": "number",
      "email": "string",
      "nombre": "string",
      "apellido": "string",
      "nombreCompleto": "string",
      "telefono": "string | null",
      "rut": "string | null",
      "ciudad": "string | null",
      "direccion": "string | null",
      "fotoUrl": "string | null",
      "valorCuota": "number",
      "fechaIngreso": "string (ISO)",
      "estadoSocio": "string",
      "role": "string"
    }
  }
}
```

---

#### `PUT /api/admin/socios/:id`
Actualiza los datos de un socio. Todos los campos son opcionales.

**Request:**
```json
{
  "nombre": "string",
  "apellido": "string",
  "email": "string",
  "telefono": "string",
  "rut": "string",
  "ciudad": "string",
  "direccion": "string",
  "valor_cuota": "number",
  "estado_socio": "activo | inactivo | suspendido",
  "role": "usuario | director_editor | director | admin",
  "fecha_ingreso": "string (ISO)"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "message": "Socio actualizado correctamente",
    "socio": { /* datos actualizados */ }
  }
}
```

---

#### `DELETE /api/admin/socios/:id`
Elimina un socio (soft delete, marca activo = 0).

**Response 200:**
```json
{
  "success": true,
  "data": {
    "message": "Socio eliminado correctamente",
    "socioId": "number"
  }
}
```

---

#### `POST /api/admin/socios/:id/foto`
Sube o actualiza la foto de perfil de un socio.

**Content-Type:** `multipart/form-data`

**Body:**
- `foto` (File): Archivo de imagen (JPEG, PNG, GIF, WebP)

**Response 200:**
```json
{
  "success": true,
  "data": {
    "message": "Foto actualizada correctamente",
    "fotoUrl": "string"
  }
}
```

---

### 💰 Gestión de Cuotas (`/api/admin/cuotas/`)

#### `GET /api/admin/cuotas`
Lista todas las cuotas con estadísticas.

**Query Params:**
- `año` (número): Año de las cuotas (default: año actual)

**Response 200:**
```json
{
  "success": true,
  "data": {
    "cuotas": [
      {
        "id": "number",
        "usuarioId": "number",
        "socio": {
          "nombre": "string",
          "apellido": "string",
          "nombreCompleto": "string"
        },
        "año": "number",
        "mes": "number",
        "valor": "number",
        "pagado": "boolean",
        "fechaPago": "string | null",
        "metodoPago": "string | null",
        "comprobanteUrl": "string | null"
      }
    ],
    "estadisticas": {
      "totalCuotas": "number",
      "pagadas": "number",
      "pendientes": "number",
      "montoTotal": "number",
      "montoPagado": "number",
      "montoPendiente": "number"
    }
  }
}
```

---

#### `POST /api/admin/cuotas/generar`
Genera cuotas para todos los socios activos en un mes específico.

**Request:**
```json
{
  "año": "number",
  "mes": "number (1-12)",
  "valorDefault": "number (opcional)"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "message": "Cuotas generadas exitosamente",
    "cuotasGeneradas": "number",
    "año": "number",
    "mes": "number"
  }
}
```

---

#### `PUT /api/admin/cuotas/marcar-pago`
Marca una cuota como pagada.

**Request:**
```json
{
  "cuotaId": "number",
  "metodoPago": "transferencia | efectivo | tarjeta",
  "notas": "string (opcional)"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "message": "Pago registrado exitosamente",
    "cuota": { /* datos actualizados */ }
  }
}
```

---

### 📢 Comunicados (`/api/admin/comunicados/`)

#### `GET /api/admin/comunicados`
Lista todos los comunicados.

**Response 200:**
```json
{
  "success": true,
  "comunicados": [
    {
      "id": "number",
      "titulo": "string",
      "contenido": "string",
      "tipo": "importante | corriente | urgente",
      "destinatarios": ["string"],
      "estado": "borrador | enviado",
      "fechaEnvio": "string | null",
      "creadoPor": "number"
    }
  ]
}
```

---

#### `POST /api/admin/comunicados`
Crea un nuevo comunicado.

**Request:**
```json
{
  "titulo": "string",
  "contenido": "string",
  "tipo": "importante | corriente | urgente",
  "destinatarios": ["todos | morosos | activos | administradores"],
  "enviar": "boolean"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "message": "Comunicado creado exitosamente",
    "comunicado": { /* datos del comunicado */ }
  }
}
```

---

### 🖼️ Gestión de Imágenes

#### `POST /api/upload-image`
Sube una imagen a Cloudflare R2.

**Content-Type:** `multipart/form-data`

**Body:**
- `file` (File): Archivo de imagen
- `path` (string): Ruta de almacenamiento (ej: "socios/123")

**Response 200:**
```json
{
  "success": true,
  "url": "string"
}
```

---

#### `GET /api/images`
Obtiene una imagen desde Cloudflare R2.

**Query Params:**
- `path` (string): Ruta de la imagen (ej: "socios/123/foto.jpg")

**Response:** Binary stream de la imagen con headers apropiados.

---

## ⚙️ Configuración de Infraestructura

### Cloudflare Account
```
Account ID: 172194a6569df504cbb8a638a94d3d2c
Project: acachile
```

### Variables de Entorno (wrangler.toml)
```toml
[env.production.vars]
ENVIRONMENT = "production"
CORS_ORIGIN = "https://acachile.pages.dev"
FRONTEND_URL = "https://acachile.pages.dev"
FROM_EMAIL = "noreply@mail.juancartagena.cl"
ADMIN_EMAIL = "admin@acachile.cl"
R2_PUBLIC_URL = "https://pub-85ac8c62baca4966b2ac0b16e1b9b6c6.r2.dev"

[[d1_databases]]
binding = "DB"
database_name = "acachile-db"
database_id = "086f0530-48b6-41db-95ab-77bce733f0df"

[[kv_namespaces]]
binding = "ACA_KV"
id = "b080082921d4476e6995c8085f1033286"
preview_id = "deda506587a1476a96578cb545f0128e"

[[r2_buckets]]
binding = "IMAGES"
bucket_name = "aca-chile-images"

[[env.production.kv_namespaces]]
binding = "ACA_KV"
id = "60fff9f10819406cad241e326950f056"

[[env.production.d1_databases]]
binding = "DB"
database_name = "acachile-db"
database_id = "086f0530-48b6-41db-95ab-77bce733f0df"

[[env.production.r2_buckets]]
binding = "IMAGES"
bucket_name = "aca-chile-images"
```

### Secrets de Cloudflare
```bash
# JWT_SECRET (para tokens de autenticación)
wrangler secret put JWT_SECRET

# RESEND_API_KEY (para envío de emails)
wrangler secret put RESEND_API_KEY
# Valor actual: re_Yk8S9iyk_63xGiXBqE3K2wG6ckLzq9zyM (rotar antes de cada sprint)
```

### Cloudflare R2 Bucket: `aca-chile`
```
Binding: IMAGES
Public URL: https://pub-85ac8c62baca4966b2ac0b16e1b9b6c6.r2.dev

Estructura de carpetas:
/socios/{id}/foto.{ext}                    # Fotos de perfil
/comprobantes/{año}/{mes}/{socioId}/...    # Comprobantes de pago
/postulaciones/{postulacionId}-{hash}.{ext}  # Fotos de nuevos postulantes
```

### Cloudflare KV Namespace
```
Binding: ACA_KV
ID (producción): 60fff9f10819406cad241e326950f056

Uso actual:
- Cache de estadísticas
- Cache de secciones de contenido (home/about/contact)
- Sugestiones de búsqueda y fallback de noticias/eventos
```

---

## 🚀 Setup y Despliegue

### Prerrequisitos
```bash
node >= 18.0.0
npm >= 9.0.0
wrangler >= 3.0.0
git
```

### Instalación Local

#### 1. Clonar repositorio
```bash
git clone https://github.com/Jcartagenac/acachile.git
cd acachile
```

#### 2. Instalar dependencias
```bash
cd frontend
npm install
```

#### 3. Configurar variables de entorno locales
```bash
# Crear archivo .dev.vars en /frontend
echo "JWT_SECRET=tu-secret-local" > .dev.vars
echo "RESEND_API_KEY=re_..." >> .dev.vars
```

#### 4. Iniciar desarrollo local
```bash
npm run dev
```
Abre: http://localhost:5173

### Despliegue a Producción

#### Opción 1: Git Push (Automático)
```bash
git add .
git commit -m "descripción del cambio"
git push origin main
```
Cloudflare Pages detecta el push y despliega automáticamente.

#### Opción 2: Manual con Wrangler
```bash
cd frontend
npm run build
npx wrangler pages deploy dist --project-name=acachile
```

### Scripts Disponibles
```bash
npm run dev          # Desarrollo local con hot-reload
npm run build        # Build de producción
npm run preview      # Preview del build
npm run lint         # Linter ESLint
npm run type-check   # Verificar tipos TypeScript
```

---

## 📚 Guía para Continuación

### Para IAs que continúan el desarrollo

#### Contexto Rápido
Este proyecto es una aplicación fullstack en **React + TypeScript** con backend en **Cloudflare Pages Functions**. La arquitectura es moderna, serverless y utiliza D1 (SQLite), R2 (storage) y KV (cache).

#### Patrones de Código Implementados

##### 1. Estructura de APIs (Backend)
Todas las APIs en `frontend/functions/api/` siguen este patrón:

```javascript
// frontend/functions/api/ejemplo/index.js
export async function onRequestGet(context) {
  const { request, env } = context;
  
  try {
    // Lógica del endpoint
    const result = await env.DB.prepare('SELECT * FROM tabla').all();
    
    return new Response(JSON.stringify({
      success: true,
      data: result.results
    }), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    });
  } catch (error) {
    console.error('[ERROR]', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' } 
    });
  }
}

export async function onRequestPost(context) {
  // Similar para POST, PUT, DELETE
}
```

##### 2. Hooks Personalizados (Frontend)
```typescript
// frontend/src/hooks/useAdminService.ts
export const useAdminService = () => {
  const { user, updateUser, hasPermission } = useAuth();

  const getMembers = async (searchTerm?: string) => {
    const response = await fetch(`/api/admin/socios?search=${searchTerm}`);
    return response.json();
  };

  return { getMembers, /* otros métodos */ };
};
```

##### 3. Componentes con Modales
```typescript
// Patrón de modal implementado en AdminModule
const [showModal, setShowModal] = useState(false);
const [selectedItem, setSelectedItem] = useState<Item | null>(null);

const handleEdit = (item: Item) => {
  setSelectedItem(item);
  setShowModal(true);
};

{showModal && selectedItem && (
  <EditModal
    item={selectedItem}
    onClose={() => setShowModal(false)}
    onSave={() => {
      loadData();
      setShowModal(false);
    }}
  />
)}
```

##### 4. Manejo de Imágenes con R2
```typescript
// frontend/src/services/imageService.ts
export const uploadToR2 = async (file: File, path: string) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('path', path);

  const response = await fetch('/api/upload-image', {
    method: 'POST',
    body: formData
  });

  return response.json();
};

// Implementación del center-crop para imágenes
export const resizeImage = async (file: File, width: number, height: number): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;

      // Center-crop algorithm
      const scale = Math.max(width / img.width, height / img.height);
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;
      const offsetX = (width - scaledWidth) / 2;
      const offsetY = (height - scaledHeight) / 2;

      ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);

      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to create blob'));
      }, 'image/jpeg', 0.92);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};
```

#### Próximas Funcionalidades Sugeridas

##### 🔥 Alta Prioridad
1. **Sistema de Notificaciones**
   - Notificaciones push en navegador
   - Emails automáticos para cuotas pendientes
   - Alertas de comunicados importantes

2. **Reportes y Estadísticas**
   - Exportar a Excel/PDF
   - Gráficos de evolución de pagos
   - Dashboard con más métricas

3. **Mejoras de UX**
   - Loading states más elaborados
   - Toasts para notificaciones
   - Confirmaciones antes de acciones destructivas

##### �� Prioridad Media
1. **Sistema de Eventos**
   - CRUD de eventos de la asociación
   - Inscripciones de socios
   - Calendario de eventos

2. **Galería de Fotos**
   - Álbumes de eventos
   - Compartir en redes sociales
   - Comentarios y likes

3. **Chat/Mensajería Interna**
   - Chat entre socios
   - Mensajes directos con admin
   - Notificaciones en tiempo real

##### 🚀 Futuro
1. **App Móvil**
   - React Native
   - Notificaciones push nativas
   - Sincronización offline

2. **Integraciones**
   - Pasarela de pagos (Webpay/Flow)
   - Google Calendar
   - WhatsApp Business API

#### Guías de Debugging

##### Logs en Cloudflare
```bash
# Ver logs en tiempo real
wrangler pages deployment tail

# Ver logs de un despliegue específico
wrangler pages deployment logs [deployment-id]
```

##### Queries D1 Directas
```bash
# Conectar a D1
wrangler d1 execute ACA_DB --command "SELECT * FROM usuarios LIMIT 5"

# Ejecutar archivo SQL
wrangler d1 execute ACA_DB --file=./schema.sql
```

##### Inspeccionar R2
```bash
# Listar objetos en bucket
wrangler r2 object list aca-chile

# Descargar un objeto
wrangler r2 object get aca-chile/socios/1/foto.jpg --file=./foto.jpg
```

#### Problemas Comunes y Soluciones

##### 1. Error de CORS
```javascript
// Agregar headers en la respuesta
headers: {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
}
```

##### 2. JWT No Válido
```bash
# Regenerar secret
wrangler secret put JWT_SECRET
# Valor nuevo: [ingresar]
```

##### 3. Imagen No Se Muestra
```javascript
// Verificar binding en wrangler.toml
[[r2_buckets]]
binding = "ACA_BUCKET"  # Debe coincidir con env.ACA_BUCKET en el código
```

##### 4. Build Falla en Cloudflare
```bash
# Verificar versiones en package.json
"node": ">=18.0.0"

# Limpiar cache
rm -rf node_modules package-lock.json
npm install
```

##### 5. Error: Variable no definida en context.params
```javascript
// INCORRECTO:
const { params } = context;
const { id } = params;

// CORRECTO:
const id = context.params.id;
```

---

## 📝 Notas Adicionales

### Versiones de Dependencias Críticas
```json
{
  "node": ">=18.0.0 (desarrollo local)",
  "react": "18.3.1",
  "react-router-dom": "6.25.1",
  "react-hook-form": "7.52.1",
  "typescript": "5.5.4",
  "vite": "5.3.5",
  "tailwindcss": "3.4.18",
  "lucide-react": "0.545.0",
  "wrangler": "3.x (compatibilidad 2024-09-23)"
}
```

### Comandos Útiles de Wrangler
```bash
# Login
wrangler login

# Ver info del proyecto
wrangler pages project list

# Ver despliegues
wrangler pages deployment list --project-name=acachile

# Rollback a despliegue anterior
wrangler pages deployment create dist --project-name=acachile

# Ver bindings
wrangler pages deployment view [deployment-id]
```

### Base de Conocimiento
- Documentación Cloudflare Pages: https://developers.cloudflare.com/pages/
- Cloudflare D1: https://developers.cloudflare.com/d1/
- Cloudflare R2: https://developers.cloudflare.com/r2/
- React Docs: https://react.dev/
- TypeScript: https://www.typescriptlang.org/docs/

---

## 📄 Licencia

Este proyecto es privado y pertenece a la Asociación Chilena de Asadores (ACA Chile).

---

## 🤝 Contribución

Para contribuir al proyecto:

1. Crea un branch desde `main`
2. Realiza tus cambios
3. Haz commit con mensajes descriptivos
4. Push y crea un Pull Request
5. Espera revisión y merge

### Convenciones de Commits
```
feat: Nueva funcionalidad
fix: Corrección de bug
docs: Cambios en documentación
style: Cambios de formato (no afectan código)
refactor: Refactorización de código
test: Agregar o modificar tests
chore: Tareas de mantenimiento
```

---

## 📞 Contacto

- **Desarrollador**: Juan Cartagena
- **Email**: juan@juancartagena.cl
- **GitHub**: [@Jcartagenac](https://github.com/Jcartagenac)

---

**Última actualización**: 18 de febrero de 2026  
**Versión**: 1.1.0  
**Estado**: ✅ Producción Estable

---

## 🎉 Resumen para Continuidad

Este README contiene TODO lo necesario para que cualquier desarrollador o IA pueda continuar el proyecto:

✅ **Funcionalidades completas** - Todas las features implementadas documentadas  
✅ **Stack tecnológico** - Versiones exactas de todas las dependencias  
✅ **Arquitectura** - Estructura de carpetas y patrones de código  
✅ **Base de datos** - Esquema completo con todas las tablas e índices  
✅ **APIs** - Documentación exhaustiva de 20+ endpoints  
✅ **Infraestructura** - Configuración de Cloudflare (D1, R2, KV)  
✅ **Setup** - Instrucciones paso a paso para desarrollo local  
✅ **Despliegue** - Guías para deployment a producción  
✅ **Debugging** - Comandos y soluciones a problemas comunes  
✅ **Próximos pasos** - Sugerencias priorizadas de funcionalidades

**IMPORTANT NOTE FOR AI CONTINUITY:**
When continuing this project, always refer back to this README for:
- Code patterns and conventions
- API endpoint structures
- Database schema
- Cloudflare configuration
- Common debugging scenarios

The project follows a consistent pattern across all endpoints and components. Study the examples provided to maintain code consistency.
