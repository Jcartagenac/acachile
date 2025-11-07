# 🚀 Sistema de Migración Cloudflare - ACA Chile

> Sistema completo para migrar tu proyecto entre cuentas de Cloudflare, incluyendo D1 Database, R2 Bucket, KV Namespace y Cloudflare Pages.

---

## ⚡ Inicio Ultra-Rápido

```bash
# Para comenzar inmediatamente:
./quick-migration.sh

# O ver ayuda:
./help.sh
```

---

## 📦 ¿Qué incluye este sistema?

Este paquete te permite **migrar completamente** tu proyecto ACA Chile a una nueva cuenta de Cloudflare con un solo comando, incluyendo:

- ✅ **D1 Database** - Estructura completa + todos los datos
- ✅ **R2 Bucket** - Todas las imágenes y archivos
- ✅ **KV Namespace** - Configuraciones y caché
- ✅ **Cloudflare Pages** - Proyecto y deployment
- ✅ **Variables y Secrets** - Configuración de entorno

---

## 🎯 Scripts Disponibles

### Principal (Empieza aquí) ⭐

```bash
./quick-migration.sh      # Menú interactivo - RECOMENDADO
./help.sh                 # Documentación rápida
./migration-index.sh      # Índice de todos los scripts
```

### Exportación

```bash
./migration-installer.sh        # Exportar todo desde cuenta actual
./export-database-complete.sh   # Backup detallado de database
```

### Utilidades

```bash
./setup-rclone.sh                # Configurar migración de imágenes
./generate-migration-report.sh  # Verificar estado de migración
```

---

## 📚 Documentación

| Archivo | Descripción |
|---------|-------------|
| `MIGRATION_SUMMARY.md` | **Resumen completo** - Lee esto primero |
| `MIGRATION_README.md` | Guía de inicio rápido |
| `MIGRATION_GUIDE.md` | Documentación detallada completa |

**Para leer:**
```bash
./help.sh    # Menú de documentación
# o
cat MIGRATION_SUMMARY.md
```

---

## 🚦 Proceso Simple en 3 Pasos

### 1️⃣ Exportar (Cuenta Actual)

```bash
./migration-installer.sh
```
⏱️ 5-10 minutos

### 2️⃣ Cambiar Cuenta

```bash
wrangler logout
wrangler login    # Usa la cuenta NUEVA
```
⏱️ 2 minutos

### 3️⃣ Instalar (Cuenta Nueva)

```bash
cd cloudflare-export
./install-in-new-account.sh
```
⏱️ 5-10 minutos

**¡Listo!** Los pasos adicionales (datos e imágenes) están en el menú interactivo.

---

## 🎨 Características

- 🎯 **Menú Interactivo** - Fácil de usar, sin comandos complejos
- 🔄 **Automatización Total** - Scripts que hacen todo por ti
- 🛡️ **Seguro** - Backups automáticos, sin pérdida de datos
- 📊 **Reportes Detallados** - Verifica cada paso
- 🎨 **Interfaz Colorida** - Mensajes claros y visuales
- ⚡ **Rápido** - Migración completa en ~1 hora

---

## ⚙️ Requisitos Previos

### Software

```bash
# Instalar si no los tienes:
npm install -g wrangler    # CLI de Cloudflare
brew install rclone        # Para migrar imágenes
brew install jq            # Para procesar JSON
```

### Información Necesaria

Antes de empezar, ten a mano:

- 🔑 `RESEND_API_KEY`
- 🔑 `GOOGLE_MAPS_API_KEY`
- 👤 Acceso a ambas cuentas Cloudflare
- 🪣 R2 API Tokens de ambas cuentas (crear en dashboard)

---

## 📊 Tiempo Total: ~1 hora

| Fase | Duración |
|------|----------|
| Exportación | 10 min |
| Cambio cuenta | 2 min |
| Instalación | 10 min |
| Migración datos | 20 min |
| Migración imágenes | 15 min |
| Deploy | 10 min |

---

## 🆘 Ayuda Rápida

```bash
# Ver ayuda interactiva
./help.sh

# Ver estado actual
wrangler whoami

# Ver recursos
wrangler d1 list
wrangler r2 bucket list
wrangler kv:namespace list

# Verificar instalación
./generate-migration-report.sh

# Health check
curl https://beta.acachile.com/api/health | jq .
```

---

## ✅ Checklist

Antes de empezar:
- [ ] Leí `MIGRATION_SUMMARY.md`
- [ ] Tengo las API keys guardadas
- [ ] Instalé Wrangler CLI
- [ ] Instalé Rclone
- [ ] Tengo acceso a ambas cuentas

Durante la migración:
- [ ] Ejecuté `./migration-installer.sh`
- [ ] Cambié a la cuenta nueva
- [ ] Ejecuté `./install-in-new-account.sh`
- [ ] Importé datos a D1
- [ ] Migré imágenes con Rclone
- [ ] Configuré secrets
- [ ] Desplegué la aplicación

Verificación:
- [ ] Ejecuté `./generate-migration-report.sh`
- [ ] Health check pasa ✅
- [ ] Todos los componentes funcionan

---

## 🎓 Para Aprender Más

**Documentación Completa:**
- 📋 [MIGRATION_SUMMARY.md](./MIGRATION_SUMMARY.md) - Empieza aquí
- 🚀 [MIGRATION_README.md](./MIGRATION_README.md) - Guía rápida
- 📚 [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) - Todo el detalle

**Recursos Cloudflare:**
- [Cloudflare D1 Docs](https://developers.cloudflare.com/d1/)
- [Cloudflare R2 Docs](https://developers.cloudflare.com/r2/)
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Wrangler CLI Docs](https://developers.cloudflare.com/workers/wrangler/)

---

## 💡 Consejos

1. **Guarda tus secrets** antes de cambiar de cuenta
2. **Usa el menú interactivo** (`./quick-migration.sh`) - es más fácil
3. **Lee los reportes** que genera cada script
4. **Verifica cada paso** antes de continuar
5. **Mantén un backup** de la configuración original

---

## 🎉 ¡Comienza Ya!

**Opción 1: Menú Interactivo (Recomendado)**
```bash
./quick-migration.sh
```

**Opción 2: Leer Primero**
```bash
./help.sh
```

**Opción 3: Ver Índice**
```bash
./migration-index.sh
```

---

## 📞 Estructura de Archivos

```
📦 Sistema de Migración
├── 🎯 quick-migration.sh           ⭐ EMPIEZA AQUÍ
├── 📖 help.sh                       Acceso a documentación
├── 📋 migration-index.sh            Índice de scripts
│
├── 📦 migration-installer.sh        Exportar todo
├── 💾 export-database-complete.sh   Backup DB detallado
├── 🔧 setup-rclone.sh               Configurar R2
├── 📊 generate-migration-report.sh  Verificar estado
│
├── 📚 MIGRATION_SUMMARY.md          Resumen completo
├── 🚀 MIGRATION_README.md           Guía rápida
└── 📖 MIGRATION_GUIDE.md            Guía detallada
```

---

## 🌟 Características Destacadas

- ✨ **Migración completa en ~1 hora**
- 🎯 **Menú interactivo fácil de usar**
- 🔄 **Exportación e importación automatizada**
- 🛡️ **Backups automáticos incluidos**
- 📊 **Reportes detallados de verificación**
- 🎨 **Interfaz colorida y clara**
- 📚 **Documentación completa**
- ⚡ **Scripts optimizados y probados**

---

## ❓ FAQ

**¿Es seguro?**
Sí, todos los datos originales permanecen intactos. Solo se copian.

**¿Cuánto tarda?**
Entre 45 minutos y 1.5 horas, dependiendo del tamaño de tus datos.

**¿Necesito conocimientos técnicos?**
No, el menú interactivo te guía paso a paso.

**¿Puedo pausar la migración?**
Sí, puedes detener y continuar cuando quieras.

**¿Qué pasa si algo falla?**
Los scripts tienen manejo de errores. Puedes reintentar sin problemas.

---

## 🎯 Tu Próximo Paso

```bash
# Ejecuta esto ahora:
./quick-migration.sh

# Y sigue las instrucciones en pantalla 🚀
```

---

**¡Éxito con tu migración!** 🎉

---

*Sistema creado: Noviembre 2025*  
*Versión: 1.0*  
*Proyecto: ACA Chile*
