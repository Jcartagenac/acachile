/**
 * Tarifario Blue Express PYME - Tamaño S (hasta 3kg)
 * Origen: Región Metropolitana (Santiago)
 * Destino: Domicilio
 * Valores incluyen IVA
 */

export interface ShippingRateEntry {
  code: string;
  name: string;
  rate: number;
  estimatedDays: string;
}

// Tarifario oficial - única fuente de verdad
const SHIPPING_RATES_TABLE: Record<string, ShippingRateEntry> = {
  'XV': {
    code: 'XV',
    name: 'Arica y Parinacota',
    rate: 9500,
    estimatedDays: '5-7'
  },
  'I': {
    code: 'I',
    name: 'Tarapacá',
    rate: 9500,
    estimatedDays: '5-7'
  },
  'II': {
    code: 'II',
    name: 'Antofagasta',
    rate: 9500,
    estimatedDays: '5-7'
  },
  'III': {
    code: 'III',
    name: 'Atacama',
    rate: 5600,
    estimatedDays: '3-5'
  },
  'IV': {
    code: 'IV',
    name: 'Coquimbo',
    rate: 5600,
    estimatedDays: '2-4'
  },
  'V': {
    code: 'V',
    name: 'Valparaíso',
    rate: 5600,
    estimatedDays: '1-2'
  },
  'RM': {
    code: 'RM',
    name: 'Metropolitana de Santiago',
    rate: 4200,
    estimatedDays: '1-2'
  },
  'VI': {
    code: 'VI',
    name: "O'Higgins",
    rate: 5600,
    estimatedDays: '2-4'
  },
  'VII': {
    code: 'VII',
    name: 'Maule',
    rate: 5600,
    estimatedDays: '2-4'
  },
  'XVI': {
    code: 'XVI',
    name: 'Ñuble',
    rate: 5600,
    estimatedDays: '3-5'
  },
  'VIII': {
    code: 'VIII',
    name: 'Biobío',
    rate: 5600,
    estimatedDays: '3-5'
  },
  'IX': {
    code: 'IX',
    name: 'La Araucanía',
    rate: 5600,
    estimatedDays: '3-5'
  },
  'XIV': {
    code: 'XIV',
    name: 'Los Ríos',
    rate: 5600,
    estimatedDays: '4-6'
  },
  'X': {
    code: 'X',
    name: 'Los Lagos',
    rate: 5600,
    estimatedDays: '4-6'
  },
  'XI': {
    code: 'XI',
    name: 'Aysén',
    rate: 9500,
    estimatedDays: '6-9'
  },
  'XII': {
    code: 'XII',
    name: 'Magallanes y Antártica Chilena',
    rate: 9500,
    estimatedDays: '6-9'
  }
};

// Mapa de normalización para variaciones comunes
const REGION_ALIASES: Record<string, string> = {
  // Códigos oficiales
  'xv': 'XV',
  'i': 'I',
  'ii': 'II',
  'iii': 'III',
  'iv': 'IV',
  'v': 'V',
  'rm': 'RM',
  'vi': 'VI',
  'vii': 'VII',
  'viii': 'VIII',
  'ix': 'IX',
  'x': 'X',
  'xi': 'XI',
  'xii': 'XII',
  'xiv': 'XIV',
  'xvi': 'XVI',
  
  // Nombres completos y variaciones
  'arica y parinacota': 'XV',
  'arica': 'XV',
  'tarapacá': 'I',
  'tarapaca': 'I',
  'antofagasta': 'II',
  'atacama': 'III',
  'coquimbo': 'IV',
  'valparaíso': 'V',
  'valparaiso': 'V',
  'metropolitana de santiago': 'RM',
  'metropolitana': 'RM',
  'santiago': 'RM',
  'región metropolitana': 'RM',
  'region metropolitana': 'RM',
  "o'higgins": 'VI',
  'ohiggins': 'VI',
  "libertador general bernardo o'higgins": 'VI',
  'maule': 'VII',
  'ñuble': 'XVI',
  'nuble': 'XVI',
  'biobío': 'VIII',
  'biobio': 'VIII',
  'la araucanía': 'IX',
  'la araucania': 'IX',
  'araucanía': 'IX',
  'araucania': 'IX',
  'los ríos': 'XIV',
  'los rios': 'XIV',
  'los lagos': 'X',
  'aysén': 'XI',
  'aysen': 'XI',
  'aysén del general carlos ibáñez del campo': 'XI',
  'magallanes y antártica chilena': 'XII',
  'magallanes y antartica chilena': 'XII',
  'magallanes': 'XII'
};

/**
 * Normaliza el nombre de región a su código oficial
 */
function normalizeRegionCode(region: string): string | null {
  if (!region) return null;
  
  const normalized = region.trim().toLowerCase();
  
  // Primero verificar si ya es un código válido
  const upperRegion = region.trim().toUpperCase();
  if (SHIPPING_RATES_TABLE[upperRegion]) {
    return upperRegion;
  }
  
  // Buscar en alias
  const code = REGION_ALIASES[normalized];
  return code || null;
}

/**
 * Obtiene la tarifa de envío para una región destino
 * @param regionDestino - Código o nombre de la región destino
 * @returns Tarifa de envío o null si la región no existe
 */
export function getShippingRate(regionDestino: string): number | null {
  const regionCode = normalizeRegionCode(regionDestino);
  
  if (!regionCode) {
    return null;
  }
  
  const rateEntry = SHIPPING_RATES_TABLE[regionCode];
  return rateEntry ? rateEntry.rate : null;
}

/**
 * Obtiene toda la información de envío para una región
 * @param regionDestino - Código o nombre de la región destino
 * @returns Información completa de envío o null si la región no existe
 */
export function getShippingInfo(regionDestino: string): ShippingRateEntry | null {
  const regionCode = normalizeRegionCode(regionDestino);
  
  if (!regionCode) {
    return null;
  }
  
  return SHIPPING_RATES_TABLE[regionCode] || null;
}

/**
 * Obtiene todas las tarifas de envío disponibles
 * @returns Array con todas las tarifas ordenadas alfabéticamente por nombre de región
 */
export function getAllShippingRates(): ShippingRateEntry[] {
  return Object.values(SHIPPING_RATES_TABLE).sort((a, b) => 
    a.name.localeCompare(b.name, 'es')
  );
}

/**
 * Valida si una región existe en el tarifario
 * @param regionDestino - Código o nombre de la región
 * @returns true si la región existe, false en caso contrario
 */
export function isValidRegion(regionDestino: string): boolean {
  return normalizeRegionCode(regionDestino) !== null;
}
