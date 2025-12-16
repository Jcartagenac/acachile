import { describe, it, expect } from 'vitest';
import { 
  getShippingRate, 
  getShippingInfo, 
  getAllShippingRates,
  isValidRegion 
} from './shippingRates';

describe('Shipping Rates - Tarifario Blue Express PYME', () => {
  describe('getShippingRate', () => {
    it('RM → RM = 4200', () => {
      expect(getShippingRate('RM')).toBe(4200);
      expect(getShippingRate('rm')).toBe(4200);
      expect(getShippingRate('Metropolitana')).toBe(4200);
      expect(getShippingRate('Santiago')).toBe(4200);
    });

    it('RM → Valparaíso = 5600', () => {
      expect(getShippingRate('V')).toBe(5600);
      expect(getShippingRate('v')).toBe(5600);
      expect(getShippingRate('Valparaíso')).toBe(5600);
      expect(getShippingRate('Valparaiso')).toBe(5600);
    });

    it('RM → Atacama = 5600', () => {
      expect(getShippingRate('III')).toBe(5600);
      expect(getShippingRate('iii')).toBe(5600);
      expect(getShippingRate('Atacama')).toBe(5600);
    });

    it('RM → Tarapacá = 9500', () => {
      expect(getShippingRate('I')).toBe(9500);
      expect(getShippingRate('i')).toBe(9500);
      expect(getShippingRate('Tarapacá')).toBe(9500);
      expect(getShippingRate('Tarapaca')).toBe(9500);
    });

    it('RM → Magallanes = 9500', () => {
      expect(getShippingRate('XII')).toBe(9500);
      expect(getShippingRate('xii')).toBe(9500);
      expect(getShippingRate('Magallanes')).toBe(9500);
      expect(getShippingRate('Magallanes y Antártica Chilena')).toBe(9500);
    });

    it('Todas las regiones zona norte extremo (9500)', () => {
      expect(getShippingRate('XV')).toBe(9500); // Arica
      expect(getShippingRate('I')).toBe(9500);  // Tarapacá
      expect(getShippingRate('II')).toBe(9500); // Antofagasta
    });

    it('Todas las regiones zona centro-sur (5600)', () => {
      expect(getShippingRate('III')).toBe(5600);  // Atacama
      expect(getShippingRate('IV')).toBe(5600);   // Coquimbo
      expect(getShippingRate('V')).toBe(5600);    // Valparaíso
      expect(getShippingRate('VI')).toBe(5600);   // O'Higgins
      expect(getShippingRate('VII')).toBe(5600);  // Maule
      expect(getShippingRate('XVI')).toBe(5600);  // Ñuble
      expect(getShippingRate('VIII')).toBe(5600); // Biobío
      expect(getShippingRate('IX')).toBe(5600);   // Araucanía
      expect(getShippingRate('XIV')).toBe(5600);  // Los Ríos
      expect(getShippingRate('X')).toBe(5600);    // Los Lagos
    });

    it('Todas las regiones zona sur extremo (9500)', () => {
      expect(getShippingRate('XI')).toBe(9500);  // Aysén
      expect(getShippingRate('XII')).toBe(9500); // Magallanes
    });

    it('Retorna null para región inválida', () => {
      expect(getShippingRate('INVALID')).toBe(null);
      expect(getShippingRate('')).toBe(null);
      expect(getShippingRate('ZZZ')).toBe(null);
    });
  });

  describe('getShippingInfo', () => {
    it('Retorna información completa para RM', () => {
      const info = getShippingInfo('RM');
      expect(info).not.toBe(null);
      expect(info?.code).toBe('RM');
      expect(info?.name).toBe('Metropolitana de Santiago');
      expect(info?.rate).toBe(4200);
      expect(info?.estimatedDays).toBe('1-2');
    });

    it('Retorna información completa para Magallanes', () => {
      const info = getShippingInfo('XII');
      expect(info).not.toBe(null);
      expect(info?.code).toBe('XII');
      expect(info?.name).toBe('Magallanes y Antártica Chilena');
      expect(info?.rate).toBe(9500);
      expect(info?.estimatedDays).toBe('6-9');
    });

    it('Funciona con nombres completos y variaciones', () => {
      expect(getShippingInfo('Metropolitana de Santiago')?.code).toBe('RM');
      expect(getShippingInfo('santiago')?.code).toBe('RM');
      expect(getShippingInfo('La Araucanía')?.code).toBe('IX');
      expect(getShippingInfo('araucania')?.code).toBe('IX');
    });

    it('Retorna null para región inválida', () => {
      expect(getShippingInfo('INVALID')).toBe(null);
    });
  });

  describe('getAllShippingRates', () => {
    it('Retorna todas las 16 regiones', () => {
      const rates = getAllShippingRates();
      expect(rates).toHaveLength(16);
    });

    it('Están ordenadas alfabéticamente', () => {
      const rates = getAllShippingRates();
      const names = rates.map(r => r.name);
      const sorted = [...names].sort((a, b) => a.localeCompare(b, 'es'));
      expect(names).toEqual(sorted);
    });

    it('Todas las tarifas están en el rango correcto', () => {
      const rates = getAllShippingRates();
      rates.forEach(rate => {
        expect([4200, 5600, 9500]).toContain(rate.rate);
      });
    });
  });

  describe('isValidRegion', () => {
    it('Valida códigos correctos', () => {
      expect(isValidRegion('RM')).toBe(true);
      expect(isValidRegion('rm')).toBe(true);
      expect(isValidRegion('V')).toBe(true);
      expect(isValidRegion('XII')).toBe(true);
    });

    it('Valida nombres completos', () => {
      expect(isValidRegion('Metropolitana de Santiago')).toBe(true);
      expect(isValidRegion('Valparaíso')).toBe(true);
      expect(isValidRegion('magallanes')).toBe(true);
    });

    it('Rechaza regiones inválidas', () => {
      expect(isValidRegion('INVALID')).toBe(false);
      expect(isValidRegion('')).toBe(false);
      expect(isValidRegion('ZZZ')).toBe(false);
    });
  });

  describe('Normalización de nombres', () => {
    it('Maneja tildes correctamente', () => {
      expect(getShippingRate('Valparaíso')).toBe(5600);
      expect(getShippingRate('Valparaiso')).toBe(5600);
      expect(getShippingRate('Tarapacá')).toBe(9500);
      expect(getShippingRate('Tarapaca')).toBe(9500);
    });

    it('Maneja mayúsculas y minúsculas', () => {
      expect(getShippingRate('RM')).toBe(4200);
      expect(getShippingRate('rm')).toBe(4200);
      expect(getShippingRate('Rm')).toBe(4200);
      expect(getShippingRate('rM')).toBe(4200);
    });

    it('Maneja espacios extra', () => {
      expect(getShippingRate('  RM  ')).toBe(4200);
      expect(getShippingRate('  Metropolitana  ')).toBe(4200);
    });

    it('Maneja variaciones de O\'Higgins', () => {
      expect(getShippingRate('VI')).toBe(5600);
      expect(getShippingRate("O'Higgins")).toBe(5600);
      expect(getShippingRate('OHiggins')).toBe(5600);
      expect(getShippingRate("ohiggins")).toBe(5600);
    });
  });
});
