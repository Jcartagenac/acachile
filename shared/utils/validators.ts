/**
 * Utilidades de validación y normalización para ACA Chile
 * Incluye validadores para RUT chileno, teléfonos y direcciones con Google Maps API
 */

/**
 * Valida el dígito verificador de un RUT chileno usando el algoritmo módulo 11.
 * @param rut - RUT con o sin puntos/guion (ej: "12345678-9" o "12.345.678-9")
 * @returns true si válido, false si no
 */
export function validateRut(rut: string): boolean {
  // Limpiar RUT: quitar puntos, espacios, y convertir a mayúsculas
  const cleanRut = rut.replace(/\./g, '').replace(/-/g, '').trim().toUpperCase();

  if (!/^\d{7,8}[0-9K]$/.test(cleanRut)) {
    return false;
  }

  const rutDigits = cleanRut.slice(0, -1);
  const dv = cleanRut.slice(-1);

  // Calcular dígito verificador esperado
  let sum = 0;
  let multiplier = 2;

  for (let i = rutDigits.length - 1; i >= 0; i--) {
    sum += parseInt(rutDigits[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const remainder = 11 - (sum % 11);
  let expectedDv: string;

  if (remainder === 11) {
    expectedDv = '0';
  } else if (remainder === 10) {
    expectedDv = 'K';
  } else {
    expectedDv = remainder.toString();
  }

  return dv === expectedDv;
}

/**
 * Formatea un RUT chileno con puntos y guion sin validar.
 * @param rut - RUT limpio sin puntos ni guion
 * @returns RUT formateado (ej: "12.345.678-9")
 */
export function formatRut(rut: string): string {
  const cleanRut = rut.replace(/\./g, '').replace(/-/g, '').trim().toUpperCase();

  if (!cleanRut) return '';

  const rutDigits = cleanRut.slice(0, -1);
  const dv = cleanRut.slice(-1);

  // Formatear con puntos
  let formatted = '';
  for (let i = rutDigits.length - 1, count = 0; i >= 0; i--, count++) {
    if (count === 3 || (count === 6 && rutDigits.length > 6)) {
      formatted = '.' + formatted;
      count = 0;
    }
    formatted = rutDigits[i] + formatted;
  }

  return `${formatted}-${dv}`;
}

/**
 * Normaliza un RUT chileno: quita puntos/espacios, valida, y formatea con puntos y guion.
 * @param rut - RUT a normalizar
 * @returns RUT normalizado (ej: "12.345.678-9") o lanza error si inválido
 */
export function normalizeRut(rut: string): string {
  const cleanRut = rut.replace(/\./g, '').replace(/-/g, '').trim().toUpperCase();

  if (!validateRut(cleanRut)) {
    throw new Error('RUT inválido');
  }

  return formatRut(cleanRut);
}

/**
 * Normaliza un número de teléfono chileno al formato +569XXXXXXXX (9 dígitos).
 * @param phone - Teléfono a normalizar (ej: "912345678", "+56912345678", "9 1234 5678")
 * @returns Teléfono normalizado o lanza error si inválido
 */
export function normalizePhone(phone: string): string {
  // Limpiar: quitar espacios, guiones, paréntesis
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');

  // Si ya tiene +56, quitarlo temporalmente
  let number = cleanPhone;
  if (cleanPhone.startsWith('+56')) {
    number = cleanPhone.slice(3);
  }

  // Debe empezar con 9 y tener 8 dígitos más (total 9)
  if (!/^9\d{8}$/.test(number)) {
    throw new Error('Teléfono inválido. Debe ser un número móvil chileno de 9 dígitos empezando con 9');
  }

  return `+56${number}`;
}

/**
 * Normaliza una dirección usando Google Maps Geocoding API.
 * @param address - Dirección a normalizar
 * @param apiKey - API key de Google Maps
 * @returns Dirección normalizada o la original si falla
 */
export async function normalizeAddress(address: string, apiKey?: string): Promise<string> {
  if (!address || address.trim().length === 0) {
    return address;
  }

  // Use provided API key or get from environment
  const key = apiKey || (typeof process !== 'undefined' && process.env ? process.env.GOOGLE_MAPS_API_KEY : '') || '';

  if (!key) {
    console.warn('[normalizeAddress] No Google Maps API key available');
    return address;
  }

  try {
    const encodedAddress = encodeURIComponent(address);
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${key}&region=cl`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status === 'OK' && data.results && data.results.length > 0) {
      // Usar la dirección formateada del primer resultado
      return data.results[0].formatted_address;
    } else {
      console.warn('[normalizeAddress] Geocoding failed:', data.status, data.error_message);
      return address; // Retornar original si falla
    }
  } catch (error) {
    console.error('[normalizeAddress] Error:', error);
    return address; // Retornar original si error
  }
}