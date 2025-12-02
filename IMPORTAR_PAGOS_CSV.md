# Importación de Pagos mediante CSV

## 📋 Descripción

Sistema de importación masiva de pagos de cuotas de socios mediante archivos CSV. Permite marcar múltiples cuotas como pagadas de forma eficiente, manejar pagos históricos y futuros, y generar cuotas automáticamente para años siguientes.

## ✅ Implementación Completada

### Ubicación
- **Página**: `/panel-admin/payments` (AdminCuotas.tsx)
- **Componente**: `ImportarPagosCSVModal`
- **Líneas**: 1458-1852 en AdminCuotas.tsx

### Características Implementadas

1. **Botón de Importación**
   - Ubicación: Junto al botón "Generar Cuotas"
   - Color: Azul (bg-blue-600)
   - Ícono: Upload de lucide-react

2. **Modal de Importación**
   - Descarga de plantilla CSV de ejemplo
   - Selector de archivo CSV
   - Validación de formato
   - Display de resultados (éxitos y errores)
   - Loading state durante procesamiento

3. **Procesamiento CSV**
   - Parse robusto de CSV con manejo de comillas
   - Validación de RUT
   - Búsqueda de usuario en la base de datos
   - Creación de cuotas nuevas
   - Actualización de cuotas existentes no pagadas
   - Manejo de años futuros (2025, 2026, etc.)

## 📄 Formato del CSV

### Estructura de Columnas

```csv
rut,enero,febrero,marzo,abril,mayo,junio,julio,agosto,septiembre,octubre,noviembre,diciembre,proximo_pago
```

### Valores Permitidos

#### Columna `rut`
- Formato: `12345678-9`
- Requerido: **Sí**
- Debe existir en la base de datos

#### Columnas de Meses (enero-diciembre)
- **Vacío**: No hay pago registrado para ese mes
- **"si"**: Marca el mes como pagado (fecha automática: 1ro del mes)
- **"YYYY-MM-DD"**: Marca el mes como pagado con fecha específica (ej: `2025-01-15`)

#### Columna `proximo_pago`
- Formato: `YYYY-MM-DD` (ej: `2025-03-05`)
- Opcional
- Si la fecha es en un año futuro (2026+), crea cuotas futuras automáticamente

### Ejemplo de CSV Válido

```csv
rut,enero,febrero,marzo,abril,mayo,junio,julio,agosto,septiembre,octubre,noviembre,diciembre,proximo_pago
12345678-9,si,si,,,,,,,,,,,2025-03-05
98765432-1,2025-01-15,2025-02-10,si,,,,,,,,,,,2025-04-05
11111111-1,,,,,,,,,,,,,2025-01-05
```

## 🔧 Lógica de Procesamiento

### 1. Validación Inicial
```typescript
- Verificar que el archivo sea CSV
- Verificar que tenga encabezados
- Verificar que incluya columna "rut"
- Parse de filas con manejo de comillas
```

### 2. Procesamiento por Fila
```typescript
Para cada fila:
  1. Buscar usuario por RUT
  2. Si no existe: registrar error y continuar
  3. Para cada mes con valor:
     a. Determinar fecha de pago (si="YYYY-MM-01", fecha="valor")
     b. Extraer año de la fecha
     c. Verificar si existe cuota para (usuario_id, año, mes)
     d. Si existe y no está pagada: actualizar
     e. Si no existe: crear
  4. Si hay proximo_pago en año futuro:
     - Crear cuotas para meses futuros hasta esa fecha
     - Dejar como no pagadas (pagado=0)
```

### 3. Creación/Actualización de Cuotas

**Crear Nueva Cuota**
```json
{
  "año": 2025,
  "mes": 1,
  "valor": 6500,
  "pagado": 1,
  "fecha_pago": "2025-01-15",
  "metodo_pago": "importacion_csv"
}
```

**Actualizar Cuota Existente**
```json
{
  "pagado": 1,
  "fecha_pago": "2025-01-15",
  "metodo_pago": "importacion_csv"
}
```

## 🎯 Casos de Uso

### Caso 1: Pagos Históricos (Enero-Febrero 2025)
```csv
rut,enero,febrero,marzo,...
12345678-9,si,si,,
```
**Resultado**: Crea/actualiza cuotas de enero y febrero 2025, marcadas como pagadas

### Caso 2: Pagos con Fechas Específicas
```csv
rut,enero,febrero,...
12345678-9,2025-01-10,2025-02-05,
```
**Resultado**: Cuotas con fecha_pago exacta del pago realizado

### Caso 3: Próximo Pago en 2026
```csv
rut,enero,febrero,proximo_pago
12345678-9,si,si,2026-03-05
```
**Resultado**: 
- Marca enero y febrero 2025 como pagados
- Crea cuotas de marzo-diciembre 2025 (no pagadas)
- Crea cuotas de enero-marzo 2026 (no pagadas)

### Caso 4: Solo Próximo Pago (Nuevo Socio)
```csv
rut,enero,febrero,proximo_pago
11111111-1,,,2025-03-05
```
**Resultado**: Crea cuotas futuras hasta marzo 2025 sin marcar como pagadas

## 📊 Display de Resultados

El modal muestra al finalizar:

```
Resultados de la Importación:
- Total procesados: 10
- Exitosos: 8
- Errores (2):
  * Fila 3: Usuario con RUT 99999999-9 no encontrado
  * Fila 7 (12345678-9): Error al obtener cuotas
```

## 🔍 Validaciones

### Validaciones a Nivel de Archivo
- ✅ Archivo debe ser .csv
- ✅ Debe tener al menos 2 líneas (headers + datos)
- ✅ Debe tener columna "rut"

### Validaciones a Nivel de Fila
- ✅ RUT no puede estar vacío
- ✅ Usuario debe existir en la BD
- ✅ Fechas deben estar en formato ISO (YYYY-MM-DD)
- ✅ Valores de mes solo pueden ser: "", "si", o fecha válida

### Validaciones a Nivel de API
- ✅ Verificar si cuota existe antes de crear
- ✅ Solo actualizar cuotas no pagadas
- ✅ Usar valor_cuota del usuario (default: 6500)

## 🚀 Manejo de Años Futuros

Cuando `proximo_pago` indica un año futuro (ej: 2026):

1. Calcula meses entre hoy y la fecha futura
2. Crea cuotas para cada mes intermedio
3. Las cuotas futuras se crean con `pagado=0`
4. Asigna el valor_cuota del usuario
5. No duplica cuotas si ya existen

**Ejemplo Práctico:**
- Hoy: Enero 2025
- proximo_pago: Marzo 2026
- Resultado: Crea ~14 cuotas (feb-dic 2025 + ene-mar 2026)

## 🛠️ Endpoints Utilizados

1. **Buscar Usuario por RUT**
   ```
   GET /api/admin/socios?search={rut}
   ```

2. **Obtener Cuotas de un Año**
   ```
   GET /api/admin/socios/{usuario_id}/cuotas?año={año}
   ```

3. **Crear Cuota**
   ```
   POST /api/admin/socios/{usuario_id}/cuotas
   Body: { año, mes, valor, pagado, fecha_pago, metodo_pago }
   ```

4. **Actualizar Cuota**
   ```
   PUT /api/admin/socios/{usuario_id}/cuotas/{cuota_id}
   Body: { pagado, fecha_pago, metodo_pago }
   ```

## 💾 Base de Datos

### Tabla: `cuotas`
```sql
CREATE TABLE cuotas (
  id INTEGER PRIMARY KEY,
  usuario_id INTEGER NOT NULL,
  año INTEGER NOT NULL,
  mes INTEGER NOT NULL,
  valor INTEGER NOT NULL,
  pagado INTEGER DEFAULT 0,
  fecha_pago TEXT,
  metodo_pago TEXT,
  comprobante_url TEXT,
  notas TEXT,
  created_at TEXT,
  updated_at TEXT,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);
```

### Método de Pago
El sistema marca todas las cuotas importadas con:
```
metodo_pago = 'importacion_csv'
```

Esto permite:
- Diferenciar pagos manuales de importaciones
- Auditar origen de los datos
- Filtrar por método de pago si es necesario

## 🧪 Pruebas Recomendadas

### Test 1: CSV Básico
```csv
rut,enero,febrero,proximo_pago
{tu_rut},si,si,2025-04-05
```
Verificar: Cuotas de enero y febrero pagadas

### Test 2: Fechas Específicas
```csv
rut,enero,febrero,proximo_pago
{tu_rut},2025-01-10,2025-02-15,2025-04-05
```
Verificar: fecha_pago correcta en la BD

### Test 3: Año Futuro
```csv
rut,enero,febrero,proximo_pago
{tu_rut},si,si,2026-06-05
```
Verificar: Cuotas creadas hasta junio 2026

### Test 4: Errores
```csv
rut,enero,febrero,proximo_pago
99999999-9,si,si,2025-04-05
```
Verificar: Error mostrado correctamente en el modal

## 📝 Notas de Implementación

### Rendimiento
- Procesamiento secuencial (no paralelo) para evitar race conditions
- Cada fila hace múltiples llamadas API (puede ser lento con muchas filas)
- Recomendado: Lotes de 50-100 socios por importación

### Manejo de Errores
- Errores individuales no detienen el proceso completo
- Cada error se registra con número de fila y RUT
- Al finalizar se muestra resumen completo

### Estados del Modal
1. **Inicial**: Instrucciones + botón descargar plantilla
2. **Archivo Seleccionado**: Muestra nombre del archivo
3. **Procesando**: Loading spinner + botón deshabilitado
4. **Resultados**: Display de éxitos y errores + botón "Cerrar"

## 🔄 Callback de Actualización

Después de una importación exitosa:
```typescript
if (successCount > 0) {
  onImport(); // Recarga datos de la página principal
}
```

Esto asegura que la lista de socios se actualice automáticamente con los nuevos pagos.

## 🎨 Estilos y UX

- **Modal**: Fondo oscuro (bg-black bg-opacity-50)
- **Ancho**: max-w-2xl (responsive)
- **Altura**: max-h-[90vh] con scroll
- **Botón Importar**: Azul (bg-blue-600)
- **Botón Plantilla**: Azul claro (bg-blue-100)
- **Botón Cancelar/Cerrar**: Gris (bg-gray-200)
- **Errores**: Fondo rojo claro (bg-red-50)
- **Resultados**: Fondo gris claro (bg-gray-50)

## 🚨 Consideraciones de Seguridad

1. ✅ Solo disponible para admins (ruta protegida)
2. ✅ Validación de RUT antes de procesamiento
3. ✅ No permite sobrescribir cuotas ya pagadas
4. ✅ Registra método de pago para auditoría
5. ✅ No expone información sensible en errores

## 📚 Referencias

- **Componente Principal**: `AdminCuotas.tsx`
- **Modal**: `ImportarPagosCSVModal` (línea 1458)
- **Servicio**: `sociosService.ts`
- **API**: `/api/admin/socios/*`
- **Base de Datos**: Cloudflare D1 (SQLite)

---

**Fecha de Implementación**: Enero 2025  
**Versión**: 1.0.0  
**Estado**: ✅ Completado y listo para producción
