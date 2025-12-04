-- Migración para corregir RUTs con sufijos _dup_XXX
-- Estos RUTs se crearon durante alguna importación y necesitan ser limpiados

-- 1. Identificar y reportar usuarios con RUTs duplicados
-- SELECT id, nombre, apellido, rut, email 
-- FROM usuarios 
-- WHERE rut LIKE '%_dup_%'
-- ORDER BY rut;

-- 2. Limpiar RUTs removiendo el sufijo _dup_XXX
-- CUIDADO: Esto puede crear conflictos si el RUT limpio ya existe

-- Actualizar RUTs con sufijo _dup_
UPDATE usuarios 
SET rut = SUBSTR(rut, 1, INSTR(rut, '_dup_') - 1)
WHERE rut LIKE '%_dup_%'
AND INSTR(rut, '_dup_') > 0;

-- 3. Verificar que no haya RUTs duplicados después de la limpieza
-- Si hay duplicados, necesitaremos una estrategia manual
-- SELECT rut, COUNT(*) as count
-- FROM usuarios
-- WHERE activo = 1
-- GROUP BY rut
-- HAVING count > 1;
