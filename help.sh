#!/bin/bash

# Script de acceso rápido a la documentación de migración

cat << 'EOF'

╔════════════════════════════════════════════════════════════╗
║     DOCUMENTACIÓN DE MIGRACIÓN - ACCESO RÁPIDO            ║
╚════════════════════════════════════════════════════════════╝

Selecciona qué quieres consultar:

  [1] 📋 Resumen Completo (MIGRATION_SUMMARY.md)
      └─ Todo lo que necesitas saber sobre el sistema

  [2] 🚀 Inicio Rápido (MIGRATION_README.md)
      └─ Guía de inicio rápido y checklist

  [3] 📚 Guía Completa (MIGRATION_GUIDE.md)
      └─ Documentación detallada paso a paso

  [4] 🎯 Índice de Scripts (migration-index.sh)
      └─ Lista de todos los scripts disponibles

  [5] ✅ Ver todos los archivos de migración
      └─ Lista completa de scripts y documentos

  [Q] Salir

EOF

read -p "Opción: " choice

case $choice in
    1)
        if command -v less &> /dev/null; then
            less MIGRATION_SUMMARY.md
        else
            cat MIGRATION_SUMMARY.md
        fi
        ;;
    2)
        if command -v less &> /dev/null; then
            less MIGRATION_README.md
        else
            cat MIGRATION_README.md
        fi
        ;;
    3)
        if command -v less &> /dev/null; then
            less MIGRATION_GUIDE.md
        else
            cat MIGRATION_GUIDE.md
        fi
        ;;
    4)
        ./migration-index.sh
        ;;
    5)
        echo ""
        echo "═══════════════════════════════════════════════════════════"
        echo "  SCRIPTS DE MIGRACIÓN"
        echo "═══════════════════════════════════════════════════════════"
        ls -lh migration*.sh export-database-complete.sh setup-rclone.sh generate-migration-report.sh 2>/dev/null
        echo ""
        echo "═══════════════════════════════════════════════════════════"
        echo "  DOCUMENTACIÓN"
        echo "═══════════════════════════════════════════════════════════"
        ls -lh MIGRATION*.md 2>/dev/null
        echo ""
        ;;
    Q|q)
        echo "Saliendo..."
        exit 0
        ;;
    *)
        echo "Opción inválida"
        ;;
esac
