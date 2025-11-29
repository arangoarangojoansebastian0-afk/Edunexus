import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { GroupCard, GroupCardSkeleton } from "@/components/groups/GroupCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/EmptyState";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Search, Plus, Users, BookOpen, Sparkles } from "lucide-react";
import type { GroupWithMembers } from "@shared/schema";
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

const createGroupSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  description: z.string().optional(),
  type: z.enum(["course", "club"]),
  grade: z.string().optional(),
});

type CreateGroupForm = z.infer<typeof createGroupSchema>;

const grades = ["6", "7", "8", "9", "10", "11"];

export default function Groups() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("discover");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [gradeFilter, setGradeFilter] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const form = useForm<CreateGroupForm>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "club",
      grade: "",
    },
  });

  const { data: allGroups, isLoading: allLoading, refetch: refetchAllGroups } = useQuery<GroupWithMembers[]>({
    queryKey: ["/api/groups"],
    refetchInterval: 3000,
  });

  const { data: myGroups, isLoading: myLoading, refetch: refetchMyGroups } = useQuery<GroupWithMembers[]>({
    queryKey: ["/api/groups/my"],
    refetchInterval: 3000,
  });

  const myGroupIds = new Set(myGroups?.map((g) => g.id) || []);

  const filteredGroups = allGroups?.filter((group) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!group.name.toLowerCase().includes(query)) return false;
    }
    if (typeFilter !== "all" && group.type !== typeFilter) return false;
    if (gradeFilter !== "all" && group.grade !== gradeFilter) return false;
    return true;
  });

  const createGroupMutation = useMutation({
    mutationFn: async (data: CreateGroupForm) => {
      await apiRequest("POST", "/api/groups", data);
    },
    onSuccess: () => {
      refetchAllGroups();
      refetchMyGroups();
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      setIsCreateOpen(false);
      form.reset();
      toast({
        title: "Grupo creado",
        description: "Tu grupo ha sido creado exitosamente.",
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
        description: "No se pudo crear el grupo. Intenta de nuevo.",
        variant: "destructive",
      });
    },
  });

  const joinGroupMutation = useMutation({
    mutationFn: async (groupId: string) => {
      await apiRequest("POST", `/api/groups/${groupId}/join`);
    },
    onSuccess: () => {
      refetchAllGroups();
      refetchMyGroups();
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      toast({
        title: "Te uniste al grupo",
        description: "Ahora eres miembro de este grupo.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "No se pudo unir al grupo. Intenta de nuevo.",
        variant: "destructive",
      });
    },
  });

  const leaveGroupMutation = useMutation({
    mutationFn: async (groupId: string) => {
      await apiRequest("POST", `/api/groups/${groupId}/leave`);
    },
    onSuccess: () => {
      refetchAllGroups();
      refetchMyGroups();
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      toast({
        title: "Saliste del grupo",
        description: "Ya no eres miembro de este grupo.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "No se pudo salir del grupo. Intenta de nuevo.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateGroupForm) => {
    createGroupMutation.mutate(data);
  };

  return (
    <AppLayout title="Grupos">
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="font-serif text-2xl font-bold">Grupos</h1>
              <p className="text-muted-foreground">
                Únete a grupos de tu curso o descubre clubes de interés
              </p>
            </div>
            {user?.verified && (
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2" data-testid="button-create-group">
                    <Plus className="h-4 w-4" />
                    Crear Grupo
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Crear Nuevo Grupo</DialogTitle>
                    <DialogDescription>
                      Crea un grupo de estudio o un club para conectar con otros estudiantes.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nombre del grupo</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Ej: Club de Robótica"
                                {...field}
                                data-testid="input-group-name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo de grupo</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger data-testid="select-group-type">
                                  <SelectValue placeholder="Selecciona el tipo" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="course">
                                  <div className="flex items-center gap-2">
                                    <BookOpen className="h-4 w-4" />
                                    Curso
                                  </div>
                                </SelectItem>
                                <SelectItem value="club">
                                  <div className="flex items-center gap-2">
                                    <Sparkles className="h-4 w-4" />
                                    Club
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {form.watch("type") === "course" && (
                        <FormField
                          control={form.control}
                          name="grade"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Grado</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger data-testid="select-group-grade">
                                    <SelectValue placeholder="Selecciona el grado" />
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
                      )}
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Descripción (opcional)</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Describe el propósito del grupo..."
                                {...field}
                                data-testid="input-group-description"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsCreateOpen(false)}
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="submit"
                          disabled={createGroupMutation.isPending}
                          data-testid="button-submit-group"
                        >
                          {createGroupMutation.isPending ? "Creando..." : "Crear Grupo"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="discover" data-testid="tab-discover">
                Descubrir
              </TabsTrigger>
              <TabsTrigger value="my-groups" data-testid="tab-my-groups">
                Mis Grupos ({myGroups?.length || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="discover" className="space-y-6">
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Buscar grupos..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                    data-testid="input-search-groups"
                  />
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full sm:w-40" data-testid="select-type-filter">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="course">Cursos</SelectItem>
                    <SelectItem value="club">Clubes</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={gradeFilter} onValueChange={setGradeFilter}>
                  <SelectTrigger className="w-full sm:w-40" data-testid="select-grade-filter">
                    <SelectValue placeholder="Grado" />
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

              {/* Groups Grid */}
              {allLoading ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <GroupCardSkeleton key={i} />
                  ))}
                </div>
              ) : filteredGroups && filteredGroups.length > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredGroups.map((group) => (
                    <GroupCard
                      key={group.id}
                      group={group}
                      isMember={myGroupIds.has(group.id)}
                      onJoin={(id) => joinGroupMutation.mutate(id)}
                      onLeave={(id) => leaveGroupMutation.mutate(id)}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Users}
                  title="No se encontraron grupos"
                  description={
                    searchQuery
                      ? "Intenta con otros términos de búsqueda."
                      : "Sé el primero en crear un grupo para la comunidad."
                  }
                  action={
                    user?.verified
                      ? {
                          label: "Crear Grupo",
                          onClick: () => setIsCreateOpen(true),
                        }
                      : undefined
                  }
                />
              )}
            </TabsContent>

            <TabsContent value="my-groups" className="space-y-6">
              {myLoading ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <GroupCardSkeleton key={i} />
                  ))}
                </div>
              ) : myGroups && myGroups.length > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myGroups.map((group) => (
                    <GroupCard
                      key={group.id}
                      group={group}
                      isMember={true}
                      onLeave={(id) => leaveGroupMutation.mutate(id)}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Users}
                  title="No estás en ningún grupo"
                  description="Explora y únete a grupos que te interesen."
                  action={{
                    label: "Explorar Grupos",
                    onClick: () => setActiveTab("discover"),
                  }}
                />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}
