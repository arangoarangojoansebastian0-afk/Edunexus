import { Link } from "wouter";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  GraduationCap,
  ArrowRight,
  Users,
  BookOpen,
  Calendar,
  ClipboardList,
  BarChart3,
  Monitor,
  Bell,
  Shield,
  FileText,
  Clock,
  MessageSquare,
  Video,
  UserCircle,
  Settings,
  Library,
  Search,
  CheckCircle2,
  Sparkles,
  Menu,
  X,
  ChevronRight,
  School,
  Award,
  UserRoundCheck,
  Presentation,
  CalendarDays,
  BookMarked,
  MessagesSquare,
  LayoutDashboard,
  UserCog,
  Database,
  Building2,
  LockKeyhole,
  Send,
  UsersRound,
  GraduationCap as GraduationIcon,
} from "lucide-react";

type Feature = {
  icon: any;
  title: string;
  description: string;
  route?: string;
  category: string;
};

const features: Feature[] = [
  {
    icon: LayoutDashboard,
    title: "Panel principal",
    description:
      "Un centro de control para consultar rápidamente la información y actividad más importante de tu institución.",
    route: "/",
    category: "Gestión",
  },
  {
    icon: UsersRound,
    title: "Grupos",
    description:
      "Consulta y administra grupos académicos y accede a la información específica de cada grupo.",
    route: "/groups",
    category: "Gestión académica",
  },
  {
    icon: UserCircle,
    title: "Perfiles",
    description:
      "Consulta perfiles de usuarios y la información correspondiente a cada miembro de la comunidad educativa.",
    route: "/profile",
    category: "Comunidad",
  },
  {
    icon: BookOpen,
    title: "Aula virtual",
    description:
      "Accede a cursos, espacios académicos y herramientas de aprendizaje desde un mismo entorno.",
    route: "/classroom",
    category: "Aprendizaje",
  },
  {
    icon: Presentation,
    title: "Cursos",
    description:
      "Consulta el contenido y la información de cada curso y entra directamente a sus espacios de trabajo.",
    route: "/classroom",
    category: "Aprendizaje",
  },
  {
    icon: Library,
    title: "Biblioteca",
    description:
      "Encuentra y consulta documentos y recursos institucionales organizados en un espacio centralizado.",
    route: "/library",
    category: "Recursos",
  },
  {
    icon: CalendarDays,
    title: "Calendario",
    description:
      "Organiza y consulta eventos, actividades y fechas importantes de la comunidad educativa.",
    route: "/calendar",
    category: "Organización",
  },
  {
    icon: Clock,
    title: "Horarios",
    description:
      "Consulta los horarios académicos de forma organizada para facilitar la planificación de las actividades.",
    route: "/schedules",
    category: "Organización",
  },
  {
    icon: MessageSquare,
    title: "Mensajería directa",
    description:
      "Comunícate directamente con otros miembros de la comunidad educativa mediante conversaciones privadas.",
    route: "/messages",
    category: "Comunicación",
  },
  {
    icon: MessagesSquare,
    title: "Mensajes grupales",
    description:
      "Participa en conversaciones relacionadas con grupos y mantén la comunicación centralizada.",
    route: "/messages",
    category: "Comunicación",
  },
  {
    icon: Video,
    title: "EduNexus Meet",
    description:
      "Crea y participa en reuniones virtuales para conectar a estudiantes, docentes y miembros de la institución.",
    route: "/meet",
    category: "Comunicación",
  },
  {
    icon: Bell,
    title: "Notificaciones",
    description:
      "Mantente informado sobre novedades y actividades importantes mediante un centro de notificaciones.",
    route: "/notifications",
    category: "Comunicación",
  },
  {
    icon: UserRoundCheck,
    title: "Asesorías",
    description:
      "Gestiona espacios de acompañamiento académico y facilita la comunicación entre estudiantes y docentes.",
    route: "/tutoring",
    category: "Aprendizaje",
  },
  {
    icon: School,
    title: "Portal de padres",
    description:
      "Un espacio diseñado para que los acudientes puedan acceder a la información educativa correspondiente.",
    route: "/parent",
    category: "Familias",
  },
  {
    icon: UserCog,
    title: "Administración",
    description:
      "Herramientas para gestionar usuarios, información y procesos administrativos de la institución.",
    route: "/admin",
    category: "Administración",
  },
  {
    icon: Database,
    title: "Super administración",
    description:
      "Gestión avanzada de la plataforma y administración de instituciones dentro del ecosistema EduNexus.",
    route: "/super-admin",
    category: "Administración",
  },
  {
    icon: Settings,
    title: "Configuración",
    description:
      "Personaliza y administra las preferencias disponibles de tu experiencia dentro de la plataforma.",
    route: "/settings",
    category: "Personalización",
  },
  {
    icon: ClipboardList,
    title: "Gestión académica",
    description:
      "Centraliza los procesos relacionados con la organización académica y el seguimiento institucional.",
    category: "Gestión académica",
  },
  {
    icon: BarChart3,
    title: "Indicadores",
    description:
      "Obtén una visión general de la actividad y el funcionamiento de los procesos educativos.",
    category: "Gestión",
  },
  {
    icon: Award,
    title: "Reconocimientos",
    description:
      "Destaca los logros y aportes de los integrantes de la comunidad educativa.",
    category: "Comunidad",
  },
  {
    icon: FileText,
    title: "Documentos institucionales",
    description:
      "Centraliza información y documentos relevantes para facilitar su consulta.",
    category: "Recursos",
  },
  {
    icon: Calendar,
    title: "Eventos",
    description:
      "Mantén a la comunidad informada sobre actividades y acontecimientos importantes.",
    category: "Organización",
  },
  {
    icon: Shield,
    title: "Gestión segura",
    description:
      "La plataforma organiza el acceso a las funcionalidades según el contexto y los permisos de cada usuario.",
    category: "Seguridad",
  },
];

const categories = [
  {
    name: "Todo",
    icon: Sparkles,
  },
  {
    name: "Aprendizaje",
    icon: BookOpen,
  },
  {
    name: "Comunicación",
    icon: MessageSquare,
  },
  {
    name: "Organización",
    icon: CalendarDays,
  },
  {
    name: "Gestión académica",
    icon: GraduationIcon,
  },
  {
    name: "Gestión",
    icon: BarChart3,
  },
  {
    name: "Administración",
    icon: Building2,
  },
  {
    name: "Comunidad",
    icon: Users,
  },
];

const roles = [
  {
    icon: GraduationCap,
    title: "Estudiantes",
    description:
      "Accede a tus espacios académicos, grupos, horarios, biblioteca, comunicaciones y reuniones virtuales.",
    features: [
      "Aula virtual",
      "Cursos y grupos",
      "Horarios",
      "Biblioteca",
      "Mensajería",
      "Meet",
    ],
  },
  {
    icon: Presentation,
    title: "Docentes",
    description:
      "Organiza tus actividades académicas, acompaña a tus estudiantes y mantén una comunicación directa.",
    features: [
      "Cursos",
      "Aula virtual",
      "Asesorías",
      "Horarios",
      "Mensajes",
      "Reuniones",
    ],
  },
  {
    icon: UserRoundCheck,
    title: "Padres y acudientes",
    description:
      "Consulta la información educativa disponible para acompañar el proceso académico de tus estudiantes.",
    features: [
      "Portal familiar",
      "Información académica",
      "Calendario",
      "Notificaciones",
      "Comunicación",
    ],
  },
  {
    icon: UserCog,
    title: "Directivos y administradores",
    description:
      "Administra los procesos institucionales y consulta herramientas de gestión desde una plataforma centralizada.",
    features: [
      "Administración",
      "Gestión académica",
      "Indicadores",
      "Usuarios",
      "Configuración",
      "Información institucional",
    ],
  },
];

function AnimatedBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-primary/20 blur-3xl animate-pulse" />
      <div
        className="absolute -right-32 top-20 h-[28rem] w-[28rem] rounded-full bg-blue-500/10 blur-3xl animate-pulse"
        style={{ animationDelay: "1s" }}
      />
      <div
        className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-violet-500/10 blur-3xl animate-pulse"
        style={{ animationDelay: "2s" }}
      />

      <div className="absolute inset-0 opacity-[0.035] [background-image:linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] [background-size:48px_48px]" />
    </div>
  );
}

function FeatureCard({ feature, index }: { feature: Feature; index: number }) {
  const Icon = feature.icon;

  const content = (
    <div
      className="group relative h-full overflow-hidden rounded-2xl border bg-card/80 p-6 backdrop-blur-sm transition-all duration-500 hover:-translate-y-2 hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/10"
      style={{
        animationDelay: `${index * 50}ms`,
      }}
    >
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/5 blur-2xl transition-all duration-500 group-hover:scale-150 group-hover:bg-primary/10" />

      <div className="relative">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 group-hover:bg-primary group-hover:text-primary-foreground">
            <Icon className="h-6 w-6" />
          </div>

          {feature.route && (
            <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform duration-300 group-hover:translate-x-1 group-hover:text-primary" />
          )}
        </div>

        <span className="mb-3 inline-block rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {feature.category}
        </span>

        <h3 className="mb-2 text-lg font-bold">{feature.title}</h3>

        <p className="text-sm leading-6 text-muted-foreground">
          {feature.description}
        </p>

        {feature.route && (
          <div className="mt-5 flex items-center gap-1 text-xs font-semibold text-primary opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            Explorar función
            <ArrowRight className="h-3.5 w-3.5" />
          </div>
        )}
      </div>
    </div>
  );

  if (feature.route && feature.route !== "/") {
    return (
      <Link href={feature.route} className="block h-full">
        {content}
      </Link>
    );
  }

  return content;
}

function RoleCard({
  role,
  index,
}: {
  role: (typeof roles)[number];
  index: number;
}) {
  const Icon = role.icon;

  return (
    <div
      className="group relative overflow-hidden rounded-3xl border bg-card p-7 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-primary/5 blur-3xl transition-transform duration-700 group-hover:scale-150" />

      <div className="relative">
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-all duration-500 group-hover:scale-110 group-hover:rotate-3">
          <Icon className="h-7 w-7" />
        </div>

        <h3 className="mb-3 text-xl font-bold">{role.title}</h3>

        <p className="mb-6 text-sm leading-6 text-muted-foreground">
          {role.description}
        </p>

        <div className="space-y-3">
          {role.features.map((item) => (
            <div key={item} className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AppPreview() {
  const [active, setActive] = useState(0);

  const previews = [
    {
      title: "Inicio",
      subtitle: "Tu centro de control educativo",
      icon: LayoutDashboard,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      stats: [
        ["Publicaciones", "24"],
        ["Eventos", "8"],
        ["Grupos", "12"],
        ["Mensajes", "16"],
      ],
      items: [
        "Actividad reciente",
        "Próximos eventos",
        "Nuevas publicaciones",
      ],
    },
    {
      title: "Aula Virtual",
      subtitle: "Todos tus espacios de aprendizaje",
      icon: BookOpen,
      color: "text-violet-500",
      bg: "bg-violet-500/10",
      stats: [
        ["Cursos", "24"],
        ["Materias", "12"],
        ["Tareas", "18"],
        ["Progreso", "87%"],
      ],
      items: [
        "Matemáticas",
        "Ciencias Naturales",
        "Tecnología e Informática",
      ],
    },
    {
      title: "Cursos",
      subtitle: "Gestiona tus cursos académicos",
      icon: GraduationCap,
      color: "text-indigo-500",
      bg: "bg-indigo-500/10",
      stats: [
        ["Mis cursos", "24"],
        ["Activos", "18"],
        ["Finalizados", "6"],
        ["Estudiantes", "482"],
      ],
      items: [
        "Curso de Matemáticas",
        "Curso de Ciencias",
        "Curso de Tecnología",
      ],
    },
    {
      title: "Grupos",
      subtitle: "Organiza tu comunidad académica",
      icon: UsersRound,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      stats: [
        ["Mis grupos", "12"],
        ["Miembros", "384"],
        ["Activos", "10"],
        ["Nuevos", "4"],
      ],
      items: [
        "Grupo 8°A",
        "Grupo 8°B",
        "Comunidad tecnológica",
      ],
    },
    {
      title: "Calendario",
      subtitle: "Organiza todas tus actividades",
      icon: CalendarDays,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      stats: [
        ["Eventos", "8"],
        ["Hoy", "3"],
        ["Esta semana", "12"],
        ["Pendientes", "5"],
      ],
      items: [
        "Reunión académica",
        "Entrega de proyecto",
        "Evento institucional",
      ],
    },
    {
      title: "Horarios",
      subtitle: "Consulta tu agenda académica",
      icon: Clock,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
      stats: [
        ["Clases", "32"],
        ["Hoy", "6"],
        ["Esta semana", "28"],
        ["Libres", "4"],
      ],
      items: [
        "Matemáticas — 7:00 AM",
        "Ciencias — 9:00 AM",
        "Tecnología — 11:00 AM",
      ],
    },
    {
      title: "Mensajes",
      subtitle: "Comunícate con tu comunidad",
      icon: MessagesSquare,
      color: "text-pink-500",
      bg: "bg-pink-500/10",
      stats: [
        ["Mensajes", "16"],
        ["Conversaciones", "8"],
        ["Sin leer", "4"],
        ["Grupos", "12"],
      ],
      items: [
        "Docente de Matemáticas",
        "Grupo 8°A",
        "Coordinación académica",
      ],
    },
    {
      title: "Notificaciones",
      subtitle: "No te pierdas ninguna novedad",
      icon: Bell,
      color: "text-red-500",
      bg: "bg-red-500/10",
      stats: [
        ["Total", "24"],
        ["Sin leer", "7"],
        ["Importantes", "3"],
        ["Hoy", "5"],
      ],
      items: [
        "Nueva tarea asignada",
        "Nuevo evento institucional",
        "Nuevo mensaje recibido",
      ],
    },
    {
      title: "Biblioteca",
      subtitle: "Todos tus recursos educativos",
      icon: Library,
      color: "text-cyan-500",
      bg: "bg-cyan-500/10",
      stats: [
        ["Recursos", "248"],
        ["Documentos", "124"],
        ["Libros", "86"],
        ["Nuevos", "18"],
      ],
      items: [
        "Material académico",
        "Documentos institucionales",
        "Recursos digitales",
      ],
    },
    {
      title: "Asesorías",
      subtitle: "Acompañamiento académico personalizado",
      icon: UserRoundCheck,
      color: "text-green-500",
      bg: "bg-green-500/10",
      stats: [
        ["Asesorías", "12"],
        ["Próximas", "4"],
        ["Completadas", "8"],
        ["Solicitudes", "3"],
      ],
      items: [
        "Asesoría de Matemáticas",
        "Tutoría de Ciencias",
        "Acompañamiento académico",
      ],
    },
    {
      title: "EduNexus Meet",
      subtitle: "Conecta mediante reuniones virtuales",
      icon: Video,
      color: "text-red-500",
      bg: "bg-red-500/10",
      stats: [
        ["Reuniones", "6"],
        ["En vivo", "2"],
        ["Próximas", "4"],
        ["Salas", "8"],
      ],
      items: [
        "Clase virtual",
        "Reunión de grupo",
        "Asesoría académica",
      ],
    },
    {
      title: "Salas Meet",
      subtitle: "Administra tus espacios virtuales",
      icon: Monitor,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      stats: [
        ["Salas", "8"],
        ["Activas", "2"],
        ["Programadas", "6"],
        ["Participantes", "84"],
      ],
      items: [
        "Sala de clase",
        "Sala de reuniones",
        "Sala de asesorías",
      ],
    },
    {
      title: "Portal de Padres",
      subtitle: "Acompaña el proceso educativo",
      icon: UserCircle,
      color: "text-teal-500",
      bg: "bg-teal-500/10",
      stats: [
        ["Estudiantes", "2"],
        ["Cursos", "8"],
        ["Eventos", "4"],
        ["Notificaciones", "6"],
      ],
      items: [
        "Progreso académico",
        "Actividades escolares",
        "Información institucional",
      ],
    },
    {
      title: "Perfil",
      subtitle: "Administra tu información personal",
      icon: UserCircle,
      color: "text-sky-500",
      bg: "bg-sky-500/10",
      stats: [
        ["Perfil", "100%"],
        ["Cursos", "8"],
        ["Grupos", "4"],
        ["Actividad", "24"],
      ],
      items: [
        "Información personal",
        "Información académica",
        "Actividad reciente",
      ],
    },
    {
      title: "Reconocimientos",
      subtitle: "Celebra los logros de la comunidad",
      icon: Award,
      color: "text-yellow-500",
      bg: "bg-yellow-500/10",
      stats: [
        ["Reconocimientos", "32"],
        ["Este mes", "8"],
        ["Destacados", "12"],
        ["Participantes", "64"],
      ],
      items: [
        "Logro académico",
        "Participación destacada",
        "Reconocimiento institucional",
      ],
    },
    {
      title: "Administración",
      subtitle: "Gestiona tu institución",
      icon: UserCog,
      color: "text-slate-500",
      bg: "bg-slate-500/10",
      stats: [
        ["Usuarios", "1.248"],
        ["Grupos", "48"],
        ["Cursos", "96"],
        ["Procesos", "18"],
      ],
      items: [
        "Gestión de usuarios",
        "Gestión académica",
        "Configuración institucional",
      ],
    },
    {
      title: "Gestión Académica",
      subtitle: "Controla los procesos educativos",
      icon: ClipboardList,
      color: "text-blue-600",
      bg: "bg-blue-600/10",
      stats: [
        ["Estudiantes", "1.248"],
        ["Docentes", "86"],
        ["Cursos", "96"],
        ["Grupos", "48"],
      ],
      items: [
        "Matrículas",
        "Cursos y materias",
        "Grupos académicos",
      ],
    },
    {
      title: "Super Administración",
      subtitle: "Control avanzado de EduNexus",
      icon: Database,
      color: "text-gray-600",
      bg: "bg-gray-600/10",
      stats: [
        ["Instituciones", "12"],
        ["Usuarios", "8.492"],
        ["Administradores", "48"],
        ["Activas", "12"],
      ],
      items: [
        "Instituciones",
        "Administradores",
        "Configuración global",
      ],
    },
    {
      title: "Configuración",
      subtitle: "Personaliza tu experiencia",
      icon: Settings,
      color: "text-zinc-500",
      bg: "bg-zinc-500/10",
      stats: [
        ["Preferencias", "8"],
        ["Seguridad", "100%"],
        ["Notificaciones", "6"],
        ["Perfil", "Completo"],
      ],
      items: [
        "Preferencias personales",
        "Seguridad de la cuenta",
        "Configuración de notificaciones",
      ],
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((current) => (current + 1) % previews.length);
    }, 3200);

    return () => clearInterval(timer);
  }, [previews.length]);

  const current = previews[active];
  const ActiveIcon = current.icon;

  return (
    <div className="relative mx-auto w-full max-w-2xl">
      <div className="absolute -inset-8 rounded-[3rem] bg-primary/10 blur-3xl" />

      <div className="relative overflow-hidden rounded-3xl border bg-card/95 p-3 shadow-2xl backdrop-blur-xl">

        {/* VENTANA */}
        <div className="rounded-2xl border bg-background/80 p-4">

          {/* BARRA DEL NAVEGADOR */}
          <div className="mb-4 flex items-center gap-2">
            <div className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
            </div>

            <div className="mx-auto flex h-6 w-64 items-center justify-center rounded-md bg-muted text-[9px] text-muted-foreground">
              app.edunexus.com
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-[155px_1fr]">

            {/* SIDEBAR COMPLETA */}
            <div className="hidden rounded-xl border bg-muted/30 p-3 md:block">

              <div className="mb-5 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <GraduationCap className="h-4 w-4" />
                </div>

                <span className="text-xs font-bold">
                  EduNexus
                </span>
              </div>

              <div className="space-y-1">

                {previews.map((preview, index) => {
                  const Icon = preview.icon;

                  return (
                    <button
                      key={preview.title}
                      type="button"
                      onClick={() => setActive(index)}
                      className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[9px] transition-all duration-300 ${
                        active === index
                          ? "bg-primary/10 font-semibold text-primary"
                          : "text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" />

                      <span className="truncate">
                        {preview.title}
                      </span>
                    </button>
                  );
                })}

              </div>
            </div>

            {/* PANEL PRINCIPAL DINÁMICO */}
            <div
              key={active}
              className="min-h-[340px] rounded-xl border bg-muted/20 p-4 animate-in fade-in slide-in-from-right-4 duration-500"
            >

              {/* HEADER */}
              <div className="mb-5 flex items-center justify-between">

                <div>
                  <p className="text-[10px] text-muted-foreground">
                    Plataforma educativa
                  </p>

                  <h3 className="mt-1 text-base font-bold">
                    {current.title}
                  </h3>

                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {current.subtitle}
                  </p>
                </div>

                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${current.bg} ${current.color}`}
                >
                  <ActiveIcon className="h-5 w-5" />
                </div>

              </div>

              {/* ESTADÍSTICAS */}
              <div className="grid grid-cols-2 gap-3">

                {current.stats.map(([label, value], index) => (
                  <div
                    key={label}
                    className="rounded-xl border bg-card p-3 animate-in fade-in zoom-in-95 duration-500"
                    style={{
                      animationDelay: `${index * 100}ms`,
                      animationFillMode: "both",
                    }}
                  >
                    <p className="text-[10px] text-muted-foreground">
                      {label}
                    </p>

                    <p className="mt-1 text-xl font-bold">
                      {value}
                    </p>
                  </div>
                ))}

              </div>

              {/* ACTIVIDAD */}
              <div className="mt-3 rounded-xl border bg-card p-4">

                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-semibold">
                    {current.title}
                  </span>

                  <span className={`text-[10px] ${current.color}`}>
                    Activo
                  </span>
                </div>

                <div className="space-y-2">

                  {current.items.map((item, index) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 rounded-lg bg-muted/50 p-2.5 animate-in fade-in slide-in-from-bottom-2 duration-500"
                      style={{
                        animationDelay: `${300 + index * 120}ms`,
                        animationFillMode: "both",
                      }}
                    >
                      <div
                        className={`flex h-7 w-7 items-center justify-center rounded-lg ${current.bg} ${current.color}`}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </div>

                      <span className="text-[10px] font-medium">
                        {item}
                      </span>

                      <ChevronRight className="ml-auto h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  ))}

                </div>
              </div>

            </div>
          </div>
        </div>

        {/* INDICADORES */}
        <div className="flex items-center justify-center gap-1.5 overflow-hidden p-3">

          {previews.map((preview, index) => (
            <button
              key={preview.title}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`Mostrar ${preview.title}`}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                active === index
                  ? "w-7 bg-primary"
                  : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/60"
              }`}
            />
          ))}

        </div>
      </div>

      {/* TARJETA INFERIOR */}
      <div className="absolute -bottom-5 -left-5 hidden items-center gap-3 rounded-2xl border bg-card p-3 shadow-xl sm:flex">

        <div
          className={`flex h-9 w-9 items-center justify-center rounded-xl ${current.bg} ${current.color}`}
        >
          <ActiveIcon className="h-5 w-5" />
        </div>

        <div>
          <p className="text-xs font-bold">
            {current.title}
          </p>

          <p className="text-[10px] text-muted-foreground">
            Función integrada en EduNexus
          </p>
        </div>

      </div>

      {/* TARJETA SUPERIOR */}
      <div className="absolute -right-5 -top-5 hidden items-center gap-3 rounded-2xl border bg-card p-3 shadow-xl sm:flex">

        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Sparkles className="h-5 w-5" />
        </div>

        <div>
          <p className="text-xs font-bold">
            EduNexus
          </p>

          <p className="text-[10px] text-muted-foreground">
            {active + 1} de {previews.length} funciones
          </p>
        </div>

      </div>

    </div>
  );
}

export default function Landing() {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [activeCategory, setActiveCategory] = useState("Todo");
  const [showAll, setShowAll] = useState(false);

  const filteredFeatures =
    activeCategory === "Todo"
      ? features
      : features.filter((feature) => feature.category === activeCategory);

  const displayedFeatures = showAll
    ? filteredFeatures
    : filteredFeatures.slice(0, 12);

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      {/* NAVBAR */}
      <header className="fixed inset-x-0 top-0 z-50 border-b bg-background/75 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold tracking-tight">EduNexus</span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
            <a
              href="#funciones"
              className="transition-colors hover:text-foreground"
            >
              Funciones
            </a>
            <a
              href="#roles"
              className="transition-colors hover:text-foreground"
            >
              Para quién
            </a>
            <a
              href="#ecosistema"
              className="transition-colors hover:text-foreground"
            >
              Ecosistema
            </a>
          </nav>

          <div className="hidden items-center gap-2 md:flex">
            <ThemeToggle />

            <Link href="/login">
              <Button variant="ghost" size="sm">
                Iniciar sesión
              </Button>
            </Link>

            <Link href="/register">
              <Button size="sm">
                Crear cuenta
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <button
            type="button"
            className="rounded-lg p-2 md:hidden"
            onClick={() => setMobileMenu((value) => !value)}
            aria-label="Abrir menú"
          >
            {mobileMenu ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>

        {mobileMenu && (
          <div className="border-t bg-background p-4 md:hidden">
            <div className="flex flex-col gap-2">
              <a
                href="#funciones"
                onClick={() => setMobileMenu(false)}
                className="rounded-lg px-3 py-2 text-sm hover:bg-muted"
              >
                Funciones
              </a>

              <a
                href="#roles"
                onClick={() => setMobileMenu(false)}
                className="rounded-lg px-3 py-2 text-sm hover:bg-muted"
              >
                Para quién
              </a>

              <a
                href="#ecosistema"
                onClick={() => setMobileMenu(false)}
                className="rounded-lg px-3 py-2 text-sm hover:bg-muted"
              >
                Ecosistema
              </a>

              <div className="mt-2 flex gap-2 border-t pt-3">
                <Link href="/login" className="flex-1">
                  <Button variant="outline" className="w-full">
                    Iniciar sesión
                  </Button>
                </Link>

                <Link href="/register" className="flex-1">
                  <Button className="w-full">Crear cuenta</Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* HERO */}
      <section className="relative flex min-h-screen items-center overflow-hidden pt-16">
        <AnimatedBackground />

        <div className="relative mx-auto grid w-full max-w-7xl items-center gap-16 px-4 py-20 md:px-6 lg:grid-cols-2 lg:py-28">
          <div className="relative z-10">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-primary/5 px-4 py-2 text-xs font-semibold text-primary shadow-sm">
              <Sparkles className="h-4 w-4" />
              La plataforma que conecta tu institución
            </div>

            <h1 className="max-w-3xl text-5xl font-black leading-[1.02] tracking-[-0.04em] md:text-6xl lg:text-7xl">
              Todo tu colegio.
              <span className="block bg-gradient-to-r from-primary via-blue-500 to-violet-500 bg-clip-text text-transparent">
                Un solo ecosistema.
              </span>
            </h1>

            <p className="mt-7 max-w-xl text-lg leading-8 text-muted-foreground md:text-xl">
              EduNexus reúne en una sola plataforma las herramientas que tu
              comunidad educativa necesita para aprender, comunicarse,
              organizarse y gestionar la institución.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/register">
                <Button size="lg" className="h-12 rounded-xl px-7 shadow-lg">
                  Comenzar ahora
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>

              <Link href="/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 rounded-xl px-7"
                >
                  Ya tengo una cuenta
                </Button>
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-xs text-muted-foreground">
              {[
                "Estudiantes",
                "Docentes",
                "Padres",
                "Directivos",
                "Administradores",
              ].map((item) => (
                <span key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="relative z-10 lg:pl-4">
            <AppPreview />
          </div>
        </div>
      </section>

      {/* ECOSISTEMA */}
      <section id="ecosistema" className="border-y bg-muted/20 py-12">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 md:grid-cols-4 md:px-6">
          {[
            {
              icon: School,
              value: "Integral",
              label: "Un ecosistema educativo conectado",
            },
            {
              icon: Users,
              value: "Multirol",
              label: "Experiencia adaptada a cada usuario",
            },
            {
              icon: Shield,
              value: "Seguro",
              label: "Acceso controlado según permisos",
            },
            {
              icon: Sparkles,
              value: "Centralizado",
              label: "Todo en un mismo lugar",
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.value}
                className="group flex flex-col items-center text-center"
              >
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="font-bold">{item.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {item.label}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* TODAS LAS FUNCIONES */}
      <section id="funciones" className="py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mx-auto mb-14 max-w-3xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-xs font-semibold text-primary">
              <Sparkles className="h-4 w-4" />
              Explora EduNexus
            </div>

            <h2 className="text-4xl font-black tracking-tight md:text-5xl">
              Todas las herramientas.
              <span className="block text-primary">
                Una experiencia conectada.
              </span>
            </h2>

            <p className="mt-5 text-muted-foreground md:text-lg">
              Descubre las funciones disponibles en el ecosistema EduNexus y
              conoce cómo cada una ayuda a conectar la comunidad educativa.
            </p>
          </div>

          {/* FILTROS */}
          <div className="mb-10 flex gap-2 overflow-x-auto pb-3">
            {categories.map((category) => {
              const Icon = category.icon;
              const active = activeCategory === category.name;

              return (
                <button
                  key={category.name}
                  type="button"
                  onClick={() => {
                    setActiveCategory(category.name);
                    setShowAll(false);
                  }}
                  className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition-all duration-300 ${
                    active
                      ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                      : "bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {category.name}
                </button>
              );
            })}
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {displayedFeatures.map((feature, index) => (
              <FeatureCard
                key={`${feature.title}-${feature.category}`}
                feature={feature}
                index={index}
              />
            ))}
          </div>

          {filteredFeatures.length > 12 && (
            <div className="mt-10 flex justify-center">
              <Button
                variant="outline"
                size="lg"
                className="rounded-xl"
                onClick={() => setShowAll((value) => !value)}
              >
                {showAll ? "Mostrar menos" : "Ver todas las funciones"}
                <ChevronRight
                  className={`ml-2 h-4 w-4 transition-transform ${
                    showAll ? "-rotate-90" : "rotate-90"
                  }`}
                />
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* ROLES */}
      <section id="roles" className="relative overflow-hidden bg-muted/20 py-24 md:py-32">
        <AnimatedBackground />

        <div className="relative mx-auto max-w-7xl px-4 md:px-6">
          <div className="mx-auto mb-14 max-w-3xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-background px-4 py-2 text-xs font-semibold shadow-sm">
              <Users className="h-4 w-4 text-primary" />
              Una plataforma para todos
            </div>

            <h2 className="text-4xl font-black tracking-tight md:text-5xl">
              Cada rol tiene su propio espacio
            </h2>

            <p className="mt-5 text-muted-foreground md:text-lg">
              EduNexus conecta a cada integrante de la institución mediante
              herramientas adaptadas a sus necesidades.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {roles.map((role, index) => (
              <RoleCard key={role.title} role={role} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* EXPERIENCIA */}
      <section className="py-24 md:py-32">
        <div className="mx-auto grid max-w-7xl items-center gap-16 px-4 md:px-6 lg:grid-cols-2">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-xs font-semibold text-primary">
              <LockKeyhole className="h-4 w-4" />
              Una experiencia centralizada
            </div>

            <h2 className="text-4xl font-black tracking-tight md:text-5xl">
              Menos herramientas separadas.
              <span className="block text-primary">
                Más conexión.
              </span>
            </h2>

            <p className="mt-6 leading-8 text-muted-foreground">
              EduNexus está pensado para reducir la fragmentación de los
              procesos educativos. La comunidad puede acceder a diferentes
              herramientas desde una experiencia coherente y centralizada.
            </p>

            <div className="mt-8 space-y-4">
              {[
                {
                  icon: Send,
                  title: "Comunicación",
                  text: "Mensajería, grupos y reuniones virtuales.",
                },
                {
                  icon: BookMarked,
                  title: "Aprendizaje",
                  text: "Cursos, aula virtual, asesorías y biblioteca.",
                },
                {
                  icon: Calendar,
                  title: "Organización",
                  text: "Calendarios, horarios y eventos institucionales.",
                },
                {
                  icon: Settings,
                  title: "Gestión",
                  text: "Herramientas administrativas y configuración.",
                },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.title}
                    className="group flex gap-4 rounded-2xl border bg-card p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>

                    <div>
                      <h3 className="font-bold">{item.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {item.text}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-8 rounded-full bg-primary/10 blur-3xl" />

            <div className="relative grid grid-cols-2 gap-4">
              {[
                {
                  icon: BookOpen,
                  title: "Aprender",
                  value: "Aula virtual",
                },
                {
                  icon: MessageSquare,
                  title: "Comunicar",
                  value: "Mensajería",
                },
                {
                  icon: CalendarDays,
                  title: "Organizar",
                  value: "Calendario",
                },
                {
                  icon: BarChart3,
                  title: "Gestionar",
                  value: "Indicadores",
                },
              ].map((item, index) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.title}
                    className={`rounded-3xl border bg-card p-6 shadow-xl transition-all duration-500 hover:-translate-y-2 ${
                      index % 2 === 1 ? "mt-8" : ""
                    }`}
                  >
                    <div className="mb-10 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      <Icon className="h-6 w-6" />
                    </div>

                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {item.title}
                    </p>

                    <p className="mt-2 font-bold">{item.value}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-primary py-24 text-primary-foreground md:py-32">
        <div className="absolute inset-0 opacity-10 [background-image:radial-gradient(circle_at_20%_20%,white_0,transparent_30%),radial-gradient(circle_at_80%_80%,white_0,transparent_30%)]" />

        <div className="relative mx-auto max-w-4xl px-4 text-center md:px-6">
          <div className="mx-auto mb-7 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
            <GraduationCap className="h-8 w-8" />
          </div>

          <h2 className="text-4xl font-black tracking-tight md:text-5xl">
            Todo empieza en EduNexus
          </h2>

          <p className="mx-auto mt-5 max-w-2xl leading-8 text-primary-foreground/80">
            Conecta aprendizaje, comunicación, organización y gestión en una
            experiencia diseñada para toda la comunidad educativa.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/register">
              <Button
                size="lg"
                variant="secondary"
                className="h-12 rounded-xl px-7"
              >
                Crear mi cuenta
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>

            <Link href="/login">
              <Button
                size="lg"
                variant="outline"
                className="h-12 rounded-xl border-white/30 bg-transparent px-7 text-white hover:bg-white/10 hover:text-white"
              >
                Iniciar sesión
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t py-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 md:flex-row md:items-center md:justify-between md:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <GraduationCap className="h-4 w-4" />
            </div>
            <span className="font-bold">EduNexus</span>
          </Link>

          <p className="text-center text-xs text-muted-foreground">
            © {new Date().getFullYear()} EduNexus. Plataforma de gestión
            educativa.
          </p>

          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <Link
              href="/login"
              className="transition-colors hover:text-foreground"
            >
              Iniciar sesión
            </Link>

            <Link
              href="/register"
              className="transition-colors hover:text-foreground"
            >
              Registrarse
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}