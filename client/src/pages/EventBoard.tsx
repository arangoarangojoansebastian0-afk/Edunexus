import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pin, Plus, Clock, User, Loader2, MoreVertical, Trash2, Copy, Edit2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { getFullName } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import type { EventWithHost } from "@shared/schema";

interface PositionedEvent extends EventWithHost {
  position: { x: number; y: number };
  isPinned?: boolean;
}

export default function EventBoard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const boardRef = useRef<HTMLDivElement>(null);
  
  const [events, setEvents] = useState<PositionedEvent[]>([]);
  const [draggedEvent, setDraggedEvent] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventSubject, setNewEventSubject] = useState("");
  const [newEventDate, setNewEventDate] = useState("");
  const [newEventTime, setNewEventTime] = useState("");
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  const { data: apiEvents, isLoading } = useQuery<EventWithHost[]>({
    queryKey: ["/api/events"],
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      await apiRequest("DELETE", `/api/events/${eventId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({
        title: "Éxito",
        description: "Evento eliminado correctamente",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar el evento",
        variant: "destructive",
      });
    },
  });

  const handleCopyEvent = (evt: EventWithHost) => {
    const eventText = `${evt.title}\nTema: ${evt.subject}\nFecha: ${new Date(evt.startTime).toLocaleString("es-ES")}\nPor: ${getFullName(evt.host.firstName, evt.host.lastName)}`;
    navigator.clipboard.writeText(eventText);
    toast({
      title: "Copiado",
      description: "Evento copiado al portapapeles",
    });
  };

  const handleEditEvent = (evt: EventWithHost) => {
    setEditingEventId(evt.id);
    setNewEventTitle(evt.title);
    setNewEventSubject(evt.subject || "");
    const startDate = new Date(evt.startTime);
    setNewEventDate(startDate.toISOString().split("T")[0]);
    setNewEventTime(startDate.toTimeString().slice(0, 5));
  };

  // Initialize events with random positions
  const initializeEvents = (apiEvents: EventWithHost[]) => {
    const positioned = apiEvents.map((evt, index) => ({
      ...evt,
      position: {
        x: (index % 5) * 280 + Math.random() * 30,
        y: Math.floor(index / 5) * 220 + Math.random() * 30,
      },
      isPinned: false,
    }));
    setEvents(positioned);
  };

  if (apiEvents && events.length === 0) {
    initializeEvents(apiEvents);
  }

  const createEventMutation = useMutation({
    mutationFn: async () => {
      const startDateTime = new Date(`${newEventDate}T${newEventTime}`);
      const endDateTime = new Date(startDateTime.getTime() + 60 * 60000);

      await apiRequest("POST", "/api/events", {
        title: newEventTitle,
        subject: newEventSubject,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
      });
    },
    onSuccess: () => {
      setNewEventTitle("");
      setNewEventSubject("");
      setNewEventDate("");
      setNewEventTime("");
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({
        title: "Éxito",
        description: "Evento creado correctamente",
      });
    },
  });

  const handleMouseDown = (e: React.MouseEvent, eventId: string) => {
    const event = events.find((ev) => ev.id === eventId);
    if (!event || event.isPinned) return;

    const boardRect = boardRef.current?.getBoundingClientRect();
    if (!boardRect) return;

    setDraggedEvent(eventId);
    setDragOffset({
      x: e.clientX - boardRect.left - event.position.x,
      y: e.clientY - boardRect.top - event.position.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggedEvent || !boardRef.current) return;

    const boardRect = boardRef.current.getBoundingClientRect();
    const newX = Math.max(0, e.clientX - boardRect.left - dragOffset.x);
    const newY = Math.max(0, e.clientY - boardRect.top - dragOffset.y);

    setEvents((prev) =>
      prev.map((evt) =>
        evt.id === draggedEvent ? { ...evt, position: { x: newX, y: newY } } : evt
      )
    );
  };

  const handleMouseUp = () => {
    setDraggedEvent(null);
  };

  const togglePin = (eventId: string) => {
    setEvents((prev) =>
      prev.map((evt) =>
        evt.id === eventId ? { ...evt, isPinned: !evt.isPinned } : evt
      )
    );
  };

  const eventCard = (evt: PositionedEvent) => (
    <div
      key={evt.id}
      className="absolute w-64 bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 p-3 hover-elevate"
      style={{
        left: `${evt.position.x}px`,
        top: `${evt.position.y}px`,
        cursor: evt.isPinned ? "default" : "grab",
        transform: draggedEvent === evt.id ? "scale(1.05)" : "scale(1)",
      }}
      onMouseDown={(e) => handleMouseDown(e, evt.id)}
      data-testid={`event-card-${evt.id}`}
    >
      <div className="space-y-2">
        {/* Header */}
        <div className="flex items-start justify-between gap-1">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base leading-tight line-clamp-2">{evt.title}</h3>
            <p className="text-xs text-muted-foreground">{evt.subject}</p>
          </div>
          <div className="flex gap-0.5 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => togglePin(evt.id)}
              data-testid={`button-pin-${evt.id}`}
            >
              <Pin className={`h-3 w-3 ${evt.isPinned ? "fill-current text-primary" : ""}`} />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  data-testid={`button-menu-${evt.id}`}
                >
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="text-xs">
                <DropdownMenuItem onClick={() => handleEditEvent(evt)} data-testid={`menu-edit-${evt.id}`}>
                  <Edit2 className="h-3 w-3 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleCopyEvent(evt)} data-testid={`menu-copy-${evt.id}`}>
                  <Copy className="h-3 w-3 mr-2" />
                  Copiar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => deleteEventMutation.mutate(evt.id)}
                  disabled={deleteEventMutation.isPending}
                  className="text-destructive focus:text-destructive"
                  data-testid={`menu-delete-${evt.id}`}
                >
                  <Trash2 className="h-3 w-3 mr-2" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Info */}
        <div className="space-y-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{formatDistanceToNow(new Date(evt.startTime), { addSuffix: true, locale: es })}</span>
          </div>
          <div className="flex items-center gap-1">
            <User className="h-3 w-3 flex-shrink-0" />
            <span className="truncate text-xs">{getFullName(evt.host.firstName, evt.host.lastName)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-1 pt-1.5 border-t">
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-7"
            data-testid={`button-join-${evt.id}`}
          >
            Unirse
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <AppLayout>
      <div className="h-screen flex flex-col gap-4 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Tablero de Eventos</h1>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="gap-2" data-testid="button-create-event">
                <Plus className="h-4 w-4" />
                Nuevo Evento
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Evento</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Título del evento"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  data-testid="input-event-title"
                />
                <Select value={newEventSubject} onValueChange={setNewEventSubject}>
                  <SelectTrigger data-testid="select-subject">
                    <SelectValue placeholder="Selecciona tema" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Matemáticas">Matemáticas</SelectItem>
                    <SelectItem value="Ciencias">Ciencias</SelectItem>
                    <SelectItem value="Español">Español</SelectItem>
                    <SelectItem value="Inglés">Inglés</SelectItem>
                    <SelectItem value="Arte">Arte</SelectItem>
                    <SelectItem value="Deportes">Deportes</SelectItem>
                    <SelectItem value="Otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="date"
                  value={newEventDate}
                  onChange={(e) => setNewEventDate(e.target.value)}
                  data-testid="input-event-date"
                />
                <Input
                  type="time"
                  value={newEventTime}
                  onChange={(e) => setNewEventTime(e.target.value)}
                  data-testid="input-event-time"
                />
                <Button
                  onClick={() => createEventMutation.mutate()}
                  disabled={!newEventTitle || !newEventSubject || !newEventDate || !newEventTime || createEventMutation.isPending}
                  className="w-full"
                  data-testid="button-submit-event"
                >
                  {createEventMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Crear Evento
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Kanban Board */}
        <div
          ref={boardRef}
          className="flex-1 bg-gradient-to-br from-primary/5 to-accent/5 rounded-lg border-2 border-dashed border-primary/20 relative overflow-auto"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          data-testid="event-board"
        >
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : events.length > 0 ? (
            events.map(eventCard)
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              <p>No hay eventos. ¡Crea uno para comenzar!</p>
            </div>
          )}
        </div>

        {/* Info */}
        <p className="text-xs text-muted-foreground">
          💡 Arrastra las tarjetas para reorganizar. Fija eventos para mantenerlos en su lugar.
        </p>
      </div>
    </AppLayout>
  );
}
