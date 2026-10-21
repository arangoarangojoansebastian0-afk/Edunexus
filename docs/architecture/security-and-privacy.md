# Seguridad y privacidad

Este documento refleja controles observables en el repositorio; no es una certificación de seguridad ni reemplaza una revisión de configuración, infraestructura y políticas de datos.

## Controles presentes en el código

- Sesiones del servidor guardadas en PostgreSQL; cookie `httpOnly` y vencimiento de siete días.
- Contraseñas procesadas con bcrypt (`server/authSimple.ts`).
- Tokens de recuperación/verificación aleatorios, almacenados en hash y con vencimiento (`server/authRoutes.ts`).
- Límites de solicitudes para login, registro, mensajería y recuperación (`server/rateLimit.ts`).
- Validación de esquemas de entrada con Zod en varias rutas.
- Autorización centralizada en middleware de `server/routes.ts` y reglas reutilizables de cursos.
- Límite de tamaño, número y extensiones para uploads; operaciones de datos segregadas por institución en varias rutas.
- Redacción de `passwordHash` en serialización JSON (`server/index.ts`).
- Secretos omitidos de Git mediante `.gitignore` para `.env`.

## Revisión necesaria antes de producción

1. Configurar `SESSION_SECRET` largo y aleatorio. `server/index.ts` contiene un valor por defecto de desarrollo; eliminar ese fallback antes de producción.
2. Revisar cookies: `secure` está configurado como `false`; en HTTPS público debe revisarse la política de cookie segura y proxy confiable.
3. Revisar políticas RLS y permisos de los buckets de Supabase, ya que el backend usa una clave de servicio. No asumir que RLS protege automáticamente las llamadas del servidor.
4. Auditar cada ruta con roles y límites de institución; el control visual del cliente no constituye autorización.
5. Confirmar que los tokens de proveedores y secretos no aparezcan en logs, respuestas, capturas o repositorio.
6. Definir reglas de privacidad, retención, copias y acceso para datos de estudiantes y menores según el contexto institucional aplicable.
7. Revisar validación real de MIME/tipo, autorización de lectura y enlaces compartidos para cada tipo de archivo.
8. Limitar y monitorizar rutas de correo, llamadas, mensajes y endpoints administrativos en el entorno público.
9. Configurar HTTPS, dominio de aplicación, origen permitido y `APP_URL` según el host real.
10. Revisar las auditorías estáticas en `docs/audits/`; son análisis automatizados y no cubren fallas de lógica o configuración.

## Datos y dependencias externas

El servicio puede transmitir datos de correo a Resend, tokens OAuth a Google, medios a Supabase Storage, datos de reunión a LiveKit y solicitudes a Master2000 si se configura. Habilitar cada integración requiere revisar los datos enviados, región, credenciales, políticas de acceso y acuerdos de tratamiento aplicables.
