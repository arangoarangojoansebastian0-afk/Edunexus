# EduNexus --- Guía de instalación y puesta en marcha

## Requisitos

-   Node.js en una versión compatible con `package.json`.
-   npm.
-   Acceso a la configuración de Supabase/PostgreSQL del entorno.
-   Variables de entorno requeridas por el código.
-   Git para clonar y versionar el proyecto.

## Instalación

``` bash
git clone https://github.com/arangoarangojoansebastian0-afk/LoyolaCommunity.git
cd LoyolaCommunity
npm install
```

El nombre del repositorio y la URL deben ajustarse si el repositorio
público fue renombrado o si EduNexus se encuentra en otro repositorio.

## Variables de entorno

Crea un `.env` local usando los nombres de variables que el proyecto
realmente espera. No publiques credenciales. Si vas a preparar un
`.env.example`, incluye nombres y valores ficticios, no claves válidas.

Variables habituales que pueden ser necesarias, dependiendo del
código: - URL de la base de datos PostgreSQL/Supabase. - Claves públicas
y privadas de servicios que utilice el backend. - Secretos de sesión o
autenticación. - URL pública del frontend y configuración de CORS. -
Configuración de almacenamiento de archivos.

No inventes nombres de variables: comprueba las referencias del código y
la configuración de despliegue.

## Ejecutar

Consulta `scripts` en `package.json`. En una fase de desarrollo se usó:

``` bash
npm run dev:server
```

El servidor local ha utilizado el puerto 5173 en una configuración
reciente, pero debes usar el puerto que indique la terminal y revisar
que no esté ocupado.

## Comprobaciones

Si existe el script correspondiente, ejecuta:

``` bash
npm run check
```

También verifica los scripts de build y pruebas disponibles en
`package.json`.

## Seguridad antes de producción

-   Habilitar y comprobar políticas RLS adecuadas en Supabase.
-   Revisar permisos en cada endpoint.
-   No usar datos reales de estudiantes en una demo pública.
-   Validar y limitar archivos subidos.
-   Proteger tokens, sesiones y secretos.
-   Configurar HTTPS y dominios permitidos.
-   Configurar copias de seguridad y recuperación.
-   Revisar privacidad, retención de datos y obligaciones aplicables a
    información de menores.

## Diagnóstico inicial

Si aparecen errores 401, revisa autenticación/sesión y cookies. Si
aparecen 403, revisa permisos del usuario y políticas de base de datos.
Si aparecen 404, confirma la ruta del frontend, endpoint del servidor y
existencia del recurso. Si aparecen 500, revisa la consola del backend y
los registros, evitando compartir secretos en capturas.
