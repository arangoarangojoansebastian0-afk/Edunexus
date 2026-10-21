# EduNexus --- Documento general del proyecto

## 1. Resumen ejecutivo

EduNexus es una plataforma web educativa que busca reunir en un entorno
digital los procesos de comunicación, organización de cursos y
seguimiento académico de una institución. Está pensada para estudiantes,
docentes, coordinadores, directores, personal de secretaría y
administradores, con funciones diferenciadas según el rol.

La propuesta busca reducir la dispersión de información entre
herramientas, facilitar el acceso a materiales y actividades, y mejorar
la comunicación entre los integrantes de la comunidad educativa.

**Importante:** este documento describe el alcance conocido y las
funciones contempladas durante el desarrollo. No sustituye una auditoría
del código ni una prueba funcional. Cada módulo debe marcarse como
implementado, parcial, pendiente o bloqueado después de probar la
versión actual.

## 2. Problema y justificación

En una comunidad educativa, los cursos, mensajes, recursos, actividades,
entregas, calificaciones y avisos pueden quedar repartidos entre
diferentes herramientas. Esto dificulta encontrar información, hacer
seguimiento y mantener una comunicación ordenada.

EduNexus propone centralizar esos procesos y ofrecer una experiencia
coherente, con acceso basado en roles y una estructura que pueda
adaptarse a diferentes instituciones.

## 3. Objetivo general

Desarrollar una plataforma educativa web que centralice la comunicación
y la gestión de procesos académicos, facilitando la interacción entre
estudiantes, docentes y personal institucional.

## 4. Objetivos específicos

-   Organizar cursos, participantes y recursos académicos.
-   Facilitar la publicación, consulta y entrega de actividades.
-   Incorporar herramientas de comunicación directa y grupal.
-   Gestionar archivos y contenido multimedia con controles de tipo y
    tamaño.
-   Proporcionar notificaciones y filtros para encontrar información
    relevante.
-   Separar las funciones de acuerdo con los roles y permisos.
-   Diseñar una interfaz adaptable y mejorar la recuperación ante
    errores.
-   Establecer una base técnica mantenible para futuras ampliaciones.

## 5. Usuarios y roles

### Estudiante

Consulta cursos y materiales, revisa actividades, entrega trabajos y usa
los canales de comunicación habilitados. Puede consultar calificaciones
cuando el sistema y sus permisos lo permitan.

### Docente

Organiza la información de sus cursos, publica actividades y materiales,
revisa entregas y se comunica con estudiantes.

### Coordinador

Apoya el seguimiento de procesos académicos y la coordinación de cursos
o usuarios de acuerdo con los permisos configurados.

### Director

Consulta información institucional y supervisa procesos autorizados.

### Secretaría

Apoya tareas administrativas y el manejo de información institucional a
la que tenga acceso.

### Administrador

Gestiona parámetros de la plataforma, configuración institucional, roles
y tareas de mantenimiento autorizadas.

Los nombres de roles y las descripciones son funcionales. Los permisos
exactos deben comprobarse en los middlewares, rutas del servidor y
políticas de base de datos.

## 6. Módulos funcionales

### 6.1 Autenticación y acceso

-   Inicio de sesión y consulta de la sesión del usuario.
-   Identificación de la institución mediante un código institucional
    para el flujo de registro/acceso.
-   Flujos previstos para verificación de correo y recuperación de
    contraseña mediante tokens seguros.
-   Autorización de endpoints y recursos por rol.

**Validación necesaria:** comprobar respuestas de login y sesión,
expiración de sesión, errores, recuperación y verificación antes de
presentar estas funciones como operativas.

### 6.2 Instituciones y configuración

-   Parámetros de la institución.
-   Código institucional como control de registro o acceso, no como
    identificador único de cada usuario.
-   Base para separar configuración y experiencia institucional.

### 6.3 Cursos y aulas

-   Listado y detalle de cursos.
-   Consulta de docentes y estudiantes inscritos.
-   Acceso a actividades y recursos del curso.
-   Vistas de tablero o contenidos académicos, según el estado actual.

### 6.4 Actividades académicas

-   Publicación y consulta de actividades.
-   Búsqueda y filtros por estado.
-   Información sobre instrucciones, fechas y recursos adjuntos, según
    los campos implementados.
-   Estados de carga, error y reintento.

### 6.5 Entregas y seguimiento

-   Entrega de trabajos por estudiantes.
-   Consulta y revisión de entregas por docentes.
-   Adjuntos reutilizando el selector multimedia.
-   Seguimiento del estado de entrega, según las reglas actuales.

### 6.6 Calificaciones

-   Espacio funcional para consultar o gestionar calificaciones según
    permisos.
-   Debe garantizarse que cada estudiante solo pueda consultar su
    información y que los docentes solo gestionen los cursos
    autorizados.

### 6.7 Chat y mensajería

-   Conversaciones directas y grupales contempladas.
-   Búsqueda y filtros de conversaciones.
-   Adjuntos y contenido multimedia como alcance de desarrollo.
-   Requisitos de validación de archivos y límite de referencia de 50
    MB.

### 6.8 Archivos y biblioteca

-   Visualización de archivos en lista o cuadrícula.
-   Filtros por tipo y propietario.
-   Selector de archivos reutilizable en chat, publicaciones,
    actividades y entregas.
-   Integración contemplada con Supabase Storage y enlaces firmados para
    recursos privados.

### 6.9 Notificaciones

Categorías contempladas: - Mensajes. - Actividades. - Calificaciones. -
Anuncios. - Entregas. - Comentarios y menciones. - Eventos.

Comportamientos contemplados: contador de no leídas, marcar como leída,
y abrir el contenido relacionado mediante un enlace profundo. Se debe
comprobar la implementación real de cada categoría.

### 6.10 Perfiles y administración

-   Datos de perfil.
-   Roles y permisos.
-   Configuración de la institución.
-   Funciones administrativas sujetas al rol.

### 6.11 Paneles, búsqueda y experiencia de usuario

-   Paneles diferenciados por rol.
-   Filtros y búsqueda.
-   Estados vacíos, carga y error.
-   Reintentos cuando una petición falla.
-   Diseño adaptable a pantallas pequeñas.
-   Guardado automático donde el módulo lo admita.

## 7. Arquitectura y tecnologías

La arquitectura conocida se basa en una aplicación web con frontend y
backend:

-   **React:** interfaz de usuario.
-   **Vite:** servidor de desarrollo y construcción del frontend.
-   **Node.js + Express:** API del servidor.
-   **TypeScript:** tipado estático.
-   **PostgreSQL / Supabase:** almacenamiento relacional y servicios de
    base de datos.
-   **Drizzle ORM:** acceso y modelado de datos en el código.
-   **Supabase Storage:** almacenamiento de archivos previsto para
    contenido multimedia.
-   **Render:** plataforma de despliegue utilizada o considerada para el
    servicio web.

La configuración exacta debe confirmarse con `package.json`, archivos de
entorno de ejemplo, esquemas y configuración de despliegue del
repositorio.

## 8. Modelo de datos: áreas conceptuales

Las entidades que el sistema necesita o contempla incluyen:

-   Usuarios y perfiles.
-   Instituciones y configuración institucional.
-   Cursos y membresías/inscripciones.
-   Actividades y entregas.
-   Calificaciones.
-   Conversaciones, participantes y mensajes.
-   Archivos y metadatos de adjuntos.
-   Notificaciones.
-   Eventos y anuncios.

Esta lista es conceptual; no afirma que exista una tabla para cada
elemento ni define relaciones definitivas. El esquema real de
Drizzle/PostgreSQL es la fuente de verdad.

## 9. Seguridad, privacidad y validación

Antes de producción, verificar: - Row Level Security (RLS) y políticas
de Supabase. - Autorización en el servidor para cada recurso. -
Protección de rutas y datos según institución y rol. - Hash y expiración
de tokens de verificación y recuperación. - Validación de MIME,
extensión y tamaño de archivos en servidor. - Acceso privado a archivos
mediante enlaces firmados con vencimiento. - Gestión segura de sesiones,
cookies, CORS y secretos. - Registro de errores sin exponer credenciales
ni datos personales. - Copias de seguridad y estrategia de
recuperación. - Política de privacidad, tratamiento de datos de menores
y condiciones de uso.

Durante el desarrollo se detectó la necesidad de revisar RLS/policies.
No debe suponerse que la base está protegida hasta comprobarlo.

## 10. Estado técnico conocido y pruebas pendientes

Se reportaron, en distintos momentos del desarrollo: -
`GET /api/auth/user` con respuestas 401 y posteriormente 500. -
`POST /api/auth/login` con respuesta 500. - Respuestas 403 en endpoints
de cursos, estudiantes, entregas o tableros. - Respuestas 404 en
endpoints de cursos/actividades para un curso concreto.

Estos errores pueden haber cambiado después de las últimas
modificaciones. Antes de una presentación, probar en el entorno
actual: 1. Inicio de sesión con cuentas de prueba de distintos roles. 2.
Consulta de sesión y cierre de sesión. 3. Acceso autorizado y denegado a
cursos. 4. Crear, listar y filtrar actividades. 5. Subir y revisar
entregas. 6. Chat, adjuntos y validación de archivos. 7. Biblioteca y
permisos de archivos. 8. Notificaciones leídas/no leídas y navegación al
elemento. 9. Calificaciones y restricciones de acceso. 10. Diseño en
móvil, estados de error y recuperación.

## 11. Instalación local

1.  Instalar Node.js compatible.
2.  Clonar el repositorio.
3.  Ejecutar `npm install`.
4.  Crear un archivo `.env` local con las variables requeridas por el
    código. No copiar secretos en documentos públicos.
5.  Ejecutar el script de desarrollo correspondiente en `package.json`.
    En una etapa se utilizó `npm run dev:server`; confirma el nombre
    actual.
6.  Abrir la URL indicada por la terminal. El puerto local utilizado
    recientemente fue 5173, pero depende de la configuración.
7.  Si hay migraciones, ejecutarlas solo siguiendo las instrucciones y
    el esquema vigentes del repositorio.

## 12. Mantenimiento y contribución

-   Crear ramas por funcionalidad o corrección.
-   Mantener los cambios pequeños y revisables.
-   Ejecutar TypeScript/lint/pruebas disponibles antes de integrar.
-   Documentar variables de entorno con nombres y ejemplos ficticios,
    nunca con secretos reales.
-   Registrar las funciones como implementadas, parciales, pendientes o
    bloqueadas.
-   Mantener sincronizados README, instrucciones de despliegue y
    configuración.

## 13. Próximos pasos sugeridos

1.  Resolver y probar autenticación.
2.  Corregir rutas y permisos de cursos/actividades.
3.  Revisar RLS y políticas de acceso.
4.  Completar y probar almacenamiento multimedia.
5.  Validar notificaciones y enlaces profundos.
6.  Revisar calificaciones, perfiles y permisos.
7.  Añadir pruebas automatizadas para flujos críticos.
8.  Documentar despliegue, copias de seguridad y recuperación.
9.  Preparar datos ficticios para demostraciones.
10. Actualizar este documento según las funciones realmente verificadas.

## 14. Conclusión

EduNexus plantea una solución integral para centralizar herramientas
escolares y facilitar la interacción de la comunidad educativa. Su valor
está en reunir procesos académicos y de comunicación bajo una
experiencia organizada por roles. La siguiente etapa clave es verificar
la estabilidad, seguridad y estado real de cada módulo para diferenciar
con precisión lo que ya funciona de lo que sigue en desarrollo.
