#!/bin/bash

# ============================================================
# GENERADOR DE REPORTE DE MIGRACIÓN
# ============================================================
# Genera un reporte detallado del estado de la migración
# ============================================================

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_section() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠ $1${NC}"; }
print_info() { echo -e "${BLUE}  $1${NC}"; }

REPORT_FILE="migration-report-$(date +%Y%m%d-%H%M%S).txt"

# Iniciar reporte
{
    echo "╔════════════════════════════════════════════════════════════╗"
    echo "║         REPORTE DE MIGRACIÓN - ACA CHILE                  ║"
    echo "║              Cloudflare Account Transfer                   ║"
    echo "╚════════════════════════════════════════════════════════════╝"
    echo ""
    echo "Fecha: $(date '+%Y-%m-%d %H:%M:%S')"
    echo "Usuario: $(whoami)"
    echo ""
    
    print_section "1. INFORMACIÓN DE CUENTA"
    echo ""
    wrangler whoami 2>&1 || echo "Error: No autenticado"
    
    echo ""
    print_section "2. RECURSOS D1 DATABASE"
    echo ""
    
    # Listar databases
    echo "Databases disponibles:"
    wrangler d1 list 2>&1 || echo "Error al listar databases"
    
    # Si existe acachile-db, obtener info
    if wrangler d1 list 2>&1 | grep -q "acachile-db"; then
        echo ""
        echo "✓ Database 'acachile-db' encontrada"
        
        # Contar tablas
        echo ""
        echo "Tablas en acachile-db:"
        wrangler d1 execute acachile-db --remote \
            --command="SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' ORDER BY name" \
            2>&1 || echo "Error al consultar tablas"
        
        # Contar registros por tabla
        echo ""
        echo "Cantidad de registros por tabla:"
        local tables=("usuarios" "socios" "noticias" "comunicados" "eventos" "evento_inscripciones")
        for table in "${tables[@]}"; do
            count=$(wrangler d1 execute acachile-db --remote \
                --command="SELECT COUNT(*) as count FROM $table" \
                --json 2>/dev/null | jq -r '.[0].results[0].count' 2>/dev/null || echo "0")
            printf "  %-25s: %s registros\n" "$table" "$count"
        done
    else
        echo "✗ Database 'acachile-db' NO encontrada"
    fi
    
    echo ""
    print_section "3. RECURSOS R2 BUCKET"
    echo ""
    
    # Listar buckets
    echo "Buckets disponibles:"
    wrangler r2 bucket list 2>&1 || echo "Error al listar buckets"
    
    # Si existe aca-chile-images, obtener info
    if wrangler r2 bucket list 2>&1 | grep -q "aca-chile-images"; then
        echo ""
        echo "✓ Bucket 'aca-chile-images' encontrado"
        
        # Contar objetos
        echo ""
        echo "Estadísticas del bucket:"
        object_count=$(wrangler r2 object list aca-chile-images 2>/dev/null | wc -l || echo "0")
        echo "  Total objetos: $object_count"
        
        # Listar prefijos (carpetas)
        echo ""
        echo "Carpetas principales:"
        wrangler r2 object list aca-chile-images --prefix="" 2>/dev/null | \
            grep -o '^[^/]*/' | sort -u | head -10 || echo "  (no disponible)"
    else
        echo "✗ Bucket 'aca-chile-images' NO encontrado"
    fi
    
    echo ""
    print_section "4. RECURSOS KV NAMESPACE"
    echo ""
    
    # Listar namespaces
    echo "KV Namespaces disponibles:"
    wrangler kv namespace list 2>&1 || echo "Error al listar namespaces"
    
    # Buscar ACA_KV
    if wrangler kv namespace list 2>&1 | grep -q "ACA_KV"; then
        echo ""
        echo "✓ Namespace 'ACA_KV' encontrado"
        
        # Obtener ID
        kv_id=$(wrangler kv namespace list 2>&1 | grep "ACA_KV" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
        if [ -n "$kv_id" ]; then
            echo "  ID: $kv_id"
            
            # Contar keys
            key_count=$(wrangler kv key list --namespace-id="$kv_id" 2>/dev/null | wc -l || echo "0")
            echo "  Keys almacenadas: $key_count"
        fi
    else
        echo "✗ Namespace 'ACA_KV' NO encontrado"
    fi
    
    echo ""
    print_section "5. CLOUDFLARE PAGES"
    echo ""
    
    # Listar proyectos
    echo "Proyectos Pages:"
    wrangler pages project list 2>&1 || echo "Error al listar proyectos"
    
    # Si existe acachile, obtener info
    if wrangler pages project list 2>&1 | grep -q "acachile"; then
        echo ""
        echo "✓ Proyecto 'acachile' encontrado"
        
        # Listar deployments recientes
        echo ""
        echo "Deployments recientes:"
        wrangler pages deployment list --project-name=acachile 2>&1 | head -20 || echo "  (no disponible)"
    else
        echo "✗ Proyecto 'acachile' NO encontrado"
    fi
    
    echo ""
    print_section "6. VERIFICACIÓN DE APLICACIÓN"
    echo ""
    
    PROJECT_URL="https://beta.acachile.com"
    
    # Health check
    echo "Health Check:"
    if command -v curl &> /dev/null; then
        response=$(curl -s "$PROJECT_URL/api/health" 2>&1 || echo "Error")
        
        if echo "$response" | grep -q "healthy"; then
            echo "✓ API Health: OK"
            echo ""
            echo "Respuesta:"
            echo "$response" | jq . 2>/dev/null || echo "$response"
        else
            echo "✗ API Health: FALLO"
            echo "Respuesta: $response"
        fi
    else
        echo "⚠ curl no disponible - verifica manualmente: $PROJECT_URL/api/health"
    fi
    
    echo ""
    print_section "7. CONFIGURACIÓN"
    echo ""
    
    # Verificar wrangler.toml
    if [ -f "frontend/wrangler.toml" ]; then
        echo "✓ wrangler.toml encontrado"
        echo ""
        echo "Configuración actual:"
        cat frontend/wrangler.toml | grep -E "(name|database_id|bucket_name|binding)" | head -20
    else
        echo "✗ wrangler.toml NO encontrado"
    fi
    
    echo ""
    print_section "8. ARCHIVOS DE EXPORTACIÓN"
    echo ""
    
    if [ -d "cloudflare-export" ]; then
        echo "✓ Directorio cloudflare-export encontrado"
        echo ""
        echo "Contenido:"
        ls -lh cloudflare-export/ 2>/dev/null || echo "  (vacío)"
        
        # Estadísticas de exportación
        if [ -f "cloudflare-export/migration-config.json" ]; then
            echo ""
            echo "Configuración de migración:"
            cat cloudflare-export/migration-config.json | jq . 2>/dev/null || cat cloudflare-export/migration-config.json
        fi
    else
        echo "✗ Directorio cloudflare-export NO encontrado"
        echo "  Ejecuta: ./migration-installer.sh"
    fi
    
    echo ""
    print_section "9. CHECKLIST DE MIGRACIÓN"
    echo ""
    
    # Verificar cada componente
    declare -A checklist
    
    # D1 Database
    if wrangler d1 list 2>&1 | grep -q "acachile-db"; then
        checklist["D1 Database"]="✓"
    else
        checklist["D1 Database"]="✗"
    fi
    
    # R2 Bucket
    if wrangler r2 bucket list 2>&1 | grep -q "aca-chile-images"; then
        checklist["R2 Bucket"]="✓"
    else
        checklist["R2 Bucket"]="✗"
    fi
    
    # KV Namespace
    if wrangler kv namespace list 2>&1 | grep -q "ACA_KV"; then
        checklist["KV Namespace"]="✓"
    else
        checklist["KV Namespace"]="✗"
    fi
    
    # Pages Project
    if wrangler pages project list 2>&1 | grep -q "acachile"; then
        checklist["Pages Project"]="✓"
    else
        checklist["Pages Project"]="✗"
    fi
    
    # wrangler.toml
    if [ -f "frontend/wrangler.toml" ]; then
        checklist["Configuración"]="✓"
    else
        checklist["Configuración"]="✗"
    fi
    
    # Health Check
    if command -v curl &> /dev/null; then
        if curl -s "$PROJECT_URL/api/health" 2>&1 | grep -q "healthy"; then
            checklist["Health Check"]="✓"
        else
            checklist["Health Check"]="✗"
        fi
    else
        checklist["Health Check"]="?"
    fi
    
    # Imprimir checklist
    for item in "${!checklist[@]}"; do
        status="${checklist[$item]}"
        printf "  [%s] %s\n" "$status" "$item"
    done
    
    echo ""
    print_section "10. RESUMEN"
    echo ""
    
    # Contar éxitos
    success_count=$(echo "${checklist[@]}" | grep -o "✓" | wc -l)
    total_count=${#checklist[@]}
    
    echo "Componentes verificados: $success_count/$total_count"
    
    if [ "$success_count" -eq "$total_count" ]; then
        echo ""
        echo "╔════════════════════════════════════════════════════════════╗"
        echo "║   ✓ MIGRACIÓN COMPLETA Y VERIFICADA                       ║"
        echo "╚════════════════════════════════════════════════════════════╝"
    elif [ "$success_count" -gt 0 ]; then
        echo ""
        echo "╔════════════════════════════════════════════════════════════╗"
        echo "║   ⚠ MIGRACIÓN PARCIAL - REVISAR COMPONENTES FALTANTES     ║"
        echo "╚════════════════════════════════════════════════════════════╝"
    else
        echo ""
        echo "╔════════════════════════════════════════════════════════════╗"
        echo "║   ✗ MIGRACIÓN NO INICIADA - EJECUTAR SCRIPTS              ║"
        echo "╚════════════════════════════════════════════════════════════╝"
    fi
    
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Reporte generado: $(date '+%Y-%m-%d %H:%M:%S')"
    echo "Guardado en: $REPORT_FILE"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
} | tee "$REPORT_FILE"

echo ""
print_success "Reporte generado exitosamente"
print_info "Archivo: $REPORT_FILE"

# Ofrecer enviar a less
if command -v less &> /dev/null; then
    echo ""
    read -p "¿Deseas ver el reporte completo? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        less "$REPORT_FILE"
    fi
fi
