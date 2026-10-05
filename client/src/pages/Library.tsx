import { FileViewer } from "@/components/FileViewer";
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
  List,
  LayoutGrid,
  Download,
  Trash2,
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
  const [sortBy, setSortBy] = useState<"recent" | "name" | "size">("recent");
  const [typeFilter, setTypeFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState<"all" | "mine">("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
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
    refetchInterval: 60000,
  });

  const filteredFiles = files?.filter((file) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!file.fileName.toLowerCase().includes(query)) return false;
    }
    if (subjectFilter !== "all" && file.subject !== subjectFilter) return false;
    if (typeFilter !== "all" && file.fileName.split(".").pop()?.toLowerCase() !== typeFilter) return false;
    if (ownerFilter === "mine" && file.uploaderId !== user?.id) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === "name") return a.fileName.localeCompare(b.fileName, "es", { sensitivity: "base" });
    if (sortBy === "size") return b.fileSize - a.fileSize;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
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
      if (!response.ok) throw new Error("El archivo no está disponible para descarga.");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const file = files?.find((f) => f.id === fileId);
      a.download = file?.fileName || "download";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo descargar el archivo.",
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

  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  
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
            <Select value={sortBy} onValueChange={(value: "recent" | "name" | "size") => setSortBy(value)}>
              <SelectTrigger className="w-full sm:w-48" aria-label="Ordenar archivos">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Más recientes</SelectItem>
                <SelectItem value="name">Nombre A–Z</SelectItem>
                <SelectItem value="size">Mayor tamaño</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-36" aria-label="Filtrar por tipo de archivo">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {Array.from(new Set((files || []).map((file) => file.fileName.split(".").pop()?.toLowerCase()))).filter((extension): extension is string => !!extension).sort().map((extension) => (
                  <SelectItem key={extension} value={extension}>{extension.toUpperCase()}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={ownerFilter} onValueChange={(value: "all" | "mine") => setOwnerFilter(value)}>
              <SelectTrigger className="w-full sm:w-36" aria-label="Filtrar por propietario">
                <SelectValue placeholder="Propietario" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="mine">Mis archivos</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex shrink-0 rounded-md border p-1" role="group" aria-label="Vista de archivos">
              <Button type="button" size="icon" variant={viewMode === "grid" ? "secondary" : "ghost"} aria-label="Vista de cuadrícula" aria-pressed={viewMode === "grid"} onClick={() => setViewMode("grid")}>
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button type="button" size="icon" variant={viewMode === "list" ? "secondary" : "ghost"} aria-label="Vista de lista" aria-pressed={viewMode === "list"} onClick={() => setViewMode("list")}>
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Files Grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <FileCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredFiles && filteredFiles.length > 0 ? (
            viewMode === "grid" ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredFiles.map((file) => (
                  <FileCard
                    key={file.id}
                    file={file}
                    onDownload={handleDownload}
                    onPreview={(file) => { if (file.fileUrl) setPreviewUrls([file.fileUrl]); }}
                    onDelete={handleDelete}
                    isOwner={user?.id === file.uploaderId}
                    isAdmin={user?.role === "admin"}
                    isModerator={user?.role === "teacher"}
                  />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full min-w-[640px] text-sm">
                  <thead className="bg-muted/50 text-left text-muted-foreground">
                    <tr><th className="p-3 font-medium">Archivo</th><th className="p-3 font-medium">Materia</th><th className="p-3 font-medium">Propietario</th><th className="p-3 font-medium">Tamaño</th><th className="p-3 font-medium">Fecha</th><th className="p-3 text-right font-medium">Acciones</th></tr>
                  </thead>
                  <tbody>
                    {filteredFiles.map((file) => (
                      <tr key={file.id} className="border-t hover:bg-muted/30">
                        <td className="max-w-[280px] p-3"><button type="button" className="truncate text-left font-medium hover:underline" title={file.fileName} onClick={() => file.fileUrl && setPreviewUrls([file.fileUrl])}>{file.fileName}</button></td>
                        <td className="p-3">{file.subject || "—"}</td>
                        <td className="p-3">{file.uploader.firstName} {file.uploader.lastName}</td>
                        <td className="whitespace-nowrap p-3">{(file.fileSize / 1024 / 1024).toFixed(2)} MB</td>
                        <td className="whitespace-nowrap p-3">{new Date(file.createdAt).toLocaleDateString("es-CO")}</td>
                        <td className="p-3"><div className="flex justify-end gap-1">
                          {file.approved && <Button type="button" size="icon" variant="ghost" aria-label={`Descargar ${file.fileName}`} onClick={() => handleDownload(file.id)}><Download className="h-4 w-4" /></Button>}
                          {(user?.id === file.uploaderId || user?.role === "admin" || user?.role === "teacher") && <Button type="button" size="icon" variant="ghost" aria-label={`Eliminar ${file.fileName}`} onClick={() => handleDelete(file.id)}><Trash2 className="h-4 w-4" /></Button>}
                        </div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
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
      {/* Visor de archivo directo - se abre automáticamente al hacer click en Ver */}
      {previewUrls.length > 0 && (() => {
        const url = previewUrls[0];
        const ext = url.split(".").pop()?.toLowerCase().split("?")[0] || "";
        const isImage = ["jpg","jpeg","png","gif","webp"].includes(ext);
        const isPdf = ext === "pdf";
        const isOffice = ["doc","docx","xls","xlsx","ppt","pptx"].includes(ext);
        const fileName = decodeURIComponent(url.split("/").pop()?.split("?")[0] || "archivo");
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setPreviewUrls([])}>
            <div className="bg-background rounded-xl shadow-2xl w-[95vw] max-w-5xl h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
                <span className="text-sm font-medium truncate pr-4">{fileName}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                    Descargar
                  </a>
                  <button onClick={() => setPreviewUrls([])} className="ml-2 text-muted-foreground hover:text-foreground text-lg leading-none">✕</button>
                </div>
              </div>
              <div className="flex-1 overflow-hidden bg-muted/10">
                {isImage && <img src={url} alt={fileName} className="w-full h-full object-contain" />}
                {isPdf && <iframe src={url} className="w-full h-full border-0" title={fileName} />}
                {isOffice && <iframe src={`https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`} className="w-full h-full border-0" title={fileName} />}
                {!isImage && !isPdf && !isOffice && (
                  <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
                    <p className="text-sm">Vista previa no disponible para este tipo de archivo</p>
                    <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm">Abrir archivo</a>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </AppLayout>
  );
}
