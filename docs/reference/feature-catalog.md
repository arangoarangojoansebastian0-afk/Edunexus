# Catálogo funcional

Mapa de funciones visibles en el cliente o implementadas en las rutas actuales. La lista no certifica despliegue, configuración de proveedores ni aceptación funcional.

| Área | Ubicación principal | Alcance identificado |
|---|---|---|
| Acceso y perfil | `client/src/pages/{Login,Register,Profile}.tsx`, `server/authRoutes.ts` | Registro, login, sesión, edición de perfil, enlaces de verificación y restablecimiento. |
| Inicio y comunidad | `Home.tsx`, `routes.ts` | Feed, publicaciones, comentarios, reacciones, reconocimientos y notificaciones. |
| Grupos y chat | `Groups.tsx`, `GroupDetail.tsx`, rutas de grupos | Descubrir/crear grupos, membresía, publicaciones, mensajes y grupos de chat. |
| Cursos y aula virtual | `Classroom.tsx`, `CourseDetail.tsx`, rutas `/api/classroom/*` | Cursos, inscripción/visibilidad, tablero, actividades, entregas, comentarios, calificaciones y asistencia. |
| Biblioteca y multimedia | `Library.tsx`, `MediaComposer.tsx`, rutas de archivos | Recursos compartidos y adjuntos, con límites y validaciones implementados en servidor. |
| Mensajería y llamadas | `DirectMessages.tsx`, `Meet.tsx`, `MeetRoom.tsx` | Mensajes directos, solicitudes, bloques, salas y llamadas; LiveKit puede requerir credenciales externas. |
| Tutorías, calendario y eventos | `Tutoring.tsx`, `Calendar.tsx`, `EventBoard.tsx` | Eventos/asesorías y calendario de acuerdo con rutas y permisos actuales. |
| Administración académica | `Admin.tsx`, `AdminDashboard.tsx`, rutas `/api/admin/*` | Usuarios, códigos, grados, grupos, periodos, matrículas, horarios, observaciones y reportes. |
| Familias | `ParentPortal.tsx`, `ParentLinkRequests.tsx`, rutas `/api/parent/*` | Solicitud/aprobación de vínculos acudiente-estudiante y consulta autorizada. |
| Integraciones | módulos en `server/` | Resend, Google Classroom, Supabase Storage, Web Push, LiveKit y Master2000; cada una depende de configuración. |

Para comprobar una acción concreta, usar [el catálogo de API](api-endpoints.md), comprobar middleware y condiciones de negocio en la ruta indicada y realizar una prueba controlada con el rol y la institución correspondientes.
