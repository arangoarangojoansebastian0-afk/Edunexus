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
  ChevronUp,
  Bell,
  Clock,
  School,
  MessageCircle,
  Video,
  UserCheck,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getFullName, getInitials, formatRole } from "@/lib/authUtils";

const mainNavItems = [
  { title: "Inicio", url: "/", icon: Home },
  { title: "Aula Virtual", url: "/classroom", icon: School },
  { title: "Horarios", url: "/schedules", icon: CalendarDays },
  { title: "Grupos", url: "/groups", icon: Users },
  { title: "Mensajes", url: "/messages", icon: MessageCircle },
  { title: "Biblioteca", url: "/library", icon: BookOpen },
  { title: "Meet", url: "/meet", icon: Video },
  { title: "Asesorías", url: "/tutoring", icon: Calendar },
  { title: "Calendario", url: "/calendar", icon: Clock },
];

// Los padres/acudientes no tienen curso, grupo ni calificaciones propias —
// solo necesitan ver a sus hijos y poder escribirle al colegio.
const parentNavItems = [
  { title: "Mis hijos", url: "/parent", icon: Users },
  { title: "Mensajes", url: "/messages", icon: MessageCircle },
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

  // BUG CORREGIDO: antes solo mostraba el link del panel a role==="admin"
  // exacto — rector, coordinador y secretaría ya tenían permisos reales en
  // el backend para partes del panel, pero ni siquiera veían el enlace acá
  // para llegar a él.
  const isAdmin = ["admin", "director", "super_admin", "coordinator", "secretary"].includes(user?.role || "");
  const navItems = user?.role === "parent" ? parentNavItems : mainNavItems;

  const { data: homeroomGroups } = useQuery<any[]>({
    queryKey: ["/api/teacher/homeroom-groups"],
    enabled: user?.role === "teacher",
  });
  const isHomeroomTeacher = (homeroomGroups?.length || 0) > 0;

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Link href="/" className="flex items-center gap-2 min-w-0">
          <GraduationCap className="h-8 w-8 text-primary shrink-0" />
          <span className="font-serif font-bold text-lg capitalize truncate">
            
            {institution?.institutionName || "Comunidad"}
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegación</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
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
              {isHomeroomTeacher && (
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

        {isAdmin && (
          <SidebarGroup>
            <SidebarGroupLabel>Administración</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={location === "/admin"}
                    data-testid="nav-admin"
                  >
                    <Link href="/admin">
                      <Shield className="h-5 w-5" />
                      <span>Panel Admin</span>
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

