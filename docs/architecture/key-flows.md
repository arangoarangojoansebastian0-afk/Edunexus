# Flujos principales de la aplicación

Los flujos describen el estado en el código actual; consulta las rutas fuente al cambiar reglas.

## Registro y verificación de correo

1. `Register.tsx` envía datos a `POST /api/auth/register`.
2. `authRoutes.ts` valida el cuerpo con Zod y `authSimple.ts` crea el usuario, validando código institucional para roles de personal y guardando `verified=false` en las cuentas nuevas.
3. Se crea una sesión para que la persona entre a EduNexus.
4. El servidor genera un token aleatorio con hash en `auth_tokens`, vencimiento de 24 horas y tipo `email_verification`; genera el enlace con `APP_URL` y llama `sendEmail` (Resend).
5. Un fallo de proveedor queda en logs y no invalida el registro.
6. `VerifyEmail.tsx` llama `GET /api/auth/verify-email?token=...`. El servidor valida hash, tipo, uso y vencimiento, actualiza `users.verified` e invalida el token.

La verificación se conserva como estado y como flujo disponible, pero no se exige para las acciones regulares actuales. El perfil puede reenviar un token nuevo.

## Recuperación de contraseña

1. `ForgotPassword.tsx` llama `POST /api/auth/forgot-password`.
2. El servidor responde con el mismo mensaje genérico exista o no la cuenta, para no revelar direcciones registradas.
3. Si existe, genera un token `password_reset` de una hora y envía el enlace mediante `sendEmail`.
4. `ResetPassword.tsx` envía token y contraseña nueva a `POST /api/auth/reset-password`.
5. La contraseña se vuelve a hashear; el token se marca usado y se invalidan sesiones guardadas para el usuario.

El correo de Resend funciona cuando `RESEND_API_KEY` está disponible en el proceso servidor. Sin ella, `email.ts` registra que no se envió el mensaje; el aviso genérico de recuperación no demuestra entrega.

## Sesión

`POST /api/auth/login` valida credenciales y establece `req.session.userId`. `express-session` guarda sesiones en PostgreSQL mediante `connect-pg-simple`. `GET /api/auth/user` carga el usuario para la interfaz. `POST /api/auth/logout` destruye la sesión.

## Acceso a cursos y aulas

El frontend consulta cursos y acciones por `/api/classroom/*`. Las comprobaciones compartidas están en `server/course-access.ts`; rutas consultan si la persona puede ver contenido, roster, asistencia y entregas. La creación del curso puede definir audiencia de grupo y estudiantes; su aplicación efectiva debe comprobarse siempre en el endpoint de lectura/contenido, no solo ocultando botones en el formulario.

## Publicación y archivos

Las rutas reciben metadatos y archivos en el servidor. Multer mantiene el archivo en memoria y limita tamaños/cantidad; se valida extensión/tipo permitido y el backend usa Supabase Storage para persistir medios. Antes de añadir un tipo nuevo, actualiza validación, interfaz de selección, permisos de lectura, almacenamiento y limpieza.

## Inicio del proceso

`server/index.ts` crea Express y el servidor HTTP, configura sesiones/logging, ejecuta `runMigrations()`, registra rutas y luego:

- en producción sirve `dist/public`;
- en desarrollo integra el middleware de Vite;
- escucha el puerto de `PORT` o 2000.

Un error de conexión de migración se registra y el proceso puede seguir; confirma el estado de base y migraciones en logs antes de dar el servicio por listo.
