# ACA Chile - Asociación Chilena de Asadores

## 🔥 Monorepo Full-Stack

Este proyecto contiene tanto el frontend como el backend de la plataforma ACA Chile, construido como un monorepo para máxima eficiencia y mantenibilidad.

## 🏗️ Estructura del Proyecto

```
acachile/
├── frontend/          # React + TypeScript + TailwindCSS
│   ├── src/           # Código fuente del frontend
│   ├── public/        # Assets estáticos
│   └── dist/          # Build de producción
├── worker/            # Cloudflare Worker (API/Backend)
│   ├── src/           # Código fuente del worker
│   └── wrangler.toml  # Configuración de Cloudflare
├── shared/            # Tipos y utilidades compartidas
│   └── index.ts       # Tipos TypeScript compartidos
└── package.json       # Configuración del workspace
```

## 🚀 Tecnologías

### Frontend
- **React 18** con TypeScript
- **Vite** como build tool
- **TailwindCSS** con diseño neumórfico
- **React Router** para navegación
- **Cloudflare Pages** para deployment

### Backend/Worker
- **Cloudflare Workers** (Edge computing)
- **TypeScript** 
- **KV Storage** para datos
- **Wrangler** para deployment

### Shared
- **TypeScript** para tipos compartidos
- **Utilidades** comunes entre frontend y backend

## 📦 Instalación

```bash
# Instalar dependencias del monorepo
npm install

# Instalar dependencias específicas
npm install --workspace=frontend
npm install --workspace=worker
npm install --workspace=shared
```

## 🛠️ Desarrollo

```bash
# Frontend (React + Vite)
npm run dev

# Worker (Cloudflare Worker)
npm run dev --workspace=worker

# Ambos en paralelo
npm run dev:all
```

## 🏗️ Build

```bash
# Build del frontend
npm run build

# Build del worker
npm run build:worker

# Build completo
npm run build:all
```

## 🚀 Deployment

### Cloudflare Pages (Frontend)
```bash
# Configuración automática desde GitHub
# Rama: main
# Build command: cd frontend && npm run build
# Build output: frontend/dist
```

### Cloudflare Workers (Backend)
```bash
npm run deploy:worker
```

## 🔧 Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Inicia servidor de desarrollo del frontend |
| `npm run build` | Build del frontend |
| `npm run build:worker` | Build del worker |
| `npm run build:all` | Build completo (worker + frontend) |
| `npm run deploy` | Deploy completo |
| `npm run deploy:frontend` | Deploy solo frontend |
| `npm run deploy:worker` | Deploy solo worker |

## 🌍 URLs

- **Frontend**: https://beta.acachile.com
- **Frontend**: https://beta.acachile.com
- **Worker API**: https://acachile-api-production.juecart.workers.dev

## 🔗 API Endpoints

- `GET /api/health` - Health check del worker
- `GET /api/eventos` - Lista de eventos
- `GET /api/noticias` - Lista de noticias

## 👥 Desarrollo

1. **Fork** el repositorio
2. **Crear rama** para tu feature: `git checkout -b feature/nueva-funcionalidad`
3. **Commit** cambios: `git commit -m 'Add nueva funcionalidad'`
4. **Push** a la rama: `git push origin feature/nueva-funcionalidad`
5. **Crear Pull Request**

## 📄 Licencia

MIT License - Ver [LICENSE](LICENSE) para detalles.

---

**🔥 ACA Chile - Asociación Chilena de Asadores**