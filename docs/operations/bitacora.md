# Bitácora de cambios

Registro cronológico de cambios relevantes del proyecto. Las fechas usan la zona horaria de Colombia. Cada entrada resume el cambio y enlaza la documentación funcional vigente.

## 2026-10-22 — Centro de ayuda y guía inicial docente

- Se añadió el centro autenticado `/help` con búsqueda de preguntas frecuentes filtradas por rol y enlaces a las secciones correspondientes.
- El perfil docente recibe una guía inicial para abrir aulas, publicar actividades, revisar entregas y consultar la agenda.
- Se añadió el acceso a la ayuda en la navegación general y se documentó el alcance en la [guía del centro de ayuda](../product/help-center.md), el catálogo funcional y la hoja de ruta. La especificación oficial pasa a versión 2.0.
- Verificación: `npm run check` y `npm run build` completaron correctamente. No se ejecutaron pruebas automatizadas. El render visual del DOCX no está disponible porque LibreOffice (`soffice.exe`) no está instalado.

## 2026-10-22 — Seguimiento de entrega y lectura de anuncios

- Cada publicación nueva del tablón registra destinatarios según la matrícula activa del curso y excluye al autor.
- Al abrir el tablón, cada estudiante marca como leídas las publicaciones que recibió. El docente asignado y personal autorizado pueden revisar nombres y estados; las cuentas de estudiantes no reciben esos datos.
- Se añadió la tabla idempotente `course_post_recipients` en el esquema y migración de arranque. Las publicaciones históricas sin registros no se presentan como notificadas.
- Se documentó el flujo en [entrega de anuncios](../product/announcement-delivery.md), la hoja de ruta, el catálogo y la especificación oficial, versión 1.9.
- Verificación: `npm run check` y `npm run build` completaron correctamente. No se ejecutaron pruebas automatizadas. El render visual del DOCX no está disponible porque LibreOffice (`soffice.exe`) no está instalado.

## 2026-10-22 — Filtros por tipo en la agenda académica

- El calendario ya integra clases recurrentes, eventos y asesorías institucionales, y fechas de entrega; ahora se puede activar u ocultar cada tipo y filtrar entregas por curso o clases por grupo.
- Los filtros afectan solamente la presentación. Las tres fuentes siguen usando sus rutas existentes, con autorización por institución y rol en servidor.
- Se documentó el alcance y sus pendientes en [agenda académica](../product/academic-calendar.md), el catálogo funcional, la hoja de ruta y la especificación oficial, versión 1.8.
- Verificación: `npm run check` y `npm run build` completaron correctamente. No se ejecutaron pruebas automatizadas. El render visual del DOCX no se pudo completar porque LibreOffice (`soffice.exe`) no está instalado en este entorno.

## 2026-10-22 — Historial de asistencia por estudiante

- Se agregó una consulta de historial limitada a 90 días como máximo y una vista inicial de los últimos 30 días en el aula.
- El docente autorizado ve el total de registros, ausencias, tardanzas y excusas por estudiante; el estudiante solo puede consultar su propio historial.
- El cliente conserva la toma diaria de asistencia y ofrece abrir u ocultar el resumen sin mezclarlo con el roster de otro curso.
- Se actualizaron la hoja de ruta, el catálogo de API y el catálogo funcional. La especificación oficial pasa a versión 1.6.
- Verificación: `npm run check` completó correctamente. No se ejecutaron pruebas automatizadas.

## 2026-10-22 — Libro de calificaciones para docentes

- La vista docente de calificaciones ahora incluye el libro consolidado por materia, grupo y periodo del año activo.
- Cada docente solo consulta grupos y materias de sus asignaciones, estudiantes matriculados en el año activo de su institución y periodos de ese mismo año.
- Se puede registrar o actualizar una nota cuantitativa o cualitativa. La API valida en servidor asignación, institución, periodo y matrícula antes de guardar.
- Los cambios registran actor, nota anterior y nueva en `audit_logs`; notas institucionales de otras materias no se devuelven en la respuesta del espacio docente.
- Se actualizó la hoja de ruta y el catálogo funcional; la especificación oficial pasa a versión 1.5.
- Verificación: `npm run check` completó correctamente. No se ejecutaron pruebas automatizadas.

## 2026-10-22 — Seguimiento completo de entregas por actividad

- El panel de entregas del aula ahora incluye a todos los estudiantes inscritos, incluso cuando aún no han enviado su trabajo.
- Cada fila identifica el estado como pendiente, atrasada, entregada sin calificar o calificada; se muestra la fecha límite o la hora de envío cuando aplica.
- Se añadieron búsqueda por estudiante y filtros por estado. El docente puede abrir la calificación desde la misma lista.
- La vista combina los endpoints existentes de roster y entregas. El servidor conserva sus controles de institución, relación con el curso y rol; no se añadió una tabla ni migración.
- Se actualizó el catálogo funcional, el catálogo de API, la hoja de ruta y la especificación oficial a versión 1.4.
- Verificación: `npm run check` completó correctamente. No se ejecutaron pruebas automatizadas.

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
