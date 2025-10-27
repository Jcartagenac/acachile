# ACA Chile Platform

> Plataforma full‑stack para la Asociación Chilena de Asadores (ACA Chile): inscripción y gestión de socios, cobro de cuotas, publicación de noticias/eventos y administración operativa con validación avanzada de datos chilenos.

[![Cloudflare Pages](https://img.shields.io/badge/Cloudflare-Pages-orange)](https://developers.cloudflare.com/pages/)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-f38020)](https://developers.cloudflare.com/workers/)
[![React 18](https://img.shields.io/badge/React-18-61dafb)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8)](https://tailwindcss.com/)
[![Google Maps API](https://img.shields.io/badge/Google%20Maps-API-green)](https://developers.google.com/maps)

---

## Índice (rápido)

- [Visión general](#1-visión-general)
- [Funcionalidades principales](#2-funcionalidades-principales)
- [Requisitos y herramientas](#3-requisitos-y-herramientas)
- [Estructura del repo](#4-estructura-del-repositorio)
- [Cómo ejecutar en desarrollo](#5-ejecutar-en-desarrollo-rápido)
- [Build y despliegue](#6-build-y-despliegue)
- [Variables de entorno y bindings](#7-variables-de-entorno-y-bindings-importantes)
- [D1 — migraciones y operaciones](#8-d1-migraciones-y-operaciones-comunes)
- [Validadores y normalización de datos](#9-validadores-y-normalización-de-datos)
- [Cambio seguro de contraseña](#10-cambio-seguro-de-contraseña-para-un-usuario-operación-manual)
- [Debugging y observabilidad](#11-debugging-y-observabilidad-tips-operativos)
- [Problemas comunes y soluciones](#12-problemas-comunes-y-soluciones-rápidas)
- [Comandos útiles](#13-comandos-útiles)
- [Health checks y endpoints](#14-health-checks-y-endpoints-importantes)
- [Superficie de API completa](#15-superficie-de-api)
- [Front-End routing y componentes](#16-front-end-routing-y-componentes)
- [Testing y calidad](#17-testing-y-calidad)
- [Despliegue y operaciones](#18-despliegue-y-operaciones)
- [Tareas de mantenimiento](#19-tareas-de-mantenimiento)
- [Troubleshooting](#20-troubleshooting)
- [Documentación complementaria](#21-documentación-complementaria)
- [Checklist de primer día](#22-checklist-de-primer-día)
- [Glosario](#23-glosario-rápido)
- [Contribuir](#24-contribuir-y-buenas-prácticas)
- [Información del desarrollador](#25-información-del-desarrollador)

---

## 1. Visión general

Este repositorio contiene la aplicación frontend (React + Vite) y las Pages Functions (endpoints serverless) que actúan como backend usando Cloudflare Workers + D1 + KV + R2.

El objetivo es permitir administrar socios, cuotas, eventos y contenido público, con controles de privacidad por socio y **validación avanzada de datos chilenos** (RUT, teléfonos, direcciones).

### Arquitectura técnica

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Cloudflare Pages Functions (serverless)
- **Base de datos**: Cloudflare D1 (SQLite distribuido)
- **Almacenamiento**: Cloudflare R2 (imágenes, comprobantes)
- **Cache**: Cloudflare KV (búsqueda, sesiones)
- **APIs externas**: Google Maps (geocoding, mapas estáticos)
- **Email**: Resend API (opcional)
- **Autenticación**: JWT con hash SHA-256 + salt
- **Validación**: Normalizadores chilenos (RUT módulo 11, teléfonos +569XXXXXXXX, direcciones geocodificadas)

---

## 2. Funcionalidades principales

### 👥 Gestión de Socios y Usuarios
- **Registro y autenticación** con validación chilena
- **Perfiles de usuario** con RUT, teléfono y dirección normalizados
- **Sistema de roles** (usuario, director, director_editor, admin)
- **Control de privacidad** por usuario
- **Panel administrativo** completo

### 💰 Sistema de Cuotas
- **Generación automática** de cuotas mensuales
- **Seguimiento de pagos** con comprobantes en R2
- **Recordatorios automáticos** (en desarrollo)
- **Reportes financieros**

### 📅 Eventos y Contenido
- **CRUD completo** de eventos y noticias
- **Sistema de inscripciones** a eventos
- **Editor visual** de contenido público
- **Búsqueda global** con filtros de privacidad

### 🔍 Búsqueda y Navegación
- **Motor de búsqueda** inteligente
- **Sugerencias en tiempo real**
- **Filtros por tipo** (usuarios, eventos, noticias)
- **Respeta configuraciones de privacidad**

### 🛡️ Validación Chilena Avanzada
- **RUT**: Validación algoritmo módulo 11 chileno
- **Teléfonos**: Normalización automática a formato +569XXXXXXXX
- **Direcciones**: Geocodificación con Google Maps API
- **Integración completa**: Creación/edición de usuarios y perfiles

### ☁️ Infraestructura Cloudflare
- **Despliegue automático** desde Git
- **CDN global** con Pages
- **Base de datos serverless** con D1
- **Almacenamiento de objetos** con R2
- **Cache distribuido** con KV
- **Variables de entorno seguras**

---

## 3. Requisitos y herramientas

- **Node.js LTS** (v18+ recomendado)
- **npm** (o yarn)
- **wrangler v3+** (para interactuar con Pages/D1/R2)
- **Cuenta de Cloudflare** con Pages/D1/R2 habilitados
- **API Key de Google Maps** (para geocodificación y mapas)

### Instalación rápida

```bash
# Instala dependencias (desde la raíz del repo)
npm install

# Instala wrangler globalmente si aún no lo tienes
npm i -g wrangler

# Configura credenciales de Cloudflare
wrangler login
```

---

## 4. Estructura del repositorio

```
├── frontend/                 # Aplicación React + Vite
│   ├── src/
│   │   ├── components/       # Componentes reutilizables
│   │   ├── pages/           # Páginas principales
│   │   ├── services/        # Servicios API
│   │   ├── types/           # Definiciones TypeScript
│   │   └── utils/           # Utilidades
│   ├── functions/           # Pages Functions (backend)
│   │   └── api/             # Endpoints serverless
│   ├── _headers             # Headers HTTP personalizados
│   └── wrangler.toml        # Configuración Cloudflare
├── shared/                   # Código compartido
│   ├── siteSections.ts      # Configuración de secciones
│   └── utils/
│       └── validators.ts    # Validadores chilenos
├── migrations/              # Migraciones D1
├── scripts/                 # Scripts de automatización
├── docs/                    # Documentación adicional
└── README.md               # Este archivo
```

---

## 5. Ejecutar en desarrollo (rápido)

### Opción A (recomendada — wrangler proxy para funciones)

```bash
cd frontend
# Levanta Vite y permite a Pages Functions responder a /api/*
wrangler pages dev dist -- npm run dev -- --host --port 5173

# Abre http://localhost:8787
```

### Opción B (desarrollo separado)

```bash
# Terminal A: frontend dev
cd frontend
npm run dev -- --port 5173

# Terminal B: emular funciones con wrangler
cd frontend
wrangler pages dev dist --local

# Ver assets en http://localhost:5173 y proxear /api/ con wrangler
```

### Verificación inicial

```bash
# Verificar health del backend
curl http://localhost:8787/api/health

# Verificar frontend
open http://localhost:5173
```

---

## 6. Build y despliegue

### Build local

```bash
cd frontend
npm run build
```

### Deploy a Cloudflare Pages

```bash
# Deploy manual con wrangler
cd frontend
npm run deploy

# O desde GitHub Actions (automático)
git push origin main
```

### Configuración de Pages

- **Build command**: `npm run build`
- **Build output directory**: `dist`
- **Root directory**: `frontend`
- **Environment variables**: Configuradas en dashboard de Pages

---

## 7. Variables de entorno y bindings importantes

### Bindings requeridos (Cloudflare)

- `DB` — Cloudflare D1 database (obligatorio)
- `ACA_KV` — Cloudflare KV namespace (cache)
- `R2` — Cloudflare R2 bucket (imágenes, comprobantes)

### Variables de entorno

| Variable | Descripción | Requerido |
|----------|-------------|-----------|
| `JWT_SECRET` | Secreto para JWT | ✅ |
| `GOOGLE_MAPS_API_KEY` | API key de Google Maps | ✅ |
| `RESEND_API_KEY` | API key de Resend (emails) | ❌ |
| `FRONTEND_URL` | URL pública del frontend | ✅ |
| `CORS_ORIGIN` | Orígenes CORS permitidos | ✅ |
| `ENVIRONMENT` | Entorno (development/production) | ✅ |

### Configuración local

Crear `frontend/.env.local`:

```bash
# Base URLs
FRONTEND_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173

# Secrets (no commitear)
JWT_SECRET=tu_jwt_secret_seguro
GOOGLE_MAPS_API_KEY=tu_api_key_google_maps

# Environment
ENVIRONMENT=development
```

### Secretos en producción

```bash
# Configurar secretos en Cloudflare Pages
echo "tu_jwt_secret" | wrangler pages secret put JWT_SECRET --project-name acachile
echo "tu_google_maps_key" | wrangler pages secret put GOOGLE_MAPS_API_KEY --project-name acachile
```

---

## 8. D1 — migraciones y operaciones comunes

### Crear base de datos

```bash
wrangler d1 create acachile-db
```

### Aplicar migraciones

```bash
# Local
wrangler d1 migrations apply acachile-db --local

# Producción
wrangler d1 migrations apply acachile-db --remote
```

### Queries útiles

```bash
# Contar usuarios
wrangler d1 execute acachile-db --command "SELECT COUNT(*) FROM usuarios;"

# Ver estructura de tabla
wrangler d1 execute acachile-db --command "PRAGMA table_info(usuarios);"

# Backup (export)
wrangler d1 execute acachile-db --command ".dump" > backup.sql
```

---

## 9. Validadores y normalización de datos

El sistema incluye validadores avanzados para datos chilenos:

### RUT (Rol Único Tributario)
- **Validación**: Algoritmo módulo 11 chileno
- **Normalización**: Formato `XXXXXXXX-X`
- **Uso**: Creación/edición de usuarios y perfiles

### Teléfonos
- **Validación**: Formato chileno móvil
- **Normalización**: `+569XXXXXXXX`
- **Soporte**: Números locales e internacionales

### Direcciones
- **Validación**: Geocodificación con Google Maps API
- **Normalización**: Dirección estandarizada
- **Fallback**: Mantiene dirección original si geocodificación falla

### Integración automática

Los validadores se ejecutan automáticamente en:
- `POST /api/admin/users` (creación de usuarios)
- `PUT /api/admin/users/:id` (edición de usuarios)
- `PUT /api/auth/me` (actualización de perfil)

### Configuración de Google Maps API

```bash
# Configurar API key como secreto
echo "AIzaSy..." | wrangler pages secret put GOOGLE_MAPS_API_KEY --project-name acachile
```

---

## 10. Cambio seguro de contraseña para un usuario (operación manual)

Las contraseñas se almacenan con **PBKDF2 (SHA-256, 150k iteraciones y sal aleatoria de 16 bytes)**. Cualquier hash legado en SHA-256 se migra automáticamente la próxima vez que el usuario inicie sesión con éxito.

### Generar hash compatible (Node.js)

```javascript
import crypto from 'crypto';

const ITERATIONS = 150_000;
const SALT_BYTES = 16;

function hashPassword(password) {
  const salt = crypto.randomBytes(SALT_BYTES);
  const derived = crypto.pbkdf2Sync(password, salt, ITERATIONS, 32, 'sha256');
  const encode = (buffer) => buffer.toString('base64');
  return `pbkdf2$${ITERATIONS}$${encode(salt)}$${encode(derived)}`;
}

console.log(hashPassword('NuevaPassword123!'));
```

### Actualizar en base de datos

```sql
UPDATE usuarios
SET password_hash = 'hash_generado_arriba'
WHERE email = 'usuario@email.com';
```

---

## 11. Debugging y observabilidad (tips operativos)

### Logs y monitoreo

```bash
# Logs de Pages Functions
wrangler pages deployment tail --project-name acachile

# Logs de build
# Ver en dashboard de Cloudflare Pages
```

### Debug panel

- **Componente**: `DebugPanel` (icono 🐛 en desarrollo)
- **Logger**: `window.logger` disponible en consola
- **Namespaces**: `auth`, `api`, `search`, `events`, `ui`

### React Error #310

Causas comunes del error "Minified React error #310":
- Hooks condicionales o en bucles
- Cambios en orden de hooks entre renders

**Solución**: Mover todos los hooks al inicio del componente.

---

## 12. Problemas comunes y soluciones rápidas

| Problema | Solución |
|----------|----------|
| `Failed to fetch` | Verificar `VITE_API_BASE_URL` y CORS |
| Login falla | Crear usuario admin y verificar `JWT_SECRET` |
| Fotos no suben | Revisar binding R2 y permisos |
| Búsqueda vacía | Verificar configuración de privacidad |
| Build falla | Ejecutar `npm install` y verificar `_headers` |
| Google Maps no carga | Verificar `GOOGLE_MAPS_API_KEY` secreto |

---

## 13. Comandos útiles

### Desarrollo
```bash
npm run dev        # Frontend con Vite
npm run build      # Build de producción
npm run preview    # Vista previa del build
npm run lint       # ESLint + TypeScript
```

### Despliegue
```bash
npm run deploy     # Build + deploy a Pages
```

### Base de datos
```bash
wrangler d1 migrations apply acachile-db --local
wrangler d1 execute acachile-db --command "SELECT * FROM usuarios LIMIT 5;"
```

### Secretos
```bash
wrangler pages secret list --project-name acachile
wrangler pages secret put VARIABLE_NAME --project-name acachile
```

---

## 14. Health checks y endpoints importantes

- `GET /api/health` — Estado del sistema
- `GET /api/search?q=...&type=usuarios` — Búsqueda global
- `GET /api/socios/:id` — Perfil público de socio
- `POST /api/admin/users` — Crear usuario (con validadores)
- `PUT /api/auth/me` — Actualizar perfil (con validadores)

---

## 15. Superficie de API completa

### Autenticación
- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/auth/profile`
- `PUT /api/auth/profile` ⭐ **Incluye validadores**
- `GET/PUT /api/auth/privacy`

### Administración de usuarios
- `GET /api/admin/users`
- `POST /api/admin/users` ⭐ **Incluye validadores**
- `PUT /api/admin/users/:id` ⭐ **Incluye validadores**
- `DELETE /api/admin/users/:id`

### Socios y cuotas
- `GET /api/admin/socios`
- `POST /api/admin/socios`
- `GET/PUT/DELETE /api/admin/socios/:id`
- `GET /api/admin/cuotas`
- `POST /api/admin/cuotas/generar`

### Eventos y contenido
- `GET /api/eventos`
- `POST /api/eventos`
- `GET /api/eventos/:id`
- `PUT /api/eventos/:id`
- `GET /api/noticias`
- `POST /api/noticias`

### Sistema
- `GET /api/search`
- `GET /api/health`
- `GET /api/system/maintenance`

---

## 16. Front-End routing y componentes

### Rutas principales
- `/` — Home público
- `/eventos` — Listado de eventos
- `/noticias` — Blog institucional
- `/unete` — Formulario de postulación
- `/perfil` — Perfil de usuario
- `/panel-admin/*` — Panel administrativo

### Componentes clave
- `AdminUsers` — Gestión de usuarios con validadores
- `UserProfile` — Perfil con campos normalizados
- `Footer` — Incluye información del desarrollador
- `DebugPanel` — Herramientas de desarrollo

---

## 17. Testing y calidad

### Pruebas manuales recomendadas

1. **Validadores chilenos**
   - Crear usuario con RUT inválido → debe mostrar error
   - Ingresar teléfono `912345678` → debe normalizarse a `+56912345678`
   - Ingresar dirección → debe geocodificarse

2. **Funcionalidades críticas**
   - Login/logout y recuperación de sesión
   - CRUD de usuarios y socios
   - Subida de imágenes a R2
   - Búsqueda respetando privacidad

### Calidad de código
```bash
npm run lint    # ESLint + TypeScript
npm run build   # Verifica compilación
```

---

## 18. Despliegue y operaciones

### Deploy automático
Cada push a `main` activa deploy automático en Cloudflare Pages.

### Rollback
- Usar historial de deployments en dashboard de Pages
- Para D1: mantener backups antes de migraciones críticas

### Monitoreo
- Dashboard de Cloudflare Pages
- Logs de Functions: `wrangler pages deployment tail`
- Endpoint `/api/health` para verificaciones

---

## 19. Tareas de mantenimiento

| Tarea | Frecuencia | Comando |
|-------|------------|---------|
| Revisar cuotas pendientes | Semanal | Panel admin |
| Limpiar cache KV | Mensual | `wrangler kv:key delete` |
| Verificar R2 | Mensual | Scripts R2 |
| Auditar usuarios | Trimestral | `/api/admin/users` |
| Actualizar secretos | Semestral | Dashboard Pages |

---

## 20. Troubleshooting

### Errores comunes

| Error | Causa | Solución |
|-------|-------|----------|
| `Failed to fetch` | API URL incorrecta | Ver `FIX_FAILED_TO_FETCH.md` |
| Login falla | Usuario no existe | Crear usuario admin |
| RUT inválido | Error de validación | Verificar algoritmo módulo 11 |
| Google Maps no carga | API key faltante | Configurar secreto `GOOGLE_MAPS_API_KEY` |

---

## 21. Documentación complementaria

- `VALIDADORES_CHILENOS.md` — Documentación detallada de validadores
- `R2_SETUP.md` — Configuración de almacenamiento
- `ENV_CONFIG.md` — Variables de entorno
- `FIX_FAILED_TO_FETCH.md` — Solución a problemas de API

---

## 22. Checklist de primer día

1. ✅ Instalar dependencias y configurar wrangler
2. ✅ Configurar variables de entorno locales
3. ✅ Crear base de datos D1 y aplicar migraciones
4. ✅ Configurar secretos en Cloudflare Pages
5. ✅ Crear usuario administrador
6. ✅ Probar validadores chilenos (RUT, teléfono, dirección)
7. ✅ Verificar subida de imágenes a R2
8. ✅ Explorar panel administrativo completo

---

## 23. Glosario rápido

- **ACA**: Asociación Chilena de Asadores
- **D1**: Base de datos SQLite serverless de Cloudflare
- **R2**: Almacenamiento de objetos S3-like
- **KV**: Cache clave-valor ultrarrápido
- **Pages Functions**: Backend serverless
- **Validadores**: Sistema de normalización chilena (RUT, teléfonos, direcciones)

---

## 24. Contribuir y buenas prácticas

- Usar feature branches (`feature/...`, `fix/...`)
- Ejecutar `npm run lint` antes de PR
- Documentar cambios en este README
- Mantener validadores actualizados
- No commitear datos sensibles

---

## 25. Información del desarrollador

**Desarrollado por:** [Juan Cartagena](https://juancartagena.cl)

**Stack tecnológico principal:**
- Frontend: React 18 + TypeScript + Vite + Tailwind CSS
- Backend: Cloudflare Pages Functions
- Base de datos: Cloudflare D1
- Almacenamiento: Cloudflare R2
- Cache: Cloudflare KV
- APIs: Google Maps Geocoding/Static Maps

**Hosteado en:** Cloudflare Pages

---

**Última actualización:** Octubre 2025

Este README es la fuente de verdad completa del proyecto ACA Chile. Incluye todas las funcionalidades implementadas, incluyendo el sistema avanzado de validación chilena y la infraestructura Cloudflare optimizada.

---

## Índice (rápido)

- Visión general
- Requisitos y herramientas
- Estructura del repo
- Cómo ejecutar en desarrollo
- Cómo construir y desplegar
- Bindings y variables de entorno
- D1 (migraciones y operaciones comunes)
- Sugerencias de debugging (incluye React error #310)
- Cambio de contraseña para un usuario (instrucciones seguras)
- Troubleshooting y logs
- Contribuir

---

## 1. Visión general

Este repositorio contiene la aplicación frontend (React + Vite) y las Pages Functions (endpoints serverless) que actúan como backend usando Cloudflare Workers + D1 + KV + R2.

El objetivo es permitir administrar socios, cuotas, eventos y contenido público, con controles de privacidad por socio.

---

## 2. Requisitos y herramientas

- Node.js LTS (v18+ recomendado)
- npm (o yarn)
- wrangler v2+ (para interactuar con Pages / D1 / R2)
- Una cuenta de Cloudflare con Pages/D1/R2 habilitados

Instalación rápida:

```bash
# Instala dependencias (desde la raíz del repo)
npm install

# Instala wrangler globalmente si aún no lo tienes
npm i -g wrangler
```

---

## 3. Estructura del repositorio

- `frontend/` — React + Vite app (contiene `src/` y `functions/` para Pages Functions).
- `frontend/functions/` — Pages Functions (cada `api/*` es un endpoint).
- `shared/` — tipos y utilidades compartidas.
- `migrations/` — scripts SQL históricos y utilitarios.
- `docs/` — guías operacionales (R2, DNS, Pages, etc.).

---

## 4. Ejecutar en desarrollo (rápido)

Hay dos modos comunes para trabajar localmente.

Opción A (recomendada — wrangler proxy para funciones):

```bash
cd frontend
# Levanta Vite y permite a Pages Functions responder a /api/*
wrangler pages dev dist -- npm run dev -- --host --port 5173

# Abre http://localhost:8787
```

Opción B (dev separados):

```bash
# Terminal A: frontend dev
cd frontend
npm run dev -- --port 5173

# Terminal B: si quieres emular funciones con wrangler
cd frontend
wrangler pages dev dist --local

# Ver assets en http://localhost:5173 y proxear /api/ con wrangler si lo configuras
```

Notas:
- Los endpoints se encuentran bajo `frontend/functions/api/*`.
- Para ejecutar funciones unitarias puedes usar `wrangler pages dev` o `wrangler dev` (ver docs de wrangler según versión).

---

## 5. Build y despliegue

Build local (produce `dist/`):

```bash
cd frontend
npm run build
```

Deploy to Cloudflare Pages (si tienes `wrangler` configurado o via GitHub Actions/Pages):

```bash
# despliegue manual con wrangler (requiere credenciales configuradas)
cd frontend
npm run deploy
```

Por defecto el build ejecuta `tsc --noEmit && vite build`.

Cloudflare Pages: el repositorio está configurado para desplegar desde `frontend/dist` (ver `wrangler.toml` y settings de Pages). Si el deploy falla por problemas con submódulos/comandos de copia (ej. `_headers`), revisa que `frontend/_headers` exista o actualiza la configuración de build.

---

## 6. Variables de entorno y bindings importantes

Configurar los bindings y secrets en Pages/Workers: los nombres abajo deben existir en el entorno de Pages.

- `DB` — binding para Cloudflare D1 (obligatorio)
- `ACA_KV` — binding para Cloudflare KV (opcional pero usado en caching)
- `R2` bindings — para R2 bucket (fotos, comprobantes)
- `JWT_SECRET` — secreto para firmar tokens JWT
- `RESEND_API_KEY` — (opcional) para enviar emails
- `FRONTEND_URL` — URL pública del frontend
- `CORS_ORIGIN` — orígenes permitidos

Localmente se usan archivos de ejemplo: `frontend/.env.development` y `frontend/.env.production` (no commitear secretos reales).

---

## 7. D1 — migraciones y operaciones comunes

Aplicar migraciones locales con wrangler:

```bash
# Crear DB (si procede)
wrangler d1 create acachile-db

# Aplicar migraciones (según tu configuración wrangler)
wrangler d1 migrations apply acachile-db --local
```

Acceso y queries rápidos (ejemplo):

```bash
# Ejecutar un query con wrangler (o usar la consola D1 en Cloudflare)
wrangler d1 execute acachile-db --file ./migrations/sql/query.sql
```

Nota sobre esquemas: el proyecto ha sufrido evoluciones; algunas funciones (por ejemplo `/api/search`) ya contienen protecciones para esquemas con columnas faltantes (usando PRAGMA table_info y `NULL AS col` como fallback). Si añades columnas, agrega migraciones idempotentes.

---

## 8. Cambio seguro de contraseña para un usuario (operación manual)

Si necesitas cambiar la contraseña de un usuario (ej. `jcartagenac@gmail.com`) el repo usa un esquema de hash basado en SHA-256 con un salt conocido en el proyecto.

Ejemplo (no ejecutes esto en producción sin confirmar):

1. El hash usado en este proyecto es: SHA-256(password + 'salt_aca_chile_2024')

2. Para actualizar la contraseña por SQL:

```sql
UPDATE usuarios
SET password_hash = '<nuevo_hash_sha256>'
WHERE email = 'jcartagenac@gmail.com';
```

3. Si prefieres que lo haga por ti, explícame destino (local/test/production) y confirmas que doy el paso.

Generación local de hash (ejemplo en node):

```js
import crypto from 'crypto';
const salt = 'salt_aca_chile_2024';
function hashPassword(password){
   return crypto.createHash('sha256').update(password + salt, 'utf8').digest('hex');
}
console.log(hashPassword('supersecret123'));
```

---

## 9. Debugging y observabilidad (tips operativos)

- Ver logs de Pages build: en la UI de Cloudflare Pages o con `wrangler pages deployments tail`.
- Ver logs de Functions / Workers en Cloudflare (Logs -> Deployments -> Tail).
- Para debug local de funciones: `wrangler pages dev` (proxy) o `wrangler dev` según versión.

React error #310 (Minified React error) — causas comunes
- Este error ocurre en producción cuando el orden de hooks cambia entre renders (hooks condicionales o hooks añadidos/quitados por un render). Diagnóstico y fixes:
   - Revisa componentes que usan hooks (`useMemo`, `useEffect`, `useState`) y asegúrate de no llamarlos condicionalmente (si usas `if (loading) return ...` está bien siempre que los hooks se declaren antes de cualquier `return` condicional temprana).
   - Evita usar hooks dentro de ramas (por ejemplo dentro de `if (socio) { useMemo(...) }`).
   - En `PublicSocioPage.tsx` se introdujeron defensas (guards, error boundary) y se aseguraron hooks en la parte superior del componente.

Problemas de build relacionados con `_headers` o ficheros estáticos
- Vite puede intentar copiar `frontend/_headers` a `dist/_headers`. Si no existe y el plugin intenta copiarlo, la build puede fallar en algunos entornos. Soluciones:
   - Añadir un archivo `frontend/_headers` (incluso vacío o con reglas mínimas) y commitearlo.
   - O modificar el plugin/copy task del build para que ignore la ausencia del archivo.

---

## 10. Problemas comunes y soluciones rápidas

- Pages no termina la clonación: revisa si hay submódulos/gitlinks (`160000` entries). Solución: eliminar el gitlink del índice y reemplazar con un directorio normal.
- Search no devuelve usuarios: revisar `frontend/functions/api/search/index.js` — el handler ahora se protege contra columnas faltantes en D1.
- Privacy guard devuelve "Token inválido": asegurarse de que `requireAuth()` es `await`ed en handlers y que el token se envía en `Authorization: Bearer <token>`.

---

## 11. Comandos útiles

Desde `frontend/`:

```bash
npm run dev        # dev con Vite
npm run build      # tsc + vite build
npm run preview    # vite preview (local dist)
npm run lint       # eslint
npm run deploy     # build + wrangler pages deploy (requiere wrangler credenciales)
```

Git / PR flow

```bash
git checkout -b feat/mi-cambio
# trabajar, commit
git push origin feat/mi-cambio
# abrir PR en GitHub -> revisión -> merge
```

---

## 12. Health checks y endpoints importantes

- `/api/health` — estado básico (bindings, DB reachable)
- `/api/search?q=...&type=usuarios` — búsqueda de usuarios (respeta privacy)
- `/api/socios/:id` — perfil público de socio (usa fallback seguro si faltan campos)

---

## 13. Contribuir

- Sigue el flujo de ramas: `main` (producción), PRs para features/fixes.
- Añade tests o una nota de verificación cuando cambies comportamiento crítico (auth, DB schema, search).
- Documenta migraciones en `migrations/` y añade instrucciones para apply en README cuando sean breaking.

---

## 14. Contacto y responsabilidades

Si necesitas que aplique cambios en producción (migraciones, update de contraseña, modificación de bindings), indícalo explícitamente y confirma el entorno (staging / production). Algunas operaciones son destructivas y requieren backup.

---

## 15. Resumen final y próximos pasos recomendados

- Tengo cambios recientes que corrigieron problemas de hooks y el espaciado del hero. Empujé esas correcciones a `main`.
- Recomendación inmediata: después de cada cambio crítico en `frontend/functions` ejecutar `npm run build` localmente y revisar `wrangler pages deployments tail` hasta que Pages muestre `deployed`.
- Próximo mantenimiento recomendado: hardening de `/api/socios/:id` para siempre devolver shape por defecto (`contact`, `location`, `privacy`) y añadir tests básicos de integración para endpoints clave.

---

Gracias por trabajar en este proyecto. Si quieres, puedo:

- Crear un checklist de pre-merge que incluya build local, tsc, tests y una revisión rápida de endpoints. 
- Preparar un pequeño script SQL migración para aplicar cambios de password o shape en D1 (lo dejo a tu confirmación antes de ejecutar).

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
