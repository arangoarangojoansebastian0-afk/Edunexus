import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Settings as SettingsIcon, Moon, Sun, Bell, Shield, LogOut, Accessibility } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useAccessibilityPreferences } from "@/hooks/useAccessibilityPreferences";

export default function Settings() {
  const { theme, toggleTheme } = useTheme();
  const accessibility = useAccessibilityPreferences();
  const { user } = useAuth();
  const { toast } = useToast();
  const push = usePushNotifications();
  type PushPreferenceKey = "pushNewMessage" | "pushNewPost" | "pushNewAnswer";
  const { data: notificationPreferences } = useQuery<{
    pushNewMessage: boolean;
    pushNewPost: boolean;
    pushNewAnswer: boolean;
  }>({ queryKey: ["/api/notification-preferences"] });

  const saveNotificationPreference = useMutation({
    mutationFn: (preference: Partial<Record<PushPreferenceKey, boolean>>) =>
      apiRequest("PATCH", "/api/notification-preferences", preference),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/notification-preferences"] }),
    onError: () => toast({ title: "No se pudo guardar la preferencia", variant: "destructive" }),
  });

  const togglePrivacy = useMutation({
    mutationFn: (isPrivate: boolean) => apiRequest("PATCH", "/api/users/me/privacy", { isPrivate }),
    onSuccess: (_data, isPrivate) => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: isPrivate ? "Mensajes directos protegidos" : "Mensajes directos abiertos",
        description: isPrivate
          ? "Las personas que aún no tienen una conversación contigo deberán enviarte una solicitud."
          : "Las personas de tu institución pueden iniciar una conversación directamente.",
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

            <div className="space-y-4">
              <h3 className="text-sm font-medium flex items-center gap-2"><Accessibility className="h-4 w-4" />Accesibilidad</h3>
              <div className="flex items-center justify-between gap-4">
                <div><Label htmlFor="large-text">Texto más grande</Label><p className="text-sm text-muted-foreground">Aumenta el tamaño base del texto en la plataforma.</p></div>
                <Switch id="large-text" checked={accessibility.largeText} onCheckedChange={accessibility.setLargeText} />
              </div>
              <div className="flex items-center justify-between gap-4">
                <div><Label htmlFor="high-contrast">Contraste alto</Label><p className="text-sm text-muted-foreground">Refuerza el contraste de textos secundarios y bordes.</p></div>
                <Switch id="high-contrast" checked={accessibility.highContrast} onCheckedChange={accessibility.setHighContrast} />
              </div>
              <div className="flex items-center justify-between gap-4">
                <div><Label htmlFor="reduce-motion">Reducir movimiento</Label><p className="text-sm text-muted-foreground">Desactiva animaciones y transiciones decorativas.</p></div>
                <Switch id="reduce-motion" checked={accessibility.reduceMotion} onCheckedChange={accessibility.setReduceMotion} />
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
                <p className="text-sm text-muted-foreground">El envío de notificaciones por correo no está configurado. Las opciones disponibles controlan los avisos push del navegador.</p>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="push-notifications">Notificaciones push</Label>
                    <p className="text-sm text-muted-foreground">
                      {!push.supported
                        ? "Tu navegador no soporta notificaciones push"
                        : !push.enabled
                        ? "El servidor todavía no tiene notificaciones push configuradas"
                        : push.permission === "denied"
                        ? "Bloqueaste los permisos de notificación en el navegador"
                        : "Recibe notificaciones en tu navegador (mensajes, solicitudes, llamadas)"}
                    </p>
                  </div>
                  <Switch
                    id="push-notifications"
                    checked={push.subscribed}
                    disabled={!push.supported || !push.enabled || push.permission === "denied" || push.loading}
                    onCheckedChange={(checked) => checked ? push.subscribe() : push.unsubscribe()}
                    data-testid="switch-push-notifications"
                  />
                </div>
                {([
                  ["pushNewMessage", "Mensajes y solicitudes"],
                  ["pushNewPost", "Anuncios y nuevas actividades"],
                  ["pushNewAnswer", "Entregas y calificaciones"],
                ] as [PushPreferenceKey, string][]).map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between gap-4 pl-4">
                    <Label htmlFor={key} className="font-normal">{label}</Label>
                    <Switch
                      id={key}
                      checked={notificationPreferences?.[key] ?? false}
                      disabled={saveNotificationPreference.isPending}
                      onCheckedChange={(checked) => saveNotificationPreference.mutate({ [key]: checked })}
                    />
                  </div>
                ))}
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
                  <Label htmlFor="profile-public">Permitir mensajes directos</Label>
                  <p className="text-sm text-muted-foreground">
                    {user?.isPrivate
                      ? "Desactivado: las personas nuevas deben enviarte una solicitud de chat."
                      : "Activado: las personas de tu institución pueden iniciar chats directamente."}
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
