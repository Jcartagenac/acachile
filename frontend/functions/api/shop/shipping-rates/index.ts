// API endpoint for shipping rates
// GET /api/shop/shipping-rates - Get all shipping rates
// Uses Blue Express PYME tariff for Size S packages from Santiago

import type { PagesFunction, Env } from '../../../types';

/**
 * Tarifario Blue Express PYME - Tamaño S (hasta 3kg)
 * Origen: Región Metropolitana (Santiago)
 * Destino: Domicilio
 * Valores incluyen IVA
 */
const SHIPPING_RATES = [
  { region_code: 'XV', region_name: 'Arica y Parinacota', rate: 9500, estimated_days: '5-7' },
  { region_code: 'I', region_name: 'Tarapacá', rate: 9500, estimated_days: '5-7' },
  { region_code: 'II', region_name: 'Antofagasta', rate: 9500, estimated_days: '5-7' },
  { region_code: 'III', region_name: 'Atacama', rate: 5600, estimated_days: '3-5' },
  { region_code: 'IV', region_name: 'Coquimbo', rate: 5600, estimated_days: '2-4' },
  { region_code: 'V', region_name: 'Valparaíso', rate: 5600, estimated_days: '1-2' },
  { region_code: 'RM', region_name: 'Metropolitana de Santiago', rate: 4200, estimated_days: '1-2' },
  { region_code: 'VI', region_name: "O'Higgins", rate: 5600, estimated_days: '2-4' },
  { region_code: 'VII', region_name: 'Maule', rate: 5600, estimated_days: '2-4' },
  { region_code: 'XVI', region_name: 'Ñuble', rate: 5600, estimated_days: '3-5' },
  { region_code: 'VIII', region_name: 'Biobío', rate: 5600, estimated_days: '3-5' },
  { region_code: 'IX', region_name: 'La Araucanía', rate: 5600, estimated_days: '3-5' },
  { region_code: 'XIV', region_name: 'Los Ríos', rate: 5600, estimated_days: '4-6' },
  { region_code: 'X', region_name: 'Los Lagos', rate: 5600, estimated_days: '4-6' },
  { region_code: 'XI', region_name: 'Aysén', rate: 9500, estimated_days: '6-9' },
  { region_code: 'XII', region_name: 'Magallanes y Antártica Chilena', rate: 9500, estimated_days: '6-9' }
];

export const onRequestGet: PagesFunction<Env> = async () => {
  try {
    // Retornar tarifario desde constante (única fuente de verdad)
    // No dependemos de la base de datos para evitar inconsistencias
    return Response.json(SHIPPING_RATES);
  } catch (error) {
    console.error('Error fetching shipping rates:', error);
    return Response.json(
      { error: 'Failed to fetch shipping rates' },
      { status: 500 }
    );
  }
};
