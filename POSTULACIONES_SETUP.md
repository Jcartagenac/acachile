# Flujo de Postulación de Socios ACA Chile

Este documento resume los cambios necesarios para habilitar el nuevo flujo de incorporación de socios basado en postulaciones, junto con las instrucciones de despliegue y verificación.

## Resumen funcional

1. Los botones públicos de registro ahora apuntan a `/unete`, donde existe un formulario completo (`JoinApplicationForm`) que captura motivaciones, disponibilidad y datos de contacto.
2. La API pública recibe las postulaciones en `POST /api/unete`. El formulario valida los campos con Zod y envía un `JoinApplicationPayload`.
3. Se almacenan los datos en la tabla `postulaciones` (y sus aprobaciones en `postulacion_aprobaciones`).
4. Un director/director-editor/admin puede revisar las postulaciones desde `/panel-admin/postulantes`, aprobar o rechazar, y dejar comentarios.
5. Cuando una postulación recibe la 2ª aprobación, se crea o reactiva el socio en `usuarios`, con contraseña temporal (se muestra al aprobador).

## Cambios en la base de datos

Las siguientes tablas/índices se crean automáticamente mediante `ensurePostulacionesSchema`:

- `postulaciones`
- `postulacion_aprobaciones`
- índices auxiliares (`idx_postulaciones_status`, `idx_postulaciones_email`, `idx_postulaciones_updated_at`)
- trigger `trg_postulaciones_updated_at`

### Primer despliegue

1. Desplegar las funciones de Cloudflare (Pages Functions) que incluyen las rutas:
   - `POST /api/unete`
   - `GET /api/admin/postulantes`
   - `GET /api/admin/postulantes/:id`
   - `POST /api/admin/postulantes/:id/approve`
   - `POST /api/admin/postulantes/:id/reject`
2. Ejecutar una llamada de prueba (por ejemplo, enviar un formulario desde `/unete`) para que se creen las tablas en D1 si aún no existen.
3. Verificar que `env.DB` contenga las nuevas tablas:
   ```bash
   wrangler d1 execute <DB_NAME> --command "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'postul%';"
   ```

## Permisos y roles

- El middleware `requireAuth` valida JWT y se apoya en la columna `role` de `usuarios`.
- Se consideran roles válidos para aprobar: `admin`, `organizer` (director), `editor` (director_editor). La lógica se encuentra en `isDirectorRole`.
- Cada postulación requiere dos aprobaciones distintas. El endpoint evita aprobaciones duplicadas por el mismo usuario.

## Navegación y rutas

- `/unete`: acceso público.
- `/panel-admin/postulantes`: requiere autenticación y rol Director/Director Editor/Admin. Accesible desde el panel de socios (botón “Gestionar postulantes”).

## Validaciones y pruebas rápidas

1. Envío de formulario `/unete`:
   - Validar campos obligatorios (mostrará mensajes si faltan datos).
   - Confirmar que aparece mensaje de éxito tras enviar.
2. Revisar `/panel-admin/postulantes` con un usuario director/admin:
   - Filtros por estado y búsqueda por nombre/email.
   - Aprobar una postulación y comprobar que pasa a `en_revision`/`aprobada`.
   - Asegurarse de que la contraseña temporal se muestra en la alerta del aprobador.
3. Rechazo de postulación:
   - Registrar motivo y validar que se guarda y se visualiza.
4. Revisar tabla `usuarios` tras aprobar dos veces:
   - Debe existir o activarse el socio con role `user` y estado `activo`.

## Notas adicionales

- El flujo anterior (`RegisterForm`) fue eliminado; cualquier enlace antiguo debe apuntar a `/unete`.
- Si se disponen de seeds/migraciones personalizados en entorno productivo se recomienda ejecutar una exportación y validación tras el primer despliegue.
- La lógica de creación de socio reutiliza el email; si existía un usuario inactivo, se reactivará y se le asignará contraseña temporal.
