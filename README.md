# EduNexus

**Plataforma educativa digital para conectar estudiantes, docentes y
equipos directivos.**

EduNexus es un proyecto web orientado a centralizar la comunicación, las
actividades académicas y la gestión escolar en una sola plataforma. Su
objetivo es facilitar el seguimiento del aprendizaje y organizar la
interacción entre los miembros de una institución educativa.

> **Estado del proyecto:** documento descriptivo basado en la
> información disponible del desarrollo. Las funciones pueden
> encontrarse en distintos estados de implementación. Verifica cada
> módulo en el entorno actual antes de presentarlo como terminado o
> disponible en producción.

## Objetivos

-   Reunir herramientas académicas y de comunicación en una sola
    aplicación.
-   Facilitar la asignación, entrega y seguimiento de actividades.
-   Permitir que cada usuario acceda a funciones acordes con su rol.
-   Mejorar la organización de cursos, archivos, mensajes y
    notificaciones.
-   Diseñar una base adaptable a distintas instituciones educativas.

## Roles contemplados

-   **Estudiante:** consulta cursos, actividades, materiales, mensajes y
    avisos; entrega trabajos y revisa la información académica que tenga
    habilitada.
-   **Docente:** organiza cursos, publica actividades y recursos, revisa
    entregas y se comunica con sus estudiantes.
-   **Coordinador:** apoya el seguimiento académico y la coordinación de
    procesos institucionales según los permisos configurados.
-   **Director:** consulta y supervisa información institucional de
    acuerdo con sus permisos.
-   **Secretaría:** apoya procesos administrativos y gestión de
    información autorizada.
-   **Administrador:** configura y mantiene la plataforma y sus
    parámetros institucionales.

Los permisos reales deben validarse en el código y en el servidor;
mencionar un rol no implica que todos sus permisos estén terminados.

## Módulos y capacidades del proyecto

-   **Autenticación y cuentas:** inicio de sesión y rutas de usuario. Se
    han contemplado flujos de verificación de correo y recuperación de
    contraseña; confirmar su estado antes de usarlos en producción.
-   **Instituciones:** configuración institucional y código de
    institución para controlar el registro o acceso institucional.
-   **Cursos y aulas:** consulta y organización de cursos, participantes
    y recursos.
-   **Actividades académicas:** publicación, consulta, filtros y estados
    de actividades.
-   **Entregas:** recepción y seguimiento de trabajos de estudiantes.
-   **Calificaciones:** espacio previsto para consultar o gestionar
    resultados académicos según el rol.
-   **Chat y comunicación:** conversaciones directas y grupales; se han
    trabajado requisitos para adjuntar archivos y enviar medios.
-   **Multimedia y archivos:** selector de archivos reutilizable para
    publicaciones, actividades, entregas y chat; se contemplan imágenes,
    audio y video, con un límite de referencia de 50 MB y validación de
    tipo/extensión.
-   **Biblioteca de archivos:** visualización de recursos, filtros por
    tipo y propietario, y vista de lista o cuadrícula.
-   **Notificaciones:** avisos sobre mensajes, actividades,
    calificaciones, anuncios, entregas, comentarios, menciones y
    eventos; se contempla lectura/no lectura y navegación al contenido
    relacionado.
-   **Búsqueda y filtros:** búsqueda de conversaciones y filtros de
    estado en actividades y otros listados.
-   **Paneles y reportes:** paneles diferenciados por rol y seguimiento
    de información relevante.
-   **Perfil y administración:** datos del perfil, roles, parámetros y
    controles administrativos.
-   **Experiencia adaptable:** mejoras de uso en pantallas móviles,
    estados de carga/error, reintentos y guardado automático donde
    corresponda.

## Tecnologías conocidas

-   **Frontend:** React y Vite.
-   **Backend:** Node.js con Express y TypeScript.
-   **Base de datos:** PostgreSQL mediante Supabase y Drizzle ORM.
-   **Almacenamiento de archivos:** se contempla Supabase Storage para
    recursos y enlaces firmados.
-   **Desarrollo:** npm y TypeScript.
-   **Despliegue previsto/usado en el proyecto:** Render para servicios
    web y Supabase para datos/servicios gestionados.

Comprueba `package.json`, los archivos de configuración y las variables
del entorno para confirmar versiones y servicios exactos del estado
actual.

## Ejecución local

1.  Instala una versión de Node.js compatible con el proyecto.
2.  Clona el repositorio.
3.  Instala dependencias con `npm install`.
4.  Configura las variables de entorno necesarias en un archivo `.env`
    local, siguiendo los nombres que exige el código. No subas secretos
    al repositorio.
5.  Ejecuta el script de desarrollo definido en `package.json`. En el
    historial de desarrollo se ha usado `npm run dev:server` para
    iniciar el servidor; verifica los scripts actuales.
6.  Abre la URL y el puerto que muestre la consola. El proyecto ha
    utilizado el puerto `5173` en una configuración local reciente, pero
    puede variar.

## Configuración y seguridad

-   No publiques claves privadas, contraseñas, tokens ni credenciales de
    Supabase.
-   Configura las políticas de acceso y Row Level Security (RLS) de
    Supabase antes de manejar datos reales. Durante el desarrollo se
    detectó que RLS/policies requerían revisión; no asumas que la base
    está protegida.
-   Valida permisos en el backend, no solamente en la interfaz.
-   Valida tipo MIME, extensión y tamaño de archivos en el servidor.
-   Usa enlaces firmados con expiración para archivos privados cuando
    corresponda.
-   Protege los tokens de verificación y recuperación con hash y
    vencimiento.
-   Revisa CORS, sesiones/cookies, límites de solicitudes y registros
    antes de producción.

## Estado y limitaciones conocidas

En el desarrollo se han observado errores de autenticación
(`/api/auth/user` y `/api/auth/login` con respuestas 401/500 en
distintos momentos) y problemas en endpoints de cursos/actividades
(respuestas 403/404 para determinados recursos). Por ello, esta
documentación no certifica que todos los módulos funcionen actualmente.
Antes de una demostración, prueba inicio de sesión, permisos, cursos,
actividades, entregas, archivos y notificaciones con cuentas de prueba.

## Estructura esperada

La estructura exacta depende de la versión del repositorio. En el
desarrollo se han utilizado carpetas/archivos como:

-   `client/`: aplicación frontend.
-   `server/`: API y lógica de servidor.
-   `shared/`: tipos o esquemas compartidos, si existe en la versión
    actual.
-   `package.json`: scripts y dependencias.
-   `.env`: configuración local no versionada.

Consulta el repositorio para confirmar la estructura definitiva.

## Contribuciones

1.  Crea una rama para el cambio.
2.  Describe el problema o funcionalidad.
3.  Ejecuta las comprobaciones disponibles, por ejemplo `npm run check`
    si el script existe.
4.  Envía un Pull Request con resumen, pruebas realizadas y capturas
    cuando sean útiles.

## Licencia

No se ha especificado una licencia en esta documentación. Añade un
archivo `LICENSE` antes de autorizar formalmente la reutilización del
código.

## Autoría

Proyecto EduNexus. Reemplaza esta sección por los nombres, institución y
datos que quieras publicar oficialmente.
