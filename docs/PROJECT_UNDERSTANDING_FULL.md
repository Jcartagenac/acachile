# PROJECT_UNDERSTANDING_FULL

## 1) Visión general

Este repositorio es, en la práctica, una **plataforma web full-stack para ACA Chile** montada sobre:

- **Frontend React + Vite + TypeScript** en `frontend/src`
- **Backend serverless con Cloudflare Pages Functions** en `frontend/functions`
- **Persistencia principal en Cloudflare D1 (SQLite)**
- **Cache y algunos rastros históricos en Cloudflare KV**
- **Assets/medios en Cloudflare R2**
- **Email transaccional vía Resend**
- **Autocomplete/detalle de direcciones vía Google Maps Places API**

Aunque el repo tiene apariencia de monorepo, el **workspace real y vigente** es `frontend/`. El root contiene:

- documentación histórica y operativa,
- un `src/` simplificado/legacy,
- scripts auxiliares,
- migraciones parciales,
- y exportaciones o artefactos de transición.

La aplicación real observada no es un simple sitio institucional: es una plataforma con múltiples dominios funcionales:

- sitio público institucional,
- noticias/blog,
- eventos e inscripciones,
- autenticación y perfil,
- administración de socios/cuotas/roles,
- postulaciones para hacerse socio,
- tienda con carrito/órdenes/comprobantes,
- libro de visitas,
- sorteos/participantes,
- elecciones / landing temática,
- y herramientas de monitoreo/configuración interna.

---

## 2) Arquitectura real observada

### Arquitectura efectiva

**Cliente**
- SPA React con `react-router-dom`
- Lazy loading de páginas en `frontend/src/App.tsx`
- Consumo directo de endpoints `/api/...`
- Estado de autenticación centralizado en `AuthContext`
- Persistencia de sesión en cookies + `localStorage`

**Servidor / API**
- Cloudflare Pages Functions, una ruta por archivo bajo `frontend/functions/api`
- Middleware global en `frontend/functions/_middleware.ts`
- Helpers de autenticación/autorización compartidos (`requireAuth`, `requireRole`, `requireAdmin`, etc.)

**Datos**
- D1 como fuente de verdad principal para usuarios, noticias, eventos, cuotas, postulaciones, tienda, guestbook, etc.
- KV usado selectivamente como caché de listados públicos (por ejemplo eventos) y con rastros de enfoques antiguos
- R2 para imágenes, avatares, noticias, productos, comprobantes de pago, etc.

### Patrón arquitectónico real

No es una clean architecture formal. Es más bien una arquitectura **pragmática de producto**:

- frontend con páginas y servicios por dominio,
- backend con endpoints por carpeta temática,
- lógica SQL incrustada en handlers,
- validación heterogénea (a veces Zod, a veces validación manual),
- varios módulos nuevos conviviendo con capas antiguas.

### Conclusión de arquitectura

La arquitectura es funcional y bastante amplia, pero **heterogénea**. Hay una mezcla clara de:

- código nuevo relativamente tipado (`.ts`, Zod, shared types),
- código legacy en `.js`,
- modelos duplicados (`usuarios` vs `users`, `eventos` vs `events`, `evento_inscripciones` vs `inscriptions`),
- y documentación no completamente alineada con la implementación actual.

---

## 3) Mapa de carpetas y módulos

## Raíz del repo

- `package.json`
  - monorepo mínimo con workspace `frontend`
- `README.md`
  - más actualizado que varios documentos legacy, pero igual no refleja todo
- `src/`
  - SPA simplificada/antigua; no parece ser la app principal desplegada
- `shared/`
  - tipos y utilidades compartidas entre frontend/backend
- `migrations/`
  - algunas migraciones SQL, sobre todo de eventos/comunicados
- `docs/`
  - documentación técnica y operativa
- `cloudflare-export/`
  - schema exportado y archivos de migración/IDs
- múltiples `.md` de operación, hotfixes, R2, Cloudflare, DNS, etc.

## `frontend/` (núcleo real)

- `package.json`
- `wrangler.toml`
- `src/`
  - componentes, páginas, hooks, services, contexts, config, utils
- `functions/`
  - Cloudflare Pages Functions y utilidades backend
- `migrations/`
  - migraciones del workspace frontend (no se listaron por separado en el barrido inicial, pero la carpeta existe)
- `scripts/`
  - deploy y bindings
- `public/`
  - assets estáticos
- `dist/`
  - build ya generado, útil para inspeccionar qué páginas existen realmente
- `node_modules/`
  - dependencias instaladas del workspace real

## `frontend/src/` módulos principales

- `App.tsx`: router maestro
- `pages/`: páginas de dominio
- `components/`: UI, admin, auth, profile, events, layout
- `contexts/`: `AuthContext`, `EventContext`
- `services/`: clientes API por dominio
- `hooks/`: hooks especializados (dashboard, imágenes, admin, user)
- `config/`: env e imágenes
- `utils/`: auth token, logger, utilidades varias

## `frontend/functions/`

- `_middleware.ts`: CORS + validación de env + auth helpers
- `types.d.ts`: bindings/tipos globales
- `utils/`: JWT, password hashing, env validation, logger
- `api/`: endpoints por dominio

---

## 4) Frontend

## Router real observado

El `frontend/src/App.tsx` registra una SPA grande con rutas para:

### Sitio público
- `/`
- `/resultados`
- `/quienes-somos`
- `/unete`
- `/contacto`
- `/buscar`
- `/socios/:id`
- `/sociosaca`
- `/participa`
- `/condicionessorteo`
- `/elecciones`
- `/elecciones/entrevistas`

### Auth y perfil
- `/auth`
- `/forgot-password`
- `/reset-password`
- `/perfil`
- `/configuracion`
- `/mi-cuenta`

### Eventos
- `/eventos`
- `/eventos/crear`
- `/eventos/mis-eventos`
- `/eventos/:id`
- `/eventos/:id/editar`

### Noticias / blog
- `/blog`
- `/blog/:slug`
- `/noticias`
- `/noticias/:slug`
- `/noticias/crear`
- `/noticias/editar/:slug`

### Guestbook
- `/visitas`

### Tienda
- `/shop`
- `/shop/:sku`
- `/cart`
- `/cart/payment/:orderNumber`

### Admin legacy y panel nuevo
- `/admin/...`
- `/panel-admin/...`

Hay coexistencia deliberada entre **admin antiguo** y **panel admin nuevo**, lo que confirma una migración incremental más que un rediseño completo.

## Componentes y patrones UI

Dependencias predominantes por imports:
- React
- `lucide-react`
- `react-router-dom`
- `react-hook-form`
- `zod`

Patrones observados:
- lazy loading amplio para páginas
- layouts reutilizables (`Layout`, `AdminLayout`, `PanelAdminLayout`)
- providers/context para auth y eventos
- componentes admin especializados (`AdminNews`, `AdminGuestbook`, `AdminParticipantes`, etc.)
- protección de la tienda mediante `ShopPasswordProtection`

## Auth frontend

`AuthContext.tsx` es la fuente real de verdad del login en cliente:
- guarda token y usuario en cookies + `localStorage`
- al iniciar, intenta reconstruir sesión persistida
- verifica token llamando `/api/auth/me`
- mapea roles legacy (`editor`, `organizer`, `user`) a un modelo más nuevo:
  - `admin`
  - `director`
  - `director_editor`
  - `usuario`

Esto es importante: **la UI ya trabaja con un modelo de roles más moderno que el backend/base histórica**.

## Servicios frontend relevantes

- `eventService.ts`: eventos, inscripciones, participantes
- `shopService.ts`: productos, órdenes, shipping, pago, carrito local
- `newsService.ts`: noticias/categorías/tags
- `postulacionesService.ts`: postulación pública y revisión admin
- `sociosService.ts`: socios/cuotas/configuración
- `adminService.ts`: users/stats/system config/health/logs/maintenance
- `commentsService.ts`, `searchService.ts`, `imageService.ts`, `userService.ts`

## Observaciones frontend importantes

1. Existe un `src/` en la raíz con una app mucho más pequeña que no coincide con la app real. Parece legado o bootstrap inicial.
2. La tienda está protegida por clave de acceso desde el frontend, no por autenticación estándar de usuarios.
3. El guestbook tiene capa de traducción en cliente usando `libretranslate.com`.
4. El carrito vive en `localStorage` con una clave por sesión de navegador.
5. Hay páginas de prueba/variantes como `HomePage_fixed.tsx`, `HomePage_test.tsx`, `TestUser.tsx`, lo que sugiere trabajo iterativo con artefactos no completamente limpiados.

---

## 5) Backend / Functions y endpoints

## Middleware global

`frontend/functions/_middleware.ts` hace:
- limitar el middleware a `/api/*`
- validar bindings críticos mediante `validateEnv(env)` una sola vez y cachear el resultado
- responder CORS
- proveer helpers:
  - `requireAuth`
  - `requireRole`
  - `requireAdmin`
  - `requireAdminOrDirector`
  - `jsonResponse`
  - `errorResponse`
  - `authErrorResponse`

### Bindings tipados observados
En `functions/types.d.ts`:
- `DB: D1Database`
- `ACA_KV: KVNamespace`
- `IMAGES: R2Bucket`
- `ENVIRONMENT`
- `JWT_SECRET?`
- `ADMIN_EMAIL?`
- `CORS_ORIGIN?`
- `RESEND_API_KEY?`
- `FROM_EMAIL?`
- `FRONTEND_URL?`
- `R2_PUBLIC_URL?`

Nota: el código de Places usa `env.GOOGLE_MAPS_API_KEY`, pero esa variable **no aparece en `types.d.ts`**.

## Autenticación

### `/api/auth/login`
- login por **RUT + password**
- busca en `usuarios`
- valida hash con helper de password
- migra hashes legacy al vuelo si corresponde
- emite JWT firmado con HMAC SHA-256

### `/api/auth/register`
- registro básico contra `usuarios`
- crea usuario con `role = user` por defecto
- devuelve usuario, pero no siempre token

### `/api/auth/me`
- `GET`: obtiene perfil autenticado
- `PUT`: actualiza perfil del usuario
- normaliza/valida algunos campos usando `shared/utils/validators`

### Otros endpoints auth observados
- `change-password`
- `find-user-by-rut`
- `forgot-password`
- `reset-password`
- `privacy`

## Noticias

Rutas principales:
- `/api/noticias`
- `/api/noticias/[slug]`
- `/api/noticias/categories`
- rutas de archive/restore/permanent/unarchive
- likes/comentarios/compartir en rutas paralelas

Implementación observada:
- noticias viven en D1 (`news_articles`)
- categorías viven en `news_categories`
- tags existen en schema, pero en varias respuestas se devuelven como `[]`
- view count se incrementa con tabla `article_views`
- delete real es **soft delete** mediante `deleted_at` y `status = archived`

## Eventos

Rutas observadas:
- `/api/eventos`
- `/api/eventos/[id]`
- `/api/eventos/[id]/inscribirse`
- `/api/eventos/[id]/inscripcion-publica`
- `/api/eventos/[id]/inscripciones`
- `/api/eventos/[id]/inscripciones/[inscripcionId]`
- `/api/eventos/[id]/archive`
- `/api/eventos/[id]/unarchive`
- `/api/eventos/reset`

Implementación vista en `eventos/index.js`:
- D1 como fuente principal
- KV como caché para queries públicas básicas
- filtros por `status`, `type`, `search`, `page`, `limit`, `includeArchived`
- creación autenticada
- mapeo de columnas snake_case → propiedades frontend camelCase

## Tienda / ecommerce

Rutas observadas:
- `/api/shop/products`
- `/api/shop/products/[id]`
- `/api/shop/products/sku/[sku]`
- `/api/shop/orders`
- `/api/shop/orders/all`
- `/api/shop/orders/[orderId]`
- `/api/shop/orders/[orderId]/status`
- `/api/shop/orders/[orderNumber]/payment-proof`
- `/api/shop/payment-config`
- `/api/shop/shipping-rates`
- `/api/shop/comunas`

Implementación observada:
- productos desde `shop_products`
- órdenes desde `shop_orders` y `shop_order_items`
- al crear orden se descuenta inventario directamente
- comprobante de pago se actualiza por URL
- shipping y comunas tienen endpoints dedicados

## Postulaciones (`/unete`)

Rutas:
- `/api/unete`
- `/api/admin/postulantes`
- `/api/admin/postulantes/[id]`
- `/approve`
- `/reject`
- `/assign-reviewer`
- `/feedback`
- `/export-csv`

Implementación:
- usa Zod en la entrada pública
- asegura schema con `ensurePostulacionesSchema`
- exige dos aprobaciones por defecto
- soporte de reviewers asignados, feedback y export CSV
- acceso admin/director vía `requireAdminOrDirector`

## Guestbook

Rutas:
- `/api/guestbook`
- `/api/guestbook/[id]`
- `/restore`
- `/permanent`

Implementación:
- entradas públicas se auto-publican (`status = published`)
- soporte de imagen opcional
- soporte papelera con `deleted_at`

## Participantes / sorteos

Rutas:
- `/api/participantes`
- `/api/participantes/export-csv`
- `/api/participantes/init`

Implementación observada:
- POST público para registrar participante
- GET solo admin
- crea tabla `participantes` si no existe
- pero el `CREATE TABLE` observado no incluye `accepts_marketing`, y luego el insert sí intenta usarla

## System / monitoreo

Rutas:
- `/api/system/health`
- `/api/system/config`
- `/api/system/logs`
- `/api/system/maintenance`
- `/api/health`
- `/api/bindings`

`system/health.js` mezcla checks nuevos y legacy:
- D1 check real
- KV check real
- prueba endpoints críticos
- pero estadísticas consultan `users` y KV keys históricas (`eventos:all`, `noticias:all`)

## Places / Maps

- `/api/places/autocomplete`
- `/api/places/details`

Usan Google Places API y filtran por Chile.

---

## 6) Modelo de datos y migraciones

## Esquema observado

El archivo `cloudflare-export/complete-schema.sql` es la mejor foto consolidada del modelo. Principales tablas:

### Núcleo de usuarios/socios
- `usuarios`
- `configuracion_global`
- `roles_catalog`
- `user_privacy_settings`
- `cuotas`
- `generacion_cuotas`
- `pagos`
- `comunicados`

### Eventos y postulaciones
- `eventos`
- `postulaciones`
- `postulacion_aprobaciones`

### Noticias / contenido
- `news_categories`
- `news_tags`
- `news_articles`
- `news_article_tags`
- `news_comments`
- `site_sections`

### Compatibilidad legacy / duplicada
- `users`
- `events`
- `inscriptions`

Esto es una señal fuerte de evolución del sistema sin limpieza total del esquema.

## Migraciones vistas en `migrations/`

- `005_create_comunicados.sql`
- `006_create_eventos.sql`
- `007_add_archived_status_eventos.sql`
- `008_add_index_inscriptions_created_at.sql`
- `021_add_social_event_type.sql`

### Observaciones de migraciones

1. La historia de `eventos` muestra recreaciones de tabla para ampliar `CHECK` de `status` y `type`.
2. `008_add_index_inscriptions_created_at.sql` apunta a tabla `inscriptions`, no `evento_inscripciones`, lo que refleja coexistencia de modelos.
3. El schema exportado incluye muchas tablas no representadas por migraciones visibles en la raíz; probablemente hubo migraciones en otros lugares o creación progresiva desde endpoints/helpers.

## Modelo funcional por dominio

### Socios/cuotas
- `usuarios` guarda perfil, rol, estado socio, cuota, foto, etc.
- `cuotas` guarda por `usuario_id + año + mes`
- `pagos` guarda evidencia y procesamiento administrativo

### Noticias
- `news_articles` + `news_categories`
- soft delete vía `deleted_at`
- vistas por `view_count`
- tracking de visitas únicas con `article_views` visto en código, aunque no apareció en el trozo leído del schema exportado

### Eventos
- tabla `eventos` moderna
- además tablas legacy `events` e `inscriptions`
- inscripciones/event participants también aparecen en servicios y migraciones históricas

### Tienda
Aunque no apareció en el fragmento del schema exportado leído, el código demuestra existencia de:
- `shop_products`
- `shop_orders`
- `shop_order_items`
- posiblemente tablas auxiliares para configuración de pagos, comunas y tarifas

### Guestbook
Código demuestra tabla `guestbook` con al menos:
- `name`, `email`, `social_network`, `social_handle`, `title`, `message`, `image_url`, `status`, `deleted_at`, `ip_address`, `user_agent`, timestamps

---

## 7) Autenticación y autorización

## Autenticación

### Mecanismo
- JWT firmado con HMAC-SHA256 usando Web Crypto API
- secret en `JWT_SECRET`
- expiración: 7 días en login observado

### Passwords
`functions/utils/password.js` implementa:
- esquema actual: `PBKDF2` SHA-256 con 100000 iteraciones
- esquema legacy: SHA-256 con salt estático `salt_aca_chile_2024`
- `verifyPassword` detecta hashes viejos y permite upgrade en login

Esto es una mejora real respecto a bcrypt mencionado por docs, pero también evidencia que los documentos están atrasados.

## Autorización

### Backend
- `requireAuth`
- `requireRole`
- `requireAdmin`
- `requireAdminOrDirector`

### Frontend
- `AuthContext` con utilidades `hasPermission`, `hasRole`, `canManage`
- `shared/index.ts` define:
  - `ROLE_HIERARCHY`
  - `ROLE_PERMISSIONS`
  - `roleUtils`

### Desalineación de roles
Roles backend/históricos observados:
- `admin`
- `editor`
- `user`
- `organizer`
- `super_admin` (en mapeos)

Roles frontend modernos:
- `admin`
- `director`
- `director_editor`
- `usuario`

La app depende de **mapeos de compatibilidad**. Funciona, pero es deuda semántica importante.

---

## 8) Integraciones Cloudflare / D1 / KV / R2 / Resend / Maps

## Cloudflare Pages / Wrangler

`frontend/wrangler.toml` define:
- `pages_build_output_dir = "dist"`
- `compatibility_flags = ["nodejs_compat"]`
- binding D1 `DB`
- binding KV `ACA_KV`
- binding R2 `IMAGES`
- env vars para `production` y `preview`

## D1

Es la base de datos principal. Todo el código importante la usa:
- auth
- noticias
- eventos
- shop
- guestbook
- postulaciones
- participantes
- socios/cuotas

## KV

Uso real observado:
- caché de listados públicos de eventos
- health checks y algunos restos legacy

Uso esperado por docs es más amplio, pero el código actual sugiere que **D1 ya reemplazó buena parte del uso original de KV**.

## R2

`/api/upload-image` sube archivos al bucket `IMAGES`.
Carpetas permitidas:
- `avatars`
- `home`
- `eventos`
- `noticias`
- `gallery`
- `postulaciones`
- `shop-products`
- `payment-proofs`
- `videos`

Tipos permitidos:
- JPEG/PNG/WebP
- PDF
- MP4

Límite real en código: **150 MB**.

## Resend

`functions/api/_utils/email.ts` usa `fetch('https://api.resend.com/emails')` con `RESEND_API_KEY`.
Se usa al menos para notificaciones de reviewers/postulaciones.

## Google Maps Places

`places/autocomplete.ts` y `places/details.ts` usan `GOOGLE_MAPS_API_KEY`.
Hay incluso una key hardcodeada en el `wrangler.toml` raíz legacy, lo cual es un riesgo.

---

## 9) Dominios funcionales: tienda, carrito, envíos, postulaciones, eventos, noticias, admin

## Tienda / carrito / checkout / envíos

### Frontend
- `ShopPage.tsx`: catálogo
- `ProductDetailPage.tsx`: detalle por SKU
- `CartPage.tsx`: carrito
- `PaymentPage.tsx`: flujo de pago y subida de comprobante
- `shopService.ts`: API client + carrito local

### Backend
- productos CRUD
- órdenes públicas y admin
- cambio de estado
- subida de comprobante
- configuración de medios de pago
- comunas y shipping rates

### Observaciones
- inventario se descuenta al crear orden, no al confirmar pago
- carrito es puramente local por sesión del navegador
- algunos endpoints esperados por frontend no están claramente alineados en nombre (ej. `uploadPaymentProof` usa `/api/upload`, mientras existe `/api/upload-image`)

## Postulaciones

Flujo bastante completo:
- landing `JoinPage`
- formulario rico en campos (`JoinApplicationForm`)
- validación Zod
- persistencia en `postulaciones`
- revisión por directorio
- asignación de reviewer
- feedback
- aprobación/rechazo
- posible generación de credenciales/socio al aprobar

Es uno de los módulos más maduros funcionalmente.

## Eventos

Capacidades:
- listado y detalle público
- creación/edición admin
- inscripción autenticada
- inscripción pública en algunos casos
- archivo/unarchive
- listados de participantes

## Noticias

Capacidades:
- listado y detalle
- categorías
- edición admin
- soft delete/papelera
- comentarios y moderación
- likes y compartir
- control de vistas únicas

## Libro de visitas

Capacidades:
- publicación pública inmediata
- imagen opcional
- multilenguaje en cliente
- administración/papelera

## Admin

Hay dos experiencias:
- legacy `/admin/...`
- nueva `/panel-admin/...`

Módulos admin detectados:
- dashboard
- users/socios
- cuotas
- content/home editor
- news
- postulantes
- participantes
- guestbook
- ecommerce
- settings
- monitoring
- system config / logs / maintenance

---

## 10) Flujo de deploy y tooling

## npm / workspace

### Root
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run verify`

### Frontend workspace
- `dev`
- `build`
- `build:prod`
- `preview`
- `deploy`
- `deploy:auto`
- `setup-bindings`
- `check-bindings`
- `health-check`

## Deploy

El flujo esperado es:
1. build Vite en `frontend/dist`
2. deploy a Cloudflare Pages vía `wrangler pages deploy dist --project-name=acachile`
3. bindings en Pages Dashboard o `wrangler.toml`

## Scripts operativos observados

En docs se mencionan:
- `intelligent-deploy.cjs`
- `dashboard-helper.cjs`
- `setup-bindings.cjs`
- `auto-configure-bindings.cjs`
- scripts root de DNS/R2/entorno

## Testing/quality real

Hay una capa de calidad, pero **curada y parcial**:
- lint focalizado en archivos concretos
- typecheck parcial frontend/backend
- Vitest presente

Importante: no parece una cobertura integral del sistema completo.

## CI

La documentación menciona `.github/workflows/ci.yml`, pero en el repo inspeccionado **no existe** `.github/workflows`.

---

## 11) Dependencias importantes detectadas en package.json y node_modules

## Root

Dependencias directas:
- `@aws-sdk/client-s3`
- `node-fetch`

Probablemente se usan en scripts o integraciones auxiliares del root; no son el corazón del frontend runtime.

## Frontend runtime

Instaladas y realmente visibles por imports/uso:
- `react`
- `react-dom`
- `react-router-dom`
- `react-hook-form`
- `zod`
- `js-cookie`
- `lucide-react`
- `clsx`
- `tailwind-merge`
- `xlsx`

### Rol real de estas dependencias
- **React / React DOM**: base SPA
- **React Router**: routing completo de la app
- **react-hook-form + zod + @hookform/resolvers**: formularios y validación
- **js-cookie**: persistencia auth
- **lucide-react**: iconografía de casi toda la UI
- **xlsx**: export/import CSV/XLSX en admin
- **clsx + tailwind-merge**: composición de clases Tailwind

## Frontend dev/tooling
- `vite`
- `@vitejs/plugin-react`
- `typescript`
- `tailwindcss`
- `postcss`
- `autoprefixer`
- `eslint`, `@eslint/js`, `typescript-eslint`, plugins React
- `vitest`, `jsdom`, Testing Library

## Node_modules: síntesis práctica

El usuario pidió “leer absolutamente todo, incluyendo node_modules”. A nivel práctico, el repo trae el `frontend/node_modules` completo, pero lo importante para entender el sistema no es enumerar cada archivo generado sino identificar **qué librerías realmente estructuran el producto**.

Las librerías clave presentes y efectivamente reflejadas en imports/código son las anteriores. No se detectó un framework oculto extra ni dependencias backend complejas estilo Express/Prisma/ORM; el backend funciona con el runtime y bindings de Cloudflare, y SQL directo.

---

## 12) Inconsistencias entre docs y código

Se detectaron bastantes:

### 1. Nombre/identidad de la organización
Aparecen referencias a:
- Asociación Chilena de **Asadores**
- Asociación Chilena de **Arqueología**
- Asociación Chilena de **Ajedrez**

Ejemplos:
- `frontend/README.md` dice “Arqueología”
- email template dice “Ajedrez”
- el código funcional y branding principal apuntan a **Asadores**

### 2. Login documentado vs login real
- `API_DOCUMENTATION.md` documenta login por **email + password**
- el endpoint real `auth/login.ts` autentica por **RUT + password**

### 3. Hashing documentado vs hashing real
- docs mencionan bcrypt
- código real usa **PBKDF2** y migración desde SHA-256 legacy

### 4. URLs / dominios
- docs mencionan `beta.acachile.com`, `api.acachile.cl`, `acachile-prod.pages.dev`
- `wrangler.toml` vigente apunta a `https://acachile.com`
- hay restos de dominios preview y producción cruzados

### 5. README vs repo real
- `README.md` menciona `.github/workflows/ci.yml`
- carpeta `.github/workflows` no existe

### 6. "No hay URLs hardcodeadas"
`ENV_CONFIG.md` afirma que no hay URLs hardcodeadas, pero en código/documentos sí aparecen varias:
- `https://acachile.com`
- `https://images.acachile.com`
- `https://libretranslate.com/translate`
- links directos a forms, panel admin, etc.

### 7. Modelos duplicados
- `usuarios` y `users`
- `eventos` y `events`
- `evento_inscripciones` y `inscriptions`

Esto no es solo inconsistencia documental; es inconsistencia estructural.

### 8. Endpoint names inconsistentes
Frontend llama algunas rutas que no calzan exactamente con nombres backend visibles, por ejemplo:
- `shopService.uploadPaymentProof()` usa `/api/upload`
- backend leído expone claramente `/api/upload-image`

### 9. Tipos incompletos
`GOOGLE_MAPS_API_KEY` se usa, pero no está en `functions/types.d.ts`.

### 10. Comentarios vs código real
`upload-image.ts` comenta compresión/optimización, pero el código actual **sube el archivo original sin procesarlo**.

---

## 13) Riesgos y deuda técnica

## Riesgos altos

### A. Modelo de datos duplicado / legacy coexistente
La coexistencia de `usuarios/users`, `eventos/events`, `inscriptions/evento_inscripciones` aumenta:
- confusión semántica,
- bugs por consultar la tabla incorrecta,
- dificultad para migrar/reportar,
- y deuda operativa en health checks/admin.

### B. Desalineación de roles
Backend usa roles legacy; frontend usa roles modernos mapeados. Eso puede romper:
- autorización fina,
- lógica de paneles,
- auditoría de permisos,
- y consistencia de UX.

### C. Validación y tipado heterogéneos
Hay mezcla de:
- TS fuerte,
- JS suelto,
- Zod en algunos flujos,
- validación manual en otros,
- SQL inline sin capa de repositorio.

Eso dificulta consistencia y pruebas.

### D. Estado documental confuso
La cantidad de docs históricos/hotfixes/README alternativos complica identificar la verdad actual.

### E. Posibles bugs reales detectables
- `participantes`: `CREATE TABLE` no muestra `accepts_marketing`, pero el insert sí lo usa.
- `system/health.js`: consulta `users` y KV legacy, no necesariamente el modelo principal actual.
- `shopService` y upload endpoints parecen desalineados.

### F. Seguridad / secretos
- aparece una Google Maps API key en `wrangler.toml` root legacy
- múltiples docs con IDs y detalles operativos de Cloudflare
- riesgo de exposición accidental en repo o despliegues

## Riesgos medios

### G. Artefactos generados versionados
- `frontend/dist/` existe dentro del repo
- `frontend/node_modules/` presente en workspace inspeccionado

Puede ser normal localmente, pero si están versionados o usados como fuente de verdad, generan ruido y confusión.

### H. D1 + KV sin estrategia de consistencia formal
Eventos usan D1 con caché en KV, pero no se ve una política homogénea transversal.

### I. Admin legacy y nuevo paralelos
Mantener dos paneles eleva costo de mantenimiento y riesgo de divergencia funcional.

---

## 14) Recomendaciones

## Prioridad 1: definir la “verdad oficial”

1. Declarar explícitamente que `frontend/` es la app principal.
2. Documentar que el `src/` raíz es legacy o eliminarlo si ya no se usa.
3. Crear un `ARCHITECTURE.md` corto y vigente con:
   - dominios,
   - tablas oficiales,
   - roles oficiales,
   - bindings requeridos,
   - estrategia de deploy.

## Prioridad 2: unificar modelo de roles

1. Elegir un único vocabulario de roles:
   - o legacy (`admin/editor/user/...`)
   - o moderno (`admin/director/director_editor/usuario`)
2. Migrar DB + JWT + frontend a un solo modelo.
3. Mantener compatibilidad temporal solo en una capa centralizada.

## Prioridad 3: limpiar modelo de datos legacy

1. Inventariar qué tablas son activas de verdad.
2. Marcar como deprecated las legacy.
3. Migrar endpoints/health/admin al modelo único.
4. Evitar que nuevas features sigan usando tablas duplicadas.

## Prioridad 4: corregir inconsistencias funcionales puntuales

1. `participantes`: alinear schema creado vs columnas insertadas.
2. `upload` vs `upload-image`: unificar endpoint y contrato.
3. `system/health.js`: dejarlo consultando las tablas/fuentes reales actuales.
4. Agregar `GOOGLE_MAPS_API_KEY` a los tipos/env docs correctos.

## Prioridad 5: seguridad y configuración

1. retirar secretos o API keys hardcodeadas del repo/archivos legacy
2. consolidar variables en un único documento vigente
3. distinguir claramente `production`, `preview`, `development`
4. revisar CORS y uso de `*` en endpoints públicos/admin

## Prioridad 6: mejorar mantenibilidad

1. convertir handlers JS críticos a TS
2. extraer SQL repetido a helpers/repositorios por dominio
3. ampliar tests a módulos clave:
   - auth
   - postulaciones
   - shop orders
   - eventos
   - noticias
4. centralizar contratos API compartidos para reducir drift frontend/backend

## Prioridad 7: higiene del repo

1. revisar si `dist/` y otros artefactos deben vivir fuera de control de versión
2. ordenar docs históricos bajo `docs/archive/`
3. dejar un índice de documentación “vigente vs histórica”

---

## Resumen ejecutivo

Este proyecto es una **plataforma full-stack amplia y funcional**, construida sobre Cloudflare Pages Functions + D1 + KV + R2, con frontend React/Vite. El workspace real es `frontend/`, no el root.

Lo más fuerte del sistema hoy:
- cobertura de dominios muy completa,
- integración real con infraestructura Cloudflare,
- módulo de postulaciones bastante trabajado,
- tienda/eventos/noticias/admin ya operativos,
- autenticación con JWT y migración de hashes legacy.

Lo más delicado:
- convivencia de capas legacy y nuevas,
- documentación inconsistente,
- duplicación de tablas/modelos,
- vocabulario de roles desalineado,
- algunos bugs o desajustes evidentes entre frontend, endpoints y schema.

Si hubiera que resumirlo en una frase:

> **Es un producto real, grande y vivo, con bastante funcionalidad ya montada, pero todavía atravesando una transición arquitectónica y semántica que conviene ordenar antes de seguir escalando features.**
