# Sistema de Tarifas de Envío - Blue Express PYME

## Resumen

Sistema actualizado de cálculo de tarifas de envío basado en el tarifario oficial de Blue Express PYME para paquetes tamaño S (hasta 3kg) desde Santiago.

## Características

### Alcance
- **Modalidad**: Solo entrega a domicilio
- **Tamaño**: Solo paquetes S (hasta 3 kg)
- **Origen**: SIEMPRE Región Metropolitana (Santiago)
- **Precios**: Incluyen IVA

### Tarifario Implementado

| Zona | Regiones | Tarifa | Días Estimados |
|------|----------|--------|----------------|
| **Metropolitana** | RM | $4.200 | 1-2 días |
| **Centro-Sur** | III, IV, V, VI, VII, VIII, IX, X, XIV, XVI | $5.600 | 1-6 días |
| **Extremos** | I, II, XI, XII, XV | $9.500 | 5-9 días |

### Detalle por Región

#### Tarifa $4.200 (RM)
- RM - Metropolitana de Santiago: 1-2 días

#### Tarifa $5.600 (Centro-Sur)
- III - Atacama: 3-5 días
- IV - Coquimbo: 2-4 días
- V - Valparaíso: 1-2 días
- VI - O'Higgins: 2-4 días
- VII - Maule: 2-4 días
- XVI - Ñuble: 3-5 días
- VIII - Biobío: 3-5 días
- IX - La Araucanía: 3-5 días
- XIV - Los Ríos: 4-6 días
- X - Los Lagos: 4-6 días

#### Tarifa $9.500 (Extremos)
- XV - Arica y Parinacota: 5-7 días
- I - Tarapacá: 5-7 días
- II - Antofagasta: 5-7 días
- XI - Aysén: 6-9 días
- XII - Magallanes y Antártica Chilena: 6-9 días

## Arquitectura

### Archivos Principales

1. **`frontend/src/utils/shippingRates.ts`**
   - Única fuente de verdad para el tarifario
   - Funciones de cálculo y validación
   - Normalización de nombres de regiones

2. **`frontend/functions/api/shop/shipping-rates/index.ts`**
   - API endpoint que retorna tarifas desde constante
   - No depende de base de datos (evita inconsistencias)

3. **`frontend/src/utils/shippingRates.test.ts`**
   - 23 tests unitarios
   - Cobertura completa de casos de uso

4. **`frontend/migrations/0021_update_shipping_rates_blue_express.sql`**
   - Script de migración de base de datos
   - Documentación de cambios

## API de Funciones

### `getShippingRate(regionDestino: string): number | null`

Obtiene la tarifa de envío para una región destino.

```typescript
// Por código
getShippingRate('RM')          // → 4200
getShippingRate('V')           // → 5600
getShippingRate('XII')         // → 9500

// Por nombre
getShippingRate('Metropolitana')  // → 4200
getShippingRate('Valparaíso')     // → 5600
getShippingRate('Magallanes')     // → 9500

// Normalización automática
getShippingRate('rm')             // → 4200 (minúsculas)
getShippingRate('valparaiso')     // → 5600 (sin tilde)
getShippingRate('  RM  ')         // → 4200 (espacios)

// Región inválida
getShippingRate('INVALID')        // → null
```

### `getShippingInfo(regionDestino: string): ShippingRateEntry | null`

Obtiene información completa de envío para una región.

```typescript
getShippingInfo('RM')
// → {
//     code: 'RM',
//     name: 'Metropolitana de Santiago',
//     rate: 4200,
//     estimatedDays: '1-2'
//   }

getShippingInfo('INVALID')  // → null
```

### `getAllShippingRates(): ShippingRateEntry[]`

Retorna todas las tarifas ordenadas alfabéticamente.

```typescript
getAllShippingRates()
// → [
//     { code: 'II', name: 'Antofagasta', rate: 9500, estimatedDays: '5-7' },
//     { code: 'XV', name: 'Arica y Parinacota', rate: 9500, estimatedDays: '5-7' },
//     ...
//   ]
```

### `isValidRegion(regionDestino: string): boolean`

Valida si una región existe en el tarifario.

```typescript
isValidRegion('RM')         // → true
isValidRegion('Valparaíso') // → true
isValidRegion('INVALID')    // → false
```

## Normalización de Regiones

El sistema normaliza automáticamente:

- **Mayúsculas/minúsculas**: `RM`, `rm`, `Rm` → `RM`
- **Tildes**: `Valparaíso`, `Valparaiso` → `V`
- **Espacios**: `  RM  `, `Metropolitana` → `RM`
- **Nombres completos**: `Metropolitana de Santiago` → `RM`
- **Abreviaciones**: `Santiago`, `Metropolitana` → `RM`
- **Variaciones**: `O'Higgins`, `OHiggins`, `ohiggins` → `VI`

## Tests

El sistema incluye 23 tests que verifican:

### Tests Básicos (5 tests requeridos)
- ✅ RM → RM = 4200
- ✅ RM → Valparaíso = 5600
- ✅ RM → Atacama = 5600
- ✅ RM → Tarapacá = 9500
- ✅ RM → Magallanes = 9500

### Tests Adicionales
- ✅ Todas las zonas tarifarias (3 tests)
- ✅ Información completa de envío (4 tests)
- ✅ Listado de todas las regiones (3 tests)
- ✅ Validación de regiones (3 tests)
- ✅ Normalización de nombres (4 tests)

### Ejecutar Tests

```bash
npm test -- shippingRates.test.ts
```

## Uso en la Aplicación

### En CartPage.tsx

```typescript
import { getShippingRate } from '@/utils/shippingRates';

const handleRegionChange = (regionCode: string) => {
  const rate = getShippingRate(regionCode);
  if (rate !== null) {
    setShippingCost(rate);
  } else {
    console.error('Región no válida');
  }
};
```

### En el API

```typescript
// frontend/functions/api/shop/shipping-rates/index.ts
// Retorna tarifario desde constante (no usa DB)
export const onRequestGet: PagesFunction<Env> = async () => {
  return Response.json(SHIPPING_RATES);
};
```

## Migración

### Actualizar Base de Datos

```bash
cd /Users/jcartagenac/Documents/poroto
npx wrangler d1 execute acachile-db --remote --file frontend/migrations/0021_update_shipping_rates_blue_express.sql
```

### Verificar Actualización

```bash
npx wrangler d1 execute acachile-db --remote --command "
SELECT region_code, region_name, rate, estimated_days 
FROM shop_shipping_rates 
ORDER BY rate, region_name;
"
```

## Ventajas del Nuevo Sistema

1. **Única fuente de verdad**: Tarifario definido en código, no en DB
2. **Sin inconsistencias**: API no depende de DB para tarifas
3. **Normalización robusta**: Maneja múltiples variaciones de nombres
4. **Tests completos**: 23 tests garantizan correcto funcionamiento
5. **Mantenible**: Cambios de tarifas en un solo lugar
6. **Documentado**: Migración SQL y documentación completa
7. **Type-safe**: TypeScript con interfaces bien definidas

## Mantenimiento

Para actualizar tarifas:

1. Editar `frontend/src/utils/shippingRates.ts` (tabla `SHIPPING_RATES_TABLE`)
2. Editar `frontend/functions/api/shop/shipping-rates/index.ts` (constante `SHIPPING_RATES`)
3. Actualizar tests en `shippingRates.test.ts` si es necesario
4. Ejecutar tests: `npm test -- shippingRates.test.ts`
5. Crear migración SQL para actualizar DB
6. Ejecutar migración en producción
7. Deploy automático vía git push

## Changelog

### v1.0.0 - 16 de diciembre de 2025

**Cambios implementados:**
- ✅ Tarifario Blue Express PYME implementado
- ✅ Solo paquetes tamaño S (hasta 3kg)
- ✅ Origen fijo: Santiago/RM
- ✅ Normalización de nombres de regiones
- ✅ 23 tests unitarios (100% passing)
- ✅ API actualizada (no usa DB)
- ✅ Base de datos actualizada
- ✅ Migración SQL documentada

**Tarifas actualizadas:**
- RM: $4.200 (antes: $3.290)
- Centro-Sur: $5.600 (antes: $3.590-$5.600)
- Extremos: $9.500 (antes: $8.890-$13.590)

**Archivos modificados:**
- `frontend/src/utils/shippingRates.ts` (nuevo)
- `frontend/src/utils/shippingRates.test.ts` (nuevo)
- `frontend/functions/api/shop/shipping-rates/index.ts` (actualizado)
- `frontend/migrations/0021_update_shipping_rates_blue_express.sql` (nuevo)
- Base de datos `shop_shipping_rates` (actualizada)
