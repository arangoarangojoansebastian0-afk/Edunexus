import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Upload, Loader2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";

interface CreateRecognitionCardProps {
  users: User[];
  onSuccess?: () => void;
}

export function CreateRecognitionCard({ users, onSuccess }: CreateRecognitionCardProps) {
  const { toast } = useToast();
  const [recipientId, setRecipientId] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");

  const createMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/recognitions", {
        recipientId,
        content: content.trim(),
        imageUrl: previewUrl || null,
      });
      return await response.json();
    },
    onSuccess: () => {
      setRecipientId("");
      setContent("");
      setImageUrl("");
      setImageFile(null);
      setPreviewUrl("");
      queryClient.invalidateQueries({ queryKey: ["/api/recognitions"] });
      toast({
        title: "¡Reconocimiento creado!",
        description: "El reconocimiento ha sido compartido exitosamente.",
      });
      onSuccess?.();
    },
    onError: (error: Error) => {
      console.error("Error creating recognition:", error);
      toast({
        title: "Error",
        description: "No se pudo crear el reconocimiento. Intenta de nuevo.",
        variant: "destructive",
      });
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Compress image before storing
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          
          // Max dimension 800px
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

  const handleSubmit = () => {
    if (!recipientId || (!content.trim() && !previewUrl)) {
      toast({
        title: "Campo requerido",
        description: "Selecciona un estudiante y agrega texto o una imagen.",
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate();
  };

  const selectedUser = users.find((u) => u.id === recipientId);

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Estudiante</label>
          <Select value={recipientId} onValueChange={setRecipientId}>
            <SelectTrigger data-testid="select-student-recognition">
              <SelectValue placeholder="Selecciona un estudiante" />
            </SelectTrigger>
            <SelectContent>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.firstName} {user.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedUser && (
          <div className="flex items-center gap-2 p-2 rounded bg-muted/50">
            <Avatar className="h-8 w-8">
              <AvatarImage src={selectedUser.profileImageUrl || undefined} alt={selectedUser.firstName} />
              <AvatarFallback>{selectedUser.firstName?.[0]}{selectedUser.lastName?.[0]}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">
              @{(selectedUser.firstName + selectedUser.lastName).toLowerCase().replace(/\s/g, "")}
            </span>
          </div>
        )}

        <div>
          <label className="text-sm font-medium mb-2 block">Mensaje</label>
          <Textarea
            placeholder="Escribe un mensaje de reconocimiento..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="text-sm"
            data-testid="input-recognition-content"
          />
        </div>

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

        <div>
          <label className="text-sm font-medium mb-2 block">Imagen (opcional)</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
            id="recognition-image"
            data-testid="input-recognition-image"
          />
          <label
            htmlFor="recognition-image"
            className="cursor-pointer flex items-center justify-center gap-2 p-3 rounded border-2 border-dashed hover:bg-muted/50 transition"
          >
            <Upload className="h-4 w-4" />
            <span className="text-sm">
              {imageFile ? imageFile.name : "Selecciona una imagen"}
            </span>
          </label>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={createMutation.isPending || !recipientId || (!content.trim() && !previewUrl)}
          className="w-full"
          data-testid="button-create-recognition"
        >
          {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Compartir Reconocimiento
        </Button>
      </CardContent>
    </Card>
  );
}
