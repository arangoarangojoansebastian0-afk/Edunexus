import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import type { PostWithAuthor } from "@shared/schema";

interface ConvertPostToEventDialogProps {
  post: PostWithAuthor;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConvertPostToEventDialog({
  post,
  isOpen,
  onOpenChange,
}: ConvertPostToEventDialogProps) {
  const { toast } = useToast();
  const [title, setTitle] = useState(post.content.slice(0, 50) || "Evento");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [subject, setSubject] = useState("Otro");

  const convertMutation = useMutation({
    mutationFn: async () => {
      const [dateOnly] = date.split("T");
      const startDateTime = new Date(`${dateOnly}T${startTime}`);
      const endDateTime = new Date(`${dateOnly}T${endTime}`);

      await apiRequest("POST", `/api/posts/${post.id}/convert-to-event`, {
        title,
        subject,
        locationUrl: location || undefined,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
      });
    },
    onSuccess: () => {
      toast({
        title: "Éxito",
        description: "Publicación convertida a evento",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo convertir la publicación",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !startTime || !endTime) {
      toast({
        title: "Campos requeridos",
        description: "Completa fecha y horas",
        variant: "destructive",
      });
      return;
    }
    convertMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Convertir Publicación a Evento</DialogTitle>
          <DialogDescription>
            Configura los detalles del evento para esta publicación
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título del Evento</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título"
              data-testid="input-event-title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Materia/Categoría</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ej: Matemáticas"
              data-testid="input-event-subject"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Lugar/Enlace (opcional)</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ej: Aula 101 o https://meet.google.com/..."
              data-testid="input-event-location"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Fecha</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                data-testid="input-event-date"
              />
            </div>
            <div className="space-y-2">
              <Label>Hora Inicio - Fin</Label>
              <div className="flex gap-2">
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="flex-1"
                  data-testid="input-event-start-time"
                />
                <Input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="flex-1"
                  data-testid="input-event-end-time"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={convertMutation.isPending}
              data-testid="button-submit-convert"
            >
              {convertMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Crear Evento
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
