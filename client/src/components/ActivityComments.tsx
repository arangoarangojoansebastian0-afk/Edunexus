import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Loader2, Lock, Users } from "lucide-react";
import { getInitials, getFullName } from "@/lib/authUtils";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface ActivityCommentsProps {
  activityId: string;
  // De quién es el hilo privado que se muestra: si quien mira es
  // estudiante, siempre es su propio id; si quien mira es docente/staff,
  // es el estudiante puntual cuya entrega se está revisando.
  studentId: string;
  currentUserId?: string;
}

function CommentThread({
  activityId,
  scope,
  studentId,
  currentUserId,
  placeholder,
}: {
  activityId: string;
  scope: "public" | "private";
  studentId: string;
  currentUserId?: string;
  placeholder: string;
}) {
  const [text, setText] = useState("");

  const { data: comments = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/classroom/activities", activityId, "comments", scope, studentId],
    queryFn: () =>
      fetch(
        `/api/classroom/activities/${activityId}/comments?scope=${scope}${
          scope === "private" ? `&studentId=${studentId}` : ""
        }`,
        { credentials: "include" }
      ).then((r) => r.json()),
  });

  const mutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/classroom/activities/${activityId}/comments`, {
        content: text.trim(),
        visibility: scope,
        studentId: scope === "private" ? studentId : undefined,
      });
    },
    onSuccess: () => {
      setText("");
      queryClient.invalidateQueries({
        queryKey: ["/api/classroom/activities", activityId, "comments", scope, studentId],
      });
    },
  });

  return (
    <div className="space-y-3">
      <div className="max-h-56 overflow-y-auto space-y-2.5 pr-1">
        {isLoading ? (
          <p className="text-xs text-muted-foreground text-center py-3">Cargando...</p>
        ) : comments.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-3">
            {scope === "public" ? "Aún no hay comentarios de la clase." : "Aún no hay comentarios privados."}
          </p>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="flex gap-2">
              <Avatar className="h-6 w-6 shrink-0">
                <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                  {getInitials(c.author?.firstName, c.author?.lastName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xs font-medium truncate">
                    {getFullName(c.author?.firstName, c.author?.lastName)}
                  </span>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true, locale: es })}
                  </span>
                </div>
                <p className="text-xs text-foreground/90 break-words">{c.content}</p>
              </div>
            </div>
          ))
        )}
      </div>
      <div className="flex gap-2">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          rows={1}
          className="min-h-0 h-9 resize-none text-xs py-2"
        />
        <Button
          size="icon"
          className="h-9 w-9 shrink-0"
          disabled={!text.trim() || mutation.isPending}
          onClick={() => mutation.mutate()}
        >
          {mutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
        </Button>
      </div>
    </div>
  );
}

export function ActivityComments({ activityId, studentId, currentUserId }: ActivityCommentsProps) {
  return (
    <Tabs defaultValue="public" className="mt-2">
      <TabsList className="h-8">
        <TabsTrigger value="public" className="text-xs gap-1.5 h-6">
          <Users className="h-3 w-3" />
          Comentarios de la clase
        </TabsTrigger>
        <TabsTrigger value="private" className="text-xs gap-1.5 h-6">
          <Lock className="h-3 w-3" />
          Comentarios privados
        </TabsTrigger>
      </TabsList>
      <TabsContent value="public" className="mt-3">
        <CommentThread
          activityId={activityId}
          scope="public"
          studentId={studentId}
          currentUserId={currentUserId}
          placeholder="Escribe un comentario para toda la clase..."
        />
      </TabsContent>
      <TabsContent value="private" className="mt-3">
        <CommentThread
          activityId={activityId}
          scope="private"
          studentId={studentId}
          currentUserId={currentUserId}
          placeholder="Escribe un comentario privado..."
        />
      </TabsContent>
    </Tabs>
  );
}
