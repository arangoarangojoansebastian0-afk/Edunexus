import { usePersistentState } from "@/hooks/usePersistentState";
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
import { useInstitutionSettings } from "@/hooks/useInstitutionSettings";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  BookOpen, Plus, Users, ChevronRight, GraduationCap,
  CheckCircle2, Loader2, Telescope, Search,
} from "lucide-react";
import type { CourseWithTeacher } from "@shared/schema";

const createCourseSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  subject: z.string().min(1, "La asignatura es requerida"),
  description: z.string().optional(),
  grade: z.string().min(1, "El grado es requerido"),
  semester: z.string().optional(),
  academicYear: z.string().optional(),
  groupIds: z.array(z.string()).default([]),
  studentIds: z.array(z.string()).default([]),
});
type CreateCourseForm = z.infer<typeof createCourseSchema>;

const GRADES = ["6°", "7°", "8°", "9°", "10°", "11°", "Todos"];

function CreateCourseDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { toast } = useToast();
  const [studentSearch, setStudentSearch] = useState("");

  const { data: academicGroups = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/academic-groups"],
    enabled: open,
  });
  const { data: directory = [] } = useQuery<any[]>({
    queryKey: ["/api/users"],
    enabled: open,
  });

  // Consulta para obtener las asignaturas creadas dinámicamente en el panel de administración
  const { data: subjects, isLoading: loadingSubjects } = useQuery<any[]>({
    queryKey: ["/api/admin/subjects"],
  });

  // Consulta para obtener el sistema evaluativo actual de la institución
  const { data: institution } = useInstitutionSettings();

  const form = useForm<CreateCourseForm>({
    resolver: zodResolver(createCourseSchema),
    defaultValues: {
      name: "",
      subject: "",
      description: "",
      grade: "",
      semester: "",
      academicYear: new Date().getFullYear().toString(),
      groupIds: [],
      studentIds: [],
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
      setStudentSearch("");
      onClose();
    },
    onError: () => {
      toast({ title: "Error al crear el curso", variant: "destructive" });
    },
  });

  // Filtrar solo las materias que estén activadas por el administrador
  const activeSubjects = subjects?.filter((s) => s.active) || [];
  const students = directory.filter((person) => person.role === "student");
  const selectedGroupIds = form.watch("groupIds") || [];
  const selectedStudentIds = form.watch("studentIds") || [];
  const filteredStudents = students.filter((student) =>
    `${student.firstName} ${student.lastName}`.toLocaleLowerCase("es").includes(studentSearch.trim().toLocaleLowerCase("es"))
  );

  // BUG CORREGIDO: esto leía `institution?.maxGrade`, un campo que NUNCA
  // existió en el esquema (el campo real es `gradeScale`, un texto libre
  // como "1.0 - 5.0"). Por eso el banner siempre caía al valor por
  // defecto (100) sin importar lo que el admin configurara: no es que no
  // se estuviera leyendo el sistema evaluativo, es que se estaba leyendo
  // una propiedad que no existe.
  const evaluationType = institution?.evaluationType || "quantitative";
  const evaluationLabel =
    evaluationType === "qualitative" ? "cualitativo" :
    evaluationType === "mixed" ? "mixto" : "cuantitativo";
  const scaleLabel =
    evaluationType === "qualitative"
      ? (institution?.qualitativeScale || "Bajo, Básico, Alto, Superior")
      : (institution?.gradeScale || "1.0 - 5.0");

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
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

            <section className="rounded-2xl border bg-muted/20 p-4 sm:p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Users className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold">Acceso al aula</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Elige grupos completos, estudiantes específicos o combina ambas opciones.</p>
                </div>
                <Badge variant="secondary" className="shrink-0">
                  {selectedGroupIds.length + selectedStudentIds.length} selecciones
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border bg-background p-3 sm:p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">Grupos</p>
                      <p className="text-xs text-muted-foreground">Inscribe a todos sus alumnos</p>
                    </div>
                    <Badge variant="outline">{selectedGroupIds.length}/{academicGroups.length}</Badge>
                  </div>
                  <div className="max-h-48 overflow-y-auto pr-1 space-y-2">
                    {academicGroups.length === 0 ? (
                      <p className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">No hay grupos académicos disponibles.</p>
                    ) : academicGroups.map((group: any) => {
                      const selected = selectedGroupIds.includes(group.id);
                      return (
                        <label key={group.id} className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm cursor-pointer transition-colors ${selected ? "border-primary bg-primary/5" : "hover:bg-muted/60"}`}>
                          <input className="h-4 w-4 shrink-0 accent-primary" type="checkbox" checked={selected} onChange={(event) => {
                            const current = form.getValues("groupIds");
                            form.setValue("groupIds", event.target.checked ? [...current, group.id] : current.filter((id) => id !== group.id), { shouldDirty: true });
                          }} />
                          <span className="font-medium">{group.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-xl border bg-background p-3 sm:p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">Estudiantes</p>
                      <p className="text-xs text-muted-foreground">Añade personas puntuales</p>
                    </div>
                    <Badge variant="outline">{selectedStudentIds.length} elegidos</Badge>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input className="pl-9" value={studentSearch} onChange={(event) => setStudentSearch(event.target.value)} placeholder="Buscar por nombre..." aria-label="Buscar estudiante" />
                  </div>
                  <div className="max-h-48 overflow-y-auto pr-1 space-y-1">
                    {filteredStudents.length === 0 ? (
                      <p className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground text-center">No se encontraron estudiantes.</p>
                    ) : filteredStudents.map((student: any) => {
                      const selected = selectedStudentIds.includes(student.id);
                      return (
                        <label key={student.id} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm cursor-pointer transition-colors ${selected ? "bg-primary/5 text-foreground" : "hover:bg-muted/60"}`}>
                          <input className="h-4 w-4 shrink-0 accent-primary" type="checkbox" checked={selected} onChange={(event) => {
                            const current = form.getValues("studentIds");
                            form.setValue("studentIds", event.target.checked ? [...current, student.id] : current.filter((id) => id !== student.id), { shouldDirty: true });
                          }} />
                          <span className="min-w-0 flex-1 truncate font-medium">{student.firstName} {student.lastName}</span>
                          {student.grade && <span className="text-xs text-muted-foreground shrink-0">{student.grade}</span>}
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>

            {/* Banner Informativo del Sistema Evaluativo Institucional */}
            <div className="bg-muted/60 rounded-lg p-3 text-xs text-muted-foreground border">
              <span className="font-semibold block text-foreground mb-0.5">
                Modelo evaluativo activo:
              </span>
              Este curso y sus tareas se regirán bajo el sistema{" "}
              <span className="font-medium text-foreground">
                {evaluationLabel}
              </span>{" "}
              con la escala{" "}
              <span className="font-semibold text-primary">{scaleLabel}</span>.
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
}: {
  course: CourseWithTeacher;
  enrolled?: boolean;
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
          <Link href={`/aula-virtual/${course.id}`}>
            Abrir
            <ChevronRight className="h-3.5 w-3.5 ml-1" />
          </Link>
        </Button>
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
  const [showCreate, setShowCreate] = useState(false);
  const [view, setView] = useState<"mine" | "all">("mine");
  const [searchQuery, setSearchQuery] = usePersistentState("classroom-search", "");

  const isTeacher = user?.role === "teacher" || user?.role === "admin";

  const { data: myCourses, isLoading, isError: myCoursesError, refetch: refetchMyCourses } = useQuery<CourseWithTeacher[]>({
    queryKey: ["/api/classroom/courses"],
  });

  const { data: allCourses, isLoading: allLoading, isError: allCoursesError, refetch: refetchAllCourses } = useQuery<CourseWithTeacher[]>({
    queryKey: ["/api/classroom/courses/all"],
    enabled: view === "all",
  });

  const enrolledIds = new Set(myCourses?.map((c) => c.id));
  const displayCourses = view === "mine" || isTeacher ? myCourses : allCourses;
  const isLoadingDisplay = view === "mine" || isTeacher ? isLoading : allLoading;
  const courseLoadError = view === "mine" || isTeacher ? myCoursesError : allCoursesError;
  const filteredCourses = displayCourses?.filter((course) => {
    const needle = searchQuery.trim().toLocaleLowerCase("es");
    if (!needle) return true;
    return [course.name, course.subject, course.description, course.grade, course.teacher?.firstName, course.teacher?.lastName]
      .some((value) => value?.toLocaleLowerCase("es").includes(needle));
  });

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
            {!isTeacher && user?.role !== "student" && (
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

        <div className="relative max-w-xl">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Buscar por curso, asignatura o docente..."
            aria-label="Buscar cursos"
            className="pl-9"
          />
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
        ) : courseLoadError ? (
          <Card className="flex flex-wrap items-center justify-between gap-3 p-5">
            <p className="text-sm text-muted-foreground">No se pudieron cargar los cursos.</p>
            <Button variant="outline" size="sm" onClick={() => {
              if (view === "mine" || isTeacher) void refetchMyCourses();
              else void refetchAllCourses();
            }}>Reintentar</Button>
          </Card>
        ) : filteredCourses && filteredCourses.length > 0 ? (
          <>
            {view === "all" && !isTeacher && (
              <p className="text-sm text-muted-foreground">
                {filteredCourses.filter((c) => !enrolledIds.has(c.id)).length} cursos disponibles
              </p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  enrolled={enrolledIds.has(course.id)}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg">
              {searchQuery.trim()
                ? "No hay resultados"
                : view === "mine"
                ? isTeacher
                  ? "No has creado cursos aún"
                  : "No estás inscrito en ningún curso"
                : "No hay cursos disponibles"}
            </h3>
            <p className="text-sm text-muted-foreground mt-1 text-center max-w-sm">
              {searchQuery.trim()
                ? "Prueba con otro nombre de curso, asignatura o docente."
                : view === "mine"
                ? isTeacher
                  ? 'Crea tu primer curso con "Nuevo curso"'
                  : 'Ve a "Explorar" para inscribirte en cursos disponibles'
                : "Los profesores aún no han publicado cursos"}
            </p>
            {!searchQuery.trim() && isTeacher ? (
              <Button className="mt-4" onClick={() => setShowCreate(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Crear primer curso
              </Button>
            ) : !searchQuery.trim() && view === "mine" ? (
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
