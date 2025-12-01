import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Loader2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const subjects = [
  "Matemáticas",
  "Ciencias",
  "Historia",
  "Lenguaje",
  "Inglés",
  "Física",
  "Química",
  "Biología",
];

export function CreateEventCard() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("Matemáticas");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [startHour, setStartHour] = useState("09:00");
  const [endHour, setEndHour] = useState("10:00");
  const [locationUrl, setLocationUrl] = useState("");

  const createMutation = useMutation({
    mutationFn: async () => {
      const [dateOnly] = date.split("T");
      const startDateTime = new Date(`${dateOnly}T${startHour}`);
      const endDateTime = new Date(`${dateOnly}T${endHour}`);

      await apiRequest("POST", "/api/events", {
        title: title.trim(),
        subject,
        description: description.trim() || undefined,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        locationUrl: locationUrl.trim() || undefined,
      });
    },
    onSuccess: () => {
      // Reset form
      setTitle("");
      setSubject("Matemáticas");
      setDescription("");
      setDate("");
      setStartHour("09:00");
      setEndHour("10:00");
      setLocationUrl("");
      setIsOpen(false);

      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({
        title: "¡Evento creado!",
        description: "El evento ha sido compartido exitosamente.",
      });
    },
    onError: (error: Error) => {
      console.error("Error creating event:", error);
      toast({
        title: "Error",
        description: "No se pudo crear el evento. Intenta de nuevo.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!title.trim() || !date || !startHour || !endHour) {
      toast({
        title: "Campos requeridos",
        description: "Completa título, fecha y horarios.",
        variant: "destructive",
      });
      return;
    }

    if (startHour >= endHour) {
      toast({
        title: "Horario inválido",
        description: "La hora de inicio debe ser anterior a la de fin.",
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full gap-2" data-testid="button-create-event">
          <Plus className="h-4 w-4" />
          Crear Evento
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Evento</DialogTitle>
          <DialogDescription>
            Comparte un evento, asesoría o actividad con la comunidad
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <Label htmlFor="title">Título del Evento *</Label>
            <Input
              id="title"
              placeholder="Ej: Asesoría de Matemáticas"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              data-testid="input-event-title"
            />
          </div>

          {/* Subject */}
          <div>
            <Label htmlFor="subject">Materia/Categoría</Label>
            <Select value={subject} onValueChange={setSubject}>
              <SelectTrigger data-testid="select-subject">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Descripción (opcional)</Label>
            <Textarea
              id="description"
              placeholder="Detalles sobre el evento..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-20"
              data-testid="textarea-description"
            />
          </div>

          {/* Date */}
          <div>
            <Label htmlFor="date">Fecha *</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              data-testid="input-event-date"
            />
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startHour">Hora Inicio *</Label>
              <Input
                id="startHour"
                type="time"
                value={startHour}
                onChange={(e) => setStartHour(e.target.value)}
                data-testid="input-start-hour"
              />
            </div>
            <div>
              <Label htmlFor="endHour">Hora Fin *</Label>
              <Input
                id="endHour"
                type="time"
                value={endHour}
                onChange={(e) => setEndHour(e.target.value)}
                data-testid="input-end-hour"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <Label htmlFor="location">Lugar/Enlace (opcional)</Label>
            <Input
              id="location"
              placeholder="Ej: Aula 101 o https://meet.google.com/..."
              value={locationUrl}
              onChange={(e) => setLocationUrl(e.target.value)}
              data-testid="input-location"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            data-testid="button-cancel-event"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createMutation.isPending}
            data-testid="button-submit-event"
          >
            {createMutation.isPending && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Crear Evento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
