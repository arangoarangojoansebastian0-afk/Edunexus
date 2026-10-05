import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getFullName, getInitials } from "@/lib/authUtils";
import { cn } from "@/lib/utils";
import { MediaFileList } from "@/components/media/MediaFileList";
import { MediaComposer } from "@/components/media/MediaComposer";

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

export function CreatePostCard({
  onSubmit,
  placeholder = "¿Qué quieres compartir con la comunidad?",
  isSubmitting = false,
}: CreatePostCardProps) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [draftFile, setDraftFile] = useState<File | null>(null);

  const handleSubmit = () => {
    const completeFiles = [...files, ...(draftFile ? [draftFile] : [])];
    if (!content.trim() && completeFiles.length === 0) return;
    onSubmit(content.trim(), completeFiles.length > 0 ? completeFiles : undefined);
    setContent("");
    setFiles([]);
    setDraftFile(null);
    setIsFocused(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
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
                <MediaFileList files={files} onRemove={removeFile} />
              </div>
            )}

            {(isFocused || content || files.length > 0 || draftFile) && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MediaComposer value={draftFile} onChange={(file) => { setDraftFile(file); setIsFocused(true); }} onSend={() => {}} showSendButton={false} disabled={isSubmitting || files.length >= MAX_FILES} />
                  {draftFile && <Button type="button" variant="outline" size="sm" disabled={isSubmitting || files.length >= MAX_FILES} onClick={() => { setFiles((prev) => [...prev, draftFile]); setDraftFile(null); }}>Agregar ({files.length + 1}/{MAX_FILES})</Button>}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setContent("");
                      setFiles([]);
                      setDraftFile(null);
                      setIsFocused(false);
                    }}
                    data-testid="button-cancel-post"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={(!content.trim() && files.length === 0 && !draftFile) || isSubmitting}
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
