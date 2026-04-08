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
