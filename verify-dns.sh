#!/bin/bash

# Script de Verificación DNS para Email Configuration
# juancartagena.cl - ACA Chile

echo "🔍 VERIFICANDO CONFIGURACIÓN DNS PARA EMAILS"
echo "============================================="
echo ""

DOMAIN="mail.juancartagena.cl"

echo "🌐 Dominio: $DOMAIN"
echo ""

# Verificar registro MX
echo "📧 Verificando registro MX..."
dig +short MX $DOMAIN
echo ""

# Verificar registro SPF
echo "🛡️ Verificando registro SPF..."
dig +short TXT $DOMAIN | grep "v=spf1"
echo ""

# Los registros DKIM CNAME ya no son necesarios con la nueva configuración de Resend
echo "✅ Configuración DNS simplificada - Solo MX, SPF y DMARC requeridos"
echo ""

# Verificar registro DMARC
echo "🚨 Verificando registro DMARC..."
dig +short TXT _dmarc.$DOMAIN | grep "v=DMARC1"
echo ""

echo "✅ VERIFICACIÓN COMPLETA"
echo ""
echo "📋 CHECKLIST SIMPLIFICADO:"
echo "- [ ] Registro MX configurado"
echo "- [ ] Registro SPF configurado (v=spf1)"  
echo "- [ ] Registro DMARC configurado (v=DMARC1)"
echo ""
echo "✅ No se requieren registros DKIM CNAME con la nueva configuración de Resend"
echo ""
echo "🔗 Próximo paso: Verificar en Resend Dashboard"
echo "   https://resend.com/dashboard/domains"