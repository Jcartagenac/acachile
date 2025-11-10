-- Actualizar email de contacto de info/contacto@acachile.com a hola@acachile.com
-- Fecha: 2025-11-10

UPDATE site_sections 
SET content = REPLACE(content, 'contacto@acachile.com', 'hola@acachile.com')
WHERE page = 'contact' AND key = 'contact-info';

UPDATE site_sections 
SET content = REPLACE(content, 'info@acachile.com', 'hola@acachile.com')
WHERE page = 'contact' AND key = 'contact-info';
