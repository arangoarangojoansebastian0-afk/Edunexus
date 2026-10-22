# Documentación de EduNexus

Este es el índice de la documentación vigente, preparada a partir de los archivos de código y configuración presentes en el repositorio.

## Ingeniería

- [Especificación técnica y funcional de EduNexus](official/EduNexus-Especificacion-tecnica-y-funcional.docx): documento formal vigente sobre módulos, roles, arquitectura, datos, integraciones y operación.
- [Vista general y arquitectura](architecture/system-overview.md): componentes, límites y flujo de solicitudes.
- [Mapa de archivos](architecture/repository-map.md): para qué sirve cada carpeta y archivo de la raíz.
- [Flujos principales](architecture/key-flows.md): registro, sesión, correo, recuperación, cursos y archivos.
- [Modelo de datos](architecture/data-model.md): tablas agrupadas por dominio y fuente de verdad del esquema.
- [Seguridad y privacidad](architecture/security-and-privacy.md): autenticación, permisos, secretos y puntos que requieren validación operativa.

## Operación

- [Desarrollo local](operations/local-development.md): requisitos, comandos y flujo de trabajo.
- [Configuración](operations/configuration.md): variables de entorno y servicios externos.
- [Bitácora de cambios](operations/bitacora.md): registro fechado de cambios funcionales y documentales.

## Referencia

- [Catálogo de API](reference/api-endpoints.md): rutas declaradas en el backend, actualizado desde el código al documentar esta versión.
- [Catálogo funcional](reference/feature-catalog.md): módulos identificados en el cliente y servidor; no sustituye pruebas de aceptación.
- [Revisión anual de promoción](product/annual-promotion.md): calendario, evidencia, consenso docente, resolución directiva y controles institucionales.
- [Plan de implementación priorizado](product/implementation-roadmap.md): backlog de funciones escolares, estado conocido y orden de trabajo.
- [Seguimiento de actividades](product/activity-tracking.md): roster, estados de entrega y filtros disponibles para el docente.
- [Libro de calificaciones docente](product/teacher-gradebook.md): asignaciones, periodos, matrícula y auditoría de notas.
- [Historial de asistencia](product/attendance-history.md): recuentos por estudiante y límites de acceso por rol.
- [Agenda académica](product/academic-calendar.md): fuentes, filtros por tipo y controles institucionales del calendario.
- [Especificación técnica y funcional oficial](official/EduNexus-Especificacion-tecnica-y-funcional.docx): alcance multiinstitucional, perfiles, conexiones, módulos e historial fechado.
- [Guías de diseño](product/design-guidelines.md): lineamientos visuales existentes.

## Calidad

- [Auditoría estática de seguridad](audits/SECURITY_STATIC_AUDIT.md)
- [Auditoría estática de accesibilidad](audits/ACCESSIBILITY_STATIC_AUDIT.md)
- [Auditoría estática de rendimiento](audits/PERFORMANCE_STATIC_AUDIT.md)

## Histórico

Los documentos previos se conservan en [archive/legacy-documents](archive/legacy-documents). Algunos contienen supuestos o instrucciones antiguas; se preservan como referencia histórica y no como fuente normativa. Los archivos sueltos vacíos y un bundle antiguo se preservan en `scratch/legacy-root-artifacts` para mantener la trazabilidad.
