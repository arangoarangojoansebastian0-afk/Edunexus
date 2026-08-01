import { useQuery } from "@tanstack/react-query";

/**
 * Consulta la configuración de la institución (/api/admin/institution):
 * evaluationType, qualitativeScale, colores, logo, etc.
 *
 * BUG QUE ESTO CORRIGE: el queryClient global de la app usa
 * `staleTime: Infinity` (ver client/src/lib/queryClient.ts) para evitar
 * refetching innecesario. Eso está bien para datos que solo cambia el propio
 * usuario, pero la configuración institucional la cambia el admin y la
 * consumen TODOS los demás (profesores, estudiantes, padres) — en sus
 * propias sesiones de navegador, ya abiertas de antes.
 *
 * Con staleTime: Infinity, una vez que un profesor carga la app, esa
 * consulta queda cacheada "para siempre" en su sesión: aunque el admin
 * cambie el sistema evaluativo (o cualquier otra cosa) y guarde
 * correctamente, el profesor JAMÁS ve el cambio reflejado en sus aulas
 * hasta que recargue la página a mano (F5) — porque React Query solo
 * revalida cuando alguien invalida la query explícitamente, y esa
 * invalidación solo ocurre en la sesión del admin que guardó, no en la de
 * los demás usuarios ya conectados.
 *
 * Este hook centraliza la consulta con un staleTime corto para que se
 * revalide sola cada cierto tiempo y al volver a la pestaña, sin tener que
 * tocar el comportamiento global del queryClient (que sí conviene mantener
 * agresivo para el resto de datos de la app).
 */
export function useInstitutionSettings() {
  return useQuery<any>({
    queryKey: ["/api/admin/institution"],
    staleTime: 30_000, // 30s: suficientemente fresco sin bombardear el backend
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
}
