# Desarrollo local

## Requisitos

- Node.js 20 (alineado con `.replit` y Nixpacks) y npm.
- PostgreSQL accesible; puede ser el PostgreSQL de Supabase.
- Git para trabajar con el repositorio.

## Preparación

```powershell
npm install
Copy-Item .env.example .env
```

Completa `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` y un `SESSION_SECRET` aleatorio en `.env`. Aunque algunos proveedores son opcionales, el cliente Supabase se inicializa al registrar las rutas. Añade `RESEND_API_KEY` si quieres probar correo. El `.env` no debe subirse ni compartirse.

## Arranque

```powershell
npm run dev
```

Abre `http://localhost:5173` para la interfaz. Vite redirige las solicitudes API y WebSocket al servidor Express del puerto 2000. Si el entorno ya configura el servicio web detrás de otro puerto, usa el URL mostrado en la consola.

También existen `npm run dev:server` (servidor con Vite integrado según entorno) y `npm run dev:client` (solo Vite; requiere API aparte).

## Comprobaciones disponibles

```powershell
npm run check
npm run build
npm run test:course-access
npm run smoke
npm run audit:security
npm run audit:accessibility
npm run audit:performance
```

Las auditorías estáticas y el smoke script no sustituyen pruebas manuales de permisos por rol, institución, datos y archivos.

## Estructura de trabajo

- Cambios UI: `client/src/`.
- Rutas/lógica de negocio API: `server/routes.ts`, o `server/authRoutes.ts` para identidad.
- Reglas de acceso: módulo de dominio, por ejemplo `server/course-access.ts`.
- Datos: `shared/schema.ts`, migraciones y almacenamiento en `server/storage.ts`.
- Tests y auditorías: junto al módulo o bajo `scripts/`.
- Documentación actual: `docs/`; utilidades personales: `scripts/local-tools/`.

Antes de terminar un cambio, revisa `git status`, `git diff --check` y que no se incluyan `.env`, `uploads/`, `node_modules/` o `dist/`.
