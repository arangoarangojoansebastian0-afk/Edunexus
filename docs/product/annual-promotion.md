# Revisión anual de promoción estudiantil

## Propósito

El flujo ayuda a cada institución a revisar de forma colegiada la continuidad académica de sus estudiantes al cierre del año. No decide con una nota de corte ni cambia matrículas automáticamente: reúne antecedentes, solicita la recomendación de cada docente que enseñó al estudiante y requiere una resolución humana de dirección.

## Calendario

La ronda de revisión para el año de origen se abre en la fecha de inicio configurada para el año académico destino. Por ejemplo, una institución puede crear el año destino y establecer su inicio el 1 de octubre. La fecha pertenece al calendario de cada institución; EduNexus no impone el mismo día a todos los colegios.

El personal institucional debe crear el año destino antes de la revisión. Si el año siguiente no existe o no tiene fecha de inicio, la pantalla informa que falta configuración y bloquea el registro de recomendaciones y decisiones.

## Evidencia presentada

El expediente reúne la información disponible para el estudiante en el grupo y año seleccionados:

- Calificaciones por asignatura y periodo.
- Conteos y registros de asistencia, ausencias y llegadas tarde.
- Observaciones académicas y de convivencia registradas durante el año.
- Estado de convivencia y compromisos académicos o de convivencia asociados a la matrícula.
- Recomendación y justificación de cada docente asignado.

El conjunto depende de la información que docentes y personal hayan registrado. Una ausencia de registros no equivale a una valoración positiva ni negativa.

## Recomendaciones y resolución

Cada docente asignado mediante horario/enseñanza, responsable de un aula virtual del grupo o docente con inscripción directa del estudiante al curso registra una opción: promover, mantener en el grado o solicitar revisión adicional. Debe incluir una justificación escrita; puede editar su propio aporte mientras el caso siga abierto.

Para aprobar promoción o permanencia, todos los docentes requeridos deben haber enviado la misma recomendación. Si hay recomendaciones faltantes, desacuerdo o una solicitud de revisión adicional, dirección puede aplazar el caso; la matrícula de origen permanece activa y se puede continuar la deliberación.

Administración institucional, dirección o coordinación registra la decisión final y el acta/justificación. Para promoción elige un grupo del grado inmediatamente siguiente; para permanencia, un grupo del mismo nivel. El cambio valida que año, estudiante, grupos y grados pertenezcan a la misma institución. Una sola transacción crea la nueva matrícula y cierra la matrícula revisada. Un aplazamiento solo conserva el expediente y no modifica la matrícula.

## Permisos y privacidad

Los docentes consultan únicamente expedientes de estudiantes a quienes enseñan por asignación de grupo, curso virtual vinculado o inscripción directa al curso, además de sus designaciones como director de grupo. Dirección, coordinación y administración institucional pueden consultar y resolver los casos de su colegio. Secretaría y estudiantes no reciben acceso a esta herramienta.

Las rutas vuelven a validar identidad, rol, institución, periodo, grupo y relación docente; el cliente no es la autoridad de permisos. Las tablas de recomendaciones y decisiones incluyen `institution_id`, y las decisiones conservan quién resolvió, fecha, resultado, matrícula destino y justificación. Los datos pertenecen a cada institución y nunca se mezclan con el conjunto de otro colegio.

## Persistencia e integración

El esquema de `shared/schema.ts` declara `student_promotion_reviews` y `student_promotion_decisions`. El cambio se aplica mediante la migración `migrations/0003_student_promotion_reviews.sql` y la inicialización del servidor en `server/migrate.ts`.

La pantalla vive en `client/src/pages/Promotions.tsx`; el backend implementa lectura, recomendación y decisión en `server/routes.ts`. La entrada se muestra en los menús de docentes, administración, dirección y coordinación. El modelo académico destino usa los años y grupos existentes; no se requiere un servicio externo.

## Limitaciones deliberadas

- Las instituciones definen sus propios criterios y fechas; no se codifican reglas universales de aprobación.
- La pantalla expone evidencia registrada en EduNexus, no información que aún esté en otros sistemas.
- Este flujo requiere revisión y aprobación humana; no programa procesos automáticos ni notifica familias por correo.
- Si un estudiante está en el último grado o tiene una ruta de graduación especial, dirección debe tramitarlo conforme al procedimiento institucional vigente. El flujo actual cubre promoción al grado siguiente o permanencia.
