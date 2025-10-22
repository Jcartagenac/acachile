# ACA Chile Platform

> Plataforma full‑stack para la Asociación Chilena de Asadores (ACA Chile): inscripción y gestión de socios, cobro de cuotas, publicación de noticias/eventos y administración operativa, todo sobre la plataforma serverless de Cloudflare.

[![Cloudflare Pages](https://img.shields.io/badge/Cloudflare-Pages-orange)](https://developers.cloudflare.com/pages/)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-f38020)](https://developers.cloudflare.com/workers/)
[![React 18](https://img.shields.io/badge/React-18.3.1-61dafb)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8)](https://tailwindcss.com/)

---

## 📚 Tabla de Contenidos

1. [Visión General](#1--visión-general)
2. [Stack Tecnológico Detallado](#2--stack-tecnológico-detallado)
3. [Arquitectura y Flujo de Datos](#3--arquitectura-y-flujo-de-datos)
4. [Estructura de Directorios](#4--estructura-de-directorios)
5. [Roles y Permisos](#5--roles-y-permisos)
6. [Módulos y Funcionalidades](#6--módulos-y-funcionalidades)
7. [Modelado de Datos](#7--modelado-de-datos)
8. [Entornos y Configuración](#8--entornos-y-configuración)
9. [Puesta en Marcha Local](#9--puesta-en-marcha-local)
10. [Comandos y Scripts Clave](#10--comandos-y-scripts-clave)
11. [Datos Iniciales y Usuarios Admin](#11--datos-iniciales-y-usuarios-admin)
12. [Superficie de API](#12--superficie-de-api)
13. [Front‑End Routing y Componentes](#13--front-end-routing-y-componentes)
14. [Observabilidad y Debug](#14--observabilidad-y-debug)
15. [Testing y Calidad](#15--testing-y-calidad)
16. [Despliegue y Operaciones](#16--despliegue-y-operaciones)
17. [Tareas de Mantenimiento](#17--tareas-de-mantenimiento)
18. [Troubleshooting](#18--troubleshooting)
19. [Documentación Complementaria](#19--documentación-complementaria)
20. [Checklist de Primer Día](#20--checklist-de-primer-día)
21. [Glosario Rápido](#21--glosario-rápido)
22. [Contribuir y Buenas Prácticas](#22--contribuir-y-buenas-prácticas)

---

## 1. 🎯 Visión General

ACA Chile centraliza la administración de la asociación:

- Gestión de socios (altas, bajas, actualización de perfil, privacidad, foto, estado).
- Cobranza de cuotas con seguimiento mensual, recibos y estadísticas.
- Panel administrativo para usuarios internos con roles diferenciados.
- Publicación de eventos, noticias y contenido institucional.
- Formularios de postulación con flujo de revisión/aprobación.
- Buscador global con privacidad configurable.

El objetivo de este README es permitir que cualquier persona (desde un pasante junior hasta otra IA) pueda levantar el entorno, comprender la arquitectura y continuar el desarrollo sin depender de conocimiento tácito.

---

## 2. 🧠 Stack Tecnológico Detallado

### Frontend
- **React 18 + TypeScript** (SPA).
- **Vite 5** como bundler y dev server.
- **Tailwind CSS** para estilos y diseño responsivo.
- **React Router 6** para la navegación.
- **Context API + hooks** (`AuthContext`, `EventContext`) para estado global.
- **Servicios HTTP propios** con logging estructurado (`src/services`).
- **Lucide React** para iconografía y `clsx` / `tailwind-merge` para utilidades CSS.

### Backend (Cloudflare)
- **Cloudflare Pages Functions** (basadas en Workers) bajo `frontend/functions`.
- **D1 (SQLite serverless)** como base de datos principal.
- **Cloudflare KV** para datos cacheados y catálogos ligeros.
- **Cloudflare R2** (S3 compatible) para almacenamiento de medios (fotos, comprobantes).
- **Resend** para correos transaccionales (bienvenida, recuperación, avisos).
- **JWT** para autenticación con middleware propio.

### Tooling / Dev Experience
- **ESLint 9 + TypeScript ESLint** (modo flat) para linting.
- **Tailwind CLI** integrado en Vite.
- **Wrangler CLI** para emulación local, despliegues y gestión de bindings.
- **Scripts auxiliares** (`R2_*`, guías en `docs/`) para tareas de infraestructura.

---

## 3. 🏗️ Arquitectura y Flujo de Datos

```
┌───────────────┐        ┌────────────────────────┐
│ Navegador SPA │  HTTPS │ Cloudflare Pages (Vite) │
└──────┬────────┘        └────────────┬───────────┘
       │                              │
       │  fetch /api/*                │ Serverless render (static assets)
       ▼                              ▼
┌──────────────────────────────┐   ┌─────────────────────────┐
│ Cloudflare Pages Functions   │   │ Static Assets (React)   │
│ (frontend/functions/api)     │   │ dist/ -> CDN global     │
└──────────┬──────┬────────────┘
           │      │
           │      │ calls (via bindings)
           │      ▼
           │    ┌───────────────────────────┐
           │    │ Cloudflare D1 (SQLite)    │ ← datos estructurados
           │    └───────────────────────────┘
           │
           │    ┌───────────────────────────┐
           │    │ Cloudflare KV (ACA_KV)    │ ← cache, catálogos, contenido
           │    └───────────────────────────┘
           │
           │    ┌───────────────────────────┐
           └──▶ │ Cloudflare R2             │ ← fotos, comprobantes, adjuntos
                └───────────────────────────┘
```

- Autenticación: JWT firmado, validado por middleware compartido (`frontend/functions/api/_middleware`).
- Autorización: roles + permisos (ver [sección 5](#5--roles-y-permisos)).
- Comunicación interna: servicios en `frontend/src/services/*` abstraen endpoints y normalizan respuestas.
- Logging: consola estructurada en frontend (window.logger) y logs de Workers disponibles en Cloudflare (`wrangler pages deployment tail`).

---

## 4. 🗂️ Estructura de Directorios

| Ruta | Contenido |
|------|-----------|
| `frontend/` | Proyecto React + Vite. Contiene `src/`, `public/`, config de Tailwind, Vite, ESLint. |
| `frontend/functions/` | Cloudflare Pages Functions (cada archivo o carpeta expone un endpoint). |
| `frontend/functions/api/_middleware/` | Autenticación, helpers comunes (`requireAuth`, `jsonResponse`). |
| `frontend/functions/api/admin/` | Endpoints administrativos (usuarios, socios, cuotas, roles, migraciones). |
| `frontend/functions/api/auth/` | Login, perfil, privacidad. |
| `frontend/functions/api/search/` | Búsqueda global y sugerencias. |
| `shared/` | Tipos TypeScript compartidos (roles, permisos, tipos de eventos, utilidades). |
| `migrations/` | Scripts SQL (histórico) aplicables sobre D1. |
| `docs/*.md` | Guías operativas (DNS, R2, Pages, debugging, etc.). |
| `scripts/`, `*.sh` | Utilidades para deploy, configuración y mantenimiento (leer cada doc antes de usar). |
| `clone/`, `clone-repo/` | Snapshot legacy (no forman parte del build actual; mantener por referencia). |
| `public/`, `dist/` | Assets estáticos y salida de build respectivamente. |

---

## 5. 🔐 Roles y Permisos

Roles vigentes (tabla `roles_catalog` + `shared/index.ts`):

| Rol | Descripción | Permisos principales |
|-----|-------------|----------------------|
| `usuario` | Socio estándar, acceso a portal público y su perfil. | Ver eventos/noticias, gestionar perfil, ver/descargar cuotas propias. |
| `director_editor` | Director con capacidad editorial. | Todo lo anterior + administrar contenido (eventos, noticias, postulaciones). |
| `director` | Director operativo. | Gestión de socios, cuotas, comunicados, estadísticas avanzadas. |
| `admin` | Administrador general. | Acceso total: configuración, usuarios internos, seguridad. |

> También existe `super_admin` en código heredado para compatibilidad, pero la UI actual se alinea con los cuatro roles anteriores.

Los permisos específicos se definen en `shared/index.ts` (`ROLE_PERMISSIONS`), y la UI condicional utiliza estos valores para mostrar/ocultar acciones.

---

## 6. ✨ Módulos y Funcionalidades

### Frontend (principales vistas)
- **Landing / Sitio público**: Home, eventos, noticias, formulario “Únete”.
- **Autenticación**: Login, recuperación, refresco de sesión (JWT en localStorage + cookies).
- **Perfil de socio**: Datos personales, preferencias de privacidad, historial de pago.
- **Panel Admin**:
  - **Dashboard**: métricas rápidas (usuarios activos, cuotas, eventos).
  - **Socios** (`AdminSocios`): CRUD completo, importación CSV, subida de foto a R2, estado y listas.
  - **Usuarios internos** (`AdminUsers`): creación/edición de credenciales + roles.
  - **Cuotas**: resumen anual, detalle por socio, actualización de estado.
  - **Comunicados**: redacción, publicación, filtrado por destinatarios.
  - **Eventos & Noticias**: gestión con soporte multimedia (imágenes en R2, caché en KV).
  - **Postulaciones**: revisión multi-aprobador, seguimiento de candidatos.
  - **Contenido institucional**: editor por secciones (home, about, contacto) con fallback en KV.

### Backend (funciones destacadas)
- **`/api/admin/socios`**: CRUD + reactivación de socios, valida roles, normaliza payloads (incluye `rol`).
- **`/api/admin/users`**: altas/bajas de usuarios staff, cambio de roles, catálogo de roles (`/api/admin/roles`).
- **`/api/admin/migrate-socios-schema`**: script idempotente para preparar tablas de cuotas/configuración.
- **`/api/auth/privacy`**: preferencias de visibilidad (email, teléfono, RUT, etc.).
- **`/api/search/*`**: búsqueda global y sugerencias con respeto de flags de privacidad.
- **`/api/admin/content`**: editor de secciones del sitio, cacheado en KV.
- **`/api/unete`**: recepción de postulaciones con foto (subida a R2 + registro en D1).
- **`/api/system/maintenance`**: health check ampliado (bindings, conexiones).

---

## 7. 🗃️ Modelado de Datos

### 7.1 Tablas principales en D1

> Las columnas listadas provienen de migraciones y consultas activas. La base histórica (`usuarios`, `inscripciones`, `comentarios`) se mantiene de versiones anteriores.

#### `usuarios`
- `id` (INTEGER, PK)
- `email` (TEXT, único)
- `password_hash` (TEXT)
- `nombre`, `apellido` (TEXT)
- `telefono`, `rut`, `ciudad`, `direccion` (TEXT, opcional)
- `foto_url` (TEXT, opcional)
- `valor_cuota` (INTEGER, default 6500)
- `fecha_ingreso` (DATETIME)
- `estado_socio` (TEXT, default `'activo'`)
- `lista_negra` (BOOLEAN numérico)
- `motivo_lista_negra` (TEXT)
- `role` (TEXT, valores en roles_catalog)
- `activo` (BOOLEAN numérico)
- `last_login`, `created_at`, `updated_at` (DATETIME)

#### `roles_catalog`
- `key` (PK) – `usuario`, `director_editor`, `director`, `admin`
- `label`, `description` (TEXT)
- `priority` (INTEGER)
- `created_at` (DATETIME)

#### `configuracion_global`
- `id` (PK autoincremental)
- `clave`, `valor`, `descripcion`
- `tipo` (string, number, json…)
- `created_at`, `updated_at`

#### `cuotas`
- `id` (PK)
- `usuario_id` (FK → usuarios.id)
- `año`, `mes`
- `valor`
- `pagado` (BOOLEAN)
- `fecha_pago`, `metodo_pago`
- `comprobante_url`
- `notas`
- `created_at`, `updated_at`
- Índices: por `usuario_id/año`, `año/mes`, `pagado`, `fecha_pago`.

#### `pagos`
- `id` (PK)
- `cuota_id`, `usuario_id`, `procesado_por` (FK a usuarios)
- `monto`, `metodo_pago`, `comprobante_url`, `estado`
- `fecha_pago`
- `notas_admin`
- `created_at`, `updated_at`

#### `generacion_cuotas`
- `id` (PK)
- `año`, `mes` (único)
- `valor_default`
- `generadas` (INTEGER)
- `generado_por` (FK)
- `fecha_generacion`

#### `comunicados`
- `id` (PK)
- `titulo`, `contenido`, `tipo` (`importante`, `corriente`, `urgente`)
- `destinatarios` (JSON string)
- `fecha_envio`
- `estado` (`borrador`, `enviado`)
- `created_by` (FK → usuarios)
- `created_at`, `updated_at`

#### `eventos`
- `id` (PK)
- `title`, `description`, `location`, `image`
- `date`, `time`
- `type` (`campeonato`, `taller`, `encuentro`, `competencia`, `masterclass`)
- `status` (`draft`, `published`, `completed`, `cancelled`)
- `registration_open` (BOOLEAN)
- `max_participants`, `current_participants`
- `price`
- `organizer_id` (FK → usuarios)
- `created_at`, `updated_at`

#### `evento_inscripciones`
- `id` (TEXT PK)
- `evento_id`, `user_id` (FK → eventos / usuarios)
- `status` (`confirmed`, `waitlist`, `cancelled`)
- `created_at`, `updated_at`
- Índices: por evento y por usuario.

#### `postulaciones`
- `id` (PK)
- `full_name`, `email`, `phone`, `rut`
- `birthdate`, `region`, `city`, `occupation`
- `experience_level`, `specialties`
- `motivation`, `contribution`
- `availability` (JSON string)
- `has_competition_experience` (BOOLEAN numérico)
- `competition_details`
- `instagram`, `other_networks`
- `references_info`
- `photo_url`
- `status` (`pendiente`, `en_revision`, `aprobada`, `rechazada`)
- `approvals_required`, `approvals_count`
- `rejection_reason`
- `approved_at`, `rejected_at`
- `socio_id` (FK opcional → usuarios)
- `created_at`, `updated_at`

#### `postulacion_aprobaciones`
- `id` (PK)
- `postulacion_id` (FK → postulaciones, delete cascade)
- `approver_id` (FK → usuarios)
- `approver_role`
- `comment`
- `created_at`
- Constraint: `UNIQUE(postulacion_id, approver_id)`

#### `site_sections`
- PK compuesto (`page`, `key`)
- `title`, `content`, `image_url`
- `sort_order`
- `source_type` (`custom`, `event`, `news`)
- `source_id`
- `cta_label`, `cta_url`
- `created_at`, `updated_at`

#### `user_privacy_settings`
- `user_id` (PK / FK → usuarios)
- `show_email`, `show_phone`, `show_rut`, `show_address`, `show_birthdate`, `show_public_profile` (INTEGER 0/1)
- `updated_at`

#### Tablas legacy relevantes
- `inscripciones`, `comentarios`: usadas para métricas históricas en algunos endpoints de usuarios.

### 7.2 Cloudflare KV (`ACA_KV`)
- `noticias:all`: listado cacheado de noticias.
- `search:suggestions:*`: cache de sugerencias de búsqueda.
- `content:sections:<page>` (`SECTION_CACHE_KEY`): contenido institucional por página.
- Otros valores temporales para catálogos (roles, configuraciones rápidas).

### 7.3 Cloudflare R2
- Bucket principal (consultar `R2_*` docs) con estructura sugerida:
  - `socios/<userId>/foto.{jpg|png|webp}` – foto de perfil procesada.
  - `comprobantes/<año>/<mes>/<socioId>/<uuid>.pdf|jpg` – comprobantes de pago.
  - `postulaciones/<id>/<filename>` – fotos/documentos de postulantes.
  - `contenido/<slug>/media.*` – assets institucionales.
- Política de CORS y acceso público configurada via scripts en `docs/R2_*`.

### 7.4 Configuración y metadatos
- `ENVIRONMENT`, `FRONTEND_URL`, `CORS_ORIGIN`, `FROM_EMAIL`, `ADMIN_EMAIL`: definidos en `wrangler.toml` y Panel de Pages.
- Secretos: `JWT_SECRET`, `RESEND_API_KEY` (ver `ENV_CONFIG.md`, `SECRETS_CONFIG.md`).

---

## 8. ⚙️ Entornos y Configuración

| Variable | Descripción | Notas |
|----------|-------------|-------|
| `VITE_API_BASE_URL` | Base URL para fetch desde el frontend | Development: `http://localhost:8787` |
| `VITE_ENVIRONMENT` | `development` / `production` | Usado para toggles de logging. |
| `FRONTEND_URL` | URL base del frontend | Debe coincidir con dominio. |
| `CORS_ORIGIN` | Lista de orígenes permitidos (string o CSV) | Necesario para Workers. |
| `JWT_SECRET` | Hex string 32 bytes | Configurar en Pages (secret). |
| `RESEND_API_KEY` | API key para Resend | Solo requerido para enviar correos. |
| `DB` (binding) | Cloudflare D1 | Configurado en Pages + wrangler. |
| `ACA_KV` (binding) | Cloudflare KV | Para cache/sugerencias. |
| `R2` bindings | (según scripts) | Requiere bucket + token. |

Archivos `.env` disponibles en `frontend/` (`.env.development`, `.env.production`) sirven de referencia. _No se deben commitear datos sensibles_.

---

## 9. 🚀 Puesta en Marcha Local

1. **Clonar e instalar dependencias**
   ```bash
   git clone https://github.com/Jcartagenac/acachile.git
   cd acachile
   npm install
   ```

2. **Configurar variables locales**
   ```bash
   cp frontend/.env.development frontend/.env.local
   # Ajustar valores si deseas otro puerto o base URL.
   ```

3. **Iniciar sesión en Cloudflare (una vez)**
   ```bash
   wrangler login
   ```

4. **Preparar D1**
   - Crear base si no existe: `wrangler d1 create acachile-db`
   - Aplicar migraciones básicas (local):  
     ```bash
     wrangler d1 migrations apply acachile-db --local
     ```
   - Opcional: ejecutar `frontend/functions/api/admin/migrate-socios-schema` vía curl para asegurar columnas extendidas.

5. **Levantar entorno local**

   **Opción A: Wrangler + Vite en una sola terminal**
   ```bash
   cd frontend
   wrangler pages dev dist -- npm run dev -- --host --port 5173
   ```
   - Wrangler proxea `/api/*` a las funciones.
   - Accede a `http://localhost:8787` (sirve assets + API).

   **Opción B: Servicios separados**
   ```bash
   # Terminal 1
   cd frontend
   npm run dev -- --port 5173

   # Terminal 2
   cd frontend
   wrangler pages dev dist --port 8787
   ```

6. **Crear usuario admin**
   - Via POST `http://localhost:8787/api/admin/users` (desde panel) o insert directo en D1.
   - Alternativa rápida: insertar manualmente en D1 (ver sección [11](#11--datos-iniciales-y-usuarios-admin)).

7. **Verificar health**
   - `curl http://localhost:8787/api/health`
   - Abrir `http://localhost:5173` (o `:8787`) y confirmar login/panel.

---

## 10. 🛠️ Comandos y Scripts Clave

| Comando | Ruta | Descripción |
|---------|------|-------------|
| `npm run dev` | `frontend/` | Levanta el frontend (Vite). |
| `wrangler pages dev dist -- ...` | `frontend/` | Emula Pages + funciones localmente. |
| `npm run build` | `frontend/` | Build de producción (incluye copia de `_headers`). |
| `npm run preview` | `frontend/` | Sirve el build generado para testing rápido. |
| `npm run lint` | `frontend/` | ESLint + TypeScript. |
| `npm run deploy` | `frontend/` | Build y deploy a Cloudflare Pages (`acachile`). |
| `wrangler d1 migrations apply acachile-db` | raíz | Aplica migraciones (local o remoto). |

Scripts auxiliares (leer documentación antes de usar):

| Script | Propósito |
|--------|-----------|
| `scripts/update-r2-internal.js` | Ajustes avanzados para objetos en R2. |
| `setup-r2-*.sh` | Configuración automatizada de buckets y permisos. |
| `prepare-temp-urls.js` | Generación de URLs temporales para compartir assets. |
| `auto-dns-setup.sh` | Automatiza configuración DNS (ver `DNS_*`). |

---

## 11. 🧪 Datos Iniciales y Usuarios Admin

- **Crear admin vía API**
  ```bash
  curl -X POST http://localhost:8787/api/admin/users \
    -H "Content-Type: application/json" \
    -d '{
      "name": "Admin Local",
      "email": "admin@local.test",
      "password": "Passw0rd!",
      "role": "admin"
    }'
  ```
- **Inyección directa en D1 (solo desarrollo)**
  ```sql
  INSERT INTO usuarios (email, password_hash, nombre, apellido, role, activo, created_at, updated_at)
  VALUES ('admin@local.test', '<hash sha256>', 'Admin', 'Local', 'admin', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
  ```
  > Hash generable con `frontend/functions/api/admin/users/index.js` (`hashPassword`). Puedes usar la misma función en Node o replicar manualmente (SHA-256 + salt `salt_aca_chile_2024`).

- **Datos demo**
  - `temp_init_events.js`, `plantilla_socios_aca.csv` sirven como ejemplos.
  - Revisa `temp-images/` y documentación R2 para subir imágenes.

---

## 12. 🌐 Superficie de API

> Todas las rutas cuelgan de `/api`. Endpoints principales:

### Autenticación
- `POST /api/auth/login`
- `POST /api/auth/register` (si habilitado)
- `GET /api/auth/profile`
- `PUT /api/auth/profile`
- `GET/PUT /api/auth/privacy`
- `POST /api/auth/logout`

### Socios y Usuarios
- `GET /api/admin/socios`
- `POST /api/admin/socios`
- `GET/PUT/DELETE /api/admin/socios/:id`
- `GET /api/admin/users`
- `POST /api/admin/users`
- `PUT /api/admin/users/:id`
- `DELETE /api/admin/users/:id`
- `GET /api/admin/roles`

### Cuotas y Finanzas
- `GET /api/admin/cuotas`
- `POST /api/admin/cuotas/generar`
- `PUT /api/admin/cuotas/:id`
- `POST /api/admin/cuotas/:id/comprobante` (R2)
- `GET /api/admin/pagos`

### Eventos y Noticias
- `GET /api/eventos`, `POST /api/eventos`
- `GET /api/eventos/:id`, `PUT /api/eventos/:id`
- `GET /api/noticias`, `POST /api/noticias`
- `GET /api/admin/content` (con `?page=home|about|contact`)
- `POST /api/admin/content`

### Postulaciones y Formularios
- `POST /api/unete`
- `GET /api/admin/postulaciones`
- `PUT /api/admin/postulaciones/:id` (cambio de estado, asignación de socio)
- `POST /api/admin/postulaciones/:id/approve`

### Búsqueda y utilitarios
- `GET /api/search?q=&type=&limit=`
- `GET /api/search/suggestions?q=`
- `GET /api/system/maintenance`
- `GET /api/health`

> Los archivos originales en `frontend/functions/api/**/*` son la referencia definitiva para el comportamiento y validaciones.

---

## 13. 🖥️ Front‑End Routing y Componentes

| Ruta | Componente | Descripción |
|------|------------|-------------|
| `/` | `Home` | Landing pública. |
| `/eventos` | `Eventos` | Listado público de eventos. |
| `/eventos/:id` | `EventoDetalle` | Detalle de evento. |
| `/noticias` | `Noticias` | Blog institucional. |
| `/unete` | `JoinForm` | Postulación a la asociación (upload foto). |
| `/perfil` | `UserProfile` | Datos del socio y privacidad. |
| `/panel-admin` | `AdminDashboard` | Resumen general (requiere rol >= director). |
| `/panel-admin/socios` | `AdminSocios` | CRUD socios. |
| `/panel-admin/users` | `AdminUsers` | Gestión de usuarios internos. |
| `/panel-admin/cuotas` | `AdminCuotas` | Seguimiento de cuotas. |
| `/panel-admin/comunicados` | `AdminComunicados` | Comunicaciones internas. |
| `/panel-admin/eventos` | `AdminEventos` | CRUD eventos. |
| `/panel-admin/noticias` | `AdminNoticias` | CRUD noticias. |
| `/panel-admin/postulaciones` | `AdminPostulaciones` | Revisión de solicitudes. |
| `/panel-admin/contenido` | `AdminContent` | Editor de secciones públicas. |
| `/buscar` | `SearchResults` | Vista de resultados para la búsqueda global. |

El enrutamiento está centralizado en `frontend/src/App.tsx`. Cada vista consume servicios desde `frontend/src/services/`.

---

## 14. 🔍 Observabilidad y Debug

- `frontend/src/utils/logger.ts`: wrapper que expone `window.logger` con namespaces (`auth`, `api`, `search`, `events`, `ui`). Útil en desarrollo.
- `components/debug/DebugPanel.tsx`: panel flotante (icono 🐛) que muestra estado de auth, entorno y ejecuta pruebas rápidas.
- `logger.auth.info('mensaje')`: disponible desde consola en desarrollo.
- Cloudflare: inspeccionar logs con `wrangler pages deployment tail --project-name acachile`.
- Endpoint `/api/system/maintenance`: entrega estado de bindings, conexiones y algunas métricas (útil cuando algo falla en producción).

---

## 15. ✅ Testing y Calidad

Actualmente no existe una suite automática consolidada. Recomendaciones:

1. Ejecutar `npm run lint` antes de abrir PR.
2. Pruebas manuales mínimas:
   - Login/logout, recuperación de sesión.
   - CRUD de socios y usuarios (incluyendo cambio de roles).
   - Generación y pago de cuotas.
   - Creación de eventos/noticias + verificación en el sitio público.
   - Flujo de postulación (formulario → panel admin).
   - Buscador global (respetando privacidad).
3. Verificar subida de archivos (foto socio, comprobantes) para asegurarse de que R2 está correctamente configurado.
4. Revisión visual en múltiples breakpoints (Tailwind).

Se recomienda agregar pruebas unitarias/e2e en el futuro (por ejemplo, Vitest + Playwright).

---

## 16. ☁️ Despliegue y Operaciones

1. **Build**
   ```bash
   cd frontend
   npm run build
   ```

2. **Deploy manual**
   ```bash
   npm run deploy
   # Equivalente a: wrangler pages deploy dist --project-name acachile
   ```

3. **Variables/secretos**
   - Administrar desde dashboard de Cloudflare Pages (Settings → Environment Variables).
   - O usar CLI:  
     `echo "valor" | wrangler pages secret put JWT_SECRET --project-name acachile`

4. **D1 migrations**
   - Producción: `wrangler d1 migrations apply acachile-db --remote`
   - Verificar con `wrangler d1 execute acachile-db --remote --command "SELECT COUNT(*) FROM usuarios;"`.

5. **R2 uploads**
   - Scripts en `docs/R2_*.md` explican cómo subir desde CLI o automatizar tareas.

6. **Rollback**
   - Utilizar historial de deployments en Cloudflare Pages para revertir.
   - D1: mantén respaldo antes de migraciones críticas (`wrangler d1 backup` no existe nativamente; exporta manualmente con `.dump` si es necesario).

---

## 17. 🔁 Tareas de Mantenimiento

| Tarea | Frecuencia sugerida | Cómo |
|-------|--------------------|------|
| Revisar cuotas pendientes | Semanal | Panel admin → Cuotas, o query D1. |
| Actualizar catálogo de roles | Ad-hoc | `/api/admin/roles` (se autopopula). |
| Limpiar cache de noticias/búsqueda | Cuando cambien datos masivos | Invalidar claves en KV (`wrangler kv:key delete`). |
| Revisar postulaciones pendientes | Diario | Panel admin → Postulaciones. |
| Verificar integridad de R2 | Mensual | Scripts `R2_*` + revisión manual. |
| Actualizar credenciales (Resend, JWT) | Revísalo cada 6 meses | Dashboard Cloudflare. |
| Auditar permisos de usuarios internos | Trimestral | `/api/admin/users`. |

---

## 18. 🆘 Troubleshooting

| Problema | Posible causa | Solución |
|----------|---------------|----------|
| `Failed to fetch` en producción | `VITE_API_BASE_URL` apuntando a worker incorrecto o CORS bloqueado | Ver `FIX_FAILED_TO_FETCH.md` + actualizar variable en Pages. |
| Login siempre falla en local | `JWT_SECRET` no configurado o D1 vacío | Crear secreto, crear usuario admin. |
| Fotos no se suben a R2 | Falta binding R2 o credenciales | Revisar `R2_SETUP.md`, verificar logs de Workers. |
| Búsqueda no muestra socios | Privacidad deshabilitada (`showPublicProfile=false`) o índice vacío | Revisar `/api/auth/privacy` y carga inicial de datos. |
| Wrangler no inicia | Node/npm faltantes | Instalar Node 20+, volver a correr `npm install`. |
| Deploy falla en Pages | Build command incorrecto o dependencias no instaladas | Configurar root `frontend/`, comando `npm run build`, output `frontend/dist`. |

---

## 19. 📎 Documentación Complementaria

| Documento | Descripción |
|-----------|-------------|
| `ENV_CONFIG.md` | Variables de entorno y secretos en Pages. |
| `SECRETS_CONFIG.md` | Cómo gestionar secretos (JWT, Resend, etc.). |
| `CLOUDFLARE_PAGES_CONFIG.md` / `PAGES_CONFIG.md` | Paso a paso para configurar Pages. |
| `R2_SETUP.md`, `R2_IMAGE_SETUP.md`, `IMAGENES_COMPLETO.md` | Configuración de buckets, políticas y procesos de imagen. |
| `DNS_VALORES_ESTANDAR.md`, `DNS_SIMPLIFICADO_RESEND.md`, `TABLA_DNS_RESUMEN.md` | DNS/apuntadores para dominios y correo. |
| `DEBUG_FRONTEND_COMPLETO.md` | Guía de logging y panel de debug. |
| `SPRINT-*.md`, `RESUMEN_COMPLETO.md` | Historial de sprints y decisiones. |
| `FIX_FAILED_TO_FETCH.md` | Caso real de ajuste de endpoints API. |
| `POSTULACIONES_SETUP.md` | Detalles del flujo de postulaciones. |

Todos los documentos están en la raíz o en `clone-repo/` (mismo contenido duplicado; usar la versión actual en raíz).

---

## 20. ✅ Checklist de Primer Día

1. Instalar dependencias (`npm install`) y loguearte en Cloudflare (`wrangler login`).
2. Configurar `.env.local` en `frontend/`.
3. Crear/aplicar base D1 local (`wrangler d1 migrations apply acachile-db --local`).
4. Levantar entorno (`wrangler pages dev ...`) y verificar `http://localhost:8787/api/health`.
5. Crear usuario admin y probar login.
6. Explorar panel admin (socios, usuarios, cuotas) para familiarizarte con el flujo.
7. Revisar `DebugPanel` y `window.logger` en consola.
8. Leer `ENV_CONFIG.md`, `R2_SETUP.md` y `PAGES_CONFIG.md` para entender la infraestructura.
9. Documentar cualquier hallazgo y actualizar este README si detectas incoherencias.

---

## 21. 📖 Glosario Rápido

- **ACA**: Asociación Chilena de Asadores.
- **D1**: Base de datos relacional serverless (SQLite administrado por Cloudflare).
- **R2**: Almacenamiento de objetos S3-like dentro de Cloudflare.
- **KV**: Almacenamiento clave-valor ultrarápido.
- **Pages Functions**: Funciones serverless que acompañan a un sitio desplegado en Cloudflare Pages.
- **Socio**: Miembro de la asociación (usuario final).
- **Cuota**: Pago mensual recurrente de un socio.
- **Postulación**: Solicitud para convertirse en socio.
- **Inscripción**: Registro de usuario en un evento concreto.
- **Dashboard**: Vista principal del panel administrativo.

---

## 22. 🙌 Contribuir y Buenas Prácticas

- Utiliza feature branches (`feature/...`, `fix/...`).
- Sigue convenciones de código existentes (hooks + servicios).
- Asegúrate de correr `npm run lint` antes de abrir PR.
- Documenta en `docs/` cualquier cambio operacional relevante (nueva variable, script, migración).
- Mantén este README sincronizado con la realidad del proyecto.
- Evita subir datos sensibles; usa `.env.local` y secretos en Pages.
- Para cambios en la base de datos agrega migraciones (SQL o scripts Workers) y documenta cómo aplicarlas.

---

**Última actualización:** Febrero 2026  
Si agregas nuevas funcionalidades, infra o flujos, por favor expande la sección correspondiente. Este README es la fuente de verdad para tomar el proyecto desde cero. ¡Buen asado y buenos deploys! 🔥🥩
