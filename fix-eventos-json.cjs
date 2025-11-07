const fs = require('fs');

try {
    const eventosJSON = fs.readFileSync('cloudflare-export/database/json-data/eventos.json', 'utf-8');
    const eventosData = JSON.parse(eventosJSON);
    
    // Extraer todos los results
    const eventos = eventosData.flatMap(item => item.results || []);

    console.log(`Encontrados ${eventos.length} eventos`);

    if (eventos.length === 0) {
        console.log('No hay eventos para importar');
        process.exit(0);
    }

    const escapeSingleQuote = (str) => str ? String(str).replace(/'/g, "''") : '';
    
    const sqlStatements = eventos.map(evento => {
        const title = escapeSingleQuote(evento.title || '');
        const description = escapeSingleQuote(evento.description || '');
        const date = evento.date || '';
        const time = evento.time || '';
        const location = escapeSingleQuote(evento.location || '');
        // Saltar imágenes grandes (base64), solo rutas
        let imageValue = 'NULL';
        if (evento.image && evento.image.length < 500 && !evento.image.startsWith('data:')) {
            imageValue = "'" + escapeSingleQuote(evento.image) + "'";
        }
        const type = evento.type || 'encuentro';
        const status = evento.status || 'draft';
        const registration_open = evento.registration_open ? 1 : 0;
        const max_participants = evento.max_participants || 'NULL';
        const price = evento.price || 0;
        const organizer_id = evento.organizer_id || 1;
        const created_at = evento.created_at || 'CURRENT_TIMESTAMP';
        const updated_at = evento.updated_at || 'CURRENT_TIMESTAMP';

        return `INSERT INTO eventos (title, description, date, time, location, image, type, status, registration_open, max_participants, price, organizer_id, created_at, updated_at)
VALUES ('${title}', '${description}', '${date}', '${time}', '${location}', ${imageValue}, '${type}', '${status}', ${registration_open}, ${max_participants}, ${price}, ${organizer_id}, '${created_at}', '${updated_at}');`;
    });

    const sqlContent = sqlStatements.join('\n\n');
    fs.writeFileSync('cloudflare-export/database/sql-dumps/eventos-fixed.sql', sqlContent);
    console.log(`✅ SQL generado en eventos-fixed.sql (${sqlStatements.length} eventos)`);
    
} catch(err) {
    console.error('Error:', err.message);
    console.error(err.stack);
    process.exit(1);
}
