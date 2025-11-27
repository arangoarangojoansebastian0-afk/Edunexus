import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ImagePlus, Send, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getFullName, getInitials } from "@/lib/authUtils";
import { cn } from "@/lib/utils";

interface CreatePostCardProps {
  onSubmit: (content: string, media?: string[]) => void;
  placeholder?: string;
  isSubmitting?: boolean;
  groupId?: string;
}

export function CreatePostCard({
  onSubmit,
  placeholder = "¿Qué quieres compartir con la comunidad?",
  isSubmitting = false,
}: CreatePostCardProps) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = () => {
    if (!content.trim()) return;
    onSubmit(content.trim());
    setContent("");
    setIsFocused(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
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
                isFocused && "min-h-[100px]"
              )}
              data-testid="input-post-content"
            />
            {(isFocused || content) && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="gap-2"
                    data-testid="button-add-media"
                  >
                    <ImagePlus className="h-4 w-4" />
                    <span className="hidden sm:inline">Imagen</span>
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setContent("");
                      setIsFocused(false);
                    }}
                    data-testid="button-cancel-post"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={!content.trim() || isSubmitting}
                    size="sm"
                    className="gap-2"
                    data-testid="button-submit-post"
                  >
                    <Send className="h-4 w-4" />
                    <span>Publicar</span>
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
