-- Actualización de tarifas de envío Blue Express PYME
-- Fecha: 16 de diciembre de 2025
-- Tamaño: S (hasta 3kg)
-- Origen: Región Metropolitana (Santiago)
-- Destino: Domicilio
-- Valores: Incluyen IVA

-- Zona Metropolitana (tarifa más baja)
UPDATE shop_shipping_rates SET rate = 4200, estimated_days = '1-2' WHERE region_code = 'RM';

-- Zona Centro-Sur (tarifa media)
UPDATE shop_shipping_rates SET rate = 5600, estimated_days = '1-2' WHERE region_code = 'V';
UPDATE shop_shipping_rates SET rate = 5600, estimated_days = '2-4' WHERE region_code = 'IV';
UPDATE shop_shipping_rates SET rate = 5600, estimated_days = '2-4' WHERE region_code = 'VI';
UPDATE shop_shipping_rates SET rate = 5600, estimated_days = '2-4' WHERE region_code = 'VII';
UPDATE shop_shipping_rates SET rate = 5600, estimated_days = '3-5' WHERE region_code = 'III';
UPDATE shop_shipping_rates SET rate = 5600, estimated_days = '3-5' WHERE region_code = 'XVI';
UPDATE shop_shipping_rates SET rate = 5600, estimated_days = '3-5' WHERE region_code = 'VIII';
UPDATE shop_shipping_rates SET rate = 5600, estimated_days = '3-5' WHERE region_code = 'IX';
UPDATE shop_shipping_rates SET rate = 5600, estimated_days = '4-6' WHERE region_code = 'XIV';
UPDATE shop_shipping_rates SET rate = 5600, estimated_days = '4-6' WHERE region_code = 'X';

-- Zona Extremos Norte y Sur (tarifa más alta)
UPDATE shop_shipping_rates SET rate = 9500, estimated_days = '5-7' WHERE region_code = 'XV';
UPDATE shop_shipping_rates SET rate = 9500, estimated_days = '5-7' WHERE region_code = 'I';
UPDATE shop_shipping_rates SET rate = 9500, estimated_days = '5-7' WHERE region_code = 'II';
UPDATE shop_shipping_rates SET rate = 9500, estimated_days = '6-9' WHERE region_code = 'XI';
UPDATE shop_shipping_rates SET rate = 9500, estimated_days = '6-9' WHERE region_code = 'XII';

-- Verificar actualización
SELECT 
  region_code,
  region_name,
  rate,
  estimated_days,
  CASE 
    WHEN rate = 4200 THEN 'RM (Metropolitana)'
    WHEN rate = 5600 THEN 'Centro-Sur'
    WHEN rate = 9500 THEN 'Extremos (Norte/Sur)'
    ELSE 'VERIFICAR'
  END as zona_tarifa
FROM shop_shipping_rates 
ORDER BY rate, region_name;
