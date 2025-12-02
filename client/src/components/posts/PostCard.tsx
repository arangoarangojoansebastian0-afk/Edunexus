import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Flag,
  Edit,
  Trash2,
  Pin,
  Calendar,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { getFullName, getInitials, formatRole } from "@/lib/authUtils";
import type { PostWithAuthor } from "@shared/schema";
import { cn } from "@/lib/utils";

interface PostCardProps {
  post: PostWithAuthor;
  currentUserId?: string;
  onLike?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onEdit?: (post: PostWithAuthor) => void;
  onDelete?: (postId: string) => void;
  onReport?: (postId: string) => void;
  onPin?: (postId: string) => void;
  onConvertToEvent?: (post: PostWithAuthor) => void;
  isLiked?: boolean;
  likesCount?: number;
  commentsCount?: number;
}

export function PostCard({
  post,
  currentUserId,
  onLike,
  onComment,
  onEdit,
  onDelete,
  onReport,
  onPin,
  onConvertToEvent,
  isLiked = false,
  likesCount = 0,
  commentsCount = 0,
}: PostCardProps) {
  const [liked, setLiked] = useState(isLiked);
  const [likes, setLikes] = useState(likesCount);

  const isOwner = currentUserId === post.authorId;
  const authorName = getFullName(post.author.firstName, post.author.lastName);
  const authorInitials = getInitials(post.author.firstName, post.author.lastName);

  const handleLike = () => {
    setLiked(!liked);
    setLikes(liked ? likes - 1 : likes + 1);
    onLike?.(post.id);
  };

  const timeAgo = formatDistanceToNow(new Date(post.createdAt), {
    addSuffix: true,
    locale: es,
  });

  return (
    <Card className="hover-elevate" data-testid={`post-card-${post.id}`}>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-3">
        <Link href={`/profile/${post.authorId}`}>
          <div className="flex items-start gap-3 hover-elevate cursor-pointer">
            <Avatar className="h-10 w-10">
              <AvatarImage
                src={post.author.profileImageUrl || undefined}
                alt={authorName}
                className="object-cover"
              />
              <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                {authorInitials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm">{authorName}</span>
              {post.author.role !== "student" && (
                <Badge variant="secondary" className="text-xs">
                  {formatRole(post.author.role)}
                </Badge>
              )}
              {post.pinned && (
                <Badge variant="outline" className="text-xs gap-1">
                  <Pin className="h-3 w-3" />
                  Fijado
                </Badge>
              )}
              </div>
              <span className="text-xs text-muted-foreground">{timeAgo}</span>
            </div>
          </div>
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" data-testid="button-post-menu">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {isOwner && (
              <>
                <DropdownMenuItem onClick={() => onEdit?.(post)} data-testid="button-edit-post">
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete?.(post.id)}
                  className="text-destructive focus:text-destructive"
                  data-testid="button-delete-post"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            {onPin && (
              <DropdownMenuItem onClick={() => onPin(post.id)} data-testid="button-pin-post">
                <Pin className="h-4 w-4 mr-2" />
                {post.pinned ? "Desfijar" : "Fijar publicación"}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => onReport?.(post.id)} data-testid="button-report-post">
              <Flag className="h-4 w-4 mr-2" />
              Reportar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onConvertToEvent?.(post)} data-testid="button-convert-to-event">
              <Calendar className="h-4 w-4 mr-2" />
              Convertir a Evento
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className="pb-3">
        <p className="text-sm whitespace-pre-wrap">{post.content}</p>
        {post.media && post.media.length > 0 && (
          <div className={cn(
            "mt-3 grid gap-2",
            post.media.length === 1 ? "grid-cols-1" : "grid-cols-2"
          )}>
            {post.media.slice(0, 4).map((url, idx) => (
              <div
                key={idx}
                className="relative aspect-video rounded-lg overflow-hidden bg-muted"
              >
                <img
                  src={url}
                  alt={`Imagen ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                {post.media.length > 4 && idx === 3 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white font-semibold text-lg">
                      +{post.media.length - 4}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-0 border-t">
        <div className="flex items-center gap-1 w-full pt-3">
          <Button
            variant="ghost"
            size="sm"
            className={cn("gap-2", liked && "text-red-500")}
            onClick={handleLike}
            data-testid="button-like"
          >
            <Heart className={cn("h-4 w-4", liked && "fill-current")} />
            <span>{likes > 0 ? likes : ""}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={() => onComment?.(post.id)}
            data-testid="button-comment"
          >
            <MessageCircle className="h-4 w-4" />
            <span>{commentsCount > 0 ? commentsCount : ""}</span>
          </Button>
          <Button variant="ghost" size="sm" className="gap-2 ml-auto" data-testid="button-share">
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
