import { useMemo, useState } from "react";
import { Link } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { BookOpen, Search, GraduationCap, Users, Mail, ClipboardList, CalendarDays, ArrowRight } from "lucide-react";

type HelpItem = { title: string; text: string; href?: string; linkLabel?: string; roles?: string[] };

const helpItems: HelpItem[] = [
  { title: "¿Cómo verifico mi correo?", text: "Abre el mensaje de verificación que EduNexus envió a tu dirección y sigue el enlace. Si no llega, revisa spam y solicita un nuevo envío desde la pantalla de acceso.", href: "/verify-email", linkLabel: "Abrir verificación" },
  { title: "¿Cómo recupero mi contraseña?", text: "En el inicio de sesión selecciona «Olvidé mi contraseña», escribe el correo de tu cuenta y sigue el enlace recibido. La respuesta confirma la solicitud, pero la entrega depende de la configuración de correo de la institución.", href: "/forgot-password", linkLabel: "Recuperar contraseña" },
  { title: "¿Cómo entro a un aula?", text: "Entra a Aula Virtual y abre un curso disponible para tu cuenta. El acceso depende de que estés matriculado o de la audiencia que configuró el docente.", href: "/aula-virtual", linkLabel: "Ir a Aula Virtual", roles: ["student", "teacher", "admin", "director", "coordinator", "secretary"] },
  { title: "¿Cómo publico una actividad?", text: "Abre una de tus aulas, entra a Actividades y selecciona Nueva actividad. Añade instrucciones, fecha de entrega y archivos; revisa que esté publicada para que los estudiantes autorizados puedan verla.", href: "/aula-virtual", linkLabel: "Ver mis aulas", roles: ["teacher"] },
  { title: "¿Cómo reviso y califico entregas?", text: "Abre Calificaciones y entregas o la pestaña de entregas de un aula. Elige una actividad para revisar el estado de cada estudiante y registrar la calificación y retroalimentación.", href: "/grades", linkLabel: "Abrir revisión", roles: ["teacher"] },
  { title: "¿Cómo consulto mis notas y entregas?", text: "Entra a Calificaciones para revisar las notas disponibles. Para entregar un trabajo, abre el curso, entra a Actividades y selecciona la tarea correspondiente.", href: "/grades", linkLabel: "Abrir calificaciones", roles: ["student"] },
  { title: "¿Cómo vinculo a un acudiente?", text: "El estudiante o acudiente puede iniciar una solicitud de vínculo desde el área familiar. La información del estudiante se comparte únicamente después de que el vínculo se aprueba.", href: "/parent", linkLabel: "Abrir portal familiar", roles: ["parent", "student"] },
  { title: "¿Qué hago si no veo un curso o estudiante?", text: "Comprueba que iniciaste sesión con la cuenta correcta y que pertenece a la institución adecuada. El acceso depende del rol, las asignaciones, la matrícula activa y los permisos institucionales. Si sigue faltando, contacta a coordinación o administración de tu institución.", roles: ["teacher", "admin", "director", "coordinator", "secretary", "student"] },
  { title: "¿Cómo cambio mis datos?", text: "En Mi Perfil puedes actualizar la información personal que habilita tu institución. Algunas funciones pueden requerir que un administrador institucional revise el cambio.", href: "/profile", linkLabel: "Abrir perfil" },
  { title: "¿Cómo contacto al equipo docente?", text: "Usa Mensajes para comunicarte con las personas disponibles de tu institución. En asuntos de matrícula, permisos o acceso, contacta al personal administrativo de tu colegio.", href: "/messages", linkLabel: "Abrir mensajes" },
  { title: "¿Cómo reviso la configuración institucional?", text: "El personal administrativo gestiona usuarios, grupos, años académicos y parámetros desde el Panel Admin. Las opciones disponibles dependen del cargo y los permisos del servidor.", href: "/admin", linkLabel: "Abrir Panel Admin", roles: ["admin", "director", "coordinator", "secretary", "super_admin"] },
  { title: "¿Por qué no puedo enviar notificaciones por correo?", text: "La aplicación necesita que el proveedor de correo esté configurado en el entorno de despliegue. Los ajustes de notificaciones push no activan el correo electrónico. Contacta a la administración de tu institución si un mensaje esperado no llega.", roles: ["admin", "director", "coordinator", "secretary", "super_admin"] },
];

const roleLabels: Record<string, string> = {
  teacher: "Docentes", student: "Estudiantes", parent: "Familias", admin: "Administración",
  director: "Dirección", coordinator: "Coordinación", secretary: "Secretaría", super_admin: "Plataforma",
};

export default function HelpCenter() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const role = user?.role || "student";
  const visibleItems = useMemo(() => helpItems.filter((item) => {
    const roleMatches = !item.roles || item.roles.includes(role);
    const query = search.trim().toLocaleLowerCase("es");
    return roleMatches && (!query || `${item.title} ${item.text}`.toLocaleLowerCase("es").includes(query));
  }), [role, search]);

  const guideItems = [
    { title: "Revisa tus aulas", description: "Desde Inicio o Mis Aulas abre solo los cursos que tienes asignados.", icon: BookOpen, href: "/aula-virtual" },
    { title: "Publica actividades", description: "Define instrucciones, entrega y archivos para el curso seleccionado.", icon: ClipboardList, href: "/aula-virtual" },
    { title: "Revisa entregas y notas", description: "Consulta quién entregó, quién falta y registra la retroalimentación.", icon: GraduationCap, href: "/grades" },
    { title: "Organiza tus fechas", description: "Consulta clases, entregas y eventos en la agenda del calendario.", icon: CalendarDays, href: "/calendar" },
  ];

  return (
    <AppLayout title="Centro de ayuda">
      <main className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6">
        <section className="rounded-2xl border bg-card p-5 sm:p-7">
          <div className="flex items-start gap-3">
            <span className="rounded-xl bg-primary/10 p-3 text-primary"><BookOpen className="h-6 w-6" /></span>
            <div><p className="text-sm text-muted-foreground">{roleLabels[role] || "Comunidad EduNexus"}</p><h1 className="text-2xl font-bold sm:text-3xl">Centro de ayuda</h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Guías para usar EduNexus. El acceso a cursos, estudiantes y administración depende de tu rol y de las reglas de tu institución.</p></div>
          </div>
          <div className="relative mt-5"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar una pregunta..." aria-label="Buscar en el centro de ayuda" className="pl-9" /></div>
        </section>

        {role === "teacher" && !search.trim() && <section className="space-y-3" aria-labelledby="teacher-guide-heading">
          <div><p className="text-sm font-medium text-primary">Guía inicial</p><h2 id="teacher-guide-heading" className="text-xl font-semibold">Empieza tu jornada docente</h2></div>
          <div className="grid gap-3 sm:grid-cols-2">
            {guideItems.map(({ title, description, icon: Icon, href }) => <Card key={title} className="min-w-0"><CardContent className="flex h-full items-start gap-3 p-4"><Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" /><div className="min-w-0 flex-1"><h3 className="font-semibold">{title}</h3><p className="mt-1 text-sm text-muted-foreground">{description}</p><Button asChild size="sm" variant="ghost" className="mt-1 h-auto px-0"><Link href={href}>Ir a la sección <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link></Button></div></CardContent></Card>)}
          </div>
        </section>}

        <section className="space-y-3" aria-labelledby="help-questions-heading">
          <div className="flex items-center gap-2"><Users className="h-5 w-5 text-primary" /><h2 id="help-questions-heading" className="text-xl font-semibold">Preguntas frecuentes</h2><span className="text-sm text-muted-foreground">{visibleItems.length}</span></div>
          {visibleItems.length ? <div className="space-y-2">{visibleItems.map((item) => <details key={item.title} className="group rounded-xl border bg-card px-4 py-3">
            <summary className="cursor-pointer list-none pr-6 font-medium marker:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">{item.title}</summary>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.text}</p>
            {item.href && item.linkLabel && <Button asChild size="sm" variant="ghost" className="mt-1 h-auto px-0"><Link href={item.href}>{item.linkLabel} <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link></Button>}
          </details>)}</div> : <Card><CardHeader><CardTitle className="text-base">No encontramos esa pregunta</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">Prueba con otro término o escribe al personal de tu institución desde Mensajes.</CardContent></Card>}
        </section>

        <Card className="border-primary/20"><CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center"><Mail className="h-5 w-5 shrink-0 text-primary" /><p className="flex-1 text-sm text-muted-foreground">¿Necesitas ayuda con tu cuenta o permisos? Contacta al equipo de tu institución. Nunca compartas tu contraseña ni códigos de verificación.</p><Button asChild variant="outline" size="sm"><Link href="/messages">Abrir mensajes</Link></Button></CardContent></Card>
      </main>
    </AppLayout>
  );
}
