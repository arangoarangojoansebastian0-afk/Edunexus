import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CalendarCheck, Check, ClipboardList, GraduationCap, MessageSquareText, ShieldAlert } from "lucide-react";

type Year = { id: string; year: number; startDate: string | null; isActive: boolean };
type Review = { id: string; teacherId: string; teacherName: string; recommendation: string; notes: string };
type PromotionCase = {
  enrollment: any;
  student: { id: string; firstName: string | null; lastName: string | null; email: string | null };
  group: { id: string; name: string; gradeName: string; gradeLevel: number };
  requiredTeachers: { id: string; name: string; submitted: boolean }[];
  reviews: Review[];
  consensus: string | null;
  allTeachersSubmitted: boolean;
  grades: { grade: string; subjectName: string; periodName: string; notes: string | null }[];
  attendance: { present: number; absent: number; late: number; other: number; records: any[] };
  observations: { id: string; type: string; severity: string | null; title: string; description: string; createdAt: string; teacherName: string; teacherLastName: string | null }[];
  existingCommitments: { academic: string | null; coexistence: string | null; observation: string | null; disciplinaryStatus: string | null };
  decision: any | null;
};
type PromotionData = { years: Year[]; sourceYear: Year | null; targetYear: Year | null; reviewOpen: boolean; cases: PromotionCase[] };
type AcademicGroup = { id: string; name: string; gradeName?: string; grade?: { name: string; level: number }; gradeLevel?: number };

const recommendationLabel: Record<string, string> = { promote: "Promover", repeat: "Mantener en el grado", review: "Requiere revisión adicional" };

export default function Promotions() {
  const { user } = useAuth();
  const isLeadership = ["admin", "director", "coordinator", "super_admin"].includes(user?.role || "");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const yearsQuery = useQuery<{ years: Year[] }>({ queryKey: ["/api/promotions?meta=1"] });
  const [yearId, setYearId] = useState("");
  const selectedYearId = yearId || yearsQuery.data?.years?.find((year) => year.isActive)?.id || yearsQuery.data?.years?.at(-1)?.id || "";
  const promotionQuery = useQuery<PromotionData>({ queryKey: [`/api/promotions?yearId=${selectedYearId}`], enabled: !!selectedYearId });
  const groupsQuery = useQuery<AcademicGroup[]>({ queryKey: ["/api/admin/academic-groups"], enabled: isLeadership });

  const refresh = async () => {
    await queryClient.invalidateQueries({ predicate: (query) => String(query.queryKey[0]).startsWith("/api/promotions") });
  };

  return (
    <AppLayout title="Promoción anual">
      <main className="mx-auto max-w-6xl space-y-5 p-4 md:p-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-primary"><GraduationCap className="h-5 w-5" /><span className="text-sm font-medium">Cierre y transición académica</span></div>
            <h1 className="text-2xl font-bold">Revisión de promoción anual</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">La decisión considera el proceso integral del estudiante. Cada docente asignado aporta su recomendación y dirección registra la resolución final.</p>
          </div>
          <div className="w-full sm:w-56">
            <label className="mb-1 block text-xs text-muted-foreground">Año que se revisa</label>
            <Select value={selectedYearId} onValueChange={setYearId}>
              <SelectTrigger><SelectValue placeholder="Seleccionar año" /></SelectTrigger>
              <SelectContent>{(yearsQuery.data?.years || []).map((year) => <SelectItem key={year.id} value={year.id}>{year.year}{year.isActive ? " · Activo" : ""}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </header>

        {!selectedYearId && <Alert><CalendarCheck className="h-4 w-4" /><AlertTitle>Faltan años académicos</AlertTitle><AlertDescription>La institución debe configurar el año que se revisará y el siguiente año con su fecha de inicio.</AlertDescription></Alert>}
        {yearsQuery.isError && <Alert variant="destructive"><ShieldAlert className="h-4 w-4" /><AlertTitle>No se pudieron cargar los años académicos</AlertTitle><AlertDescription>Comprueba tu acceso institucional e inténtalo de nuevo.</AlertDescription></Alert>}
        {promotionQuery.isLoading && <Card><CardContent className="p-6 text-sm text-muted-foreground">Cargando expedientes...</CardContent></Card>}
        {promotionQuery.isError && <Alert variant="destructive"><ShieldAlert className="h-4 w-4" /><AlertTitle>No se pudo cargar la revisión</AlertTitle><AlertDescription>Comprueba que tu cuenta tenga institución asignada e inténtalo de nuevo.</AlertDescription></Alert>}
        {promotionQuery.data && (
          <>
            <Alert variant={promotionQuery.data.reviewOpen ? "default" : "destructive"}>
              <CalendarCheck className="h-4 w-4" />
              <AlertTitle>{promotionQuery.data.reviewOpen ? "Periodo de revisión abierto" : "Periodo de revisión cerrado"}</AlertTitle>
              <AlertDescription>
                {promotionQuery.data.targetYear
                ? `Año destino ${promotionQuery.data.targetYear.year}. La revisión se habilita desde ${promotionQuery.data.targetYear.startDate ? new Date(`${String(promotionQuery.data.targetYear.startDate).slice(0, 10)}T00:00:00Z`).toLocaleDateString("es-CO", { timeZone: "UTC" }) : "una fecha por configurar"}, definida por tu institución.`
                  : `Crea el año académico ${((promotionQuery.data.sourceYear?.year || 0) + 1)} en el panel institucional y configura su fecha de inicio para abrir el periodo.`}
              </AlertDescription>
            </Alert>
            {promotionQuery.data.cases.length === 0 ? (
              <Card><CardContent className="p-8 text-center"><ClipboardList className="mx-auto mb-3 h-8 w-8 text-muted-foreground" /><p className="font-medium">No hay estudiantes asignados para revisar</p><p className="mt-1 text-sm text-muted-foreground">Aparecerán los estudiantes matriculados en el año seleccionado.</p></CardContent></Card>
            ) : promotionQuery.data.cases.map((item) => (
              <PromotionStudentCard key={item.enrollment.id} item={item} sourceYear={promotionQuery.data!.sourceYear!} targetYear={promotionQuery.data!.targetYear} reviewOpen={promotionQuery.data!.reviewOpen} isLeadership={isLeadership} groups={groupsQuery.data || []} refresh={refresh} toast={toast} />
            ))}
          </>
        )}
      </main>
    </AppLayout>
  );
}

function PromotionStudentCard({ item, sourceYear, targetYear, reviewOpen, isLeadership, groups, refresh, toast }: {
  item: PromotionCase; sourceYear: Year; targetYear: Year | null; reviewOpen: boolean; isLeadership: boolean; groups: AcademicGroup[];
  refresh: () => Promise<void>; toast: ReturnType<typeof useToast>["toast"];
}) {
  const { user } = useAuth();
  const myReview = item.reviews.find((review) => review.teacherId === user?.id);
  const isFinalDecision = !!item.decision && item.decision.outcome !== "defer";
  const [recommendation, setRecommendation] = useState(myReview?.recommendation || "");
  const [teacherNotes, setTeacherNotes] = useState(myReview?.notes || "");
  const [outcome, setOutcome] = useState("");
  const [targetGroupId, setTargetGroupId] = useState("");
  const [decisionNotes, setDecisionNotes] = useState("");
  const sourceLevel = item.group.gradeLevel;
  const eligibleGroups = useMemo(() => groups.filter((group) => {
    const level = group.grade?.level ?? group.gradeLevel;
    const gradeName = group.grade?.name ?? group.gradeName;
    if (level == null || !gradeName || !sourceLevel) return false;
    return level === sourceLevel + 1 || level === sourceLevel;
  }), [groups, sourceLevel]);

  const recommendationMutation = useMutation({
    mutationFn: () => apiRequest("PUT", `/api/promotions/${item.enrollment.id}/recommendation`, { recommendation, notes: teacherNotes }),
    onSuccess: async () => { toast({ title: "Recomendación guardada", description: "Tu aporte quedó registrado en el expediente." }); await refresh(); },
    onError: (error: Error) => toast({ title: "No se pudo guardar", description: error.message, variant: "destructive" }),
  });
  const decisionMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/promotions/${item.enrollment.id}/decision`, { outcome, targetGroupId: outcome === "defer" ? undefined : targetGroupId, notes: decisionNotes }),
    onSuccess: async () => { toast({ title: "Resolución registrada", description: "La decisión y el historial quedaron guardados." }); await refresh(); },
    onError: (error: Error) => toast({ title: "No se pudo cerrar el caso", description: error.message, variant: "destructive" }),
  });
  const attendanceTotal = item.attendance.present + item.attendance.absent + item.attendance.late + item.attendance.other;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><CardTitle>{item.student.firstName} {item.student.lastName}</CardTitle><p className="mt-1 text-sm text-muted-foreground">{item.group.gradeName} · {item.group.name} · Año {sourceYear.year}{item.student.email ? ` · ${item.student.email}` : ""}</p></div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{item.requiredTeachers.filter((teacher) => teacher.submitted).length}/{item.requiredTeachers.length} docentes</Badge>
            {item.consensus && <Badge>{item.consensus === "promote" ? "Consenso: promover" : "Consenso: mantener"}</Badge>}
            {item.decision && <Badge variant="secondary">{isFinalDecision ? (item.decision.outcome === "promote" ? "Promovido" : "Permanece en el grado") : "Revisión aplazada"}</Badge>}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <section>
          <h3 className="mb-2 text-sm font-semibold">Aportes de docentes asignados</h3>
          <div className="flex flex-wrap gap-2">{item.requiredTeachers.map((teacher) => <Badge key={teacher.id} variant={teacher.submitted ? "default" : "outline"}>{teacher.submitted ? <Check className="mr-1 h-3 w-3" /> : null}{teacher.name || "Docente"}</Badge>)}</div>
          {item.reviews.length > 0 && <div className="mt-3 grid gap-2 md:grid-cols-2">{item.reviews.map((review) => <div key={review.id} className="rounded-lg border p-3 text-sm"><p className="font-medium">{review.teacherName} · {recommendationLabel[review.recommendation]}</p><p className="mt-1 whitespace-pre-wrap text-muted-foreground">{review.notes}</p></div>)}</div>}
        </section>

        <section className="grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border p-3"><h3 className="mb-2 text-sm font-semibold">Notas registradas ({item.grades.length})</h3>{item.grades.length ? <ul className="space-y-1 text-sm">{item.grades.map((grade, index) => <li key={`${grade.subjectName}-${grade.periodName}-${index}`} className="flex justify-between gap-3"><span>{grade.subjectName} · {grade.periodName}</span><strong>{grade.grade}</strong></li>)}</ul> : <p className="text-sm text-muted-foreground">No hay notas cargadas en el año.</p>}</div>
          <div className="rounded-lg border p-3"><h3 className="mb-2 text-sm font-semibold">Asistencia ({attendanceTotal} registros)</h3><p className="text-sm text-muted-foreground">Asistencias: {item.attendance.present} · Ausencias: {item.attendance.absent} · Llegadas tarde: {item.attendance.late} · Otros: {item.attendance.other}</p>{item.attendance.records.length > 0 && <details className="mt-2 text-sm"><summary className="cursor-pointer text-primary">Ver todos los registros</summary><div className="mt-2 max-h-48 space-y-1 overflow-y-auto">{item.attendance.records.map((record: any, index: number) => <p key={`${record.date}-${index}`} className="text-muted-foreground">{new Date(record.date).toLocaleDateString("es-CO")} · {record.status}{record.notes ? ` · ${record.notes}` : ""}</p>)}</div></details>}</div>
        </section>

        <section className="rounded-lg border p-3"><h3 className="mb-2 text-sm font-semibold">Comportamiento, observaciones y compromisos</h3>
          <div className="grid gap-3 text-sm md:grid-cols-2"><div className="space-y-2">{item.existingCommitments.disciplinaryStatus && <p><strong>Estado de convivencia:</strong> {item.existingCommitments.disciplinaryStatus}</p>}{item.existingCommitments.academic && <p><strong>Compromiso académico:</strong> {item.existingCommitments.academic}</p>}{item.existingCommitments.coexistence && <p><strong>Compromiso de convivencia:</strong> {item.existingCommitments.coexistence}</p>}{item.existingCommitments.observation && <p><strong>Observación académica:</strong> {item.existingCommitments.observation}</p>}{!item.existingCommitments.disciplinaryStatus && !item.existingCommitments.academic && !item.existingCommitments.coexistence && !item.existingCommitments.observation && <p className="text-muted-foreground">No hay compromisos previos registrados.</p>}</div>
            <div className="max-h-64 space-y-2 overflow-y-auto">{item.observations.length ? item.observations.map((observation) => <div key={observation.id} className="border-l-2 pl-2"><p className="font-medium">{observation.title} · {observation.type}</p><p className="text-muted-foreground">{observation.description}</p><p className="text-xs text-muted-foreground">{observation.teacherName} {observation.teacherLastName || ""} · {new Date(observation.createdAt).toLocaleDateString("es-CO")}</p></div>) : <p className="text-muted-foreground">No hay observaciones registradas en el año.</p>}</div>
          </div>
        </section>

        {!isLeadership && !isFinalDecision && (
          <section className="space-y-3 rounded-lg bg-muted/40 p-3">
            <div className="flex items-center gap-2 text-sm font-semibold"><MessageSquareText className="h-4 w-4" />Tu recomendación</div>
            {!reviewOpen ? <p className="text-sm text-muted-foreground">Podrás registrar tu recomendación cuando abra el periodo anual.</p> : <>
              <Select value={recommendation} onValueChange={setRecommendation}><SelectTrigger><SelectValue placeholder="Selecciona tu recomendación" /></SelectTrigger><SelectContent><SelectItem value="promote">Promover al grado siguiente</SelectItem><SelectItem value="repeat">Mantener en el grado actual</SelectItem><SelectItem value="review">Requiere revisión adicional</SelectItem></SelectContent></Select>
              <Textarea value={teacherNotes} onChange={(event) => setTeacherNotes(event.target.value)} placeholder="Justifica tu recomendación con base en el proceso integral del estudiante..." rows={3} />
              <Button disabled={!recommendation || teacherNotes.trim().length < 5 || recommendationMutation.isPending} onClick={() => recommendationMutation.mutate()}>{recommendationMutation.isPending ? "Guardando..." : myReview ? "Actualizar mi recomendación" : "Registrar recomendación"}</Button>
            </>}
          </section>
        )}

        {isLeadership && !isFinalDecision && (
          <section className="space-y-3 rounded-lg bg-muted/40 p-3">
            <div className="flex items-center gap-2 text-sm font-semibold"><ShieldAlert className="h-4 w-4" />Resolución de directivos</div>
            {!reviewOpen ? <p className="text-sm text-muted-foreground">La institución debe esperar hasta la fecha configurada para abrir la revisión.</p> : <>
              {!item.allTeachersSubmitted && <p className="text-sm text-amber-700 dark:text-amber-300">Faltan recomendaciones de docentes. Puedes dejar el caso en revisión diferida; no se cambiará la matrícula.</p>}
              {item.allTeachersSubmitted && !item.consensus && <p className="text-sm text-amber-700 dark:text-amber-300">No hay acuerdo unánime. El caso requiere diálogo o una revisión diferida.</p>}
              <Select value={outcome} onValueChange={setOutcome}><SelectTrigger><SelectValue placeholder="Decisión final" /></SelectTrigger><SelectContent><SelectItem value="promote" disabled={item.consensus !== "promote"}>Aprobar promoción</SelectItem><SelectItem value="repeat" disabled={item.consensus !== "repeat"}>Mantener en el grado</SelectItem><SelectItem value="defer">Aplazar y continuar revisión</SelectItem></SelectContent></Select>
              {(outcome === "promote" || outcome === "repeat") && <Select value={targetGroupId} onValueChange={setTargetGroupId}><SelectTrigger><SelectValue placeholder={`Grupo destino · ${targetYear?.year || "próximo año"}`} /></SelectTrigger><SelectContent>{eligibleGroups.filter((group) => {
                const level = group.grade?.level ?? group.gradeLevel;
                return outcome === "promote" ? level === sourceLevel + 1 : level === sourceLevel;
              }).map((group) => <SelectItem key={group.id} value={group.id}>{group.grade?.name ?? group.gradeName} · {group.name}</SelectItem>)}</SelectContent></Select>}
              <Textarea value={decisionNotes} onChange={(event) => setDecisionNotes(event.target.value)} placeholder="Acta o justificación de la decisión directiva..." rows={3} />
              <Button disabled={!outcome || decisionNotes.trim().length < 5 || (outcome !== "defer" && !targetGroupId) || decisionMutation.isPending} onClick={() => decisionMutation.mutate()}>{decisionMutation.isPending ? "Guardando..." : "Guardar resolución"}</Button>
            </>}
          </section>
        )}

        {isFinalDecision && <div className="rounded-lg border border-primary/30 p-3 text-sm"><div className="flex items-center gap-2 font-semibold"><CalendarCheck className="h-4 w-4" />Resolución directiva</div><p className="mt-1 text-muted-foreground">{item.decision.notes}</p></div>}
        {item.decision?.outcome === "defer" && <div className="rounded-lg border border-amber-500/30 p-3 text-sm"><div className="font-semibold">Caso aplazado para continuar la revisión</div><p className="mt-1 text-muted-foreground">{item.decision.notes}</p></div>}
      </CardContent>
    </Card>
  );
}
