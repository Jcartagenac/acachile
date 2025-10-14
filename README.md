# ACA Chile - Asociación Chilena de Asadores

## 🎯 Descripción del Proyecto

Plataforma web completa para la **Asociación Chilena de Asadores (ACA Chile)** que incluye:
- Sistema de gestión de usuarios con autenticación completa
- Portal de eventos, noticias y competencias de asado
- Sistema de recuperación de contraseñas por email
- Panel administrativo para gestión de registros
- API RESTful con Cloudflare Workers
- Frontend moderno con React + TypeScript + Vite

---

## 🏗️ Arquitectura del Sistema

### **Frontend** (`/frontend/`)
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite 5
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM
- **State Management**: Context API
- **UI Components**: Lucide React (iconos)
- **Deployment**: Cloudflare Pages

### **Backend** (`/worker/`)
- **Runtime**: Cloudflare Workers
- **Database**: Cloudflare KV (Key-Value Store)
- **Email Service**: Resend API
- **Authentication**: JWT tokens personalizados
- **API Style**: RESTful

### **Infraestructura**
- **Hosting**: Cloudflare (Workers + Pages)
- **DNS**: Cloudflare DNS
- **Email**: Resend con dominio personalizado
- **Account ID**: `172194a6569df504cbb8a638a94d3d2c` (juecart@gmail.com)

---

## 🚀 URLs de Despliegue

### **Producción**
- **Frontend**: https://acachile.pages.dev
- **API**: https://acachile-api-production.juecart.workers.dev
- **Email Domain**: noreply@mail.juancartagena.cl (temporal)

### **Desarrollo**  
- **Frontend**: http://localhost:5173 (Vite dev server)
- **API**: https://acachile-api.juecart.workers.dev
- **Worker Local**: http://localhost:8787 (wrangler dev)

---

## 📊 Estado Actual del Sistema

### ✅ **Funcionalidades Completamente Implementadas**

#### **1. Sistema de Autenticación**
- ✅ Login con email/password
- ✅ Registro de nuevos usuarios (pendiente aprobación admin)
- ✅ Recuperación de contraseña por email **FUNCIONANDO AL 100%**
- ✅ Cambio de contraseña para usuarios logueados
- ✅ JWT tokens con expiración automática
- ✅ Middleware de autenticación en rutas protegidas

#### **2. Gestión de Usuarios**
- ✅ Migración completa de usuarios a Cloudflare KV
- ✅ Sistema de roles (super_admin, admin, user)
- ✅ Perfiles de usuario con información completa
- ✅ Sistema de membresías (vip, premium, basic)

#### **3. Sistema de Emails**
- ✅ **Resend API integrada y funcionando**
- ✅ **DNS configurado y verificado** (mail.juancartagena.cl)
- ✅ Templates HTML profesionales con branding ACA Chile
- ✅ Envío automático de emails de recuperación
- ✅ Sistema preparado para emails de bienvenida y aprobación

#### **4. API RESTful Completa**
- ✅ Endpoints de autenticación (/api/auth/*)
- ✅ Gestión de usuarios (/api/admin/*)
- ✅ Eventos y noticias (/api/eventos, /api/noticias)
- ✅ CORS configurado correctamente
- ✅ Manejo de errores robusto

#### **5. Frontend Moderno**
- ✅ Interfaz responsive con Tailwind CSS
- ✅ Sistema de rutas con React Router
- ✅ Context API para estado global
- ✅ Componentes reutilizables
- ✅ Integración completa con API

### 🔄 **En Desarrollo/Próximas Funcionalidades**

#### **1. Panel Administrativo**
- 🔄 Gestión de registros pendientes
- 🔄 Aprobación/rechazo de nuevos usuarios
- 🔄 Panel de métricas y estadísticas

#### **2. Gestión de Eventos**
- 🔄 CRUD completo de eventos
- 🔄 Sistema de inscripciones
- 🔄 Gestión de competencias

#### **3. Optimizaciones**
- 🔄 Caching estratégico
- 🔄 Optimización de imágenes
- 🔄 PWA features

---

## 🔧 Configuración del Entorno

### **Prerrequisitos**
```bash
# Herramientas necesarias
node >= 18.0.0
npm >= 9.0.0
wrangler >= 4.43.0 (Cloudflare CLI)
git
```

### **Instalación Local**

#### **1. Clonar repositorio**
```bash
git clone https://github.com/Jcartagenac/acachile.git
cd acachile
```

#### **2. Instalar dependencias**
```bash
# Frontend
cd frontend
npm install

# Worker  
cd ../worker
npm install
```

#### **3. Configurar variables de entorno**

**Frontend** (`frontend/.env`):
```env
VITE_API_BASE_URL=https://acachile-api-production.juecart.workers.dev
```

**Worker** (`worker/wrangler.toml`):
```toml
# Ya configurado - revisar archivo para detalles
account_id = "172194a6569df504cbb8a638a94d3d2c"
FROM_EMAIL = "noreply@mail.juancartagena.cl"
```

#### **4. Configurar secrets de Cloudflare**
```bash
cd worker

# API Key de Resend (ya configurada)
npx wrangler secret put RESEND_API_KEY
# Valor: re_Yk8S9iyk_63xGiXBqE3K2wG6ckLzq9zyM
```

### **Desarrollo Local**

#### **Opción 1: Desarrollo completo**
```bash
# Terminal 1: Frontend
cd frontend
npm run dev
# Disponible en: http://localhost:5173

# Terminal 2: Worker
cd worker  
npm run dev
# Disponible en: http://localhost:8787
```

#### **Opción 2: Frontend con API en producción**
```bash
# Solo frontend (usa API de producción)
cd frontend
npm run dev
```

---

## 📂 Estructura del Proyecto

```
acachile/
├── frontend/                 # React + Vite Frontend
│   ├── src/
│   │   ├── components/      # Componentes React reutilizables
│   │   ├── contexts/        # Context API (AuthContext)
│   │   ├── pages/          # Páginas/rutas principales
│   │   ├── types/          # Definiciones TypeScript
│   │   └── main.tsx        # Entry point
│   ├── package.json
│   └── .env                # Variables de entorno
│
├── worker/                  # Cloudflare Worker API
│   ├── src/
│   │   ├── index.ts        # Entry point del worker
│   │   ├── auth-system.ts  # Sistema de autenticación
│   │   ├── user-migration.ts # Gestión de usuarios en KV
│   │   └── email-service.ts # Servicio de emails con Resend
│   ├── wrangler.toml       # Configuración de Cloudflare
│   └── package.json
│
├── docs/                    # Documentación del sistema
│   ├── DNS_SIMPLIFICADO_RESEND.md
│   ├── REGISTROS_DNS_CLOUDFLARE.md
│   ├── RESEND_SETUP.md
│   └── [otros archivos de docs]
│
├── verify-dns.sh           # Script verificación DNS
├── package.json            # Workspace principal
└── README.md              # Este archivo
```

---

## 🔐 Sistema de Autenticación

### **Usuarios Predeterminados** (Post-migración)
```javascript
// Usuarios creados automáticamente en KV
{
  id: 1,
  email: "jcartagenac@gmail.com", 
  password: "supersecret123",
  roles: ["super_admin"],
  membershipType: "vip"
}

{
  id: 2, 
  email: "admin@acachile.com",
  password: "admin123",
  roles: ["admin"]
}

{
  id: 3,
  email: "usuario@acachile.com", 
  password: "user123",
  roles: ["user"]
}
```

### **Flujo de Autenticación**
1. **Login**: POST `/api/auth/login` → JWT token
2. **Registro**: POST `/api/auth/register` → Pendiente aprobación  
3. **Forgot Password**: POST `/api/auth/forgot-password` → Email enviado
4. **Reset Password**: POST `/api/auth/reset-password` → Nueva contraseña
5. **Profile**: GET `/api/auth/profile` → Datos usuario (requiere JWT)

### **JWT Token Structure**
```javascript
{
  userId: number,
  email: string, 
  exp: timestamp // Expiración 7 días
}
```

---

## 📧 Sistema de Emails (100% Funcional)

### **Configuración Resend**
- **API Key**: `re_Yk8S9iyk_63xGiXBqE3K2wG6ckLzq9zyM` (configurada como secret)
- **Dominio**: `mail.juancartagena.cl` ✅ Verificado
- **From Email**: `noreply@mail.juancartagena.cl`

### **DNS Configurado** (Cloudflare - juancartagena.cl)
```dns
# Registros configurados y verificados ✅
MX    mail                  10 feedback-smtp.us-east-1.amazonses.com
TXT   mail                  "v=spf1 include:_spf.resend.com ~all"  
TXT   _dmarc.mail          "v=DMARC1; p=quarantine; rua=mailto:dmarc@juancartagena.cl"
```

### **Templates de Email Disponibles**
1. **Password Reset** ✅ Funcionando
   - HTML responsive con branding ACA Chile
   - Botón de acción principal  
   - Warnings de seguridad
   - Expiración automática (1 hora)

2. **Welcome Email** 🔄 Implementado, no usado aún
3. **Registration Approval** 🔄 Implementado, no usado aún

### **Verificar Sistema de Email**
```bash
# Script de verificación DNS
./verify-dns.sh

# Probar envío de email
curl -X POST "https://acachile-api-production.juecart.workers.dev/api/auth/forgot-password" \
  -H "Content-Type: application/json" \
  -d '{"email": "jcartagenac@gmail.com"}'

# Resultado esperado: Email en bandeja de entrada
```

---

## 🗄️ Base de Datos (Cloudflare KV)

### **Estructura de Datos en KV**

#### **Usuarios** (`user:${id}`)
```javascript
{
  id: number,
  email: string,
  password: string, // bcrypt hash  
  name: string,
  membershipType: "vip" | "premium" | "basic",
  roles: string[], // ["super_admin", "admin", "user"]
  region: string,
  joinDate: string,
  active: boolean,
  status: "active" | "pending" | "suspended",
  emailVerified: boolean,
  createdAt: string,
  updatedAt: string,
  isInitialUser: boolean // Para usuarios migrados
}
```

#### **Tokens de Reset** (`reset_token:${token}`)
```javascript
{
  userId: number,
  email: string, 
  expires: timestamp,
  used: boolean
}
// TTL: 3600 segundos (1 hora)
```

#### **Índices** (`email_to_user:${email}`)
```javascript
{
  userId: number,
  email: string
}
```

### **Namespaces de KV Configurados**
```toml
# Desarrollo
ACA_KV: b080082921d447e6995c8085f1033286

# Producción  
ACA_KV: 60fff9f10819406cad241e326950f056
```

---

## 🌐 API Endpoints

### **Autenticación**
```http
POST   /api/auth/login              # Login usuario
POST   /api/auth/register           # Registro nuevo usuario
POST   /api/auth/forgot-password    # Solicitar reset password ✅
POST   /api/auth/reset-password     # Confirmar nuevo password ✅  
POST   /api/auth/change-password    # Cambiar password (requiere login)
GET    /api/auth/profile            # Obtener perfil usuario
```

### **Administración**
```http
POST   /api/admin/migrate-users     # Migrar usuarios iniciales a KV ✅
GET    /api/admin/registrations/pending    # Registros pendientes
POST   /api/admin/registrations/approve    # Aprobar registro
POST   /api/admin/registrations/reject     # Rechazar registro  
```

### **Contenido**
```http  
GET    /api/eventos                 # Listar eventos
GET    /api/eventos/:id             # Obtener evento específico
GET    /api/noticias                # Listar noticias
```

### **Utilidad**
```http
GET    /                           # Info API + endpoints disponibles
GET    /api/health                 # Health check
```

### **Ejemplo de Response**
```javascript
// Éxito
{
  success: true,
  data: { ... },
  message?: string
}

// Error
{
  success: false, 
  error: string,
  details?: any
}
```

---

## 🚀 Despliegue

### **Cloudflare Workers (API)**
```bash
cd worker

# Desarrollo
npx wrangler deploy --env=""

# Producción
npx wrangler deploy --env production

# Ver logs en tiempo real
npx wrangler tail --env production
```

### **Cloudflare Pages (Frontend)**  
```bash
cd frontend

# Build local
npm run build

# Deploy automático via Git push
# Configurado en Cloudflare Pages Dashboard
```

### **Variables de Entorno en Cloudflare**

#### **Variables Públicas** (wrangler.toml)
```toml
ENVIRONMENT = "production"
FROM_EMAIL = "noreply@mail.juancartagena.cl"  
FRONTEND_URL = "https://acachile.pages.dev"
```

#### **Secrets** (Encriptadas)
```bash
RESEND_API_KEY = "re_Yk8S9iyk_63xGiXBqE3K2wG6ckLzq9zyM"
```

---

## 🧪 Testing y Debugging

### **Comandos de Testing**

#### **Verificar Sistema de Email**
```bash
# Verificar DNS
./verify-dns.sh

# Test forgot password  
curl -X POST "https://acachile-api-production.juecart.workers.dev/api/auth/forgot-password" \
  -H "Content-Type: application/json" \
  -d '{"email": "jcartagenac@gmail.com"}'
```

#### **Verificar Autenticación**
```bash  
# Test login
curl -X POST "https://acachile-api-production.juecart.workers.dev/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "jcartagenac@gmail.com", "password": "supersecret123"}'
```

#### **Health Checks**
```bash
# API Health
curl https://acachile-api-production.juecart.workers.dev/api/health

# Worker Info
curl https://acachile-api-production.juecart.workers.dev/
```

### **Logs y Monitoring**
```bash
# Ver logs en tiempo real
cd worker
npx wrangler tail --env production

# Ver métricas en dashboard
# https://dash.cloudflare.com → Workers → acachile-api-production
```

---

## 🔐 Configuración de Seguridad

### **Cloudflare Account** (CRÍTICO)
- **Account ID**: `172194a6569df504cbb8a638a94d3d2c`
- **Email**: `juecart@gmail.com` 
- **IMPORTANTE**: SIEMPRE usar esta cuenta para deployments

### **Secrets Management**
```bash
# Ver secrets configuradas
npx wrangler secret list --env production

# Actualizar secret
npx wrangler secret put NOMBRE_SECRET --env production
```

### **CORS y Security Headers**
```javascript
// Configurado en worker/src/index.ts
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS', 
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};
```

---

## 📚 Documentación Adicional

### **Archivos de Documentación**
- `DNS_SIMPLIFICADO_RESEND.md` - Configuración DNS para emails
- `REGISTROS_DNS_CLOUDFLARE.md` - Registros DNS exactos
- `RESEND_SETUP.md` - Setup completo de Resend  
- `CLOUDFLARE_CONFIG.md` - Configuraciones Cloudflare
- `verify-dns.sh` - Script verificación automática

### **Scripts Útiles**
```bash
# Verificar DNS
./verify-dns.sh

# Build completo  
npm run build

# Deploy completo
cd worker && npx wrangler deploy --env production
```

---

## 🐛 Troubleshooting

### **Problemas Comunes**

#### **1. Emails no llegan**
```bash
# Verificar DNS
./verify-dns.sh

# Verificar dominio en Resend
# https://resend.com/dashboard/domains

# Revisar spam folder
```

#### **2. Error de autenticación**  
```bash
# Verificar usuarios en KV
curl -X POST "API_URL/api/admin/migrate-users"

# Verificar credentials
# Email: jcartagenac@gmail.com
# Password: supersecret123
```

#### **3. Worker deployment errors**
```bash
# Verificar account ID
npx wrangler whoami

# Usar account correcto
# Account ID: 172194a6569df504cbb8a638a94d3d2c
```

#### **4. CORS errors**
```javascript
// Ya configurado en worker/src/index.ts
// Si persiste, verificar frontend URL en CORS_ORIGIN
```

### **Enlaces de Debugging**
- **Cloudflare Dashboard**: https://dash.cloudflare.com
- **Resend Dashboard**: https://resend.com/dashboard  
- **GitHub Repo**: https://github.com/Jcartagenac/acachile
- **Frontend Live**: https://acachile.pages.dev
- **API Live**: https://acachile-api-production.juecart.workers.dev

---

## 🔄 Migración Futura a acachile.com

### **Cuando tengas control del dominio acachile.com:**

#### **1. Actualizar configuración de email**
```toml
# En worker/wrangler.toml
FROM_EMAIL = "noreply@acachile.com"  # o mail.acachile.com
FRONTEND_URL = "https://acachile.com"
```

#### **2. Configurar DNS para acachile.com**
```bash
# Repetir configuración DNS para nuevo dominio
# Usar misma configuración que juancartagena.cl
```

#### **3. Desplegar cambios**  
```bash
cd worker
npx wrangler deploy --env production

cd frontend
# Actualizar .env y rebuild
```

---

## 👨‍💻 Para Desarrolladores (AI/Humanos)

### **Contexto Importante**
1. **Sistema 100% funcional** - No es un prototipo, está en producción
2. **Email system working** - DNS configurado y emails enviándose  
3. **Cloudflare-first** - Toda la infraestructura está en Cloudflare
4. **TypeScript everywhere** - Frontend y Worker usan TypeScript
5. **Security-focused** - JWT, bcrypt, secrets management implementado

### **Patrón de Desarrollo Usado**
```javascript
// Patrón consistente para endpoints API
export async function handleEndpoint(request: Request, env: Env): Promise<Response> {
  try {
    // 1. Validar método HTTP
    // 2. Parsear y validar body
    // 3. Lógica de negocio  
    // 4. Respuesta estandarizada
    return new Response(JSON.stringify({
      success: true,
      data: result
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false, 
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}
```

### **Próximas Tareas Sugeridas**
1. **Panel Admin** - Implementar gestión de registros pendientes
2. **Eventos CRUD** - Sistema completo de gestión de eventos
3. **File Upload** - Sistema de imágenes para eventos/usuarios
4. **Push Notifications** - Notificaciones en tiempo real  
5. **Analytics** - Métricas de uso y engagement
6. **PWA** - Convertir en Progressive Web App

### **Herramientas de Desarrollo Recomendadas**
- **VS Code** con extensiones TypeScript, Tailwind CSS
- **Wrangler CLI** para desarrollo local de Workers
- **Resend Dashboard** para monitoring de emails
- **Cloudflare Dashboard** para métricas y logs

---

## 📞 Contacto y Soporte

### **Información del Proyecto**
- **Repositorio**: https://github.com/Jcartagenac/acachile
- **Owner**: Juan Cartagena (`jcartagenac@gmail.com`)  
- **Cloudflare Account**: `juecart@gmail.com`
- **Dominio Email**: `mail.juancartagena.cl`

### **Estado del Deployment**  
- ✅ **API**: Producción estable
- ✅ **Frontend**: Producción estable  
- ✅ **Emails**: Funcionando al 100%
- ✅ **DNS**: Configurado y verificado
- ✅ **Documentación**: Completa y actualizada

---

**📝 Última actualización**: 14 de octubre de 2025  
**🔄 Versión**: 1.0.0 (Sistema completo funcional)  
**⚡ Status**: Producción - Sistema estable y operativo