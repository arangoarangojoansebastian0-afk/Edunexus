import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/EmptyState";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Video,
  Plus,
  Copy,
  Globe,
  Lock,
  Clock,
  Users2,
  Trash2,
  Check,
} from "lucide-react";

interface MeetSession {
  id: string;
  title: string;
  description: string | null;
  roomName: string;
  visibility: "public" | "private";
  status: "scheduled" | "live" | "ended" | "cancelled";
  scheduledAt: string;
  durationMinutes: number;
  hostId: string;
  hostFirstName: string;
  hostLastName: string;
}

export default function Meet() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [createOpen, setCreateOpen] = useState(false);
  const [createdLink, setCreatedLink] = useState<{ id: string; title: string } | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [when, setWhen] = useState<"now" | "later">("now");
  const [scheduledAt, setScheduledAt] = useState("");
  const [duration, setDuration] = useState("60");
  const [invitedGroupIds, setInvitedGroupIds] = useState<string[]>([]);

  const { data: sessions, isLoading } = useQuery<MeetSession[]>({
    queryKey: ["/api/meet/sessions"],
    refetchInterval: 5000,
  });

  const { data: allGroups } = useQuery<{ id: string; name: string }[]>({
    queryKey: ["/api/groups"],
  });

  const resetForm = () => {
    setTitle(""); setDescription(""); setVisibility("public");
    setWhen("now"); setScheduledAt(""); setDuration("60"); setInvitedGroupIds([]);
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const scheduled = when === "now" ? new Date() : new Date(scheduledAt);
      const res = await apiRequest("POST", "/api/meet/sessions", {
        title,
        description: description || null,
        visibility,
        scheduledAt: scheduled.toISOString(),
        durationMinutes: parseInt(duration),
        invitedGroupIds: visibility === "private" ? invitedGroupIds : undefined,
      });
      return res.json();
    },
    onSuccess: (session) => {
      queryClient.invalidateQueries({ queryKey: ["/api/meet/sessions"] });
      setCreateOpen(false);
      setCreatedLink({ id: session.id, title: session.title });
      resetForm();
    },
    onError: (e: Error) => toast({ title: "No se pudo crear la reunión", description: e.message, variant: "destructive" }),
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => { await apiRequest("DELETE", `/api/meet/sessions/${id}`, {}); },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meet/sessions"] });
      toast({ title: "Reunión cancelada" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const copyLink = (id: string) => {
    const url = `${window.location.origin}/meet/${id}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Enlace copiado", description: url });
  };

  const activeSessions = (sessions || []).filter((s) => s.status !== "cancelled" && s.status !== "ended");
  const pastSessions = (sessions || []).filter((s) => s.status === "ended" || s.status === "cancelled");

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Video className="h-6 w-6" /> Meet
            </h1>
            <p className="text-sm text-muted-foreground">Crea una videollamada y comparte el enlace, sin necesidad de agendar una asesoría.</p>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" data-testid="button-new-meeting">
                <Plus className="h-4 w-4" /> Nueva reunión
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Nueva reunión</DialogTitle>
                <DialogDescription>Se genera un enlace para compartir con quien quieras invitar.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Título</label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Reunión de padres de familia" data-testid="input-meeting-title" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Descripción (opcional)</label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">¿Cuándo?</label>
                  <div className="flex gap-2">
                    <Button type="button" size="sm" variant={when === "now" ? "default" : "outline"} className="flex-1" onClick={() => setWhen("now")}>
                      Ahora mismo
                    </Button>
                    <Button type="button" size="sm" variant={when === "later" ? "default" : "outline"} className="flex-1" onClick={() => setWhen("later")}>
                      Programar
                    </Button>
                  </div>
                  {when === "later" && (
                    <Input
                      type="datetime-local"
                      className="mt-2"
                      value={scheduledAt}
                      onChange={(e) => setScheduledAt(e.target.value)}
                      data-testid="input-meeting-datetime"
                    />
                  )}
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Duración estimada (minutos)</label>
                  <Input type="number" min="10" max="480" value={duration} onChange={(e) => setDuration(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Visibilidad</label>
                  <div className="flex gap-2">
                    <Button type="button" size="sm" variant={visibility === "public" ? "default" : "outline"} className="gap-1.5 flex-1" onClick={() => setVisibility("public")}>
                      <Globe className="h-3.5 w-3.5" /> Pública
                    </Button>
                    <Button type="button" size="sm" variant={visibility === "private" ? "default" : "outline"} className="gap-1.5 flex-1" onClick={() => setVisibility("private")}>
                      <Lock className="h-3.5 w-3.5" /> Privada
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {visibility === "public"
                      ? "Cualquiera de tu institución la ve en su lista de Meet y puede unirse."
                      : "Solo entra quien tenga el enlace (y, si invitas grupos, solo esos grupos)."}
                  </p>
                </div>
                {visibility === "private" && (
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Invitar grupos (opcional)</label>
                    <div className="space-y-1 max-h-32 overflow-y-auto rounded-md border p-2">
                      {allGroups?.length ? allGroups.map((g) => (
                        <label key={g.id} className="flex items-center gap-2 text-sm py-0.5 cursor-pointer">
                          <Checkbox
                            checked={invitedGroupIds.includes(g.id)}
                            onCheckedChange={(checked) => {
                              setInvitedGroupIds((prev) => checked ? [...prev, g.id] : prev.filter((id) => id !== g.id));
                            }}
                          />
                          {g.name}
                        </label>
                      )) : <p className="text-xs text-muted-foreground py-1">No tienes grupos disponibles.</p>}
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button
                  onClick={() => createMutation.mutate()}
                  disabled={!title.trim() || (when === "later" && !scheduledAt) || createMutation.isPending}
                  data-testid="button-confirm-create-meeting"
                >
                  {createMutation.isPending ? "Creando..." : "Crear reunión"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Cargando...</p>
        ) : activeSessions.length === 0 ? (
          <EmptyState
            icon={Video}
            title="No hay reuniones todavía"
            description="Crea una para obtener un enlace que puedes compartir por chat, correo o donde quieras."
          />
        ) : (
          <div className="space-y-3">
            {activeSessions.map((s) => (
              <MeetingCard
                key={s.id}
                session={s}
                isHost={s.hostId === user?.id}
                onCopy={() => copyLink(s.id)}
                onJoin={() => setLocation(`/meet/${s.id}`)}
                onCancel={() => cancelMutation.mutate(s.id)}
              />
            ))}
          </div>
        )}

        {pastSessions.length > 0 && (
          <div className="space-y-2 pt-4">
            <h2 className="text-sm font-medium text-muted-foreground">Anteriores</h2>
            {pastSessions.map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-lg border px-3 py-2 opacity-60">
                <span className="text-sm truncate">{s.title}</span>
                <Badge variant="outline" className="shrink-0">{s.status === "cancelled" ? "Cancelada" : "Terminada"}</Badge>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Enlace listo para compartir tras crear la reunión */}
      <Dialog open={!!createdLink} onOpenChange={(open) => !open && setCreatedLink(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>¡Reunión creada!</DialogTitle>
            <DialogDescription>Comparte este enlace con quien quieras invitar a "{createdLink?.title}".</DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2">
            <code className="text-xs flex-1 truncate">{createdLink && `${window.location.origin}/meet/${createdLink.id}`}</code>
            <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => createdLink && copyLink(createdLink.id)}>
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setCreatedLink(null)}>Cerrar</Button>
            <Button onClick={() => createdLink && setLocation(`/meet/${createdLink.id}`)} className="gap-2">
              <Video className="h-4 w-4" /> Unirse ahora
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

function MeetingCard({
  session, isHost, onCopy, onJoin, onCancel,
}: {
  session: MeetSession; isHost: boolean;
  onCopy: () => void; onJoin: () => void; onCancel: () => void;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="text-base truncate">{session.title}</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              {session.hostFirstName} {session.hostLastName}
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {session.status === "live" && <Badge className="bg-green-600 hover:bg-green-600 gap-1"><span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />En vivo</Badge>}
            <Badge variant="outline" className="gap-1">
              {session.visibility === "public" ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
              {session.visibility === "public" ? "Pública" : "Privada"}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {session.description && <p className="text-sm text-muted-foreground">{session.description}</p>}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          {format(new Date(session.scheduledAt), "d 'de' MMMM, h:mm a", { locale: es })} · {session.durationMinutes} min
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" className="gap-1.5" onClick={onJoin} data-testid="button-join-meeting">
            <Video className="h-3.5 w-3.5" /> Unirse
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={onCopy}>
            <Copy className="h-3.5 w-3.5" /> Copiar enlace
          </Button>
          {isHost && (
            <Button size="sm" variant="ghost" className="gap-1.5 text-red-500 hover:text-red-600 ml-auto" onClick={onCancel}>
              <Trash2 className="h-3.5 w-3.5" /> Cancelar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
