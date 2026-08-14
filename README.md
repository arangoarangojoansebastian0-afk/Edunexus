# EduNexus — README

EduNexus es una plataforma educativa web diseñada para centralizar y organizar la gestión académica de diferentes instituciones educativas. El proyecto busca transformar procesos que normalmente se realizan de manera dispersa en una plataforma unificada, modular y escalable.

## Objetivo

El objetivo de EduNexus es proporcionar una solución tecnológica que permita administrar la información académica e institucional desde un mismo sistema, facilitando el trabajo de estudiantes, docentes, directivos y personal administrativo.

La plataforma está planteada para funcionar como un sistema **multicolegio**, de manera que diferentes instituciones puedan gestionar sus propios datos y configuraciones sin perder la separación entre ellas.

## Características principales

* Gestión de usuarios y roles.
* Administración de instituciones educativas.
* Gestión de estudiantes.
* Gestión de docentes.
* Administración de cursos y grupos académicos.
* Gestión de materias y grados.
* Gestión de matrículas.
* Espacios y herramientas para la gestión del aula.
* Configuración institucional.
* Arquitectura preparada para crecer con nuevos módulos.

## Roles del sistema

* **Estudiante:** consulta su información académica y utiliza las herramientas disponibles para su proceso educativo.
* **Docente:** administra información relacionada con sus clases, materias y estudiantes.
* **Director:** consulta y gestiona información general de la institución.
* **Coordinador:** administra procesos académicos y realiza seguimiento a grupos y estudiantes.
* **Secretaría:** gestiona procesos administrativos como matrículas e información institucional.
* **Administrador:** configura y supervisa la plataforma y sus diferentes componentes.

## Módulos

### Classroom

Espacio destinado a la interacción y gestión de las actividades académicas.

### Cursos

Administración de los cursos y grupos de estudiantes.

### Materias

Gestión de las asignaturas ofrecidas por la institución.

### Grados

Organización de los niveles académicos.

### Grupos académicos

Creación y administración de grupos de estudiantes asociados a cursos, grados y materias.

### Matrículas

Gestión del proceso de inscripción y vinculación de estudiantes a la institución.

### Configuración institucional

Administración de la información y parámetros propios de cada institución educativa.

## Tecnologías

* **TypeScript**
* **React**
* **Vite**
* **Tailwind CSS**
* **Supabase**
* **PostgreSQL**

## Arquitectura conceptual

```text
EduNexus
│
├── Gestión institucional
│   ├── Instituciones
│   ├── Configuración
│   └── Usuarios
│
├── Gestión académica
│   ├── Grados
│   ├── Cursos
│   ├── Grupos
│   └── Materias
│
├── Gestión estudiantil
│   ├── Estudiantes
│   └── Matrículas
│
└── Gestión educativa
    └── Classroom
```

## Base de datos

EduNexus utiliza una base de datos PostgreSQL mediante Supabase. La estructura de datos está pensada para relacionar instituciones, usuarios, estudiantes, docentes, cursos, materias, grupos y matrículas.

Uno de los principios importantes del proyecto es mantener la separación de la información entre instituciones, permitiendo que EduNexus pueda crecer como una plataforma multicolegio.

## Instalación

### Requisitos

* Node.js
* npm
* Git
* Una cuenta y proyecto de Supabase

### Clonar el repositorio

```bash
git clone URL_DEL_REPOSITORIO
cd edunexus
```

### Instalar dependencias

```bash
npm install
```

### Configurar variables de entorno

Crear un archivo `.env` en la raíz del proyecto:

```env
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_clave_de_supabase
```

No se deben subir claves privadas, contraseñas ni archivos `.env` con información sensible al repositorio.

### Ejecutar en desarrollo

```bash
npm run dev
```

## Scripts

```bash
npm run dev
npm run build
npm run preview
```

## Estado del proyecto

EduNexus se encuentra en desarrollo. La plataforma está siendo construida de forma modular para permitir la incorporación progresiva de nuevas funcionalidades.

## Próximos objetivos

* Completar el sistema de autenticación y autorización.
* Finalizar la estructura multicolegio.
* Consolidar los módulos académicos.
* Mejorar la gestión de roles y permisos.
* Completar la gestión de matrículas.
* Desarrollar funcionalidades de Classroom.
* Implementar paneles específicos para cada tipo de usuario.
* Mejorar la documentación técnica.
* Añadir pruebas automatizadas.
* Preparar el sistema para despliegue en producción.

## Contribución

Las contribuciones pueden realizarse mediante ramas independientes y pull requests.

1. Crear una rama para la funcionalidad o corrección.
2. Realizar los cambios.
3. Probar la funcionalidad.
4. Crear un commit descriptivo.
5. Abrir un Pull Request.

## Licencia

Este proyecto todavía no tiene una licencia de código abierto definida. La licencia deberá establecerse antes de distribuir oficialmente el proyecto como software de código abierto.

## Autoría

**EduNexus**
Proyecto de desarrollo de plataforma educativa multicolegio.

> EduNexus busca centralizar la gestión educativa en una plataforma moderna, modular y escalable.
