# AGENT_CHANGELOG

## 2026-04-07

### Cierre temporal de “Únete a ACA”
- **Objetivo:** cerrar temporalmente las postulaciones y deshabilitar el acceso operativo a `/unete`.
- **Archivos modificados:**
  - `frontend/src/pages/JoinPage.tsx`
  - `frontend/src/components/layout/Header.tsx`
  - `frontend/src/pages/AuthPage.tsx`
  - `frontend/src/components/auth/LoginForm.tsx`
  - `frontend/src/components/auth/AuthModal.tsx`
  - `frontend/functions/api/unete/index.ts`
- **Cambios realizados:**
  - se reemplazó la página `/unete` por una pantalla de cierre temporal
  - se cambiaron los textos de botones y llamados a acción de “Únete a ACA” a “Cerrado temporalmente”
  - se deshabilitaron accesos visibles desde header y flujos de autenticación
  - el endpoint `/api/unete` ahora responde como cerrado temporalmente

## 2026-04-08

### Hero principal convertido en carrusel de noticias destacadas
- **Objetivo:** reemplazar el hero principal por un resumen visual de las últimas 4 noticias destacadas del sitio, sin rehacer el resto de la portada.
- **Archivo modificado:**
  - `frontend/src/pages/HomePage.tsx`
- **Cambios realizados:**
  - el hero ahora muestra hasta 4 noticias en formato carrusel horizontal
  - si existen noticias destacadas (`is_featured`), se usan primero; si no, se usan las 4 más recientes
  - cada slide muestra imagen destacada, título, resumen breve y botón “Leer más”
  - autoplay configurado en 6 segundos por slide con transición suave
  - pausa del autoplay al pasar el mouse sobre el hero en escritorio
  - navegación táctil por swipe en móvil
  - dots de paginación e indicadores discretos
  - fallback limpio si no hay noticias disponibles
- **Validación:**
  - build del frontend ejecutado correctamente después del cambio
