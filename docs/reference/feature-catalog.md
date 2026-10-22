# Catálogo funcional

Mapa de funciones visibles en el cliente o implementadas en las rutas actuales. La lista no certifica despliegue, configuración de proveedores ni aceptación funcional.

| Área | Ubicación principal | Alcance identificado |
|---|---|---|
| Acceso y perfil | `client/src/pages/{Login,Register,Profile}.tsx`, `server/authRoutes.ts` | Registro, login, sesión, edición de perfil, enlaces de verificación y restablecimiento. |
| Inicio y comunidad | `Home.tsx`, `routes.ts` | Feed, publicaciones, comentarios, reacciones, reconocimientos y notificaciones. |
| Grupos y chat | `Groups.tsx`, `GroupDetail.tsx`, rutas de grupos | Descubrir/crear grupos, membresía, publicaciones, mensajes y grupos de chat. |
| Cursos y aula virtual | `Classroom.tsx`, `CourseDetail.tsx`, rutas `/api/classroom/*` | Cursos, inscripción/visibilidad, tablero, actividades, entregas, comentarios, calificaciones y asistencia. |
| Espacio de trabajo docente | `Home.tsx`, `/api/teacher/workspace` | Conteos exactos de aulas activas y entregas por revisar, más hasta cuatro aulas recientes, delimitados por docente e institución. |
| Seguimiento de actividades | `CourseDetail.tsx`, `/api/classroom/activities/:id/submissions`, `/api/classroom/courses/:id/students` | Vista por actividad con todo el roster del aula, estado pendiente/atrasado/entregado/calificado, fecha de entrega, filtro por estado y búsqueda de estudiante; los permisos de roster y entregas se comprueban en servidor. |
| Libro docente por periodo | `Grades.tsx`, `/api/gradebook/teacher/workspace` | Consulta las asignaciones de materia y grupo del docente, el año activo, periodos, matrículas vigentes y notas existentes; permite guardar o actualizar una nota solo para la asignación, periodo y matrícula autorizados. Los cambios quedan en `audit_logs`. |
| Asistencia por curso | `CourseDetail.tsx`, `/api/classroom/courses/:id/attendance`, `/api/classroom/courses/:id/attendance/history` | Toma de lista diaria e historial de los últimos 30 días con recuento de ausencias, tardanzas y excusas por estudiante. El servidor permite al personal académico autorizado ver el curso y a cada estudiante consultar solo sus propios registros. |
| Agenda académica | `Calendar.tsx`, `/api/events`, `/api/classroom/my-activities`, `/api/admin/schedules` | Integra eventos/asesorías, fechas de entrega y clases recurrentes en las vistas de mes, semana, día y agenda; filtros independientes por tipo y selección de curso o grupo para entregas y clases. Los eventos no se vinculan a un curso en el modelo actual y permanecen visibles. Las fuentes conservan permisos institucionales y de rol. |
| Biblioteca y multimedia | `Library.tsx`, `MediaComposer.tsx`, rutas de archivos | Recursos compartidos y adjuntos, con límites y validaciones implementados en servidor. |
| Mensajería y llamadas | `DirectMessages.tsx`, `Meet.tsx`, `MeetRoom.tsx` | Mensajes directos, solicitudes, bloques, salas y llamadas; LiveKit puede requerir credenciales externas. |
| Tutorías, calendario y eventos | `Tutoring.tsx`, `Calendar.tsx`, `EventBoard.tsx` | Eventos/asesorías y calendario de acuerdo con rutas y permisos actuales. |
| Administración académica | `Admin.tsx`, `AdminDashboard.tsx`, rutas `/api/admin/*` | Usuarios, códigos, grados, grupos, periodos, matrículas, horarios, observaciones y reportes. |
| Revisión y promoción anual | `Promotions.tsx`, `/api/promotions`, `student_promotion_reviews`, `student_promotion_decisions` | Expediente de notas, asistencia, observaciones y compromisos; recomendación individual de cada docente asignado; consenso unánime y resolución final de dirección con creación de matrícula en el año destino dentro de la misma institución. La apertura usa la fecha de inicio configurada para el próximo año académico. |
| Familias | `ParentPortal.tsx`, `ParentLinkRequests.tsx`, rutas `/api/parent/*` | Solicitud/aprobación de vínculos acudiente-estudiante y consulta autorizada. |
| Navegación por rol | `client/src/components/layout/AppSidebar.tsx`, `client/src/pages/Grades.tsx` | Menús diferenciados para estudiantes, docentes, acudientes, personal institucional, administración y superadministración; el docente accede a revisión de entregas y su grupo aparece cuando corresponde. |
| Integraciones | módulos en `server/` | Resend, Google Classroom, Supabase Storage, Web Push, LiveKit y Master2000; cada una depende de configuración. |

Para comprobar una acción concreta, usar [el catálogo de API](api-endpoints.md), comprobar middleware y condiciones de negocio en la ruta indicada y realizar una prueba controlada con el rol y la institución correspondientes.
