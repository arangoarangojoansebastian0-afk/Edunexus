# Bitácora de cambios

Registro cronológico de cambios relevantes del proyecto. Las fechas usan la zona horaria de Colombia. Cada entrada resume el cambio y enlaza la documentación funcional vigente.

## 2026-10-21 — Navegación diferenciada por rol

- Se separaron los accesos laterales para estudiantes, docentes, acudientes, personal institucional, administradores institucionales y superadministradores.
- El menú docente muestra accesos de trabajo docente, como sus aulas y la revisión de entregas; “Mi Grupo” solo aparece cuando el docente tiene un grupo asignado.
- La vista de calificaciones identifica la revisión de entregas para docentes y conserva el nombre “Calificaciones” para estudiantes.
- Se actualizó el [catálogo funcional](../reference/feature-catalog.md) y la sección de roles del [README](../../README.md).
- Se creó la especificación oficial [EduNexus — Especificación técnica y funcional](../official/EduNexus-Especificacion-tecnica-y-funcional.docx), versión 1.0, con arquitectura, módulos, perfiles, persistencia, integraciones y operación.

## 2026-10-21 — Panel de trabajo docente multiinstitucional

- Inicio ahora presenta al docente sus aulas activas y el número de entregas pendientes de revisión, con accesos directos al aula y a la revisión.
- El endpoint `/api/teacher/workspace` calcula los conteos en el servidor y filtra por el docente autenticado y su institución; la caché del cliente distingue usuario e institución.
- La especificación oficial subió a versión 1.2 y declara explícitamente el aislamiento multiinstitucional; el catálogo funcional también fue actualizado.
