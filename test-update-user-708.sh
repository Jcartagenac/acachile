#!/bin/bash

# Script para actualizar usuario 708 con datos de prueba
# Para demostrar que los campos se muestran correctamente

echo "Este script requiere que estés autenticado en el panel admin"
echo ""
echo "Para probar manualmente, ve a:"
echo "https://acachile.com/panel-admin/users/708/edituser"
echo ""
echo "Y agrega:"
echo "  - Fecha de Nacimiento: 1990-01-15 (o cualquier fecha)"
echo "  - Red Social: https://instagram.com/tu_usuario"
echo ""
echo "O usa el CSV import con estos datos:"
cat << 'EOF'

Ejemplo de CSV para importar:
--------------------------------
rut,nombre,apellido,email,fecha_nacimiento,red_social,comuna,region
[RUT-DEL-USUARIO-708],Diego,Alberto Arevalo Arevalo,email@example.com,1990-01-15,https://instagram.com/ejemplo,Puente Alto,Región Metropolitana

Reemplaza [RUT-DEL-USUARIO-708] con el RUT real del usuario.

EOF
