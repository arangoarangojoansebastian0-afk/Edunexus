# Modelo de datos

La fuente ORM primaria es `shared/schema.ts` (PostgreSQL y Drizzle). Los nombres de abajo corresponden a tablas del esquema actual y se agrupan por responsabilidad. Las relaciones, restricciones y columnas completas están en el archivo fuente; este resumen evita duplicar allí el modelo entero.

## Institución e identidad

`institution_settings`, `users`, `auth_tokens`, `sessions`, `teacher_codes`, `staff_codes`, `audit_logs`.

`users.institution_id` y las claves de institución delimitan los datos por colegio. Los códigos de acceso vinculan registros de personal; `auth_tokens` distingue recuperación de contraseña y verificación de correo.

## Comunidad y contenido

`groups`, `group_members`, `posts`, `comments`, `reactions`, `files`, `events`, `event_participants`, `reports`, `messages`, `questions`, `answers`, `qa_votes`, `badges`, `user_badges`, `recognitions`, `notifications`, `notification_preferences`.

## Estructura académica

`subjects`, `grades`, `academic_groups`, `academic_years`, `academic_periods`, `student_enrollments`, `class_schedules`, `student_observations`, `teaching_assignments`.

## Aula virtual y evaluación

`courses`, `course_enrollments`, `activities`, `course_announcements`, `announcement_comments`, `submissions`, `activity_comments`, `attendance`, `gradebook_entries`.

El acceso por curso se concentra en `server/course-access.ts`. Para reglas concretas de roster, inscripción y visibilidad, consultar esa lógica junto a las rutas API.

## Integraciones y comunicación

`google_classroom_tokens`, `google_classroom_course_links`, `direct_messages`, `message_requests`, `chat_groups`, `chat_group_members`, `chat_group_messages`, `user_blocks`, `call_logs`, `push_subscriptions`, `meet_sessions`, `meet_session_invites`, `meet_participants`.

## Relación padre/acudiente

`parent_student_links` registra vínculos y estados de aprobación entre acudientes y estudiantes. La migración versionada asociada está en `migrations/0002_parent_student_links.sql`.

## Procedimiento para modificar el esquema

1. Actualiza tabla, referencias e índices en `shared/schema.ts`.
2. Añade una migración SQL versionada en `migrations/` y actualiza el journal de Drizzle cuando corresponda.
3. Revisa `server/migrate.ts`, que también crea/actualiza partes del esquema en el arranque.
4. Actualiza tipos/validadores, `server/storage.ts`, rutas y clientes afectados.
5. Aplica el cambio primero en una base de desarrollo con respaldo. Nunca ejecutes `db:push` a ciegas en producción.
