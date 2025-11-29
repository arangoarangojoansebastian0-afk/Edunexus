import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pin, MessageCircle, Plus, Clock, User, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { getFullName } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
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
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");

  const { data: apiEvents, isLoading } = useQuery<EventWithHost[]>({
    queryKey: ["/api/events"],
  });

  // Initialize events with random positions
  const initializeEvents = (apiEvents: EventWithHost[]) => {
    const positioned = apiEvents.map((evt) => ({
      ...evt,
      position: {
        x: Math.random() * 400,
        y: Math.random() * 300,
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
    const newX = Math.max(0, Math.min(e.clientX - boardRect.left - dragOffset.x, boardRect.width - 300));
    const newY = Math.max(0, Math.min(e.clientY - boardRect.top - dragOffset.y, boardRect.height - 200));

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
      className="absolute w-80 bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 p-4 hover-elevate"
      style={{
        left: `${evt.position.x}px`,
        top: `${evt.position.y}px`,
        cursor: evt.isPinned ? "default" : "grab",
        transform: draggedEvent === evt.id ? "scale(1.05)" : "scale(1)",
      }}
      onMouseDown={(e) => handleMouseDown(e, evt.id)}
      data-testid={`event-card-${evt.id}`}
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-lg leading-tight">{evt.title}</h3>
            <p className="text-sm text-muted-foreground">{evt.subject}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 flex-shrink-0"
            onClick={() => togglePin(evt.id)}
            data-testid={`button-pin-${evt.id}`}
          >
            <Pin className={`h-4 w-4 ${evt.isPinned ? "fill-current text-primary" : ""}`} />
          </Button>
        </div>

        {/* Info */}
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>{formatDistanceToNow(new Date(evt.startTime), { addSuffix: true, locale: es })}</span>
          </div>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>{getFullName(evt.host.firstName, evt.host.lastName)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2"
                onClick={() => setSelectedEventId(evt.id)}
                data-testid={`button-comment-${evt.id}`}
              >
                <MessageCircle className="h-4 w-4" />
                <span className="text-xs">{evt._count?.participants || 0}</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-3">
                <h3 className="font-semibold">Comentarios</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  <p className="text-sm text-muted-foreground">No hay comentarios aún</p>
                </div>
                <div className="space-y-2 pt-2 border-t">
                  <Textarea
                    placeholder="Agregar comentario..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="text-sm"
                    rows={2}
                  />
                  <Button
                    size="sm"
                    className="w-full"
                    disabled={!newComment.trim()}
                    data-testid="button-submit-comment"
                  >
                    Comentar
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Button
            variant="outline"
            size="sm"
            className="ml-auto"
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
          className="flex-1 bg-gradient-to-br from-primary/5 to-accent/5 rounded-lg border-2 border-dashed border-primary/20 relative overflow-hidden"
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
