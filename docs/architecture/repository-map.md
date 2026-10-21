# Mapa del repositorio

## Carpetas de primer nivel

| Ruta | Propósito | ¿Se genera? |
|---|---|---:|
| `.claude/` | Configuración local para herramientas de desarrollo asistidas. | No |
| `.git/` | Base de datos e historial de Git. No editar manualmente. | No |
| `attached_assets/` | Imágenes y recursos estáticos fuente usados por el cliente. | No |
| `client/` | Código React, estilos, páginas, componentes y public assets. | No |
| `dist/` | Salida compilada para producción (`dist/public` y bundle de servidor). | Sí; no editar |
| `docs/` | Documentación vigente, auditorías e histórico documental. | No |
| `migrations/` | Migraciones SQL y metadatos de Drizzle. | No |
| `node_modules/` | Dependencias instaladas con npm. | Sí; no editar |
| `scratch/` | Herramientas de análisis temporales y artefactos de raíz archivados. | Parcial |
| `script/` | Script de build del bundle cliente/servidor. | No |
| `scripts/` | Auditorías, smoke script, generador de catálogo API y herramientas locales. | No |
| `server/` | API, autenticación, acceso a datos, integraciones y proveedores. | No |
| `shared/` | Esquema, tipos y validadores compartidos cliente/servidor. | No |
| `supabase/` | Configuración del proyecto Supabase local. | No |
| `uploads/` | Archivos existentes del entorno, consumidos como datos. Puede contener datos de usuarios y no es un directorio de código. | Datos |

## Archivos de la raíz

| Archivo | Propósito |
|---|---|
| `.env` | Secretos y configuración local real; ignorado por Git, no compartir. |
| `.env.example` | Plantilla sin credenciales reales. |
| `.gitignore` | Excluye dependencias, build, entorno y utilidades locales. |
| `.replit` | Configuración de ejecución en Replit, Node y puerto. |
| `README.md` | Portada del repositorio e inicio rápido. |
| `components.json` | Configuración del generador de componentes UI. |
| `drizzle.config.ts` | Configuración de Drizzle Kit y ubicación del esquema/migraciones. |
| `nixpacks.toml` | Fases de instalación/build/arranque para Nixpacks. |
| `package.json` | Scripts npm, dependencias y metadatos del paquete. |
| `package-lock.json` | Árbol de dependencias npm fijado. |
| `postcss.config.js` | Plugins de PostCSS usados por estilos. |
| `tailwind.config.ts` | Tema y contenido detectado por Tailwind. |
| `tsconfig.json` | Compilador TypeScript y alias de módulos. |
| `vite.config.ts` | Cliente, alias, build y proxies de desarrollo. |

## Documentación y scripts movidos

- Documentación de proyecto previa: `docs/archive/legacy-documents/`.
- Lineamientos visuales: `docs/product/design-guidelines.md`.
- Auditorías estáticas: `docs/audits/`.
- Scripts auxiliares personales: `scripts/local-tools/` (ignorados por Git; lee su README antes de ejecutarlos).
- Archivos vacíos y bundle antiguo que no tienen referencias activas: `scratch/legacy-root-artifacts/`.

## Datos que no se deben mezclar con código

`uploads/`, `.env`, bases PostgreSQL/Supabase y buckets remotos contienen datos o secretos. No mover ni borrar al limpiar código. `dist/` y `node_modules/` se regeneran a partir de fuentes y dependencias.
