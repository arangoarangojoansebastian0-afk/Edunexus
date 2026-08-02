import { useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Paperclip, Send, X, FileText, Image as ImageIcon, File as FileIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getFullName, getInitials } from "@/lib/authUtils";
import { cn } from "@/lib/utils";

interface CreatePostCardProps {
  // BUG CORREGIDO: antes `onSubmit` solo recibía el texto — el botón
  // "Imagen" ni siquiera tenía un input de archivo detrás, era decorativo.
  // Ahora se puede adjuntar cualquier archivo (no solo imágenes) y se
  // manda junto con el texto.
  onSubmit: (content: string, files?: File[]) => void;
  placeholder?: string;
  isSubmitting?: boolean;
  groupId?: string;
}

const MAX_FILES = 5;

function pickIcon(file: File) {
  if (file.type.startsWith("image/")) return ImageIcon;
  if (file.type === "application/pdf") return FileText;
  return FileIcon;
}

export function CreatePostCard({
  onSubmit,
  placeholder = "¿Qué quieres compartir con la comunidad?",
  isSubmitting = false,
}: CreatePostCardProps) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    if (!content.trim() && files.length === 0) return;
    onSubmit(content.trim(), files.length > 0 ? files : undefined);
    setContent("");
    setFiles([]);
    setIsFocused(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
  };

  const handleFilesSelected = (selected: FileList | null) => {
    if (!selected) return;
    const incoming = Array.from(selected);
    setFiles((prev) => [...prev, ...incoming].slice(0, MAX_FILES));
    setIsFocused(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  if (!user?.verified) {
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground text-center">
            Tu cuenta está pendiente de verificación. Una vez verificada podrás crear publicaciones.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="create-post-card">
      <CardContent className="p-4">
        <div className="flex gap-3">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarImage
              src={user?.profileImageUrl || undefined}
              alt={getFullName(user?.firstName, user?.lastName)}
              className="object-cover"
            />
            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
              {getInitials(user?.firstName, user?.lastName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-3">
            <Textarea
              placeholder={placeholder}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onKeyDown={handleKeyDown}
              className={cn(
                "min-h-[60px] resize-none border-0 bg-muted/50 focus-visible:ring-1",
                (isFocused || files.length > 0) && "min-h-[100px]"
              )}
              data-testid="input-post-content"
            />

            {files.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {files.map((file, idx) => {
                  const Icon = pickIcon(file);
                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-1.5 pl-2 pr-1 py-1 rounded-md bg-muted text-xs font-medium"
                      data-testid={`attachment-preview-${idx}`}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      <span className="max-w-[140px] truncate">{file.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 shrink-0"
                        onClick={() => removeFile(idx)}
                        data-testid={`button-remove-attachment-${idx}`}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}

            {(isFocused || content || files.length > 0) && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFilesSelected(e.target.files)}
                    data-testid="input-file-attachment"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="gap-2"
                    disabled={files.length >= MAX_FILES}
                    onClick={() => fileInputRef.current?.click()}
                    data-testid="button-add-media"
                  >
                    <Paperclip className="h-4 w-4" />
                    <span className="hidden sm:inline">Adjuntar</span>
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setContent("");
                      setFiles([]);
                      setIsFocused(false);
                    }}
                    data-testid="button-cancel-post"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={(!content.trim() && files.length === 0) || isSubmitting}
                    size="sm"
                    className="gap-2"
                    data-testid="button-submit-post"
                  >
                    <Send className="h-4 w-4" />
                    <span>{isSubmitting ? "Publicando..." : "Publicar"}</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
