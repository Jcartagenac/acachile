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

### Ajuste de composición visual del hero de noticias
- **Objetivo:** hacer que la imagen vuelva a ser protagonista y que el bloque editorial se apoye abajo sin tapar demasiado el hero.
- **Archivo modificado:**
  - `frontend/src/pages/HomePage.tsx`
- **Cambios realizados:**
  - se eliminó la sensación de tarjeta grande flotante sobre la imagen
  - el contenido textual quedó apoyado abajo a la izquierda
  - se cambió el overlay a un degradado inferior más suave y editorial
  - se redujo el ancho y peso visual del bloque textual
  - se acortó el extracto visible a una presentación más discreta
  - se reforzó la limpieza del resumen para evitar HTML, estilos o texto basura
- **Validación:**
  - build del frontend ejecutado correctamente después del ajuste

### Mantenedor del carrusel principal del home en panel admin
- **Objetivo:** dejar el carrusel del hero principal administrable desde “Gestión de Contenido > Inicio”, sin hardcodear slides en el frontend.
- **Archivos modificados:**
  - `shared/siteSections.ts`
  - `frontend/functions/api/_utils/content.ts`
  - `frontend/functions/api/admin/content/index.ts`
  - `frontend/src/components/admin/AdminHomeEditor.tsx`
  - `frontend/src/pages/HomePage.tsx`
- **Cambios realizados:**
  - se agregó soporte para `is_active` en `site_sections`
  - el admin de Inicio ahora incorpora un bloque específico para contenidos destacados del Hero Home
  - permite agregar slides, asociarlos a noticias, definir orden, activar/desactivar y quitarlos
  - cada slide muestra vista rápida con título, noticia asociada, imagen, orden, estado y URL pública
  - el home consume primero los slides configurados en admin (`hero_slide_*` activos); si no hay, cae al fallback actual de noticias destacadas/recientes
- **Validación:**
  - build del frontend ejecutado correctamente después del cambio

### Corrección de lógica del carrusel administrado del Hero Home
- **Objetivo:** asegurar que cada slide dependa del contenido seleccionado en admin y que “Leer más” redirija automáticamente al contenido público correcto.
- **Archivos modificados:**
  - `frontend/src/components/admin/AdminHomeEditor.tsx`
  - `frontend/src/pages/HomePage.tsx`
- **Cambios realizados:**
  - el carrusel quedó conceptualizado como contenidos destacados para portada, no como una categoría rígida
  - se eliminó del mantenedor la edición manual del texto del botón para los slides del hero
  - la URL pública ahora se deriva automáticamente del contenido asociado
  - el hero del home consume título, imagen, resumen y URL directamente desde la noticia vinculada
  - si un slide no tiene contenido válido asociado, ya no se usa para el carrusel
  - el slide completo quedó clickeable hacia el mismo destino que el botón
- **Validación:**
  - build del frontend ejecutado correctamente después del ajuste

## 2026-04-09

### Pop Up principal administrable desde panel admin
- **Objetivo:** permitir crear, activar, desactivar y visualizar un popup principal del sitio desde el gestor de contenidos, sin hardcodearlo en frontend.
- **Archivos modificados:**
  - `shared/sitePopup.ts`
  - `frontend/functions/api/_utils/popup.ts`
  - `frontend/functions/api/admin/content/popup.ts`
  - `frontend/functions/api/content/popup.ts`
  - `frontend/functions/api/admin/content/upload.js`
  - `frontend/functions/api/upload-image.ts`
  - `frontend/migrations/0027_create_site_popup.sql`
  - `frontend/src/components/admin/AdminPopupEditor.tsx`
  - `frontend/src/components/SitePopup.tsx`
  - `frontend/src/pages/AdminContent.tsx`
  - `frontend/src/pages/HomePage.tsx`
- **Cambios realizados:**
  - se creó una entidad dedicada `site_popup`, separada de `site_sections`, para mantener el popup como módulo propio del CMS
  - se agregó API admin para leer y guardar el popup principal, con soporte para imagen, link opcional, apertura en nueva pestaña y estado activo/inactivo
  - se agregó endpoint público para que la home consulte solo el popup activo
  - se habilitó carpeta `popup` en el flujo de uploads a R2
  - el panel admin ahora incorpora una pestaña “Pop Up principal” con subida desde computador, preview, activación/desactivación y guardado
  - la portada ahora consulta el popup activo y lo muestra centrado con overlay oscuro, cierre visible, comportamiento responsive y cierre persistido por sesión
  - se dejó garantizado que exista un solo popup principal administrable a la vez mediante un registro singleton
- **Validación:**
  - build del frontend ejecutado correctamente después de la implementación

### Corrección de resolución de noticias destacadas desde Home
- **Objetivo:** corregir de raíz los errores intermitentes al abrir noticias destacadas desde la portada, alineando admin, home y detalle público.
- **Archivos modificados:**
  - `frontend/src/components/admin/AdminHomeEditor.tsx`
  - `frontend/src/pages/HomePage.tsx`
  - `frontend/src/services/newsService.ts`
- **Cambios realizados:**
  - la relación admin → noticia destacada dejó de depender del `slug` como identificador principal y ahora usa el `id` del contenido, con compatibilidad retroactiva para configuraciones antiguas
  - el admin ahora prioriza solo noticias publicadas y resuelve selecciones antiguas por `id` o `slug`
  - el home ahora reconstruye siempre la URL pública de noticias destacadas desde el contenido resuelto, evitando depender de `cta_url` stale o de slugs guardados manualmente
  - se reforzó la resolución de noticias en hero y secciones destacadas para tolerar configuraciones previas
  - `newsService` ahora devuelve errores más coherentes en vez de caer en mensajes genéricos por excepciones HTTP
- **Validación:**
  - build del frontend ejecutado correctamente después del ajuste

### Nuevo módulo Portal del Socio con layout y navegación interna
- **Objetivo:** crear una nueva sección escalable en `/portaldelsocio` con layout propio, menú persistente y subrutas internas para los módulos del portal.
- **Archivos modificados:**
  - `frontend/src/App.tsx`
  - `frontend/src/features/portal/portalSections.ts`
  - `frontend/src/components/portal/PortalDelSocioLayout.tsx`
  - `frontend/src/pages/PortalSectionPage.tsx`
- **Cambios realizados:**
  - se integró `/portaldelsocio` como conjunto de rutas anidadas dentro del router principal
  - se agregó redirect de `/portaldelsocio` a `/portaldelsocio/inicio`
  - se definió un catálogo central de secciones del portal para construir rutas y menú desde una sola fuente
  - se creó un layout persistente del portal con menú interno responsive y estado activo por sección
  - cada subruta carga dentro del mismo layout y muestra contenido placeholder listo para crecer funcionalmente
- **Validación:**
  - build del frontend ejecutado correctamente después de la implementación

### Administración integrada del Portal del Socio
- **Objetivo:** permitir gestionar desde el panel admin el contenido base del Portal del Socio y hacer que `/portaldelsocio` consuma esos datos.
- **Archivos modificados:**
  - `shared/portalSections.ts`
  - `frontend/src/features/portal/portalSections.ts`
  - `frontend/src/App.tsx`
  - `frontend/src/components/layout/PanelAdminLayout.tsx`
  - `frontend/src/components/portal/PortalDelSocioLayout.tsx`
  - `frontend/src/pages/PortalSectionPage.tsx`
  - `frontend/src/pages/AdminPortalDelSocio.tsx`
  - `frontend/functions/api/_utils/portal.ts`
  - `frontend/functions/api/admin/portal-sections.ts`
  - `frontend/functions/api/portal/sections.ts`
  - `frontend/migrations/0028_create_portal_sections.sql`
- **Cambios realizados:**
  - se creó una entidad dedicada `portal_sections` para almacenar el contenido editable de las secciones del portal
  - se agregó endpoint admin protegido para listar y guardar secciones del portal
  - se agregó endpoint público para que `/portaldelsocio` consuma el contenido administrable
  - se añadió la opción `Portal del Socio` dentro del panel admin
  - se creó una vista de administración interna del portal con listado de secciones y editor de título/descripción
  - el frontend público del portal ahora usa datos provenientes de API y no contenido hardcodeado
- **Validación:**
  - build del frontend ejecutado correctamente después de la integración

### Gestión de documentos del Portal del Socio
- **Objetivo:** permitir subir, administrar y visualizar archivos en la sección `Documentos` del Portal del Socio desde el panel admin.
- **Archivos modificados:**
  - `shared/portalDocuments.ts`
  - `frontend/src/pages/AdminPortalDelSocio.tsx`
  - `frontend/src/pages/PortalSectionPage.tsx`
  - `frontend/src/components/portal/PortalDocumentsPreview.tsx`
  - `frontend/functions/api/_utils/portalDocuments.ts`
  - `frontend/functions/api/admin/portal-documents.ts`
  - `frontend/functions/api/admin/portal-documents/[id].ts`
  - `frontend/functions/api/portal/documents.ts`
  - `frontend/migrations/0029_create_portal_documents.sql`
- **Cambios realizados:**
  - se creó persistencia dedicada para documentos del portal con metadata de nombre, tipo, URL, tamaño y orden
  - se implementó subida de archivos al storage R2 con soporte para PDF, imágenes y documentos ofimáticos comunes
  - se agregó administración en el panel para subir múltiples archivos, renombrarlos y eliminarlos
  - la sección pública `/portaldelsocio/documentos` ahora consume los archivos desde API y los muestra en grilla con preview/icono por tipo
  - se extrajo una grilla reutilizable de documentos para compartir exactamente la misma representación visual entre frontend y admin
  - la estructura quedó preparada para futuras categorías, filtros y ordenamiento
- **Validación:**
  - build del frontend ejecutado correctamente después de la implementación

### Vista previa responsive de Documentos dentro del admin
- **Objetivo:** permitir visualizar desde el panel admin cómo se verá la sección `Documentos` del portal, sin salir del módulo.
- **Archivos modificados:**
  - `frontend/src/pages/AdminPortalDelSocio.tsx`
  - `frontend/src/pages/PortalSectionPage.tsx`
  - `frontend/src/components/portal/PortalDocumentsPreview.tsx`
- **Cambios realizados:**
  - se agregó toggle `Vista previa` dentro de la administración de documentos
  - la vista previa reutiliza la misma grilla y tarjetas del frontend público, evitando duplicar lógica visual
  - se añadieron modos de simulación para desktop, tablet y móvil dentro del panel admin
  - la vista previa refleja archivos actuales, orden y nombres visibles cargados en el módulo
- **Validación:**
  - build del frontend ejecutado correctamente después de la implementación

### Reconstrucción base del módulo Competencias como dashboard navegable
- **Objetivo:** rehacer Competencias desde cero como estructura limpia de navegación interna, sin lógica compleja todavía, tanto en el portal público como en el panel admin.
- **Archivos modificados:**
  - `frontend/src/App.tsx`
  - `frontend/src/features/portal/competenciasSections.ts`
  - `frontend/src/components/portal/CompetenciasDashboardGrid.tsx`
  - `frontend/src/pages/PortalCompetenciasPage.tsx`
  - `frontend/src/pages/PortalCompetenciasSectionPage.tsx`
  - `frontend/src/pages/AdminPortalCompetenciasPage.tsx`
  - `frontend/src/pages/AdminPortalDelSocio.tsx`
- **Cambios realizados:**
  - se reconstruyó Competencias como dashboard interno con navegación por cards hacia cinco sub-secciones
  - se agregaron rutas públicas para equipos, ranking, calendario, resultados y bases dentro de `/portaldelsocio/competencias/*`
  - se agregaron rutas equivalentes dentro del admin en `/panel-admin/portal-del-socio/competencias/*`
  - cada sub-sección quedó con placeholder mínimo, preparada para crecer sin rigidez
  - se mantuvo coherencia visual con el Portal del Socio y el panel admin actual
- **Validación:**
  - build del frontend ejecutado correctamente después de la reconstrucción
