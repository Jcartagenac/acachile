#!/bin/bash

# Script Automático de Configuración DNS para Email
# Requiere Cloudflare CLI instalado y configurado

echo "🚀 CONFIGURACIÓN AUTOMÁTICA DNS - CLOUDFLARE"
echo "============================================"

# Variables
DOMAIN="juancartagena.cl"
SUBDOMAIN="mail.juancartagena.cl"
ZONE_ID="YOUR_ZONE_ID_HERE"  # Debes obtener esto de Cloudflare

# Verificar si CF CLI está instalado
if ! command -v cf &> /dev/null; then
    echo "❌ Cloudflare CLI no encontrado"
    echo "Instalar con: npm install -g @cloudflare/cli"
    exit 1
fi

echo "📧 Configurando registros DNS para $SUBDOMAIN..."

# Registro MX
echo "Configurando registro MX..."
cf dns record create $DOMAIN --type MX --name mail --content "feedback-smtp.us-east-1.amazonses.com" --priority 10

# Registro SPF
echo "Configurando registro SPF..."  
cf dns record create $DOMAIN --type TXT --name mail --content "v=spf1 include:_spf.resend.com ~all"

# Registros DKIM (estos valores son ejemplos - usar los reales de Resend)
echo "Configurando registros DKIM..."
cf dns record create $DOMAIN --type CNAME --name "rs1._domainkey.mail" --content "rs1.rsnd.net"
cf dns record create $DOMAIN --type CNAME --name "rs2._domainkey.mail" --content "rs2.rsnd.net"

# Registro DMARC
echo "Configurando registro DMARC..."
cf dns record create $DOMAIN --type TXT --name "_dmarc.mail" --content "v=DMARC1; p=quarantine; rua=mailto:dmarc@juancartagena.cl"

echo "✅ Configuración DNS completada!"
echo ""
echo "🔍 Verificar en:"
echo "https://dash.cloudflare.com/YOUR_ACCOUNT_ID/juancartagena.cl/dns"
echo ""
echo "⚠️ IMPORTANTE: Reemplazar valores con los exactos de Resend Dashboard"