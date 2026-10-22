# Entrega y lectura de anuncios del aula

## Audiencia del aula

El tablón pertenece a un curso y solo pueden consultarlo el docente asignado, el personal institucional autorizado y los estudiantes matriculados activos. La institución del usuario debe coincidir con la del curso. La audiencia se determina por la matrícula del aula, incluidos los grupos y estudiantes seleccionados al configurar el curso.

## Registro de destinatarios

Al publicar en el tablón, EduNexus crea una entrega para cada estudiante activo de la matrícula del curso (excluye al autor y cuentas que no sean estudiantes) y emite la notificación existente. Al cargar el tablón como estudiante, el servidor registra la primera lectura de los avisos que le fueron entregados.

El docente asignado y el personal con acceso al tablón ven, debajo de cada publicación, la cantidad de destinatarios, cuántos la han abierto y el estado de lectura por estudiante. El endpoint solo adjunta nombres a los roles autorizados; los estudiantes no reciben el registro de lectura de sus compañeros.

## Persistencia y alcance

La tabla `course_post_recipients` vincula cada `post_id` con `user_id`, fecha de entrega y fecha de primera lectura. Una restricción única evita duplicar destinatarios de la misma publicación. La migración idempotente vive en `server/migrate.ts`; no requiere una acción manual en despliegues que ejecutan el arranque habitual.

Las publicaciones anteriores a esta función no tienen un historial fiable de destinatarios y se muestran como sin registros de entrega. El sistema no inventa entregas ni lecturas históricas.

## Pendiente

La publicación sigue siendo por curso. Enviar un mismo aviso a varios cursos o elegir destinatarios distintos por aviso requiere definir reglas de composición, permisos y almacenamiento de audiencias sin permitir filtraciones entre instituciones.
