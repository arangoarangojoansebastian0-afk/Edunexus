import { useEffect, useState } from "react";
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
import { FileText, Users, Calendar, BookOpen, ClipboardList, X } from "lucide-react";
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
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    try {
      setShowOnboarding(localStorage.getItem(`edunexus-onboarding-v1-${user.id}`) !== "dismissed");
    } catch {
      setShowOnboarding(false);
    }
  }, [user?.id]);

  const dismissOnboarding = () => {
    try { if (user?.id) localStorage.setItem(`edunexus-onboarding-v1-${user.id}`, "dismissed"); } catch { /* La bienvenida se puede cerrar aunque el almacenamiento del navegador esté bloqueado. */ }
    setShowOnboarding(false);
  };


  const { data: posts, isLoading: postsLoading, refetch: refetchPosts } = useQuery<PostWithAuthor[]>({
    queryKey: ["/api/posts"],
  });

  const { data: groups } = useQuery<Group[]>({
    queryKey: ["/api/groups/my"],
  });

  const { data: allUsers = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: events, isLoading: eventsLoading, isError: eventsError, refetch: refetchEvents } = useQuery<EventWithHost[]>({
    queryKey: ["/api/events"],
  });

  const { data: conversations } = useQuery<{ unreadCount: number }[]>({
    queryKey: ["/api/direct-messages/conversations"],
  });

  const { data: dueActivities = [], isLoading: activitiesLoading, isError: activitiesError, refetch: refetchActivities } = useQuery<Array<{
    id: string;
    title: string;
    dueDate: string | Date;
    courseId: string;
    courseName: string;
    submissionStatus?: string;
    grade?: string | null;
    pendingReviewCount?: number;
  }>>({
    queryKey: ["/api/classroom/my-activities"],
    queryFn: async () => {
      const response = await fetch("/api/classroom/my-activities", { credentials: "include" });
      if (!response.ok) throw new Error("No se pudieron cargar las actividades");
      return response.json();
    },
  });

  const canViewInstitutionOverview = ["admin", "director", "coordinator", "secretary"].includes(user?.role || "");
  const { data: institutionStats, isLoading: institutionStatsLoading } = useQuery<{
    students: number;
    teachers: number;
    courses: number;
    activities: number;
    atRisk: number;
    attendanceRate: number | null;
  }>({
    queryKey: ["/api/admin/institutional-stats"],
    enabled: canViewInstitutionOverview,
  });

  const { data: recentGrades = [], isLoading: gradesLoading, isError: gradesError } = useQuery<Array<{
    id: string;
    grade: string;
    notes: string | null;
    updatedAt: string;
    subjectName: string;
    periodName: string;
  }>>({
    queryKey: ["/api/gradebook/me"],
    enabled: user?.role === "student",
  });

  const createPostMutation = useMutation({
    mutationFn: async ({ content, files }: { content: string; files?: File[] }) => {
      if (files && files.length > 0) {
        const formData = new FormData();
        formData.append("content", content);
        files.forEach((f) => formData.append("attachments", f));
        const res = await fetch("/api/posts", {
          method: "POST",
          credentials: "include",
          body: formData,
        });
        if (!res.ok) throw new Error("Error al publicar");
        return await res.json();
      }
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

  const upcomingEvents = (events || [])
    .filter((e) => new Date(e.startTime) > new Date())
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .slice(0, 3);
  const unreadMessagesTotal = (conversations || []).reduce((sum, c) => sum + (c.unreadCount || 0), 0);
  const upcomingActivities = dueActivities
    .filter((activity) => new Date(activity.dueDate).getTime() >= Date.now()
      || (user?.role === "student" && activity.submissionStatus === "pending")
      || (user?.role === "teacher" && (activity.pendingReviewCount || 0) > 0))
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 4);

  return (
    <AppLayout title="Inicio" showSearch>
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {showOnboarding && (
              <Card className="border-primary/20 bg-primary/[0.03]">
                <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-2">
                  <div>
                    <CardTitle className="text-base">Bienvenido a EduNexus</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {user?.role === "student"
                        ? "Encuentra tus cursos en Aula Virtual, revisa fechas y entregas en Calendario y conversa con tu comunidad desde Mensajes."
                        : user?.role === "teacher"
                          ? "Gestiona tus cursos desde Aula Virtual, revisa entregas y calificaciones en cada curso y mantente al día desde Calendario."
                          : ["admin", "director", "coordinator", "secretary"].includes(user?.role || "")
                            ? "Consulta el resumen institucional aquí y entra al Panel Admin para gestionar la operación académica de tu institución."
                            : "Explora la comunidad, los grupos, el calendario y la biblioteca desde el menú principal."}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" aria-label="Cerrar bienvenida" onClick={dismissOnboarding}>
                    <X className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button variant="ghost" className="h-auto px-0 text-sm text-primary hover:bg-transparent" onClick={dismissOnboarding}>Entendido</Button>
                </CardContent>
              </Card>
            )}

            {/* Create Post */}
            <CreatePostCard
              onSubmit={(content, files) => createPostMutation.mutateAsync({ content, files })}
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
            {user?.role === "student" && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base">Últimas calificaciones</CardTitle>
                    <Button variant="ghost" size="sm" asChild><Link href="/profile">Ver perfil</Link></Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {gradesLoading ? (
                    <div className="space-y-2"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
                  ) : gradesError ? (
                    <p className="text-sm text-muted-foreground">No se pudieron cargar tus calificaciones.</p>
                  ) : recentGrades.length ? recentGrades.slice(0, 4).map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between gap-3 rounded-lg bg-muted/50 p-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{entry.subjectName}</p>
                        <p className="truncate text-xs text-muted-foreground">{entry.periodName}{entry.notes ? ` · ${entry.notes}` : ""}</p>
                      </div>
                      <Badge variant="secondary" className="shrink-0">{entry.grade}</Badge>
                    </div>
                  )) : (
                    <p className="py-2 text-center text-sm text-muted-foreground">Todavía no tienes calificaciones registradas.</p>
                  )}
                </CardContent>
              </Card>
            )}

            {canViewInstitutionOverview && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base">Resumen institucional</CardTitle>
                    <Button variant="ghost" size="sm" asChild><Link href="/admin">Panel</Link></Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {institutionStatsLoading ? (
                    <div className="grid grid-cols-2 gap-3"><Skeleton className="h-16" /><Skeleton className="h-16" /><Skeleton className="h-16" /><Skeleton className="h-16" /></div>
                  ) : institutionStats ? (
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        ["Estudiantes", institutionStats.students],
                        ["Docentes", institutionStats.teachers],
                        ["Cursos", institutionStats.courses],
                        ["Actividades", institutionStats.activities],
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-lg bg-muted/50 p-3">
                          <p className="text-xl font-semibold">{value}</p>
                          <p className="text-xs text-muted-foreground">{label}</p>
                        </div>
                      ))}
                      {institutionStats.atRisk > 0 && (
                        <p className="col-span-2 text-xs text-amber-700 dark:text-amber-400">
                          {institutionStats.atRisk} estudiante{institutionStats.atRisk === 1 ? "" : "s"} requiere{institutionStats.atRisk === 1 ? "" : "n"} seguimiento académico.
                        </p>
                      )}
                      {institutionStats.attendanceRate != null && (
                        <p className="col-span-2 text-xs text-muted-foreground">Asistencia promedio (30 días): {institutionStats.attendanceRate}%</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No se pudo cargar el resumen institucional.</p>
                  )}
                </CardContent>
              </Card>
            )}

            {(user?.role === "student" || user?.role === "teacher" || user?.role === "admin") && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <ClipboardList className="h-4 w-4" />
                      {user.role === "student" ? "Próximas entregas" : user.role === "teacher" ? "Actividades y revisión" : "Actividades próximas"}
                    </CardTitle>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/calendar">Calendario</Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {activitiesLoading ? (
                    <div className="space-y-2"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
                  ) : activitiesError ? (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-center">
                      <p className="text-sm text-muted-foreground">No pudimos cargar tus actividades.</p>
                      <Button variant="ghost" size="sm" onClick={() => refetchActivities()}>Intentar de nuevo</Button>
                    </div>
                  ) : upcomingActivities.length ? (
                    upcomingActivities.map((activity) => (
                      <Link key={activity.id} href={`/classroom/${activity.courseId}`}>
                        <div className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
                          <p className="text-sm font-medium truncate">{activity.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{activity.courseName} · {new Date(activity.dueDate).toLocaleDateString("es-CO", { day: "numeric", month: "short" })}</p>
                          {user.role === "student" && (
                            <Badge variant={activity.submissionStatus === "pending" && new Date(activity.dueDate).getTime() < Date.now() ? "destructive" : "secondary"} className="mt-1 text-[10px]">
                              {activity.submissionStatus === "graded" ? `Calificada${activity.grade ? ` · ${activity.grade}` : ""}` : activity.submissionStatus === "submitted" ? "Entregada" : new Date(activity.dueDate).getTime() < Date.now() ? "Vencida · pendiente" : "Pendiente"}
                            </Badge>
                          )}
                          {user.role === "teacher" && (activity.pendingReviewCount || 0) > 0 && (
                            <Badge variant="default" className="mt-1 text-[10px]">
                              {activity.pendingReviewCount} {activity.pendingReviewCount === 1 ? "entrega por revisar" : "entregas por revisar"}
                            </Badge>
                          )}
                        </div>
                      </Link>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-2">No hay actividades próximas.</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Próximos eventos + mensajes sin leer */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Próximamente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/messages">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
                    <span className="text-sm font-medium">Mensajes sin leer</span>
                    <Badge variant={unreadMessagesTotal > 0 ? "default" : "outline"}>
                      {unreadMessagesTotal}
                    </Badge>
                  </div>
                </Link>

                {eventsLoading ? (
                  <div className="space-y-2"><Skeleton className="h-12 w-full" /><Skeleton className="h-12 w-full" /></div>
                ) : eventsError ? (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-center">
                    <p className="text-sm text-muted-foreground">No pudimos cargar los próximos eventos.</p>
                    <Button variant="ghost" size="sm" onClick={() => refetchEvents()}>Intentar de nuevo</Button>
                  </div>
                ) : upcomingEvents.length > 0 ? (
                  <div className="space-y-2">
                    {upcomingEvents.map((event) => (
                      <Link key={event.id} href={`/calendar?event=${encodeURIComponent(event.id)}`}>
                        <div className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
                          <p className="text-sm font-medium truncate">{event.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(event.startTime).toLocaleDateString("es-CO", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-2">No tienes eventos próximos.</p>
                )}
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
