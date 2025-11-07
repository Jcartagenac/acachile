# ACA Chile Platform

> Plataforma digital para la Asociación Chilena de Asadores (ACA Chile). Incluye frontend en React/Vite, Pages Functions en Cloudflare, D1, KV y R2 para administrar socios, eventos, noticias y operaciones internas.

---

## Quick Start

1. **Prerequisitos**
   - Node.js ≥ 18 (Se recomienda LTS)
   - npm ≥ 9 (instalado con Node)
   - [Wrangler](https://developers.cloudflare.com/workers/wrangler/install-and-update/) ≥ v3 para emular Pages Functions

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables**
   ```bash
   cp .env.example .env.local          # Ajusta valores según tu entorno
   cp frontend/.env.development frontend/.env.local
   ```

4. **Correr en desarrollo**
   ```bash
   # 1) Frontend
   npm run dev -w frontend

   # 2) Backend (Pages Functions + bindings simulados)
   npx wrangler pages dev frontend --local
   ```

5. **Verifica calidad**
   ```bash
   npm run verify
   ```

---

## Calidad y pruebas

- `npm run lint` & `npm run typecheck` ejecutan un set curado de chequeos para utilidades compartidas y helpers críticos de backend.
- `npm run test` usa Vitest (JS DOM + Node) para cubrir helpers frontend y funciones de salud del backend.
- `npm run verify` encadena lint → typecheck → tests (lo mismo que corre en CI).
- Documentación extendida en `docs/tooling.md`.

> Tip: ejecuta `npm run verify` antes de abrir un PR o desplegar.

---

## Entorno y configuración

- Plantilla base: `.env.example`
- Variables de frontend Vite (`VITE_*`) viven en `frontend/.env.*`
- Variables de backend (Cloudflare Pages Functions) se gestionan vía `wrangler pages secret|var`
- Guías complementarias:
  - `ENV_CONFIG.md` – mapa completo de variables
  - `BINDINGS.md` (en `frontend/`) – bindings activos en Cloudflare
  - `CLOUDFLARE_CONFIG*.md` – referencia de infraestructura

---

## Estructura principal

```
.
├── frontend/                  # Workspace principal (React + Pages Functions)
│   ├── src/                   # Código del frontend (componentes, páginas, utils)
│   ├── functions/             # Cloudflare Pages Functions (backend)
│   ├── scripts/               # Automatizaciones (deploy, bindings, etc.)
│   └── package.json
├── shared/                    # Utilidades compartidas entre frontend/backend
├── docs/                      # Documentación generada durante los sprints
├── scripts/*                  # Scripts globales (R2, DNS, etc.)
├── .github/workflows/ci.yml   # Pipeline CI (lint + typecheck + tests)
├── .env.example               # Plantilla de variables
├── package.json               # Workspace raíz
└── README.md                  # Este documento
```

---

## Scripts destacados

Consulta `docs/tooling.md` para la lista completa. Resumen rápido:

- `npm run dev -w frontend` – servidor Vite con HMR
- `npm run build -w frontend` – build de producción (ejecuta typecheck antes de Vite)
- `npm run deploy -w frontend` – despliegue manual a Cloudflare Pages
- `frontend/scripts/intelligent-deploy.cjs` – despliegue inteligente (ver documentación)

---

## Documentación complementaria

| Documento | Contenido |
| --- | --- |
| `ENV_CONFIG.md` | Variables de entorno y secretos por entorno |
| `API_DOCUMENTATION.md` | Resumen de endpoints y rutas clave |
| `DEBUG_FRONTEND_COMPLETO.md` | Guía de debugging exhaustivo |
| `CLOUDFLARE_*.md` | Configuración Pages / R2 / DNS |
| `SPRINT-4-COMPLETADO.md` y `SPRINT-EVENTOS-COMPLETADO.md` | Historial de entregas anteriores |
| `RESUMEN_COMPLETO.md` | Índice global del proyecto |

Mantén estos archivos en la raíz para consultas rápidas; están referenciados desde distintos tableros.

---

## Despliegue y operaciones

- Producción vive en Cloudflare Pages (`beta.acachile.com`).
- Usa `npm run deploy -w frontend` para builds controlados o `frontend/scripts/intelligent-deploy.cjs` para despliegues asistidos.
- Health checks:
  - `/api/system/health?detailed=true`
  - `/api/health`
- Scripts de infraestructura adicionales: `auto-dns-setup.sh`, `setup-r2-complete.js`, `configure-env-vars.sh`.

---

## Integración continua

El workflow `CI` (`.github/workflows/ci.yml`) se ejecuta en cada push/PR sobre `main` y `develop`:

1. `npm ci`
2. `npm run verify`

Si necesitas más validaciones (por ejemplo, cobertura), extiende este flujo.

---

## Contribuir

1. Trabaja con una rama feature.
2. Ajusta `.env.local` y usa datos sintéticos al compartir configuraciones.
3. Ejecuta `npm run verify` antes de hacer push.
4. Actualiza documentación relevante (README, `docs/`, notas de sprint).
5. Abre PR con resumen breve y resultados de verificación.

¿Dudas? Revisa los archivos `README_old.md` y `RESUMEN_COMPLETO.md` para información histórica, o conversa con el equipo en el canal de #plat-dev.
