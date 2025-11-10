-- Actualizar información de contacto con enlaces de Instagram y Facebook
-- Fecha: 2025-11-10

UPDATE site_sections 
SET content = 'Instagram: https://www.instagram.com/aca.chile
Facebook: https://web.facebook.com/aca.chile
Email: contacto@acachile.com
Teléfono: +56 9 1234 5678'
WHERE page = 'contact' AND key = 'contact-info';
