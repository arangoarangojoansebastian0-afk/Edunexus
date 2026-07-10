import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Settings as SettingsIcon, Moon, Sun, Bell, Shield, LogOut } from "lucide-react";

export default function Settings() {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const { toast } = useToast();

  const togglePrivacy = useMutation({
    mutationFn: (isPrivate: boolean) => apiRequest("PATCH", "/api/users/me/privacy", { isPrivate }),
    onSuccess: (_data, isPrivate) => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: isPrivate ? "Perfil privado activado" : "Perfil público activado",
        description: isPrivate
          ? "Ahora quien quiera escribirte por primera vez deberá enviarte una solicitud."
          : "Ahora cualquiera de tu institución puede escribirte directamente.",
      });
    },
    onError: () => toast({ title: "No se pudo actualizar la privacidad", variant: "destructive" }),
  });

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <AppLayout title="Configuración">
      <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              Configuración
            </CardTitle>
            <CardDescription>
              Personaliza tu experiencia en EduNexus
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Theme */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium flex items-center gap-2">
                {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                Apariencia
              </h3>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="dark-mode">Modo oscuro</Label>
                  <p className="text-sm text-muted-foreground">
                    Cambia entre el tema claro y oscuro
                  </p>
                </div>
                <Switch
                  id="dark-mode"
                  checked={theme === "dark"}
                  onCheckedChange={toggleTheme}
                  data-testid="switch-dark-mode"
                />
              </div>
            </div>

            <Separator />

            {/* Notifications */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Notificaciones
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="email-notifications">Notificaciones por email</Label>
                    <p className="text-sm text-muted-foreground">
                      Recibe actualizaciones importantes por correo
                    </p>
                  </div>
                  <Switch id="email-notifications" defaultChecked data-testid="switch-email-notifications" />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="push-notifications">Notificaciones push</Label>
                    <p className="text-sm text-muted-foreground">
                      Recibe notificaciones en tu navegador
                    </p>
                  </div>
                  <Switch id="push-notifications" data-testid="switch-push-notifications" />
                </div>
              </div>
            </div>

            <Separator />

            {/* Privacy */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Privacidad
              </h3>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="profile-public">Perfil público</Label>
                  <p className="text-sm text-muted-foreground">
                    {user?.isPrivate
                      ? "Tu perfil es privado: solo puedes chatear con quien acepte tu solicitud (o tú la de ellos)."
                      : "Permitir que cualquiera de tu institución te escriba directamente."}
                  </p>
                </div>
                <Switch
                  id="profile-public"
                  checked={!user?.isPrivate}
                  onCheckedChange={(checked) => togglePrivacy.mutate(!checked)}
                  disabled={togglePrivacy.isPending}
                  data-testid="switch-profile-public"
                />
              </div>
            </div>

            <Separator />

            {/* Session */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <LogOut className="h-4 w-4" />
                Sesión
              </h3>
              <Button
                variant="destructive"
                onClick={handleLogout}
                className="w-full sm:w-auto"
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar Sesión
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
