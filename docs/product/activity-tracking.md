# Seguimiento de actividades escolares

## Alcance disponible

En cada aula, el docente puede abrir el seguimiento de una actividad y consultar el roster completo del curso. Cada estudiante aparece con uno de cuatro estados: pendiente, atrasada, entregada sin calificar o calificada. La vista presenta la fecha límite o la fecha y hora de envío, permite buscar por nombre y filtrar por estado, y mantiene el acceso directo para calificar una entrega.

La lista toma sus datos de `GET /api/classroom/courses/:id/students` y `GET /api/classroom/activities/:id/submissions`. El servidor comprueba que el usuario pertenezca a la institución y tenga acceso al roster y a las entregas del aula. No se incorpora una matrícula implícita: solo se presenta el alumnado que el backend reconoce como inscrito en ese curso.

## Cálculo de estado

| Estado | Regla visible |
|---|---|
| Calificada | Existe una entrega con nota registrada. |
| Entregada sin calificar | Existe entrega, pero todavía no tiene nota. |
| Atrasada | No existe entrega y ya pasó la fecha límite. |
| Pendiente | No existe entrega y la fecha límite no ha vencido, o la actividad no tiene fecha límite. |

Si existen varios envíos del mismo estudiante, se presenta el más reciente. La edición de nota se mantiene ligada a la entrega concreta mostrada.

## Límites y trabajo pendiente

La vista corresponde a una actividad y un aula a la vez. El tablero general entre varios cursos, grupo y periodo queda registrado en la [hoja de ruta priorizada](implementation-roadmap.md). La etiqueta “Atrasada” solo se calcula para actividades con fecha límite; no reemplaza reglas institucionales de prórroga o excusa.
