#!/bin/bash

# Script para copiar datos desde el export JSON
echo "=================================================="
echo "INSERTANDO EVENTOS DESDE JSON"
echo "=================================================="

# Generar SQL desde el JSON de eventos
node -e "
const fs = require('fs');

try {
    const eventosJSON = fs.readFileSync('cloudflare-export/database/json-data/eventos.json', 'utf-8');
    const eventos = JSON.parse(eventosJSON).results || [];

    if (eventos.length === 0) {
        console.log('No hay eventos para importar');
        process.exit(0);
    }

    console.log(\`Generando SQL para \${eventos.length} eventos...\`);

    const escapeSingleQuote = (str) => str ? str.replace(/'/g, \"''\") : '';
    
    const sqlStatements = eventos.map(evento => {
        const title = escapeSingleQuote(evento.title || '');
        const description = escapeSingleQuote(evento.description || '');
        const date = evento.date || '';
        const time = evento.time || '';
        const location = escapeSingleQuote(evento.location || '');
        const image = evento.image ? escapeSingleQuote(evento.image) : 'NULL';
        const type = evento.type || 'encuentro';
        const status = evento.status || 'draft';
        const registration_open = evento.registration_open ? 1 : 0;
        const max_participants = evento.max_participants || 'NULL';
        const price = evento.price || 0;
        const organizer_id = evento.organizer_id || 1;
        const created_at = evento.created_at || 'CURRENT_TIMESTAMP';
        const updated_at = evento.updated_at || 'CURRENT_TIMESTAMP';
        const end_date = evento.end_date ? \"'\" + evento.end_date + \"'\" : 'NULL';

        return \`INSERT INTO eventos (title, description, date, time, location, image, type, status, registration_open, max_participants, price, organizer_id, created_at, updated_at, end_date)
VALUES ('\${title}', '\${description}', '\${date}', '\${time}', '\${location}', \${image === 'NULL' ? 'NULL' : \"'\" + image + \"'\"}, '\${type}', '\${status}', \${registration_open}, \${max_participants}, \${price}, \${organizer_id}, '\${created_at}', '\${updated_at}', \${end_date});\`;
    });

    const sqlContent = sqlStatements.join('\\n\\n');
    fs.writeFileSync('cloudflare-export/database/sql-dumps/eventos-fixed.sql', sqlContent);
    console.log('✅ SQL generado en eventos-fixed.sql');
    
} catch(err) {
    console.error('Error:', err.message);
    process.exit(1);
}
" && echo "✅ Script de eventos generado"

# Importar los eventos
if [ -f "cloudflare-export/database/sql-dumps/eventos-fixed.sql" ]; then
    echo ""
    echo "📦 Importando eventos..."
    wrangler d1 execute acachile-db --remote --file=cloudflare-export/database/sql-dumps/eventos-fixed.sql
    echo "✅ Eventos importados"
else
    echo "⚠️  No se generó el archivo eventos-fixed.sql"
fi

# Verificar
echo ""
echo "📊 Verificando eventos..."
wrangler d1 execute acachile-db --remote --command="SELECT COUNT(*) as total FROM eventos"
