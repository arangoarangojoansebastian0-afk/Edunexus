# Libro de calificaciones docente

## Alcance

El docente consulta y registra notas consolidadas de sus asignaturas en el año académico activo de su institución. La pantalla combina grupo y materia asignados, periodo, estudiantes matriculados y notas previamente registradas. Permite crear o actualizar una nota cuantitativa o cualitativa, conservando el modelo de calificación que la institución declara.

## Conexiones y permisos

El cliente `client/src/pages/Grades.tsx` consume `GET /api/gradebook/teacher/workspace` para cargar el espacio y envía las modificaciones a `POST /api/gradebook/teacher/workspace`. El servidor limita las asignaciones a `teaching_assignments` del docente autenticado; comprueba la institución del grupo, grado y materia; usa únicamente el año activo y sus periodos; y exige que el estudiante esté matriculado en ese grupo durante ese año.

Las notas se persisten en `gradebook_entries`. No se añadieron tablas ni migraciones. Cada registro o actualización genera un evento en `audit_logs` con docente, estudiante, grupo, materia, periodo y nota previa/nueva. Las notas de materias que el docente no tiene asignadas no se incluyen en la respuesta.

## Límites actuales

Esta entrega permite captura y actualización individual. El cierre de periodos, promedios ponderados configurables, cálculo completo de escala mixta y captura masiva quedan pendientes. La administración institucional conserva sus pantallas de boletines y exportaciones existentes.
