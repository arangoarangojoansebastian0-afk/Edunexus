# Arquitectura del sistema

## Resumen

EduNexus es una aplicación web TypeScript. El navegador carga una SPA React construida con Vite; el backend Express registra la API, sirve la SPA en producción, abre WebSockets para llamadas y usa PostgreSQL a través de `pg` y Drizzle ORM. El esquema compartido mantiene tablas, validadores Zod y tipos en `shared/schema.ts`.

```text
Navegador (React / Vite)
  ├── HTTP /api/* ──> Express ──> Drizzle ──> PostgreSQL / Supabase
  ├── /ws/calls ────> WebSocket / LiveKit
  └── archivos ─────> Supabase Storage

Servicios opcionales del backend: Resend, Google Classroom, LiveKit,
Web Push/VAPID y proveedor académico Master2000.
```

En desarrollo, Vite escucha en 5173 y proxifica `/api` y `/ws/calls` al servidor de puerto 2000. En producción, `npm run build` genera el cliente en `dist/public` y el bundle Node en `dist/index.cjs`; Express sirve el cliente estático.

## Capas y responsabilidades

### Cliente — `client/`

- `src/App.tsx`: rutas y composición de páginas.
- `src/pages/`: vistas por módulo (inicio, cursos/aula, grupos, mensajería, biblioteca, asesorías, administración, perfil y autenticación).
- `src/components/`: componentes compartidos de interfaz y dominio.
- `src/hooks/`: estado de sesión, preferencias, notificaciones y llamadas.
- `src/lib/queryClient.ts`: cliente de consultas HTTP y caché.
- `public/`: manifest, service worker e iconos PWA.

El cliente aplica controles visuales por rol para la experiencia, pero el servidor debe ser la autoridad final de acceso.

### Servidor — `server/`

- `index.ts`: Express, sesiones persistentes PostgreSQL, logging, manejo de errores, migración/arranque y servidor HTTP.
- `routes.ts`: rutas API de producto, autorización, uploads, WebSockets y conexiones con proveedores.
- `authRoutes.ts` / `authSimple.ts`: registro, login, recuperación, verificación y manejo de credenciales.
- `storage.ts`: operaciones de acceso a datos y reglas de almacenamiento.
- `db.ts`: pool PostgreSQL y Drizzle.
- `migrate.ts`: compatibilidad/migraciones ejecutadas por el arranque.
- `email.ts`, `push.ts`, `googleClassroomAuth.ts`: integraciones externas opcionales.
- `course-access.ts`: reglas reutilizables de acceso a cursos, roster, asistencia y revisión de entregas.
- `providers/`: adaptadores a proveedores externos.

### Modelo compartido — `shared/`

`schema.ts` define el esquema PostgreSQL para Drizzle y crea validadores de entrada derivados de tablas. Los cambios persistentes deben actualizar el esquema y su mecanismo de migración correspondiente.

## Sesión y autenticación

La sesión usa cookie de `express-session` y almacén PostgreSQL (`connect-pg-simple`, tabla `session`). La contraseña se procesa en `authSimple.ts`; los flujos de enlace de correo usan tokens aleatorios y vencimiento registrados en `auth_tokens`. El backend devuelve respuestas JSON; la interfaz consulta `/api/auth/user` para hidratar la sesión.

Verificar el correo no bloquea las funciones regulares de la cuenta en el estado actual. `verified` sigue registrándose como dato y el correo puede enviarse al registrar o reenviar desde el perfil. La recuperación de contraseña usa un flujo y token separados.

## Almacenamiento

Los endpoints de archivos usan validación del servidor y Supabase Storage. El upload de Multer se procesa en memoria, con máximo de 50 MB y hasta cinco archivos en las rutas configuradas. `uploads/` existe en el checkout local como almacenamiento de desarrollo/datos; no debe confundirse con el bucket remoto ni borrarse sin respaldar.

## Persistencia y migraciones

- Esquema ORM: `shared/schema.ts`.
- Migraciones Drizzle: `migrations/` y `migrations/meta/`.
- Inicialización adicional: `server/migrate.ts`, ejecutada al arrancar.
- `npm run db:push` cambia el esquema desde Drizzle Kit y puede alterar la base de datos; revisar antes de usarlo con datos reales.

Hay dos caminos de evolución de esquema (migraciones versionadas y rutinas de migración al arranque). Todo cambio debe revisarse contra ambos para evitar divergencias.

## Construcción y despliegue

La configuración de Vite está en `vite.config.ts`; el build del servidor está en `script/build.ts`. El despliegue descrito por `nixpacks.toml` instala dependencias, construye y ejecuta `npm start`; `.replit` configura Node 20, PostgreSQL 16 y puerto 2000. El proveedor de hosting y su configuración real deben confirmarse en el panel del entorno antes de cada despliegue.
