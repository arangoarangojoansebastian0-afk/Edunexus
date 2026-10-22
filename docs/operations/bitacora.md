# Bitácora de cambios

Registro cronológico de cambios relevantes del proyecto. Las fechas usan la zona horaria de Colombia. Cada entrada resume el cambio y enlaza la documentación funcional vigente.

## 2026-10-21 — Revisión colegiada de promoción anual

- Se agregó `/promotions` para docentes, coordinación, dirección y administración institucional, con expedientes de calificaciones, asistencia, observaciones y compromisos del estudiante.
- La apertura toma la fecha de inicio del año académico destino que cada institución configura; por ejemplo, puede establecerse el 1 de octubre.
- Cada docente asignado por horario, aula virtual de grupo o matrícula individual en un curso debe registrar su recomendación justificada. La resolución final de promoción o permanencia exige consenso unánime y aprobación directiva; no se usa un umbral universal de notas.
- La decisión valida el grado y grupo destino dentro de la misma institución. La matrícula destino se crea y la anterior se cierra en una transacción; los aplazamientos conservan el caso activo.
- Se añadieron las tablas `student_promotion_reviews` y `student_promotion_decisions`, la migración [0003](../../migrations/0003_student_promotion_reviews.sql), y validaciones de aislamiento multiinstitucional.
- Se actualizó la [especificación oficial](../official/EduNexus-Especificacion-tecnica-y-funcional.docx) a versión 1.3 y la [especificación funcional del flujo](../product/annual-promotion.md).
- Verificación: `tsc --noEmit` y build de producción completaron correctamente. El render visual del DOCX no se pudo ejecutar porque LibreOffice (`soffice.exe`) no está instalado en este entorno.

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
