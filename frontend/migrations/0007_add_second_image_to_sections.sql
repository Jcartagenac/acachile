-- Agregar segunda imagen opcional a secciones del sitio
-- Fecha: 2025-11-10

ALTER TABLE site_sections 
ADD COLUMN image_url_2 TEXT;
