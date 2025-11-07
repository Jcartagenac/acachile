-- ============================================================
-- Datos para tabla: roles_catalog
-- Registros: 4
-- Generado: 2025-11-04T00:28:28.226Z
-- ============================================================

INSERT INTO roles_catalog ("key", "label", "description", "priority", "created_at") VALUES ('usuario', 'Usuario / Socio', 'Acceso básico al portal de socios: puede revisar eventos, noticias y su propio perfil.', 100, '2025-10-22 03:01:29');
INSERT INTO roles_catalog ("key", "label", "description", "priority", "created_at") VALUES ('director_editor', 'Director Editor', 'Puede administrar contenidos públicos (eventos, noticias) y revisar postulaciones.', 80, '2025-10-22 03:01:29');
INSERT INTO roles_catalog ("key", "label", "description", "priority", "created_at") VALUES ('director', 'Director', 'Gestión avanzada de socios, cuotas y comunicaciones internas.', 60, '2025-10-22 03:01:29');
INSERT INTO roles_catalog ("key", "label", "description", "priority", "created_at") VALUES ('admin', 'Administrador', 'Acceso total al sistema, incluida la configuración general y seguridad.', 40, '2025-10-22 03:01:29');

-- ✓ 4 registros insertados en roles_catalog