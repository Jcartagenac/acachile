#!/bin/bash

# ============================================================
# ÍNDICE DE SCRIPTS DE MIGRACIÓN
# ============================================================

cat << 'EOF'
╔════════════════════════════════════════════════════════════╗
║         SISTEMA DE MIGRACIÓN CLOUDFLARE                   ║
║              ACA Chile - Account Transfer                  ║
╚════════════════════════════════════════════════════════════╝

📦 SCRIPTS DISPONIBLES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

┌─ PRINCIPALES ─────────────────────────────────────────────┐
│                                                            │
│  🎯 quick-migration.sh                                     │
│     ► Menú interactivo completo                           │
│     ► Recomendado para comenzar                           │
│     ► Incluye todos los pasos de migración                │
│                                                            │
│  📦 migration-installer.sh                                 │
│     ► Exporta todo desde cuenta actual                    │
│     ► Genera estructura de archivos                       │
│     ► Crea scripts de instalación                         │
│                                                            │
│  💾 export-database-complete.sh                            │
│     ► Exportación detallada de D1 Database                │
│     ► Genera SQL dumps para importación                   │
│     ► Backup completo de datos                            │
│                                                            │
└────────────────────────────────────────────────────────────┘

┌─ UTILIDADES ──────────────────────────────────────────────┐
│                                                            │
│  🔧 setup-rclone.sh                                        │
│     ► Configuración asistida de Rclone                    │
│     ► Migración de imágenes R2                            │
│     ► Testing de conexiones                               │
│                                                            │
│  📊 generate-migration-report.sh                           │
│     ► Genera reporte de estado                            │
│     ► Verifica todos los componentes                      │
│     ► Checklist de migración                              │
│                                                            │
└────────────────────────────────────────────────────────────┘

┌─ DOCUMENTACIÓN ───────────────────────────────────────────┐
│                                                            │
│  📖 MIGRATION_README.md                                    │
│     ► Guía de inicio rápido                               │
│     ► Resumen de scripts                                  │
│     ► Checklist de migración                              │
│                                                            │
│  📚 MIGRATION_GUIDE.md                                     │
│     ► Guía completa detallada                             │
│     ► Troubleshooting                                     │
│     ► Comandos de referencia                              │
│                                                            │
└────────────────────────────────────────────────────────────┘

🚀 INICIO RÁPIDO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Para comenzar la migración:

  1️⃣  Ejecuta el menú interactivo:
      ./quick-migration.sh

  2️⃣  O sigue el proceso manual:
      ./migration-installer.sh        # Exportar
      wrangler logout && wrangler login   # Cambiar cuenta
      cd cloudflare-export && ./install-in-new-account.sh

  3️⃣  Configura Rclone para imágenes:
      ./setup-rclone.sh

  4️⃣  Genera reporte de verificación:
      ./generate-migration-report.sh

📋 ORDEN RECOMENDADO DE EJECUCIÓN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ┌─ FASE 1: PREPARACIÓN (Cuenta Actual)
  │
  ├─► 1. Verificar cuenta: wrangler whoami
  ├─► 2. Exportar: ./migration-installer.sh
  ├─► 3. Backup DB: ./export-database-complete.sh (opcional)
  └─► 4. Guardar API keys y secrets
  
  ┌─ FASE 2: CAMBIO DE CUENTA
  │
  ├─► 5. Logout: wrangler logout
  ├─► 6. Login nueva: wrangler login
  └─► 7. Verificar: wrangler whoami
  
  ┌─ FASE 3: INSTALACIÓN (Cuenta Nueva)
  │
  ├─► 8. Instalar: cd cloudflare-export && ./install-in-new-account.sh
  ├─► 9. Actualizar wrangler.toml
  └─► 10. Verificar recursos creados
  
  ┌─ FASE 4: MIGRACIÓN DE DATOS
  │
  ├─► 11. Importar datos D1
  ├─► 12. Configurar Rclone: ./setup-rclone.sh
  └─► 13. Migrar imágenes R2
  
  ┌─ FASE 5: DESPLIEGUE
  │
  ├─► 14. Configurar secrets
  ├─► 15. Build y deploy
  └─► 16. Verificar: ./generate-migration-report.sh

⚙️  REQUISITOS PREVIOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ✓ Node.js 18+
  ✓ npm o pnpm
  ✓ Wrangler CLI: npm install -g wrangler
  ✓ Rclone (para R2): brew install rclone
  ✓ jq (para JSON): brew install jq
  ✓ curl (normalmente incluido en macOS)

🔑 INFORMACIÓN NECESARIA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Antes de comenzar, ten a mano:

  • RESEND_API_KEY
  • GOOGLE_MAPS_API_KEY
  • Acceso a cuenta Cloudflare antigua (origen)
  • Acceso a cuenta Cloudflare nueva (destino)
  • R2 API Tokens de ambas cuentas (para Rclone)

📊 VERIFICAR INSTALACIÓN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Después de completar la migración:

  ./generate-migration-report.sh

  Esto generará un reporte completo con:
  • Estado de D1 Database
  • Estado de R2 Bucket
  • Estado de KV Namespace
  • Estado de Pages Project
  • Health check de la aplicación
  • Checklist de componentes

🆘 AYUDA Y SOPORTE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Ver documentación completa:
  • cat MIGRATION_README.md
  • less MIGRATION_GUIDE.md

  Verificar cuenta actual:
  • wrangler whoami

  Listar recursos:
  • wrangler d1 list
  • wrangler r2 bucket list
  • wrangler kv namespace list
  • wrangler pages project list

  Health check manual:
  • curl https://beta.acachile.com/api/health | jq .

✨ CARACTERÍSTICAS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ✓ Migración completa automatizada
  ✓ Exportación de estructura y datos
  ✓ Importación con SQL dumps
  ✓ Migración de imágenes R2 con Rclone
  ✓ Configuración asistida de recursos
  ✓ Verificación automática de componentes
  ✓ Generación de reportes detallados
  ✓ Menú interactivo fácil de usar
  ✓ Documentación completa incluida
  ✓ Rollback y backup incluidos

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 TIP: Ejecuta ./quick-migration.sh para comenzar

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EOF
