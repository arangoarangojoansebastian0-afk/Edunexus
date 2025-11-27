import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, MessageSquare, BookOpen } from "lucide-react";
import { Link } from "wouter";
import type { GroupWithMembers } from "@shared/schema";

interface GroupCardProps {
  group: GroupWithMembers;
  isMember?: boolean;
  onJoin?: (groupId: string) => void;
  onLeave?: (groupId: string) => void;
}

export function GroupCard({ group, isMember = false, onJoin, onLeave }: GroupCardProps) {
  const memberCount = group._count?.members || 0;
  const postCount = group._count?.posts || 0;

  const handleAction = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isMember) {
      onLeave?.(group.id);
    } else {
      onJoin?.(group.id);
    }
  };

  return (
    <Link href={`/groups/${group.id}`}>
      <Card className="hover-elevate cursor-pointer h-full" data-testid={`group-card-${group.id}`}>
        <div className="relative aspect-video bg-muted rounded-t-lg overflow-hidden">
          {group.coverImageUrl ? (
            <img
              src={group.coverImageUrl}
              alt={group.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
              {group.type === "course" ? (
                <BookOpen className="h-12 w-12 text-primary/40" />
              ) : (
                <Users className="h-12 w-12 text-primary/40" />
              )}
            </div>
          )}
          <Badge
            variant="secondary"
            className="absolute top-3 right-3"
          >
            {group.type === "course" ? "Curso" : "Club"}
          </Badge>
        </div>
        <CardContent className="p-4">
          <div className="space-y-3">
            <div>
              <h3 className="font-semibold text-lg line-clamp-1">{group.name}</h3>
              {group.grade && (
                <p className="text-sm text-muted-foreground">{group.grade}° Grado</p>
              )}
            </div>
            {group.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {group.description}
              </p>
            )}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {memberCount}
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  {postCount}
                </span>
              </div>
              <Button
                size="sm"
                variant={isMember ? "outline" : "default"}
                onClick={handleAction}
                data-testid={isMember ? "button-leave-group" : "button-join-group"}
              >
                {isMember ? "Salir" : "Unirse"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export function GroupCardSkeleton() {
  return (
    <Card>
      <div className="aspect-video bg-muted rounded-t-lg animate-pulse" />
      <CardContent className="p-4 space-y-3">
        <div className="space-y-2">
          <div className="h-5 bg-muted rounded animate-pulse w-3/4" />
          <div className="h-4 bg-muted rounded animate-pulse w-1/4" />
        </div>
        <div className="h-4 bg-muted rounded animate-pulse w-full" />
        <div className="h-4 bg-muted rounded animate-pulse w-2/3" />
        <div className="flex items-center justify-between">
          <div className="h-4 bg-muted rounded animate-pulse w-20" />
          <div className="h-8 bg-muted rounded animate-pulse w-16" />
        </div>
      </CardContent>
    </Card>
  );
}
