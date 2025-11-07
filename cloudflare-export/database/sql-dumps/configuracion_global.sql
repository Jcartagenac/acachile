-- ============================================================
-- Datos para tabla: configuracion_global
-- Registros: 4
-- Generado: 2025-11-04T00:28:28.212Z
-- ============================================================

INSERT INTO configuracion_global ("id", "clave", "valor", "descripcion", "tipo", "created_at", "updated_at") VALUES (1, 'cuota_default', '6500', 'Valor de cuota mensual por defecto (CLP)', 'number', '2025-10-16 00:59:28', '2025-10-16 00:59:28');
INSERT INTO configuracion_global ("id", "clave", "valor", "descripcion", "tipo", "created_at", "updated_at") VALUES (2, 'año_inicio_cuotas', '2025', 'Año de inicio del sistema de cuotas', 'number', '2025-10-16 00:59:28', '2025-10-16 00:59:28');
INSERT INTO configuracion_global ("id", "clave", "valor", "descripcion", "tipo", "created_at", "updated_at") VALUES (3, 'moneda', 'CLP', 'Moneda utilizada en el sistema', 'string', '2025-10-16 00:59:28', '2025-10-16 00:59:28');
INSERT INTO configuracion_global ("id", "clave", "valor", "descripcion", "tipo", "created_at", "updated_at") VALUES (4, 'metodos_pago', '["transferencia", "efectivo", "tarjeta"]', 'Métodos de pago aceptados', 'json', '2025-10-16 00:59:29', '2025-10-16 00:59:29');

-- ✓ 4 registros insertados en configuracion_global