import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  BookOpen, Plus, Users, ChevronRight, GraduationCap,
  CheckCircle2, Loader2, Telescope,
} from "lucide-react";
import type { CourseWithTeacher } from "@shared/schema";

const createCourseSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  subject: z.string().min(1, "La asignatura es requerida"),
  description: z.string().optional(),
  grade: z.string().min(1, "El grado es requerido"),
  semester: z.string().optional(),
  academicYear: z.string().optional(),
});
type CreateCourseForm = z.infer<typeof createCourseSchema>;

const GRADES = ["6°", "7°", "8°", "9°", "10°", "11°", "Todos"];

function CreateCourseDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useToast();

  // Consulta para obtener las asignaturas creadas dinámicamente en el panel de administración
  const { data: subjects, isLoading: loadingSubjects } = useQuery<any[]>({
    queryKey: ["/api/admin/subjects"],
  });

  // Consulta para obtener el sistema evaluativo actual de la institución
  const { data: institution } = useQuery<any>({
    queryKey: ["/api/admin/institution"],
  });

  const form = useForm<CreateCourseForm>({
    resolver: zodResolver(createCourseSchema),
    defaultValues: {
      name: "",
      subject: "",
      description: "",
      grade: "",
      semester: "",
      academicYear: new Date().getFullYear().toString(),
    },
  });

  const mutation = useMutation({
    mutationFn: (data: CreateCourseForm) =>
      apiRequest("POST", "/api/classroom/courses", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classroom/courses"] });
      queryClient.invalidateQueries({ queryKey: ["/api/classroom/courses/all"] });
      toast({ title: "Curso creado correctamente" });
      form.reset();
      onClose();
    },
    onError: () => {
      toast({ title: "Error al crear el curso", variant: "destructive" });
    },
  });

  // Filtrar solo las materias que estén activadas por el administrador
  const activeSubjects = subjects?.filter((s) => s.active) || [];
  const maxGradeAllowed = institution?.maxGrade || 100;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Crear nuevo curso</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del curso *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Álgebra Lineal" {...field} data-testid="input-course-name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Asignatura *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-course-subject">
                        <SelectValue placeholder="Seleccionar asignatura" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {loadingSubjects ? (
                        <SelectItem value="loading" disabled>Cargando materias...</SelectItem>
                      ) : activeSubjects.length === 0 ? (
                        <SelectItem value="none" disabled>No hay materias activas creadas</SelectItem>
                      ) : (
                        activeSubjects.map((s) => (
                          <SelectItem key={s.id || s.name} value={s.name}>
                            {s.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe el contenido del curso..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="grade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grado *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {GRADES.map((g) => (
                          <SelectItem key={g} value={g}>{g}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="semester"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Semestre</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="I Semestre">I Semestre</SelectItem>
                        <SelectItem value="II Semestre">II Semestre</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Banner Informativo del Sistema Evaluativo Institucional */}
            <div className="bg-muted/60 rounded-lg p-3 text-xs text-muted-foreground border">
              <span className="font-semibold block text-foreground mb-0.5">
                Modelo evaluativo activo:
              </span>
              Este curso y sus tareas se regirán bajo el sistema{" "}
              <span className="font-medium text-foreground capitalize">
                {institution?.evaluationType || "cuantitativo"}
              </span>{" "}
              con un rango de calificación automático de{" "}
              <span className="font-semibold text-primary">0 a {maxGradeAllowed}</span>.
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
              <Button type="submit" disabled={mutation.isPending} data-testid="button-create-course">
                {mutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Crear Curso
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function CourseCard({
  course,
  enrolled,
  onEnroll,
  enrollPending,
}: {
  course: CourseWithTeacher;
  enrolled?: boolean;
  onEnroll?: () => void;
  enrollPending?: boolean;
}) {
  const { user } = useAuth();
  const isOwner = course.teacherId === user?.id;

  const subjectColor: Record<string, string> = {
    Matemáticas: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    Ciencias: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
    Historia: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    Literatura: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    Programación: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
    Inglés: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300",
    Física: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
    Química: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
    Biología: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  };

  return (
    <Card className="flex flex-col hover-elevate" data-testid={`card-course-${course.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <Badge
            className={`text-xs font-medium no-default-active-elevate ${
              subjectColor[course.subject] || "bg-muted text-muted-foreground"
            }`}
          >
            {course.subject}
          </Badge>
          {course.grade && (
            <span className="text-xs text-muted-foreground">{course.grade}</span>
          )}
        </div>
        <CardTitle className="text-base leading-snug mt-2 line-clamp-2">
          {course.name}
        </CardTitle>
        {course.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>
        )}
      </CardHeader>
      <CardContent className="pb-3 flex-1">
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <GraduationCap className="h-3.5 w-3.5 shrink-0" />
            {course.teacher?.firstName} {course.teacher?.lastName}
          </span>
          {course._count !== undefined && (
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5 shrink-0" />
              {course._count.students} estudiante{course._count.students !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        {course.semester && (
          <p className="text-xs text-muted-foreground mt-2">
            {course.semester}
            {course.academicYear ? ` · ${course.academicYear}` : ""}
          </p>
        )}
      </CardContent>
      <CardFooter className="pt-0 flex items-center gap-2 flex-wrap">
        <Button asChild size="sm" className="flex-1">
          <Link href={`/classroom/${course.id}`}>
            Abrir
            <ChevronRight className="h-3.5 w-3.5 ml-1" />
          </Link>
        </Button>
        {!enrolled && onEnroll && (
          <Button
            variant="outline"
            size="sm"
            onClick={onEnroll}
            disabled={enrollPending}
            data-testid={`button-enroll-${course.id}`}
          >
            {enrollPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Inscribirse"}
          </Button>
        )}
        {enrolled && !isOwner && (
          <Badge variant="secondary" className="text-xs gap-1 no-default-active-elevate">
            <CheckCircle2 className="h-3 w-3" />
            Inscrito
          </Badge>
        )}
        {isOwner && (
          <Badge variant="outline" className="text-xs no-default-active-elevate">
            Mi curso
          </Badge>
        )}
      </CardFooter>
    </Card>
  );
}

export default function Classroom() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showCreate, setShowCreate] = useState(false);
  const [view, setView] = useState<"mine" | "all">("mine");
  const [enrollingId, setEnrollingId] = useState<string | null>(null);

  const isTeacher = user?.role === "teacher" || user?.role === "admin";

  const { data: myCourses, isLoading } = useQuery<CourseWithTeacher[]>({
    queryKey: ["/api/classroom/courses"],
  });

  const { data: allCourses, isLoading: allLoading } = useQuery<CourseWithTeacher[]>({
    queryKey: ["/api/classroom/courses/all"],
    enabled: view === "all",
  });

  const enrollMutation = useMutation({
    mutationFn: (courseId: string) =>
      apiRequest("POST", `/api/classroom/courses/${courseId}/enroll`, {}),
    onMutate: (courseId) => setEnrollingId(courseId),
    onSettled: () => setEnrollingId(null),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classroom/courses"] });
      toast({ title: "Te inscribiste al curso" });
    },
    onError: () => {
      toast({ title: "Error al inscribirse", variant: "destructive" });
    },
  });

  const enrolledIds = new Set(myCourses?.map((c) => c.id));
  const displayCourses = view === "mine" || isTeacher ? myCourses : allCourses;
  const isLoadingDisplay = view === "mine" || isTeacher ? isLoading : allLoading;

  return (
    <AppLayout title="Aula Virtual">
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-semibold">
              {isTeacher ? "Mis cursos" : "Aula Virtual"}
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isTeacher
                ? "Gestiona tus cursos y actividades académicas"
                : "Accede a tus cursos, entrega actividades y revisa calificaciones"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!isTeacher && (
              <>
                <Button
                  variant={view === "mine" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setView("mine")}
                >
                  Mis cursos
                </Button>
                <Button
                  variant={view === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setView("all")}
                  data-testid="button-explore-courses"
                >
                  <Telescope className="h-3.5 w-3.5 mr-1.5" />
                  Explorar
                </Button>
              </>
            )}
            {isTeacher && (
              <Button onClick={() => setShowCreate(true)} data-testid="button-new-course">
                <Plus className="h-4 w-4 mr-2" />
                Nuevo curso
              </Button>
            )}
          </div>
        </div>

        {/* Course grid */}
        {isLoadingDisplay ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-5 w-40 mt-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : displayCourses && displayCourses.length > 0 ? (
          <>
            {view === "all" && !isTeacher && (
              <p className="text-sm text-muted-foreground">
                {displayCourses.filter((c) => !enrolledIds.has(c.id)).length} cursos disponibles
              </p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  enrolled={enrolledIds.has(course.id)}
                  onEnroll={
                    view === "all" && !enrolledIds.has(course.id) && course.teacherId !== user?.id
                      ? () => enrollMutation.mutate(course.id)
                      : undefined
                  }
                  enrollPending={enrollingId === course.id}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg">
              {view === "mine"
                ? isTeacher
                  ? "No has creado cursos aún"
                  : "No estás inscrito en ningún curso"
                : "No hay cursos disponibles"}
            </h3>
            <p className="text-sm text-muted-foreground mt-1 text-center max-w-sm">
              {view === "mine"
                ? isTeacher
                  ? 'Crea tu primer curso con "Nuevo curso"'
                  : 'Ve a "Explorar" para inscribirte en cursos disponibles'
                : "Los profesores aún no han publicado cursos"}
            </p>
            {isTeacher ? (
              <Button className="mt-4" onClick={() => setShowCreate(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Crear primer curso
              </Button>
            ) : view === "mine" ? (
              <Button className="mt-4" variant="outline" onClick={() => setView("all")}>
                <Telescope className="h-4 w-4 mr-2" />
                Explorar cursos
              </Button>
            ) : null}
          </div>
        )}
      </div>

      <CreateCourseDialog open={showCreate} onClose={() => setShowCreate(false)} />
    </AppLayout>
  );
}