# ACA Chile - Plataforma Web

Plataforma web oficial de la Asociación Chilena de Arqueología (ACA Chile), desarrollada con React y Cloudflare Pages.

---

## 🚀 Stack Tecnológico

### Frontend
- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite
- **Routing:** React Router v6
- **Styling:** CSS Modules + Tailwind CSS
- **State Management:** React Context API

### Backend (Cloudflare Pages Functions)
- **Runtime:** Cloudflare Workers (TypeScript)
- **Database:** D1 (SQLite en Cloudflare)
- **Storage:** R2 (Object Storage para imágenes)
- **Cache:** KV (Key-Value Store)
- **Email:** Resend API

### Autenticación y Seguridad
- **Auth:** JWT + PBKDF2 (compatibilidad con hashes legacy)
- **Role-based Access Control:** Admin, Director, User
- **Security:** Binding validation, conditional logging, password hash protection

---

## 📦 Scripts Disponibles

```bash
# Desarrollo local
npm run dev              # Inicia servidor de desarrollo (puerto 5173)

# Build
npm run build            # Compila para producción
npm run preview          # Preview del build de producción

# Deploy
npm run deploy           # Deploy a Cloudflare Pages (requiere wrangler)

# Linting y Type Checking
npm run lint             # Ejecuta ESLint
npx tsc --noEmit         # Verifica tipos sin compilar
```

---

## 🔐 Variables de Entorno

Ver `functions/types.d.ts` para la lista completa de tipos.

### Bindings de Cloudflare (Configurar en Pages Dashboard)

**Obligatorios:**
- `DB` - D1 Database binding
- `IMAGES` - R2 Bucket binding
- `JWT_SECRET` - Secret para generar tokens
- `R2_PUBLIC_URL` - URL pública del bucket R2

**Opcionales:**
- `ENVIRONMENT` - 'development' | 'production' (para logging condicional)
- `CORS_ORIGIN` - Origin permitido (default: '*')
- `RESEND_API_KEY` - API key de Resend (para emails)
- `FROM_EMAIL` - Email remitente
- `FRONTEND_URL` - URL del frontend (para links en emails)
- `ADMIN_EMAIL` - Email del administrador

### Variables de Desarrollo Local

Crear archivo `.dev.vars` en la raíz del proyecto:

```env
JWT_SECRET=your-super-secret-key-here
ENVIRONMENT=development
R2_PUBLIC_URL=http://localhost:8788/images
```

---

## 📁 Estructura del Proyecto

```
frontend/
├── src/                      # Código fuente del frontend
│   ├── components/           # Componentes React reutilizables
│   │   ├── layout/           # Layout components (Header, Footer)
│   │   ├── admin/            # Componentes del panel admin
│   │   └── ...
│   ├── contexts/             # React Contexts
│   │   ├── AuthContext.tsx   # Autenticación global
│   │   └── EventContext.tsx  # Gestión de eventos
│   ├── pages/                # Páginas de la aplicación
│   │   ├── HomePage.tsx
│   │   ├── AboutPage.tsx
│   │   ├── admin/            # Páginas del admin panel
│   │   └── ...
│   ├── services/             # API clients
│   │   ├── api.ts            # Cliente API base
│   │   ├── authService.ts    # Servicios de auth
│   │   └── adminService.ts   # Servicios de admin
│   ├── utils/                # Utilidades
│   │   └── logger.ts         # Sistema de logging condicional
│   ├── App.tsx               # Componente raíz
│   └── main.tsx              # Entry point
│
├── functions/                # Cloudflare Pages Functions (Backend)
│   ├── api/                  # API endpoints
│   │   ├── auth/             # Autenticación
│   │   │   ├── login.ts
│   │   │   ├── register.ts
│   │   │   ├── forgot-password.ts
│   │   │   └── ...
│   │   ├── admin/            # Endpoints de administración
│   │   │   ├── users/
│   │   │   ├── postulantes/
│   │   │   └── ...
│   │   ├── eventos/          # Gestión de eventos
│   │   ├── noticias/         # Gestión de noticias
│   │   └── ...
│   ├── utils/                # Utilidades del backend
│   │   └── logger.ts         # Logger condicional
│   ├── _middleware.ts        # Middleware global (CORS, Auth)
│   └── types.d.ts            # Tipos TypeScript globales
│
├── public/                   # Archivos estáticos
└── dist/                     # Build de producción (generado)
```

---

## 🔒 Seguridad

### Implementado
- ✅ **JWT Authentication** con PBKDF2 para hashing de passwords (y compatibilidad con hashes legacy)
- ✅ **Role-based Access Control** (Admin, Director, User roles)
- ✅ **Binding Validation** en runtime para prevenir crashes
- ✅ **Conditional Logging** - Debug logs solo en desarrollo
- ✅ **Password Hash Protection** - Nunca expuesto en responses
- ✅ **CORS Configuration** por environment
- ✅ **Error Handling** - Detalles internos ocultos en producción
- ✅ **Prepared Statements** para prevenir SQL injection

### Best Practices
- No exponer `password_hash` en ningún endpoint
- Validar todos los bindings críticos antes de usarlos
- Solo mostrar stack traces en desarrollo
- Usar `console.error` para errores (siempre activo)
- Logs de debug con `logger.debug()` (solo desarrollo)

---

## 🛠️ Desarrollo Local

### Requisitos
- Node.js 18+
- npm 9+
- Cuenta de Cloudflare (para deploy)

### Setup Inicial

1. **Clonar el repositorio**
   ```bash
   git clone <repo-url>
   cd poroto/frontend
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   ```bash
   # Crear archivo .dev.vars
   cp .dev.vars.example .dev.vars
   # Editar con tus valores
   ```

4. **Iniciar servidor de desarrollo**
   ```bash
   npm run dev
   ```

5. **Abrir en navegador**
   ```
   http://localhost:5173
   ```

### Testing Local de Pages Functions

Para probar las funciones localmente con Wrangler:

```bash
# Instalar Wrangler
npm install -g wrangler

# Iniciar en modo dev con bindings
wrangler pages dev dist --compatibility-date=2024-01-01

# Probar endpoints
curl http://localhost:8788/api/health
```

---

## 🚀 Deploy a Producción

### Vía Cloudflare Dashboard (Recomendado)

1. Conectar repositorio en Cloudflare Pages Dashboard
2. Configurar build settings:
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Root directory:** `frontend`
3. Configurar bindings en Settings > Functions:
   - D1 Database: `DB`
   - R2 Bucket: `IMAGES`
   - Environment Variables: `JWT_SECRET`, etc.
4. Deploy automático en cada push a main

### Vía Wrangler CLI

```bash
# Build
npm run build

# Deploy
wrangler pages deploy dist --project-name=aca-chile
```

---

## 🧪 Testing

```bash
# Type checking
npx tsc --noEmit

# Lint
npm run lint

# Build test
npm run build && npm run preview
```

---

## 📚 Recursos y Documentación

### Cloudflare
- [Pages Documentation](https://developers.cloudflare.com/pages/)
- [Pages Functions](https://developers.cloudflare.com/pages/functions/)
- [D1 Database](https://developers.cloudflare.com/d1/)
- [R2 Storage](https://developers.cloudflare.com/r2/)

### React + Vite
- [Vite Documentation](https://vite.dev/)
- [React Documentation](https://react.dev/)
- [React Router](https://reactrouter.com/)

---

## 🐛 Troubleshooting

### Build Errors

**Error:** `Module not found`
- Verificar imports y paths
- Ejecutar `npm install`

**Error:** `Type error in functions/`
- Verificar `functions/types.d.ts`
- Ejecutar `npx tsc --noEmit`

### Runtime Errors

**Error:** `DB binding not configured`
- Verificar bindings en Cloudflare Dashboard
- Para local: configurar `.dev.vars`

**Error:** `JWT_SECRET not configured`
- Agregar en Environment Variables
- Para local: agregar a `.dev.vars`

---

## 📝 Notas de Desarrollo

### Logger Utility

En **backend** (Pages Functions):
```typescript
import { createLogger } from '../../utils/logger';

const log = createLogger('MY-HANDLER', env.ENVIRONMENT);
log.info('Processing request');     // Solo en desarrollo
log.debug('Details', { data });     // Solo en desarrollo
log.error('Failed', { error });     // Siempre activo
```

En **frontend**:
```typescript
import { logger } from '@/utils/logger';

logger.ui.info('Component mounted');  // Solo en desarrollo
logger.api.error('API failed', err);  // Siempre activo
```

### DevTools Helper (Solo Frontend Dev)

En la consola del navegador:
```javascript
// Activar todos los logs
window.acaDebug.enableAll();

// Ver estado del logger
window.acaDebug.logger;

// Desactivar logs
window.acaDebug.disableAll();
```

---

## 👥 Contribución

1. Crear feature branch desde `main`
2. Hacer cambios y commits descriptivos
3. Asegurar que build pasa: `npm run build`
4. Crear Pull Request
5. Esperar review y merge

---

## 📄 Licencia

Propiedad de la Asociación Chilena de Arqueología (ACA Chile).

---

**Última actualización:** 2025-11-20
