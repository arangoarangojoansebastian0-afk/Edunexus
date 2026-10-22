import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { Link } from "wouter";
import { Award, BookOpen, ClipboardCheck, ExternalLink, MessageSquare, TrendingUp } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface StudentGrade {
  id: string;
  grade: string;
  notes: string | null;
  updatedAt: string;
  subjectName: string;
  periodName: string;
}

interface TeacherGradeRow {
  id: string;
  courseId: string;
  courseName: string;
  activityId: string;
  activityTitle: string;
  maxScore: number;
  studentId: string;
  studentName: string;
  grade: string | null;
  feedback: string | null;
  submittedAt: string;
  status: string;
}

interface TeacherGradebookWorkspace {
  academicYear: { id: string; year: number } | null;
  assignments: { groupId: string; groupName: string; gradeName: string; subjectId: string; subjectName: string }[];
  periods: { id: string; name: string; isActive: boolean | null }[];
  students: { groupId: string; studentId: string; firstName: string | null; lastName: string | null }[];
  entries: { id: string; groupId: string; subjectId: string; academicPeriodId: string; studentId: string; grade: string; notes: string | null }[];
}

function TeacherGradebook() {
  const { toast } = useToast();
  const [selectedAssignmentKey, setSelectedAssignmentKey] = useState("");
  const [selectedPeriodId, setSelectedPeriodId] = useState("");
  const [draftGrades, setDraftGrades] = useState<Record<string, string>>({});
  const workspaceQuery = useQuery<TeacherGradebookWorkspace>({
    queryKey: ["/api/gradebook/teacher/workspace"],
  });
  const workspace = workspaceQuery.data;
  const assignments = workspace?.assignments || [];
  const assignmentKey = (assignment: TeacherGradebookWorkspace["assignments"][number]) => `${assignment.groupId}:${assignment.subjectId}`;
  const selectedAssignment = assignments.find((assignment) => assignmentKey(assignment) === selectedAssignmentKey) || assignments[0];
  const period = workspace?.periods.find((item) => item.id === selectedPeriodId)
    || workspace?.periods.find((item) => item.isActive)
    || workspace?.periods[0];
  const students = (workspace?.students || []).filter((row) => row.groupId === selectedAssignment?.groupId);

  const saveGrade = useMutation({
    mutationFn: (input: { studentId: string; grade: string; draftKey: string }) => apiRequest("POST", "/api/gradebook/teacher/workspace", {
      studentId: input.studentId,
      groupId: selectedAssignment!.groupId,
      subjectId: selectedAssignment!.subjectId,
      academicPeriodId: period!.id,
      grade: input.grade,
    }),
    onSuccess: async (_saved, input) => {
      await queryClient.invalidateQueries({ queryKey: ["/api/gradebook/teacher/workspace"] });
      setDraftGrades((previous) => { const next = { ...previous }; delete next[input.draftKey]; return next; });
      toast({ title: "Calificación guardada", description: "La nota quedó asociada al grupo, materia y periodo seleccionados." });
    },
    onError: (error: Error) => toast({ title: "No se pudo guardar la calificación", description: error.message, variant: "destructive" }),
  });

  return (
    <Card>
      <CardHeader><CardTitle className="flex items-center gap-2"><BookOpen className="h-4 w-4" />Libro de calificaciones por periodo</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {workspaceQuery.isLoading ? <Skeleton className="h-32 w-full" /> : workspaceQuery.isError ? (
          <EmptyState icon={Award} title="No se pudo cargar el libro docente" description="Intenta recargar el espacio de calificaciones." action={{ label: "Reintentar", onClick: () => void workspaceQuery.refetch() }} />
        ) : assignments.length === 0 ? (
          <EmptyState icon={BookOpen} title="No tienes asignaturas asignadas para calificar" description="Cuando coordinación te asigne materias y grupos del año activo aparecerán aquí." />
        ) : !workspace?.academicYear ? (
          <EmptyState icon={BookOpen} title="No hay un año académico activo" description="La institución debe activar el año académico para habilitar el libro docente." />
        ) : workspace.periods.length === 0 ? (
          <EmptyState icon={BookOpen} title="El año activo no tiene periodos" description="Solicita a coordinación que configure los periodos académicos." />
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <Select value={selectedAssignment ? assignmentKey(selectedAssignment) : ""} onValueChange={setSelectedAssignmentKey}>
                <SelectTrigger aria-label="Selecciona grupo y asignatura"><SelectValue placeholder="Grupo y asignatura" /></SelectTrigger>
                <SelectContent>{assignments.map((item) => <SelectItem key={assignmentKey(item)} value={assignmentKey(item)}>{item.gradeName} · {item.groupName} · {item.subjectName}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={period?.id || ""} onValueChange={setSelectedPeriodId}>
                <SelectTrigger aria-label="Selecciona el periodo académico"><SelectValue placeholder="Periodo académico" /></SelectTrigger>
                <SelectContent>{workspace.periods.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}{item.isActive ? " · Activo" : ""}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <p className="text-xs text-muted-foreground">Año {workspace.academicYear.year}. Las notas solo se guardan para estudiantes matriculados y asignaciones que tienes autorizadas.</p>
            {students.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">No hay estudiantes matriculados en este grupo para el año activo.</p> : (
              <div className="space-y-2">
                {students.map((student) => {
                  const current = workspace.entries.find((entry) => entry.studentId === student.studentId && entry.groupId === selectedAssignment?.groupId && entry.subjectId === selectedAssignment?.subjectId && entry.academicPeriodId === period?.id);
                  const draftKey = `${selectedAssignment?.groupId}:${selectedAssignment?.subjectId}:${period?.id}:${student.studentId}`;
                  const draft = draftGrades[draftKey] ?? current?.grade ?? "";
                  return <div key={student.studentId} className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[minmax(0,1fr)_minmax(100px,150px)_auto] sm:items-center">
                    <div><p className="text-sm font-medium">{[student.firstName, student.lastName].filter(Boolean).join(" ") || "Estudiante"}</p><p className="text-xs text-muted-foreground">{current ? `Nota actual: ${current.grade}` : "Sin nota registrada"}{current?.notes ? ` · ${current.notes}` : ""}</p></div>
                    <Input aria-label={`Nota de ${[student.firstName, student.lastName].filter(Boolean).join(" ")}`} value={draft} maxLength={50} onChange={(event) => setDraftGrades((previous) => ({ ...previous, [draftKey]: event.target.value }))} placeholder="Nota" />
                    <Button size="sm" disabled={!draft.trim() || draft === current?.grade || saveGrade.isPending || !selectedAssignment || !period} onClick={() => saveGrade.mutate({ studentId: student.studentId, grade: draft.trim(), draftKey })}>{saveGrade.isPending ? "Guardando…" : current ? "Actualizar" : "Guardar"}</Button>
                  </div>;
                })}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function numeric(value: string | null | undefined) {
  if (!value) return null;
  const normalized = value.replace(",", ".").trim();
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

export default function Grades() {
  const { user } = useAuth();
  const isStudent = user?.role === "student";
  const isTeacher = user?.role === "teacher";
  const isStaff = ["admin", "director", "coordinator", "secretary", "super_admin"].includes(user?.role || "");
  const pageTitle = isTeacher ? "Calificaciones y entregas" : "Calificaciones";

  const studentQuery = useQuery<StudentGrade[]>({
    queryKey: ["/api/gradebook/me"],
    enabled: isStudent,
  });
  const teacherQuery = useQuery<TeacherGradeRow[]>({
    queryKey: ["/api/gradebook/teacher"],
    enabled: isTeacher,
  });

  const studentAverage = useMemo(() => {
    const values = (studentQuery.data || []).map((row) => numeric(row.grade)).filter((v): v is number => v !== null);
    if (!values.length) return null;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }, [studentQuery.data]);

  const subjectGroups = useMemo(() => {
    const map = new Map<string, StudentGrade[]>();
    for (const row of studentQuery.data || []) {
      const list = map.get(row.subjectName) || [];
      list.push(row);
      map.set(row.subjectName, list);
    }
    return Array.from(map.entries()).map(([subject, rows]) => {
      const values = rows.map((r) => numeric(r.grade)).filter((v): v is number => v !== null);
      return { subject, rows, average: values.length ? values.reduce((a, b) => a + b, 0) / values.length : null };
    });
  }, [studentQuery.data]);

  const teacherStats = useMemo(() => {
    const rows = teacherQuery.data || [];
    const graded = rows.filter((r) => numeric(r.grade) !== null);
    const pending = rows.filter((r) => !r.grade || r.status === "submitted");
    return {
      submissions: rows.length,
      graded: graded.length,
      pending: pending.length,
      average: graded.length ? graded.reduce((sum, row) => sum + (numeric(row.grade) || 0), 0) / graded.length : null,
    };
  }, [teacherQuery.data]);

  if (isStaff) {
    return (
      <AppLayout title="Calificaciones">
        <div className="mx-auto max-w-4xl p-4 md:p-6">
          <Card>
            <CardHeader><CardTitle>Gestión de calificaciones</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">Las herramientas institucionales de calificación están disponibles en el panel de administración.</p>
              <Button asChild><Link href="/admin">Abrir administración <ExternalLink className="ml-2 h-4 w-4" /></Link></Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  const query = isStudent ? studentQuery : teacherQuery;
  if (query.isLoading) {
    return <AppLayout title={pageTitle}><div className="mx-auto max-w-6xl p-4 md:p-6 space-y-4"><Skeleton className="h-28 w-full" /><div className="grid md:grid-cols-2 gap-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-36 w-full" />)}</div></div></AppLayout>;
  }

  if (query.isError) {
    return <AppLayout title={pageTitle}><div className="mx-auto max-w-4xl p-4 md:p-6"><EmptyState icon={Award} title="No se pudieron cargar las calificaciones" description="Comprueba tu conexión e inténtalo de nuevo." action={{ label: "Reintentar", onClick: () => void query.refetch() }} /></div></AppLayout>;
  }

  return (
    <AppLayout title={pageTitle}>
      <div className="mx-auto max-w-6xl p-4 md:p-6 space-y-6">
        {isStudent ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Registros</p><p className="text-2xl font-semibold mt-1">{studentQuery.data?.length || 0}</p></CardContent></Card>
              <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Promedio</p><p className="text-2xl font-semibold mt-1">{studentAverage === null ? "—" : studentAverage.toFixed(2)}</p></CardContent></Card>
              <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Asignaturas</p><p className="text-2xl font-semibold mt-1">{subjectGroups.length}</p></CardContent></Card>
              <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Última actualización</p><p className="text-sm font-medium mt-2">{studentQuery.data?.[0] ? new Date(studentQuery.data[0].updatedAt).toLocaleDateString("es-CO") : "—"}</p></CardContent></Card>
            </div>
            {subjectGroups.length === 0 ? <EmptyState icon={Award} title="Todavía no tienes calificaciones" description="Cuando tus docentes registren notas aparecerán aquí." /> : (
              <div className="grid md:grid-cols-2 gap-4">
                {subjectGroups.map((group) => (
                  <Card key={group.subject}>
                    <CardHeader className="pb-3"><CardTitle className="text-base flex items-center justify-between gap-2"><span className="flex items-center gap-2"><BookOpen className="h-4 w-4" />{group.subject}</span><Badge variant="secondary">{group.average === null ? "Sin promedio" : group.average.toFixed(2)}</Badge></CardTitle></CardHeader>
                    <CardContent className="space-y-2">
                      {group.rows.map((row) => <div key={row.id} className="rounded-lg border p-3"><div className="flex items-center justify-between gap-3"><span className="text-sm font-medium">{row.periodName}</span><Badge>{row.grade}</Badge></div>{row.notes && <p className="mt-1 text-xs text-muted-foreground">{row.notes}</p>}</div>)}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <TeacherGradebook />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Entregas recibidas</p><p className="text-2xl font-semibold mt-1">{teacherStats.submissions}</p></CardContent></Card>
              <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Calificadas</p><p className="text-2xl font-semibold mt-1">{teacherStats.graded}</p></CardContent></Card>
              <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Pendientes</p><p className="text-2xl font-semibold mt-1">{teacherStats.pending}</p></CardContent></Card>
              <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Promedio registrado</p><p className="text-2xl font-semibold mt-1">{teacherStats.average === null ? "—" : teacherStats.average.toFixed(2)}</p></CardContent></Card>
            </div>
            {!teacherQuery.data?.length ? <EmptyState icon={ClipboardCheck} title="No hay entregas para revisar" description="Las entregas de tus cursos aparecerán aquí." /> : (
              <Card><CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-4 w-4" />Entregas y calificaciones</CardTitle></CardHeader><CardContent className="space-y-2">
                {teacherQuery.data.map((row) => <div key={row.id} className="grid gap-2 rounded-lg border p-3 md:grid-cols-[1.2fr_1.2fr_1fr_auto] md:items-center"><div><p className="font-medium text-sm">{row.activityTitle}</p><p className="text-xs text-muted-foreground">{row.courseName}</p></div><div><p className="text-sm">{row.studentName}</p><p className="text-xs text-muted-foreground">{new Date(row.submittedAt).toLocaleDateString("es-CO")}</p></div><div>{row.feedback ? <p className="text-xs text-muted-foreground flex items-start gap-1"><MessageSquare className="h-3.5 w-3.5 mt-0.5 shrink-0" />{row.feedback}</p> : <span className="text-xs text-muted-foreground">Sin retroalimentación</span>}</div><Badge variant={row.grade ? "default" : "secondary"}>{row.grade ? `${row.grade}/${row.maxScore}` : "Pendiente"}</Badge></div>)}
              </CardContent></Card>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
