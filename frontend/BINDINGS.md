# 📋 Configuración de Bindings para Functions Tab

## 🎯 Objetivo
Hacer que las bindings aparezcan en la pestaña "Functions" del dashboard de Cloudflare Pages.

## 📊 Estado Actual
- ✅ **Bindings funcionando**: Configuradas via `wrangler.toml`
- ✅ **API operativa**: Todas las funciones trabajando correctamente
- ❌ **Visible en Functions tab**: Requiere configuración manual

## 🔧 Configuración Manual Requerida

### 1. Acceder al Dashboard
```
https://dash.cloudflare.com/172194a6569df504cbb8a638a94d3d2c/pages/view/acachile-frontend
```

### 2. Ir a Functions Tab
- Click en la pestaña **"Functions"**
- Click en **"Manage bindings"** (o "Add binding" si está vacío)

### 3. Configurar D1 Database
```
• Type: D1 database
• Variable name: DB
• D1 database: acachile-db
• Database ID: 086f0530-48b6-41db-95ab-77bce733f0df
```

### 4. Configurar KV Namespace  
```
• Type: KV namespace
• Variable name: ACA_KV
• KV namespace ID: 60fff9f10819406cad241e326950f056
```

### 5. Variables de Entorno (Opcional)
```
• ENVIRONMENT: production
• CORS_ORIGIN: https://acachile-frontend.pages.dev
• FROM_EMAIL: noreply@mail.juancartagena.cl
• ADMIN_EMAIL: admin@acachile.cl
• FRONTEND_URL: https://acachile-frontend.pages.dev
```

### 6. Guardar
- Click **"Save"**
- Esperar confirmación

## ✅ Verificación

### Estado de Bindings:
```bash
curl https://acachile-frontend.pages.dev/api/bindings
```

### Health Check:
```bash
curl https://acachile-frontend.pages.dev/api/health
```

### Resultado Esperado:
```json
{
  "bindings": {
    "DB": true,
    "ACA_KV": true,
    "JWT_SECRET": true,
    "RESEND_API_KEY": true
  },
  "tests": {
    "database": { "connected": true, "tables": ["users", "events", "inscriptions", ...] },
    "kv": { "connected": true, "canWrite": true }
  }
}
```

## 🚀 Scripts de Ayuda

### Ejecutar configurador:
```bash
npm run setup-bindings
```

### Ver estado actual:
```bash
npm run check-bindings
```

## 📝 Notas Importantes

1. **Prioridad**: Las bindings del dashboard tienen prioridad sobre `wrangler.toml`
2. **Compatibilidad**: Ambas configuraciones pueden coexistir
3. **Visibilidad**: Solo las bindings del dashboard aparecen en Functions tab
4. **Funcionalidad**: Las bindings ya funcionan correctamente via código

## 🔍 Troubleshooting

### Si las bindings no aparecen:
1. Verificar que se guardaron correctamente
2. Refrescar la página del dashboard
3. Hacer un nuevo deployment para sincronizar
4. Verificar permisos de la cuenta

### Si hay conflictos:
1. Las bindings del dashboard prevalecen
2. Comentar las del `wrangler.toml` si es necesario
3. Mantener solo una configuración activa por clarity

## ✅ Estado Final Esperado

Después de la configuración manual:
- ✅ Bindings visibles en Functions tab
- ✅ API funcionando correctamente  
- ✅ Dashboard mostrando configuración actual
- ✅ Deployments automáticos manteniendo configuración