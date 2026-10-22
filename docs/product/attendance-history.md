# Historial de asistencia por curso

## Alcance disponible

La pestaña de asistencia del aula conserva la toma de lista diaria y ahora ofrece un resumen del historial de los últimos 30 días. El personal autorizado ve, por estudiante, el número de registros, ausencias, tardanzas y excusas, junto con los últimos registros fechados. Un estudiante que abre su propio curso consulta solamente su asistencia.

## Conexión y límites

El cliente consulta `GET /api/classroom/courses/:id/attendance/history?from=AAAA-MM-DD&to=AAAA-MM-DD`. La ruta verifica acceso al curso y limita el periodo solicitado a 90 días. Docentes asignados y personal académico autorizado pueden consultar el curso; un estudiante debe estar inscrito y la API filtra siempre por su propio usuario. La consulta también filtra por institución.

No se cambió el esquema de persistencia. Las exportaciones ni los filtros administrativos por periodos más amplios forman parte de esta entrega.
