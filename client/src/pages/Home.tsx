import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { CreatePostCard } from "@/components/posts/CreatePostCard";
import { PostCard } from "@/components/posts/PostCard";
import { CommentSection } from "@/components/posts/CommentSection";
import { ConvertPostToEventDialog } from "@/components/posts/ConvertPostToEventDialog";
import { RecognitionsCarousel } from "@/components/RecognitionsCarousel";
import { EventsCarousel } from "@/components/EventsCarousel";
import { CreateRecognitionCard } from "@/components/CreateRecognitionCard";
import { CreateEventCard } from "@/components/CreateEventCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { FileText, Users, TrendingUp, Calendar, BookOpen } from "lucide-react";
import type { PostWithAuthor, Group, EventWithHost, User } from "@shared/schema";
import { Link } from "wouter";
import { getFullName, getInitials } from "@/lib/authUtils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const grades = ["6", "7", "8", "9", "10", "11"];

export default function Home() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [gradeFilter, setGradeFilter] = useState<string>("all");
  const [expandedCommentPostId, setExpandedCommentPostId] = useState<string | null>(null);
  const [convertPostId, setConvertPostId] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<PostWithAuthor | null>(null);


  const { data: posts, isLoading: postsLoading, refetch: refetchPosts } = useQuery<PostWithAuthor[]>({
    queryKey: ["/api/posts"],
  });

  const { data: groups } = useQuery<Group[]>({
    queryKey: ["/api/groups/my"],
  });

  const { data: allUsers = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: stats } = useQuery<{
    totalPosts: number;
    totalUsers: number;
    totalGroups: number;
    totalEvents: number;
  }>({
    queryKey: ["/api/stats"],
  });

  const { data: events, isLoading: eventsLoading } = useQuery<EventWithHost[]>({
    queryKey: ["/api/events"],
  });

  const createPostMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest("POST", "/api/posts", { content });
      return await response.json();
    },
    onSuccess: () => {
      refetchPosts();
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      toast({
        title: "Publicación creada",
        description: "Tu publicación ha sido compartida con la comunidad.",
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
      console.error("Error creating post:", error);
      toast({
        title: "Error",
        description: "No se pudo crear la publicación. Intenta de nuevo.",
        variant: "destructive",
      });
    },
  });

  const likeMutation = useMutation({
    mutationFn: async (postId: string) => {
      await apiRequest("POST", `/api/posts/${postId}/reactions`, { type: "like" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    },
  });

  return (
    <AppLayout title="Inicio" showSearch>
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Create Post */}
            <CreatePostCard
              onSubmit={(content) => createPostMutation.mutate(content)}
              isSubmitting={createPostMutation.isPending}
            />

            {/* Events */}
            <EventsCarousel />

            {/* Create Event */}
            <CreateEventCard />

            {/* Recognitions */}
            <RecognitionsCarousel />

            {/* Create Recognition (Teachers Only) */}
            {user?.role === "teacher" && (
              <CreateRecognitionCard
                users={
                  allUsers.filter((u) => u.role === "student") || []
                }
              />
            )}

            {/* Filter */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <h2 className="font-serif font-semibold text-lg">Publicaciones Recientes</h2>
              <Select value={gradeFilter} onValueChange={setGradeFilter}>
                <SelectTrigger className="w-40" data-testid="select-grade-filter">
                  <SelectValue placeholder="Filtrar por grado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los grados</SelectItem>
                  {grades.map((grade) => (
                    <SelectItem key={grade} value={grade}>
                      {grade}° Grado
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Posts Feed */}
            <div className="space-y-4">
              {postsLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-3/4" />
                    </CardContent>
                  </Card>
                ))
              ) : posts && posts.length > 0 ? (
                posts.map((post) => (
                  <div key={post.id}>
                    <PostCard
                      post={post}
                      currentUserId={user?.id}
                      onLike={(postId) => likeMutation.mutate(postId)}
                      onConvertToEvent={(post) => {
                        setSelectedPost(post);
                        setConvertPostId(post.id);
                      }}
                      onComment={(postId) => setExpandedCommentPostId(expandedCommentPostId === postId ? null : postId)}
                      likesCount={post._count?.reactions || 0}
                      commentsCount={post._count?.comments || 0}
                    />
                    {expandedCommentPostId === post.id && user && (
                      <Card className="mt-2">
                        <div className="p-4">
                          <CommentSection postId={post.id} currentUserId={user.id} />
                        </div>
                      </Card>
                    )}
                  </div>
                ))
              ) : (
                <EmptyState
                  icon={FileText}
                  title="No hay publicaciones"
                  description="Sé el primero en compartir algo con la comunidad."
                />
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Comunidad
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold text-primary">
                      {stats?.totalUsers || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Miembros</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold text-primary">
                      {stats?.totalPosts || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Publicaciones</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold text-primary">
                      {stats?.totalGroups || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Grupos</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold text-primary">
                      {stats?.totalEvents || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Asesorías</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* My Groups */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Mis Grupos
                  </CardTitle>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/groups">Ver todos</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {groups && groups.length > 0 ? (
                  <div className="space-y-2">
                    {groups.slice(0, 5).map((group) => (
                      <Link
                        key={group.id}
                        href={`/groups/${group.id}`}
                        className="flex items-center gap-3 p-2 rounded-lg hover-elevate cursor-pointer"
                      >
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          {group.type === "course" ? (
                            <BookOpen className="h-5 w-5 text-primary" />
                          ) : (
                            <Users className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{group.name}</p>
                          <Badge variant="secondary" className="text-xs">
                            {group.type === "course" ? "Curso" : "Club"}
                          </Badge>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No estás en ningún grupo aún.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Accesos Rápidos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start gap-2" asChild>
                  <Link href="/library">
                    <BookOpen className="h-4 w-4" />
                    Biblioteca Académica
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2" asChild>
                  <Link href="/tutoring">
                    <Calendar className="h-4 w-4" />
                    Asesorías Disponibles
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2" asChild>
                  <Link href="/groups">
                    <Users className="h-4 w-4" />
                    Explorar Grupos
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {selectedPost && (
        <ConvertPostToEventDialog
          post={selectedPost}
          isOpen={convertPostId !== null}
          onOpenChange={(open) => {
            setConvertPostId(open ? convertPostId : null);
            if (!open) setSelectedPost(null);
          }}
        />
      )}
    </AppLayout>
  );
}
