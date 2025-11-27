import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogOut, Settings } from "lucide-react";
import { Link, useLocation } from "wouter";
import { getFullName, getInitials } from "@/lib/authUtils";
import { useToast } from "@/hooks/use-toast";
import { useAuthContext } from "@/context/AuthContext";

export function UserMenu() {
  const { user, isAuthenticated } = useAuth();
  const { refetchUser } = useAuthContext();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  if (!isAuthenticated || !user) {
    return (
      <Button asChild>
        <Link href="/login">Iniciar Sesión</Link>
      </Button>
    );
  }

  const fullName = getFullName(user.firstName, user.lastName);
  const initials = getInitials(user.firstName, user.lastName);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      await refetchUser();
      toast({
        title: "Sesión cerrada",
        description: "Hasta pronto",
      });
      navigate("/");
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cerrar sesión",
        variant: "destructive",
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="relative h-9 w-9 rounded-full"
          data-testid="button-user-menu"
        >
          <Avatar className="h-9 w-9">
            {user.profileImageUrl && <AvatarImage src={user.profileImageUrl} />}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium">{fullName}</p>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile">
            <User className="mr-2 h-4 w-4" />
            Mi Perfil
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings className="mr-2 h-4 w-4" />
            Configuración
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Cerrar Sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
