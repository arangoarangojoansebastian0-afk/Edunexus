import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { PostCard } from "@/components/posts/PostCard";
import { FileCard } from "@/components/library/FileCard";
import { EmptyState } from "@/components/EmptyState";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getFullName, getInitials, formatRole, formatGrade } from "@/lib/authUtils";
import {
  Edit,
  Mail,
  GraduationCap,
  Award,
  FileText,
  MessageSquare,
  CheckCircle,
  Clock,
  X,
} from "lucide-react";
import type { PostWithAuthor, FileWithUploader, Badge as BadgeType, UserBadge } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const grades = ["6", "7", "8", "9", "10", "11"];

const interestOptions = [
  "Matemáticas",
  "Ciencias",
  "Programación",
  "Arte",
  "Música",
  "Deportes",
  "Literatura",
  "Historia",
  "Idiomas",
  "Robótica",
  "Debate",
  "Teatro",
];

const profileSchema = z.object({
  firstName: z.string().min(1, "El nombre es requerido"),
  lastName: z.string().min(1, "El apellido es requerido"),
  grade: z.string().optional(),
  bio: z.string().max(500, "La biografía no puede exceder 500 caracteres").optional(),
  interests: z.array(z.string()).max(5, "Máximo 5 intereses"),
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function Profile() {
  const { user: authUser } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const params = useParams();
  const profileUserId = params.id || authUser?.id;
  const isOwnProfile = !params.id || params.id === authUser?.id;
  const [isEditOpen, setIsEditOpen] = useState(false);

  const { data: profileUser } = useQuery({
    queryKey: ["/api/users", profileUserId],
    enabled: !!profileUserId,
  });

  const displayUser = isOwnProfile ? authUser : profileUser;

  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: displayUser?.firstName || "",
      lastName: displayUser?.lastName || "",
      grade: displayUser?.grade || "",
      bio: displayUser?.bio || "",
      interests: displayUser?.interests || [],
    },
  });

  const { data: posts, isLoading: postsLoading } = useQuery<PostWithAuthor[]>({
    queryKey: ["/api/users", profileUserId, "posts"],
    enabled: !!profileUserId,
  });

  const { data: files, isLoading: filesLoading } = useQuery<FileWithUploader[]>({
    queryKey: ["/api/users", profileUserId, "files"],
    enabled: !!profileUserId,
  });

  const { data: badges, refetch: refetchBadges } = useQuery<(UserBadge & { badge: BadgeType })[]>({
    queryKey: ["/api/users", profileUserId, "badges"],
    enabled: !!profileUserId,
  });

  const { data: allBadges } = useQuery<BadgeType[]>({
    queryKey: ["/api/badges"],
    enabled: !!authUser && (authUser.role === "teacher" || authUser.role === "admin"),
  });

  const [isAssignBadgeOpen, setIsAssignBadgeOpen] = useState(false);
  const [selectedBadgeId, setSelectedBadgeId] = useState("");

  const assignBadgeMutation = useMutation({
    mutationFn: async (badgeId: string) => {
      await apiRequest("POST", `/api/users/${profileUserId}/badges/${badgeId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", profileUserId, "badges"] });
      setIsAssignBadgeOpen(false);
      setSelectedBadgeId("");
      toast({
        title: "Insignia asignada",
        description: "La insignia ha sido asignada al estudiante.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo asignar la insignia.",
        variant: "destructive",
      });
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileForm) => {
      await apiRequest("PATCH", "/api/users/me", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      if (!isOwnProfile && profileUserId) {
        queryClient.invalidateQueries({ queryKey: ["/api/users", profileUserId] });
      }
      setIsEditOpen(false);
      toast({
        title: "Perfil actualizado",
        description: "Tus cambios han sido guardados.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el perfil. Intenta de nuevo.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProfileForm) => {
    updateProfileMutation.mutate(data);
  };

  const toggleInterest = (interest: string) => {
    const current = form.getValues("interests");
    if (current.includes(interest)) {
      form.setValue("interests", current.filter((i) => i !== interest));
    } else if (current.length < 5) {
      form.setValue("interests", [...current, interest]);
    }
  };

  if (!displayUser) {
    return (
      <AppLayout title={isOwnProfile ? "Mi Perfil" : "Perfil"}>
        <div className="flex items-center justify-center h-96">
          <Skeleton className="h-32 w-32 rounded-full" />
        </div>
      </AppLayout>
    );
  }

  const user = displayUser;

  return (
    <AppLayout title={isOwnProfile ? "Mi Perfil" : `Perfil de ${user.firstName}`}>
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        <div className="space-y-6">
          {/* Profile Header */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                <Avatar className="h-24 w-24 shrink-0">
                  <AvatarImage
                    src={user.profileImageUrl || undefined}
                    alt={getFullName(user.firstName, user.lastName)}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                    {getInitials(user.firstName, user.lastName)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="font-serif text-2xl font-bold">
                          {getFullName(user.firstName, user.lastName)}
                        </h1>
                        {user.verified ? (
                          <Badge variant="secondary" className="gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Verificado
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1">
                            <Clock className="h-3 w-3" />
                            Pendiente
                          </Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground">{formatRole(user.role)}</p>
                    </div>
                    {isOwnProfile && (
                      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="gap-2" data-testid="button-edit-profile">
                            <Edit className="h-4 w-4" />
                            Editar Perfil
                          </Button>
                        </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Editar Perfil</DialogTitle>
                          <DialogDescription>
                            Actualiza tu información personal.
                          </DialogDescription>
                        </DialogHeader>
                        <Form {...form}>
                          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={form.control}
                                name="firstName"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Nombre</FormLabel>
                                    <FormControl>
                                      <Input {...field} data-testid="input-first-name" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="lastName"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Apellido</FormLabel>
                                    <FormControl>
                                      <Input {...field} data-testid="input-last-name" />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <FormField
                              control={form.control}
                              name="grade"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Grado</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger data-testid="select-grade">
                                        <SelectValue placeholder="Selecciona tu grado" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {grades.map((grade) => (
                                        <SelectItem key={grade} value={grade}>
                                          {grade}° Grado
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="bio"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Biografía</FormLabel>
                                  <FormControl>
                                    <Textarea
                                      placeholder="Cuéntanos sobre ti..."
                                      {...field}
                                      data-testid="input-bio"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="interests"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Intereses (máx. 5)</FormLabel>
                                  <div className="flex flex-wrap gap-2">
                                    {interestOptions.map((interest) => (
                                      <Badge
                                        key={interest}
                                        variant={
                                          field.value.includes(interest)
                                            ? "default"
                                            : "outline"
                                        }
                                        className="cursor-pointer"
                                        onClick={() => toggleInterest(interest)}
                                      >
                                        {interest}
                                        {field.value.includes(interest) && (
                                          <X className="h-3 w-3 ml-1" />
                                        )}
                                      </Badge>
                                    ))}
                                  </div>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <DialogFooter>
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsEditOpen(false)}
                              >
                                Cancelar
                              </Button>
                              <Button
                                type="submit"
                                disabled={updateProfileMutation.isPending}
                                data-testid="button-save-profile"
                              >
                                {updateProfileMutation.isPending
                                  ? "Guardando..."
                                  : "Guardar Cambios"}
                              </Button>
                            </DialogFooter>
                          </form>
                        </Form>
                      </DialogContent>
                      </Dialog>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    {user.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        {user.email}
                      </span>
                    )}
                    {user.grade && (
                      <span className="flex items-center gap-1">
                        <GraduationCap className="h-4 w-4" />
                        {formatGrade(user.grade)}
                      </span>
                    )}
                  </div>

                  {user.bio && <p className="text-sm">{user.bio}</p>}

                  {user.interests && user.interests.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {user.interests.map((interest) => (
                        <Badge key={interest} variant="secondary">
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Badges */}
          {(badges && badges.length > 0) || (!isOwnProfile && authUser && (authUser.role === "teacher" || authUser.role === "admin") && displayUser?.role === "student") ? (
            <Card>
              <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  Insignias
                </CardTitle>
                {!isOwnProfile && authUser && (authUser.role === "teacher" || authUser.role === "admin") && displayUser?.role === "student" && (
                  <Dialog open={isAssignBadgeOpen} onOpenChange={setIsAssignBadgeOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" data-testid="button-assign-badge">
                        Asignar Insignia
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Asignar Insignia</DialogTitle>
                        <DialogDescription>
                          Selecciona una insignia para asignarla a este estudiante.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Select value={selectedBadgeId} onValueChange={setSelectedBadgeId}>
                          <SelectTrigger data-testid="select-badge">
                            <SelectValue placeholder="Elige una insignia..." />
                          </SelectTrigger>
                          <SelectContent>
                            {allBadges?.map((b) => (
                              <SelectItem key={b.id} value={b.id}>
                                {b.name} - {b.description}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setIsAssignBadgeOpen(false)}
                          data-testid="button-cancel-assign"
                        >
                          Cancelar
                        </Button>
                        <Button
                          onClick={() => selectedBadgeId && assignBadgeMutation.mutate(selectedBadgeId)}
                          disabled={!selectedBadgeId || assignBadgeMutation.isPending}
                          data-testid="button-confirm-assign"
                        >
                          Asignar
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {badges?.map((ub) => (
                    <Tooltip key={ub.id}>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 cursor-help hover-elevate">
                          {ub.badge.iconUrl ? (
                            <img
                              src={ub.badge.iconUrl}
                              alt={ub.badge.name}
                              className="h-8 w-8"
                            />
                          ) : (
                            <Award
                              className="h-8 w-8"
                              style={{ color: ub.badge.color || undefined }}
                            />
                          )}
                          <span className="text-sm font-medium">{ub.badge.name}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{ub.badge.description || "Sin descripción"}</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
                {!badges || badges.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sin insignias aún</p>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {/* Content Tabs */}
          <Tabs defaultValue="posts">
            <TabsList>
              <TabsTrigger value="posts" className="gap-2" data-testid="tab-posts">
                <MessageSquare className="h-4 w-4" />
                Publicaciones
              </TabsTrigger>
              <TabsTrigger value="files" className="gap-2" data-testid="tab-files">
                <FileText className="h-4 w-4" />
                Archivos
              </TabsTrigger>
            </TabsList>

            <TabsContent value="posts" className="space-y-4 mt-4">
              {postsLoading ? (
                Array.from({ length: 2 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-3/4" />
                    </CardContent>
                  </Card>
                ))
              ) : posts && posts.length > 0 ? (
                posts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    currentUserId={user.id}
                    likesCount={post._count?.reactions || 0}
                    commentsCount={post._count?.comments || 0}
                  />
                ))
              ) : (
                <EmptyState
                  icon={MessageSquare}
                  title="Sin publicaciones"
                  description="Aún no has compartido nada con la comunidad."
                />
              )}
            </TabsContent>

            <TabsContent value="files" className="mt-4">
              {filesLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-48 rounded-lg" />
                  ))}
                </div>
              ) : files && files.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {files.map((file) => (
                    <FileCard
                      key={file.id}
                      file={file}
                      isOwner={true}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={FileText}
                  title="Sin archivos"
                  description="Aún no has compartido recursos en la biblioteca."
                />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}
