import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useInstitutionSettings } from "@/hooks/useInstitutionSettings";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Home,
  Users,
  BookOpen,
  Calendar,
  CalendarDays,
  User,
  Settings,
  LogOut,
  Shield,
  GraduationCap,
  ClipboardCheck,
  ChevronUp,
  Bell,
  Clock,
  School,
  MessageCircle,
  Video,
  UserCheck,
  ClipboardList,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getFullName, getInitials, formatRole } from "@/lib/authUtils";

const studentNavItems = [
  { title: "Inicio", url: "/", icon: Home },
  { title: "Aula Virtual", url: "/aula-virtual", icon: School },
  { title: "Horarios", url: "/schedules", icon: CalendarDays },
  { title: "Grupos", url: "/groups", icon: Users },
  { title: "Mensajes", url: "/messages", icon: MessageCircle },
  { title: "Biblioteca", url: "/library", icon: BookOpen },
  { title: "Calificaciones", url: "/grades", icon: GraduationCap },
  { title: "Meet", url: "/meet", icon: Video },
  { title: "Asesorías", url: "/tutoring", icon: Calendar },
  { title: "Calendario", url: "/calendar", icon: Clock },
];

const teacherNavItems = [
  { title: "Inicio", url: "/", icon: Home },
  { title: "Mis Aulas", url: "/aula-virtual", icon: School },
  { title: "Calificaciones y entregas", url: "/grades", icon: ClipboardCheck },
  { title: "Promoción anual", url: "/promotions", icon: ClipboardList },
  { title: "Horarios", url: "/schedules", icon: CalendarDays },
  { title: "Grupos", url: "/groups", icon: Users },
  { title: "Mensajes", url: "/messages", icon: MessageCircle },
  { title: "Biblioteca", url: "/library", icon: BookOpen },
  { title: "Meet", url: "/meet", icon: Video },
  { title: "Asesorías", url: "/tutoring", icon: Calendar },
  { title: "Calendario", url: "/calendar", icon: Clock },
];

const administratorNavItems = [
  { title: "Inicio", url: "/", icon: Home },
  { title: "Aulas virtuales", url: "/aula-virtual", icon: School },
  { title: "Promoción anual", url: "/promotions", icon: ClipboardList },
  { title: "Horarios", url: "/schedules", icon: CalendarDays },
  { title: "Grupos", url: "/groups", icon: Users },
  { title: "Mensajes", url: "/messages", icon: MessageCircle },
  { title: "Biblioteca", url: "/library", icon: BookOpen },
  { title: "Meet", url: "/meet", icon: Video },
  { title: "Calendario", url: "/calendar", icon: Clock },
];

const institutionStaffNavItems = [
  { title: "Inicio", url: "/", icon: Home },
  { title: "Horarios", url: "/schedules", icon: CalendarDays },
  { title: "Mensajes", url: "/messages", icon: MessageCircle },
  { title: "Biblioteca", url: "/library", icon: BookOpen },
  { title: "Calendario", url: "/calendar", icon: Clock },
];

// Los padres/acudientes no tienen curso, grupo ni calificaciones propias —
// solo necesitan ver a sus hijos y poder escribirle al colegio.
const parentNavItems = [
  { title: "Mis hijos", url: "/parent", icon: Users },
  { title: "Mensajes", url: "/messages", icon: MessageCircle },
];

const superAdminNavItems = [
  { title: "Administración global", url: "/super-admin", icon: Shield },
];

const personalNavItems = [
  { title: "Mi Perfil", url: "/profile", icon: User },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user } = useAuth();

  
  const { data: institution } = useInstitutionSettings();

  const { data: unread } = useQuery<{ count: number }>({
    queryKey: ["/api/direct-messages/unread/count"],
    enabled: !!user,
    refetchInterval: 15000,
  });
  const unreadCount = unread?.count || 0;

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } finally {
      localStorage.removeItem("communidad_loyola_user");
      window.location.href = "/login";
    }
  };

  const role = user?.role || "student";
  const isInstitutionAdmin = ["admin", "director", "coordinator", "secretary"].includes(role);
  const isSuperAdmin = role === "super_admin";
  const navItems = role === "teacher"
    ? teacherNavItems
    : role === "parent"
      ? parentNavItems
      : isSuperAdmin
        ? superAdminNavItems
        : role === "admin"
          ? administratorNavItems
          : isInstitutionAdmin
            ? institutionStaffNavItems
            : studentNavItems;
  const navSectionLabel = role === "teacher"
    ? "Docencia"
    : role === "parent"
      ? "Familia"
      : isSuperAdmin
        ? "Plataforma"
        : isInstitutionAdmin
          ? "Gestión institucional"
          : "Aprendizaje";

  const { data: homeroomGroups } = useQuery<any[]>({
    queryKey: ["/api/teacher/homeroom-groups"],
    enabled: user?.role === "teacher",
  });
  const isHomeroomTeacher = (homeroomGroups?.length || 0) > 0;

  return (
    <Sidebar>
      <SidebarHeader className="edunexus-sidebar-brand p-4">
        <Link href="/" className="flex items-center gap-3 min-w-0 rounded-xl p-1.5 transition-colors hover:bg-white/5">
          <span className="edunexus-brand-mark flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
            <GraduationCap className="h-6 w-6" />
          </span>
          <span className="min-w-0">
            <span className="block font-serif text-base font-bold leading-tight tracking-tight text-sidebar-foreground truncate">EduNexus</span>
            <span className="mt-1 block truncate text-[10px] font-medium uppercase tracking-[0.13em] text-sidebar-foreground/55">{institution?.institutionName || "Comunidad educativa"}</span>
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{navSectionLabel}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url || (item.url !== "/" && location.startsWith(`${item.url}/`))}
                    data-testid={`nav-${item.title.toLowerCase()}`}
                  >
                    <Link href={item.url} className="flex items-center gap-2 w-full">
                      <item.icon className="h-5 w-5" />
                      <span className="flex-1">{item.title}</span>
                      {item.title === "Mensajes" && unreadCount > 0 && (
                        <Badge
                          variant="destructive"
                          className="h-5 min-w-5 px-1 flex items-center justify-center text-[10px] shrink-0"
                        >
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </Badge>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {isInstitutionAdmin && ["director", "coordinator"].includes(role) && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={location === "/promotions"} data-testid="nav-promocion-anual">
                    <Link href="/promotions" className="flex items-center gap-2 w-full"><ClipboardList className="h-5 w-5" /><span>Promoción anual</span></Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              {isHomeroomTeacher && role === "teacher" && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={location === "/my-group"}
                    data-testid="nav-mi-grupo"
                  >
                    <Link href="/my-group" className="flex items-center gap-2 w-full">
                      <UserCheck className="h-5 w-5" />
                      <span className="flex-1">Mi Grupo</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Personal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {personalNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    data-testid={`nav-${item.title.toLowerCase().replace(" ", "-")}`}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location === "/notifications"}
                  data-testid="nav-notifications"
                >
                  <Link href="/notifications">
                    <Bell className="h-5 w-5" />
                    <span>Notificaciones</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isInstitutionAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>{isSuperAdmin ? "Plataforma" : "Administración"}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={location === (isSuperAdmin ? "/super-admin" : "/admin")}
                    data-testid="nav-admin"
                  >
                    <Link href={isSuperAdmin ? "/super-admin" : "/admin"}>
                      <Shield className="h-5 w-5" />
                      <span>{isSuperAdmin ? "Panel global" : "Panel Admin"}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 h-auto py-2 px-2"
              data-testid="button-user-menu"
            >
              <Avatar className="h-9 w-9">
                <AvatarImage
                  src={user?.profileImageUrl || undefined}
                  alt={getFullName(user?.firstName, user?.lastName)}
                  className="object-cover"
                />
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {getInitials(user?.firstName, user?.lastName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-medium truncate">
                  {getFullName(user?.firstName, user?.lastName)}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {formatRole(user?.role || "student")}
                </p>
              </div>
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem asChild>
              <Link href="/profile" className="flex items-center gap-2 cursor-pointer">
                <User className="h-4 w-4" />
                <span>Mi Perfil</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings" className="flex items-center gap-2 cursor-pointer">
                <Settings className="h-4 w-4" />
                <span>Configuración</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-destructive focus:text-destructive cursor-pointer"
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4 mr-2" />
              <span>Cerrar Sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

