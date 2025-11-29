import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { FileCard, FileCardSkeleton } from "@/components/library/FileCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/EmptyState";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import {
  Search,
  Upload,
  BookOpen,
  FileText,
  AlertCircle,
} from "lucide-react";
import type { FileWithUploader } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";

const subjects = [
  "Matemáticas",
  "Ciencias",
  "Historia",
  "Lenguaje",
  "Inglés",
  "Arte",
  "Física",
  "Química",
  "Biología",
  "Geografía",
  "Educación Física",
  "Música",
  "Tecnología",
];

const allowedExtensions = [".pdf", ".docx", ".doc", ".jpg", ".jpeg", ".png"];
const maxFileSizeMB = 10;

const uploadSchema = z.object({
  subject: z.string().min(1, "Selecciona una materia"),
  description: z.string().optional(),
});

type UploadForm = z.infer<typeof uploadSchema>;

export default function Library() {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const form = useForm<UploadForm>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      subject: "",
      description: "",
    },
  });

  const { data: files, isLoading, refetch: refetchFiles } = useQuery<FileWithUploader[]>({
    queryKey: ["/api/files"],
    refetchInterval: 3000,
  });

  const filteredFiles = files?.filter((file) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!file.fileName.toLowerCase().includes(query)) return false;
    }
    if (subjectFilter !== "all" && file.subject !== subjectFilter) return false;
    return true;
  });

  const uploadMutation = useMutation({
    mutationFn: async (data: UploadForm) => {
      if (!selectedFile) throw new Error("No file selected");

      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("subject", data.subject);
      if (data.description) {
        formData.append("description", data.description);
      }

      const response = await fetch("/api/files", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Upload failed");
      }

      return response.json();
    },
    onSuccess: () => {
      refetchFiles();
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      setIsUploadOpen(false);
      setSelectedFile(null);
      form.reset();
      toast({
        title: "Archivo subido",
        description: "Tu archivo ha sido compartido exitosamente.",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Sesión expirada",
          description: "Iniciando sesión nuevamente...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "No se pudo subir el archivo. Intenta de nuevo.",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileError(null);

    if (!file) return;

    const extension = "." + file.name.split(".").pop()?.toLowerCase();
    if (!allowedExtensions.includes(extension)) {
      setFileError(`Formato no permitido. Usa: ${allowedExtensions.join(", ")}`);
      return;
    }

    if (file.size > maxFileSizeMB * 1024 * 1024) {
      setFileError(`El archivo excede el límite de ${maxFileSizeMB}MB`);
      return;
    }

    setSelectedFile(file);
  };

  const onSubmit = (data: UploadForm) => {
    uploadMutation.mutate(data);
  };

  const handleDownload = async (fileId: string) => {
    try {
      const response = await fetch(`/api/files/${fileId}/download`, {
        credentials: "include",
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const file = files?.find((f) => f.id === fileId);
        a.download = file?.fileName || "download";
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo descargar el archivo.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (fileId: string) => {
    try {
      const response = await fetch(`/api/files/${fileId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (response.ok) {
        refetchFiles();
        queryClient.invalidateQueries({ queryKey: ["/api/files"] });
        toast({
          title: "Archivo eliminado",
          description: "El archivo ha sido eliminado del sistema.",
        });
      } else {
        toast({
          title: "Error",
          description: "No se pudo eliminar el archivo.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al intentar eliminar el archivo.",
        variant: "destructive",
      });
    }
  };

  return (
    <AppLayout title="Biblioteca Académica">
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="font-serif text-2xl font-bold">Biblioteca Académica</h1>
              <p className="text-muted-foreground">
                Recursos educativos compartidos por la comunidad
              </p>
            </div>
            {user?.verified && (
              <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2" data-testid="button-upload-file">
                    <Upload className="h-4 w-4" />
                    Subir Archivo
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Subir Recurso</DialogTitle>
                    <DialogDescription>
                      Comparte materiales de estudio con la comunidad.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <div className="space-y-2">
                        <Label>Archivo</Label>
                        <div
                          className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept={allowedExtensions.join(",")}
                            onChange={handleFileSelect}
                            className="hidden"
                            data-testid="input-file"
                          />
                          {selectedFile ? (
                            <div className="flex items-center justify-center gap-2">
                              <FileText className="h-8 w-8 text-primary" />
                              <div className="text-left">
                                <p className="text-sm font-medium truncate max-w-xs">
                                  {selectedFile.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                              <p className="text-sm text-muted-foreground">
                                Haz clic para seleccionar un archivo
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                PDF, DOCX, JPG, PNG (máx. {maxFileSizeMB}MB)
                              </p>
                            </div>
                          )}
                        </div>
                        {fileError && (
                          <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{fileError}</AlertDescription>
                          </Alert>
                        )}
                      </div>

                      <FormField
                        control={form.control}
                        name="subject"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Materia</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-subject">
                                  <SelectValue placeholder="Selecciona la materia" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {subjects.map((subject) => (
                                  <SelectItem key={subject} value={subject}>
                                    {subject}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Descripción (opcional)</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Describe brevemente el contenido del archivo..."
                                {...field}
                                data-testid="input-file-description"
                              />
                            </FormControl>
                            <FormDescription>
                              Ayuda a otros a entender qué contiene este recurso.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setIsUploadOpen(false);
                            setSelectedFile(null);
                            setFileError(null);
                            form.reset();
                          }}
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="submit"
                          disabled={!selectedFile || uploadMutation.isPending}
                          data-testid="button-submit-file"
                        >
                          {uploadMutation.isPending ? "Subiendo..." : "Subir Archivo"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar archivos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-files"
              />
            </div>
            <Select value={subjectFilter} onValueChange={setSubjectFilter}>
              <SelectTrigger className="w-full sm:w-48" data-testid="select-subject-filter">
                <SelectValue placeholder="Todas las materias" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las materias</SelectItem>
                {subjects.map((subject) => (
                  <SelectItem key={subject} value={subject}>
                    {subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Files Grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <FileCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredFiles && filteredFiles.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredFiles.map((file) => (
                <FileCard
                  key={file.id}
                  file={file}
                  onDownload={handleDownload}
                  onDelete={handleDelete}
                  isOwner={user?.id === file.uploaderId}
                  isAdmin={user?.role === "admin"}
                  isModerator={user?.role === "teacher"}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={BookOpen}
              title="No hay archivos"
              description={
                searchQuery
                  ? "No se encontraron archivos con esos criterios."
                  : "Sé el primero en compartir recursos con la comunidad."
              }
              action={
                user?.verified
                  ? {
                      label: "Subir Archivo",
                      onClick: () => setIsUploadOpen(true),
                    }
                  : undefined
              }
            />
          )}
        </div>
      </div>
    </AppLayout>
  );
}
