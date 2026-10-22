# Agenda académica unificada

## Alcance

El calendario de EduNexus combina en una sola vista los eventos y asesorías institucionales, las fechas de entrega de actividades y las clases recurrentes del horario. Está disponible en vistas de mes, semana, día y agenda.

## Filtros

Los controles de filtro activan o desactivan de forma independiente eventos y asesorías, entregas y clases. También se puede filtrar las entregas por curso y las clases por grupo. Los eventos son institucionales y permanecen visibles al escoger curso o grupo, porque el modelo actual no los asocia a un aula.

Los filtros solo cambian lo que se muestra en pantalla: no alteran las consultas ni amplían el acceso del usuario a datos.

## Fuentes y permisos

| Tipo | Fuente | Restricción aplicada |
|---|---|---|
| Eventos y asesorías | `GET /api/events` | Eventos de la institución del usuario autenticado. |
| Entregas | `GET /api/classroom/my-activities` | Actividades de cursos de la institución; estudiantes consultan las publicadas en sus cursos inscritos y docentes sus cursos. |
| Clases | `GET /api/admin/schedules` | Horarios filtrados por institución; docentes por sus horarios y estudiantes por sus grupos matriculados. |

La interfaz agrupa cada elemento en la fecha correspondiente. Los horarios se repiten según el día de semana configurado. Las actividades sin fecha límite no aparecen en el calendario.

## Pendiente

Esta primera entrega no añade evaluación con fecha propia ni recordatorios configurables. Esos alcances continúan en la hoja de ruta y requieren definir sus reglas de origen y notificación.
