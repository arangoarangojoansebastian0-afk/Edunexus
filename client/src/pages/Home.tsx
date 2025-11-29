import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { CreatePostCard } from "@/components/posts/CreatePostCard";
import { PostCard } from "@/components/posts/PostCard";
import { CommentSection } from "@/components/posts/CommentSection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { FileText, Users, TrendingUp, Calendar, BookOpen, ThumbsUp, ThumbsDown, MessageCircle as MessageIcon, HelpCircle } from "lucide-react";
import type { PostWithAuthor, Group, EventWithHost } from "@shared/schema";
import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { getFullName, getInitials } from "@/lib/authUtils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const grades = ["6", "7", "8", "9", "10", "11"];

export default function Home() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [gradeFilter, setGradeFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<string>("feed");
  const [newQuestionTitle, setNewQuestionTitle] = useState("");
  const [newQuestionContent, setNewQuestionContent] = useState("");
  const [expandedQId, setExpandedQId] = useState<string | null>(null);
  const [newAnswers, setNewAnswers] = useState<Record<string, string>>({});
  const [expandedCommentPostId, setExpandedCommentPostId] = useState<string | null>(null);

  const { data: posts, isLoading: postsLoading, refetch: refetchPosts } = useQuery<PostWithAuthor[]>({
    queryKey: ["/api/posts"],
    refetchInterval: 3000, // Poll every 3 seconds
  });

  const { data: groups } = useQuery<Group[]>({
    queryKey: ["/api/groups/my"],
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
    refetchInterval: 3000, // Poll every 3 seconds
  });

  // Q&A Global - using a special group ID
  const { data: questions, isLoading: questionsLoading, refetch: refetchQuestions } = useQuery({
    queryKey: ["/api/groups/global/questions"],
  });

  const createPostMutation = useMutation({
    mutationFn: async (content: string) => {
      await apiRequest("/api/posts", "POST", { content });
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
      toast({
        title: "Error",
        description: "No se pudo crear la publicación. Intenta de nuevo.",
        variant: "destructive",
      });
    },
  });

  const likeMutation = useMutation({
    mutationFn: async (postId: string) => {
      await apiRequest(`/api/posts/${postId}/reactions`, "POST", { type: "like" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    },
  });

  const createQuestionMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("/api/groups/global/questions", "POST", {
        title: newQuestionTitle,
        content: newQuestionContent,
      });
    },
    onSuccess: () => {
      setNewQuestionTitle("");
      setNewQuestionContent("");
      toast({
        title: "Pregunta creada",
        description: "Tu pregunta ha sido publicada.",
      });
      refetchQuestions();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo crear la pregunta.",
        variant: "destructive",
      });
    },
  });

  const createAnswerMutation = useMutation({
    mutationFn: async ({ qId, content }: { qId: string; content: string }) => {
      await apiRequest(`/api/questions/${qId}/answers`, "POST", { content });
    },
    onSuccess: () => {
      setNewAnswers({});
      toast({
        title: "Respuesta publicada",
      });
      refetchQuestions();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo crear la respuesta.",
        variant: "destructive",
      });
    },
  });

  return (
    <AppLayout title="Inicio" showSearch>
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="feed" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Publicaciones
                </TabsTrigger>
                <TabsTrigger value="qa" className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4" />
                  Q&A
                </TabsTrigger>
              </TabsList>

              {/* Feed Tab */}
              <TabsContent value="feed" className="space-y-6">
                {/* Create Post */}
                <CreatePostCard
                  onSubmit={(content) => createPostMutation.mutate(content)}
                  isSubmitting={createPostMutation.isPending}
                />

                {/* Events/News */}
                <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Próximas Asesorías
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {eventsLoading ? (
                      <div className="space-y-2">
                        {Array.from({ length: 2 }).map((_, i) => (
                          <Skeleton key={i} className="h-12 w-full" />
                        ))}
                      </div>
                    ) : events && Array.isArray(events) && events.length > 0 ? (
                      <div className="space-y-2">
                        {events.slice(0, 3).map((evt: any) => (
                          <div key={evt.id} className="p-3 rounded-lg bg-muted/50 text-sm">
                            <p className="font-medium">{evt.title}</p>
                            <p className="text-xs text-muted-foreground">{evt.subject}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No hay asesorías próximas</p>
                    )}
                  </CardContent>
                </Card>

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
              </TabsContent>

              {/* Q&A Tab */}
              <TabsContent value="qa" className="space-y-6">
                {/* New Question */}
                <Card>
                  <CardHeader>
                    <CardTitle>Haz una pregunta</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Input
                      placeholder="Título de la pregunta..."
                      value={newQuestionTitle}
                      onChange={(e) => setNewQuestionTitle(e.target.value)}
                      data-testid="input-question-title"
                    />
                    <Textarea
                      placeholder="Describe tu pregunta..."
                      value={newQuestionContent}
                      onChange={(e) => setNewQuestionContent(e.target.value)}
                      data-testid="input-question-content"
                    />
                    <Button
                      onClick={() => createQuestionMutation.mutate()}
                      disabled={!newQuestionTitle || !newQuestionContent || createQuestionMutation.isPending}
                      data-testid="button-submit-question"
                    >
                      {createQuestionMutation.isPending ? "Publicando..." : "Publicar Pregunta"}
                    </Button>
                  </CardContent>
                </Card>

                {/* Questions List */}
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Preguntas</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {questionsLoading ? (
                        Array.from({ length: 2 }).map((_, i) => (
                          <Skeleton key={i} className="h-20 w-full" />
                        ))
                      ) : !questions || questions.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No hay preguntas aún. ¡Sé el primero!</p>
                      ) : (
                        questions.map((q: any) => (
                          <div
                            key={q.id}
                            className="p-4 border rounded-lg hover-elevate cursor-pointer"
                            onClick={() => setExpandedQId(expandedQId === q.id ? null : q.id)}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <h3 className="font-semibold">{q.title}</h3>
                                <p className="text-sm text-muted-foreground">{q.author?.firstName || "Usuario"}</p>
                              </div>
                              <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-1">
                                  <ThumbsUp className="h-4 w-4" />
                                  <span>{q.votes || 0}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <MessageIcon className="h-4 w-4" />
                                  <span>{q.answers?.length || 0}</span>
                                </div>
                              </div>
                            </div>

                            {/* Expanded Answers */}
                            {expandedQId === q.id && (
                              <div className="mt-4 space-y-3 border-t pt-4" onClick={(e) => e.stopPropagation()}>
                                <div className="space-y-2">
                                  {q.answers && q.answers.length > 0 ? (
                                    q.answers.map((ans: any) => (
                                      <div key={ans.id} className="p-2 bg-muted/30 rounded text-sm">
                                        <p>{ans.content}</p>
                                        <p className="text-xs text-muted-foreground mt-1">Por: {ans.author?.firstName || "Usuario"}</p>
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-xs text-muted-foreground">No hay respuestas aún</p>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  <Input
                                    placeholder="Tu respuesta..."
                                    value={newAnswers[q.id] || ""}
                                    onChange={(e) => setNewAnswers({ ...newAnswers, [q.id]: e.target.value })}
                                    data-testid={`input-answer-${q.id}`}
                                  />
                                  <Button 
                                    size="sm" 
                                    data-testid={`button-submit-answer-${q.id}`}
                                    onClick={() => {
                                      if (newAnswers[q.id]) {
                                        createAnswerMutation.mutate({ qId: q.id, content: newAnswers[q.id] });
                                      }
                                    }}
                                    disabled={!newAnswers[q.id] || createAnswerMutation.isPending}
                                  >
                                    {createAnswerMutation.isPending ? "..." : "Responder"}
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
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
    </AppLayout>
  );
}
