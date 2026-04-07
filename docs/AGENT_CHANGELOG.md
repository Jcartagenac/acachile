# AGENT_CHANGELOG

Registro operativo de cambios realizados en el proyecto para mantener trazabilidad humana, especialmente cuando se hacen ajustes rápidos sobre contenido, UI o estructura.

## Regla de trabajo

- Antes de modificar una parte del proyecto, revisar la documentación y el código relacionado para respetar la estructura existente.
- Después de cada cambio, registrar aquí:
  - fecha
  - objetivo
  - archivos tocados
  - resumen funcional
  - commit asociado

---

## 2026-04-07

### 1. Actualización del directorio ACA en `/sociosaca`
- **Objetivo:** reemplazar el directorio anterior por el nuevo directorio entregado por el equipo.
- **Archivo:** `frontend/src/pages/SociosAcaLinks.tsx`
- **Cambio realizado:**
  - se actualizaron nombres, cargos y teléfonos del directorio ACA
  - se agregó despliegue de correo electrónico por cada integrante
- **Commit:** `dabcca38` - `feat: update ACA directory contacts on socios page`

### 2. Corrección de email de Oscar Cerda
- **Objetivo:** actualizar el correo del Director Ejecutivo.
- **Archivo:** `frontend/src/pages/SociosAcaLinks.tsx`
- **Cambio realizado:**
  - email de Oscar Cerda actualizado a `directorejecutivo@acachile.com`
- **Commit:** `d42caa31` - `fix: update Oscar Cerda directory email`

### 3. Resumen de historias/noticias destacadas en home
- **Objetivo:** hacer más breve el contenido visible en las historias destacadas de la página de inicio.
- **Archivo:** `frontend/src/pages/HomePage.tsx`
- **Cambio realizado:**
  - se agregó lógica para resumir el contenido textual mostrado en noticias destacadas
  - se prioriza una frase corta si existe; si no, se recorta limpiamente con elipsis
- **Commit:** `678b73a4` - `feat: shorten featured stories on homepage`

### 4. Títulos limitados a dos líneas en destacadas
- **Objetivo:** mejorar consistencia visual de las tarjetas destacadas.
- **Archivo:** `frontend/src/pages/HomePage.tsx`
- **Cambio realizado:**
  - los títulos visibles de destacadas quedaron limitados a 2 líneas
- **Commit:** `de4874a5` - `style: clamp homepage featured titles to two lines`

### 5. Noticias destacadas más compactas
- **Objetivo:** simplificar visualmente las destacadas, dando protagonismo a la imagen y reduciendo el bloque de texto.
- **Archivo:** `frontend/src/pages/HomePage.tsx`
- **Cambio realizado:**
  - tratamiento compacto para bloques de noticias
  - imagen protagonista
  - contenido visible limitado a 2 líneas
  - CTA textual del bloque oculto en este formato compacto
- **Commit:** `6c6a9419` - `style: make featured news cards more compact`

### 6. Altura uniforme de imágenes destacadas
- **Objetivo:** evitar saltos visuales entre noticias destacadas.
- **Archivo:** `frontend/src/pages/HomePage.tsx`
- **Cambio realizado:**
  - se fijó una altura uniforme para las imágenes de noticias destacadas
- **Commit:** `9f2cdbc2` - `style: unify featured news image heights`

### 7. Noticias destacadas en grilla de 4 columnas
- **Objetivo:** convertir las destacadas del home en una grilla más editorial y compacta.
- **Archivo:** `frontend/src/pages/HomePage.tsx`
- **Cambio realizado:**
  - se agruparon las secciones de noticias del inicio en una grilla responsiva
  - en desktop se muestran hasta 4 columnas
  - cada tarjeta mantiene imagen uniforme y 2 líneas de contenido
- **Commit:** `9f0cde9a` - `feat: render featured news as four-column grid`

### 8. Documentación de entendimiento del proyecto
- **Objetivo:** dejar una base de referencia para entender arquitectura, módulos, integraciones y deuda técnica del proyecto.
- **Archivo:** `docs/PROJECT_UNDERSTANDING_FULL.md`
- **Cambio realizado:**
  - se documentó la arquitectura real observada del proyecto
  - se registraron módulos, integraciones, riesgos, inconsistencias y recomendaciones
- **Commit:** `d7e49838` - `docs: add full project understanding guide`

---

## Nota

Este archivo busca complementar los commits con contexto humano. No reemplaza documentación técnica específica ni changelogs de producto, pero sí sirve como bitácora práctica de trabajo sobre ACAChile.
