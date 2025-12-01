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
import { Plus, Loader2, Upload } from "lucide-react";
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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > 800) {
              height = Math.round(height * (800 / width));
              width = 800;
            }
          } else {
            if (height > 800) {
              width = Math.round(width * (800 / height));
              height = 800;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL("image/jpeg", 0.7);
            setPreviewUrl(compressed);
            setImageFile(file);
          }
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

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
        imageUrl: previewUrl || undefined,
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
      setImageFile(null);
      setPreviewUrl("");
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

          {/* Image Preview */}
          {previewUrl && (
            <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-muted">
              <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              <Button
                size="sm"
                variant="destructive"
                className="absolute top-2 right-2"
                onClick={() => {
                  setPreviewUrl("");
                  setImageFile(null);
                }}
                data-testid="button-remove-image"
              >
                Remover
              </Button>
            </div>
          )}

          {/* Image Input */}
          <div>
            <Label htmlFor="location">Imagen (opcional)</Label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
              id="event-image"
              data-testid="input-event-image"
            />
            <label
              htmlFor="event-image"
              className="cursor-pointer flex items-center justify-center gap-2 p-3 rounded border-2 border-dashed hover:bg-muted/50 transition"
            >
              <Upload className="h-4 w-4" />
              <span className="text-sm">
                {imageFile ? imageFile.name : "Selecciona una imagen"}
              </span>
            </label>
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
