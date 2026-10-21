# EduNexus --- Catálogo de funciones

Este catálogo sirve para preparar una presentación y para llevar control
de la implementación. Marca cada punto con uno de estos estados tras
probarlo: **Implementado**, **Parcial**, **Pendiente**, **Bloqueado**.
No marques una función como implementada solo porque esté diseñada o
aparezca en una pantalla.

  -----------------------------------------------------------------------
  Área                    Función/capacidad       Validación recomendada
  ----------------------- ----------------------- -----------------------
  Acceso                  Inicio de sesión        Probar credenciales
                                                  válidas e inválidas

  Acceso                  Sesión del usuario      Confirmar sesión
                                                  activa, expiración y
                                                  cierre

  Acceso                  Verificación de correo  Confirmar envío, token,
                                                  vencimiento y uso único

  Acceso                  Recuperación de         Confirmar token seguro,
                          contraseña              vencimiento y cambio de
                                                  clave

  Institución             Código institucional    Comprobar
                                                  registro/acceso por
                                                  institución

  Roles                   Estudiante, docente,    Verificar permisos
                          coordinador, director,  reales en servidor
                          secretaría y            
                          administrador           

  Cursos                  Lista y detalle de      Confirmar respuesta API
                          cursos                  y permisos

  Cursos                  Participantes del curso Confirmar
                                                  docente/estudiantes
                                                  autorizados

  Actividades             Crear/publicar          Validar campos y
                          actividad               permisos

  Actividades             Buscar y filtrar por    Probar filtros y
                          estado                  resultados vacíos

  Entregas                Entregar trabajo        Confirmar
                                                  almacenamiento y
                                                  relación con actividad

  Entregas                Revisar entregas        Comprobar permisos del
                                                  docente

  Calificaciones          Consultar/gestionar     Probar acceso por rol y
                          notas                   por estudiante

  Chat                    Conversaciones directas Enviar/recibir mensajes
                                                  con cuentas de prueba

  Chat                    Conversaciones grupales Validar participantes y
                                                  permisos

  Chat                    Adjuntos de hasta 50 MB Probar límites y tipos
                          (requisito de           permitidos
                          referencia)             

  Multimedia              Imágenes, audio y video Validar MIME,
                                                  extensión, tamaño y
                                                  reproducción

  Archivos                Biblioteca en           Verificar ambas vistas
                          lista/cuadrícula        

  Archivos                Filtrar por tipo y      Comprobar resultados y
                          propietario             permisos

  Almacenamiento          Supabase Storage y      Confirmar privacidad y
                          enlaces firmados        expiración

  Notificaciones          Mensajes, actividades,  Probar generación por
                          notas, anuncios,        evento
                          entregas, comentarios,  
                          menciones y eventos     

  Notificaciones          Leídas/no leídas y      Verificar actualización
                          contador                persistente

  Notificaciones          Enlace al contenido     Confirmar navegación
                          relacionado             correcta

  Perfil                  Consulta/edición de     Probar validaciones y
                          datos permitidos        permisos

  Administración          Parámetros              Verificar solo acceso
                          institucionales         autorizado

  UX                      Estados de carga,       Simular fallos de
                          error, vacío y          red/API
                          reintento               

  UX                      Diseño adaptable a      Probar anchos de
                          móvil                   pantalla distintos

  UX                      Guardado automático     Comprobar persistencia
                          donde aplique           y recuperación
  -----------------------------------------------------------------------

## Estado conocido del desarrollo

En registros previos se reportaron errores de autenticación 401/500 y
respuestas 403/404 en algunos endpoints de cursos y actividades. Deben
volver a probarse en la versión actual. También se señaló la necesidad
de revisar las políticas RLS de Supabase. Este catálogo no certifica el
estado actual de los módulos.
