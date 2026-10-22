# Hoja de ruta de implementación priorizada

Este documento convierte el listado de prioridades del producto en trabajo verificable para EduNexus, una aplicación multiinstitucional. “Base existente” indica que ya hay una ruta o pantalla relacionada; no certifica que el flujo esté completo, desplegado o aceptado por cada rol. Cada avance funcional debe conservar los filtros por institución y los permisos del servidor.

## Prioridad alta — trabajo escolar

| N.º | Función | Estado | Próximo alcance |
|---:|---|---|---|
| 1 | Panel de trabajo docente | Base existente | Aulas asignadas, conteo de revisiones y próximas tareas en Inicio. Mejorar clases próximas y avisos del docente. |
| 2 | Seguimiento de actividades | Primera entrega completada el 22-10-2026 | Roster por actividad, búsqueda y estado pendiente/atrasado/entregado/calificado. Falta consolidar filtros y reportes entre cursos y grupos. |
| 3 | Libro de calificaciones completo | Base existente, requiere completar | Revisar promedio por periodo contra el modelo de cada institución, y alinear vistas de estudiante y docente. |
| 4 | Asistencia por curso | Base existente | Toma de lista e historial por aula; completar reportes de ausencias y tardanzas con filtros institucionales. |
| 5 | Agenda académica unificada | Base existente, requiere integrar | Calendario existente; consolidar clases, entregas, evaluaciones, eventos y asesorías, con filtros por aula y avisos próximos. |
| 6 | Anuncios dirigidos | Base parcial | El contenido del aula respeta su audiencia. Falta evidencia visible de quién recibió cada aviso y selección de varios destinos/estudiantes en un mismo envío. |
| 7 | Inscripción y acceso confiables | Base existente, requiere auditoría | Mantener audiencia por grupos/alumnos y validar las mismas reglas en cada endpoint, pantalla, consulta y enlace directo. |

## Prioridad alta — experiencia por perfil

| N.º | Función | Estado | Próximo alcance |
|---:|---|---|---|
| 8 | Inicio distinto para cada perfil | Base parcial | Inicio ya presenta acciones por rol; completar tareas y resúmenes específicos para acudiente y personal administrativo. |
| 9 | Portal de acudientes | Base existente | Ampliar asistencia, actividades, fechas y avances respetando aprobación del vínculo y permisos sobre cada menor. |
| 10 | Orientación para docentes nuevos | Pendiente | Guía contextual para asignaciones, aulas, actividades y revisión de trabajos. |
| 11 | Permisos administrativos configurables | Pendiente | Matriz clara por secretaría, coordinación, dirección y administración, aplicada también en servidor. |

## Prioridad media — comunicación y colaboración

| N.º | Función | Estado | Próximo alcance |
|---:|---|---|---|
| 12 | Notificaciones configurables | Base parcial | Preferencias para notificaciones dentro de EduNexus y por correo según evento y usuario. |
| 13 | Mensajes vinculados a aulas | Base parcial | Mejorar mensajes de curso con reporte, bloqueo y moderación institucional. |
| 14 | Retroalimentación en entregas | Base parcial | Completar devolución con comentarios, archivos e instrucciones para corregir y volver a entregar. |
| 15 | Banco de recursos del curso | Base parcial | Organizar por aula y tema; explicitar quién puede descargar, sustituir o retirar cada archivo. |
| 16 | Centro de ayuda | Pendiente | Guías breves sobre registro, correo, contraseña, aulas y resolución de problemas. |

## Prioridad media — gestión institucional

| N.º | Función | Estado | Próximo alcance |
|---:|---|---|---|
| 17 | Informes exportables | Base parcial | Completar exportación PDF y Excel de asistencia, notas, entregas y matrícula con permisos por institución. |
| 18 | Historial de cambios administrativos | Pendiente de verificar e implementar | Registrar actor, fecha, valor anterior y nuevo para cambios de notas, matrícula, grupos y permisos. |
| 19 | Importación masiva | Pendiente | Plantillas, validación, vista previa y reporte de filas rechazadas antes de persistir. |
| 20 | Periodos y cierre académico | Base parcial | Configurar fechas y reglas de promedio; bloquear o auditar cambios tras el cierre. |
| 21 | Gestión de grupos académicos | Base existente, requiere completar | Distinguir grupos escolares de grupos sociales y evitar duplicados al crear cursos por materia. |

## Prioridad transversal — confianza y facilidad de uso

| N.º | Función | Estado | Próximo alcance |
|---:|---|---|---|
| 22 | Experiencia móvil | En curso | Revisar pantallas pequeñas en todas las áreas, especialmente administración, tablas, formularios, menús y aulas. |
| 23 | Cargas y errores útiles | En curso | Estandarizar mensajes comprensibles, reintentos y registro técnico interno sin exponer HTML o nombres de tablas. |
| 24 | Búsqueda global | Base parcial | Añadir cursos, grupos y entregas según rol, preservando límites de lectura y de institución. |
| 25 | Accesibilidad | En curso | Mejorar teclado, contraste, etiquetas y controles táctiles; revisar con auditoría y uso real. |
| 26 | Privacidad y seguridad estudiantil | En curso | Revisar visibilidad, moderación, retención y acceso familiar, especialmente para menores. |
| 27 | Estado de integraciones | Pendiente | Mostrar configuración y salud de correo, archivos, avisos y videollamadas sin revelar secretos. |
| 28 | Aceptación por rol | Pendiente de consolidar | Documentar y verificar flujos de estudiante, docente, acudiente y personal institucional antes de publicar. |

## Orden de ejecución

El primer tramo empieza por seguimiento, calificaciones, asistencia, agenda y controles de acceso del aula. El seguimiento por actividad se completó parcialmente en esta entrega: el docente ya ve el estado de cada estudiante del roster, con búsqueda y filtro. El trabajo siguiente es cerrar la matriz de calificaciones por periodo y ampliar el seguimiento consolidado entre cursos.

Después se abordarán el portal familiar, los informes, la adaptación móvil y los flujos de permisos. Los indicadores de integración deben describir el entorno donde corre cada institución y no asumir que las credenciales locales están presentes en producción.
