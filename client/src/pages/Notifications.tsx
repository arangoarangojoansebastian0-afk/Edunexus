import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Bell, BookOpen, CalendarDays, CheckCheck, ChevronRight, MessageCircle, MessageSquareText, RefreshCw, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

type NotificationItem = {
  id: string;
  type: string;
  title: string;
  message: string;
  relatedId?: string | null;
  read: boolean;
  createdAt: string;
};

const tabs = [
  { value: "all", label: "Todas" },
  { value: "unread", label: "Sin leer" },
  { value: "message", label: "Mensajes" },
  { value: "post", label: "Anuncios" },
  { value: "course_post", label: "Publicaciones de cursos" },
  { value: "comment", label: "Comentarios" },
  { value: "event", label: "Eventos" },
  { value: "activity", label: "Actividades" },
  { value: "submission", label: "Entregas" },
  { value: "grade", label: "Calificaciones" },
  { value: "mention", label: "Menciones" },
];

function iconForType(type: string) {
  if (type === "message") return MessageCircle;
  if (type === "comment") return MessageSquareText;
  if (type === "event") return CalendarDays;
  if (type === "post" || type === "course_post" || type === "activity" || type === "submission" || type === "grade") return BookOpen;
  return Bell;
}

function hrefForNotification(item: NotificationItem) {
  if (item.type === "message" && item.relatedId) return `/messages/group/${encodeURIComponent(item.relatedId)}`;
  if (item.type === "event" && item.relatedId) return `/calendar?event=${encodeURIComponent(item.relatedId)}`;
  if (item.type === "course_post" && item.relatedId) return `/classroom/${encodeURIComponent(item.relatedId)}`;
  if ((item.type === "activity" || item.type === "submission" || item.type === "grade") && item.relatedId) return `/classroom/${encodeURIComponent(item.relatedId)}`;
  if (item.type === "comment" && item.relatedId) return `/classroom/${encodeURIComponent(item.relatedId)}`;
  if (item.type === "activity" || item.type === "submission" || item.type === "grade") return "/classroom";
  return "/";
}

export default function Notifications() {
  const [filter, setFilter] = useState("all");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const notifications = useQuery<NotificationItem[]>({
    queryKey: ["/api/notifications"],
    queryFn: async () => {
      const response = await fetch("/api/notifications", { credentials: "include" });
      if (!response.ok) throw new Error("No se pudieron cargar las notificaciones");
      return response.json();
    },
  });

  const unreadCount = (notifications.data || []).filter((item) => !item.read).length;
  const filtered = useMemo(() => (notifications.data || []).filter((item) => {
    if (filter === "unread") return !item.read;
    return filter === "all" || item.type === filter;
  }), [notifications.data, filter]);

  const markRead = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/notifications/${encodeURIComponent(id)}/read`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/notifications"] }),
    onError: () => toast({ title: "No se pudo actualizar la notificación", variant: "destructive" }),
  });
  const markAllRead = useMutation({
    mutationFn: () => apiRequest("POST", "/api/notifications/read-all", {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/notifications"] }),
    onError: () => toast({ title: "No se pudieron marcar como leídas", variant: "destructive" }),
  });
  const deleteNotification = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/notifications/${encodeURIComponent(id)}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/notifications"] }),
    onError: () => toast({ title: "No se pudo eliminar la notificación", variant: "destructive" }),
  });

  const openNotification = (item: NotificationItem) => {
    if (!item.read) markRead.mutate(item.id);
    navigate(hrefForNotification(item));
  };

  return (
    <AppLayout title="Notificaciones">
      <div className="mx-auto max-w-3xl space-y-5 p-4 md:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Actividad reciente de tus cursos y comunidades</p>
            <h2 className="mt-1 text-2xl font-semibold">Notificaciones {unreadCount > 0 && <Badge className="ml-2 align-middle">{unreadCount} sin leer</Badge>}</h2>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => notifications.refetch()} disabled={notifications.isFetching} aria-label="Actualizar notificaciones">
              <RefreshCw className={`mr-2 h-4 w-4 ${notifications.isFetching ? "animate-spin" : ""}`} />Actualizar
            </Button>
            {unreadCount > 0 && <Button size="sm" onClick={() => markAllRead.mutate()} disabled={markAllRead.isPending}>
              <CheckCheck className="mr-2 h-4 w-4" />Marcar todo leído
            </Button>}
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Filtrar notificaciones">
          {tabs.map((tab) => <Button key={tab.value} type="button" size="sm" variant={filter === tab.value ? "default" : "outline"} onClick={() => setFilter(tab.value)} role="tab" aria-selected={filter === tab.value}>
            {tab.label}{tab.value === "unread" && unreadCount > 0 ? ` (${unreadCount})` : ""}
          </Button>)}
        </div>

        {notifications.isLoading ? <div className="space-y-3">{Array.from({ length: 4 }).map((_, index) => <Card key={index} className="flex gap-4 p-4"><Skeleton className="h-10 w-10 shrink-0 rounded-full" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-1/3" /><Skeleton className="h-4 w-4/5" /><Skeleton className="h-3 w-1/4" /></div></Card>)}</div>
          : notifications.isError ? <EmptyState icon={Bell} title="No se pudieron cargar" description="Intenta actualizar la lista en unos segundos." action={{ label: "Reintentar", onClick: () => void notifications.refetch() }} />
          : filtered.length === 0 ? <EmptyState icon={Bell} title={filter === "unread" ? "Ya estás al día" : "Sin notificaciones"} description={filter === "unread" ? "No tienes avisos pendientes por leer." : "Cuando haya novedades de tus espacios aparecerán aquí."} />
          : <div className="space-y-2">{filtered.map((item) => {
            const Icon = iconForType(item.type);
            return <Card key={item.id} className={`flex items-start gap-3 p-4 transition-colors ${!item.read ? "border-primary/25 bg-primary/[0.025]" : ""}`}>
              <span className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${!item.read ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}><Icon className="h-5 w-5" /></span>
              <button type="button" onClick={() => openNotification(item)} className="min-w-0 flex-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md">
                <span className="flex flex-wrap items-center gap-2"><span className="font-medium">{item.title}</span>{!item.read && <span className="h-2 w-2 rounded-full bg-primary" aria-label="Sin leer" />}</span>
                <span className="mt-1 block text-sm text-muted-foreground">{item.message}</span>
                <span className="mt-2 block text-xs text-muted-foreground">{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true, locale: es })}</span>
              </button>
              {!item.read && <Button type="button" variant="ghost" size="icon" onClick={() => markRead.mutate(item.id)} disabled={markRead.isPending} aria-label="Marcar como leída"><CheckCheck className="h-4 w-4" /></Button>}
              <Button type="button" variant="ghost" size="icon" onClick={() => deleteNotification.mutate(item.id)} disabled={deleteNotification.isPending} aria-label={`Eliminar notificación: ${item.title}`} title="Eliminar notificación"><Trash2 className="h-4 w-4" /></Button>
              <ChevronRight className="mt-3 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            </Card>;
          })}</div>}
      </div>
    </AppLayout>
  );
}
