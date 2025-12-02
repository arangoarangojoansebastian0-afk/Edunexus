import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { getFullName, getInitials } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { CommentWithAuthor } from "@shared/schema";

interface CommentSectionProps {
  postId: string;
  currentUserId: string;
}

export function CommentSection({ postId, currentUserId }: CommentSectionProps) {
  const [newComment, setNewComment] = useState("");

  const { data: comments, isLoading } = useQuery<CommentWithAuthor[]>({
    queryKey: ["/api/posts", postId, "comments"],
    queryFn: async () => {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch comments");
      return response.json();
    },
  });

  const createCommentMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/posts/${postId}/comments`, {
        content: newComment,
      });
      return await response.json();
    },
    onSuccess: () => {
      setNewComment("");
      queryClient.invalidateQueries({ queryKey: ["/api/posts", postId, "comments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    },
    onError: (error: Error) => {
      console.error("Error creating comment:", error);
    },
  });

  return (
    <div className="space-y-4 border-t pt-4">
      <div className="space-y-2">
        <Textarea
          placeholder="Escribe un comentario..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="text-sm"
          data-testid="input-new-comment"
        />
        <Button
          onClick={() => createCommentMutation.mutate()}
          disabled={!newComment.trim() || createCommentMutation.isPending}
          size="sm"
          data-testid="button-submit-comment"
        >
          {createCommentMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Comentar
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando comentarios...</p>
      ) : comments && comments.length > 0 ? (
        <div className="space-y-3">
          {comments.map((comment) => (
            <Card key={comment.id} className="p-3">
              <Link href={`/profile/${comment.authorId}`}>
                <div className="flex gap-3 hover-elevate cursor-pointer">
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage
                      src={comment.author?.profileImageUrl || undefined}
                      alt={getFullName(comment.author?.firstName, comment.author?.lastName)}
                    />
                    <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                      {getInitials(comment.author?.firstName, comment.author?.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                      {getFullName(comment.author?.firstName, comment.author?.lastName)}
                    </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: es })}
                  </p>
                    <p className="text-sm mt-1 whitespace-pre-wrap">{comment.content}</p>
                  </div>
                </div>
              </Link>
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No hay comentarios aún</p>
      )}
    </div>
  );
}
