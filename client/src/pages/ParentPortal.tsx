import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/EmptyState";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Users2, Plus, GraduationCap, CalendarCheck, MessageSquareWarning, Loader2 } from "lucide-react";

interface Child {
  linkId: string;
  studentId: string;
  firstName: string;
  lastName: string;
  grade: string | null;
  profileImageUrl: string | null;
}

export default function ParentPortal() {
  const { toast } = useToast();
  const [addEmail, setAddEmail] = useState("");
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

  const { data: children, isLoading } = useQuery<Child[]>({
    queryKey: ["/api/parent/children"],
  });

  const addChildMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/parent/link-requests", { studentEmail: addEmail });
    },
    onSuccess: () => {
      toast({ title: "Solicitud enviada", description: "Quedará pendiente hasta que el estudiante o el colegio la aprueben." });
      setAddEmail("");
      queryClient.invalidateQueries({ queryKey: ["/api/parent/children"] });
    },
    onError: (e: Error) => {
      const msg = /^\d+:\s*(.*)$/.exec(e.message)?.[1];
      let clean = e.message;
      if (msg) { try { clean = JSON.parse(msg).message || clean; } catch { clean = msg; } }
      toast({ title: "No se pudo enviar la solicitud", description: clean, variant: "destructive" });
    },
  });

  const activeChild = children?.find((c) => c.studentId === selectedChildId) || children?.[0];

  return (
    <AppLayout title="Portal de padres">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users2 className="h-6 w-6" /> Mis hijos
          </h1>
          <p className="text-sm text-muted-foreground">Sigue las notas, asistencia y observaciones de tus hijos vinculados.</p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Agregar otro hijo/a</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="Correo con el que está registrado"
                value={addEmail}
                onChange={(e) => setAddEmail(e.target.value)}
              />
              <Button
                onClick={() => addChildMutation.mutate()}
                disabled={!addEmail.trim() || addChildMutation.isPending}
                className="gap-1.5 shrink-0"
              >
                {addChildMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Enviar solicitud
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Quedará pendiente hasta que el estudiante (o el colegio) apruebe el vínculo.
            </p>
          </CardContent>
        </Card>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Cargando...</p>
        ) : !children?.length ? (
          <EmptyState
            icon={Users2}
            title="Todavía no tienes hijos vinculados"
            description="Envía una solicitud arriba con el correo de tu hijo/a para empezar a ver su información."
          />
        ) : (
          <>
            {children.length > 1 && (
              <div className="flex gap-2 flex-wrap">
                {children.map((c) => (
                  <button
                    key={c.studentId}
                    onClick={() => setSelectedChildId(c.studentId)}
                    className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                      activeChild?.studentId === c.studentId ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"
                    }`}
                  >
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={c.profileImageUrl || undefined} />
                      <AvatarFallback className="text-[10px]">{c.firstName[0]}{c.lastName[0]}</AvatarFallback>
                    </Avatar>
                    {c.firstName} {c.lastName}
                  </button>
                ))}
              </div>
            )}

            {activeChild && <ChildDetail child={activeChild} />}
          </>
        )}
      </div>
    </AppLayout>
  );
}

function ChildDetail({ child }: { child: Child }) {
  const [periodId, setPeriodId] = useState<string>("");

  const { data: periods } = useQuery<{ id: string; name: string }[]>({
    queryKey: [`/api/parent/children/${child.studentId}/periods`],
  });

  const activePeriodId = periodId || periods?.[periods.length - 1]?.id || "";

  const { data: reportCard, isLoading: loadingGrades } = useQuery<any[]>({
    queryKey: [`/api/parent/children/${child.studentId}/report-card/${activePeriodId}`],
    enabled: !!activePeriodId,
  });

  const { data: attendance, isLoading: loadingAttendance } = useQuery<any[]>({
    queryKey: [`/api/parent/children/${child.studentId}/attendance`],
  });

  const { data: observations, isLoading: loadingObs } = useQuery<any[]>({
    queryKey: [`/api/parent/children/${child.studentId}/observations`],
  });

  const presentCount = attendance?.filter((a) => a.status === "present").length ?? 0;
  const totalAttendance = attendance?.length ?? 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-3 pb-3">
        <Avatar className="h-12 w-12">
          <AvatarImage src={child.profileImageUrl || undefined} />
          <AvatarFallback>{child.firstName[0]}{child.lastName[0]}</AvatarFallback>
        </Avatar>
        <div>
          <CardTitle className="text-lg">{child.firstName} {child.lastName}</CardTitle>
          {child.grade && <p className="text-sm text-muted-foreground">{child.grade}</p>}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="grades">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="grades" className="gap-1.5"><GraduationCap className="h-3.5 w-3.5" /> Notas</TabsTrigger>
            <TabsTrigger value="attendance" className="gap-1.5"><CalendarCheck className="h-3.5 w-3.5" /> Asistencia</TabsTrigger>
            <TabsTrigger value="observations" className="gap-1.5"><MessageSquareWarning className="h-3.5 w-3.5" /> Observador</TabsTrigger>
          </TabsList>

          <TabsContent value="grades" className="space-y-3 pt-4">
            {periods && periods.length > 0 && (
              <Select value={activePeriodId} onValueChange={setPeriodId}>
                <SelectTrigger className="w-full sm:w-64">
                  <SelectValue placeholder="Selecciona un periodo" />
                </SelectTrigger>
                <SelectContent>
                  {periods.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {loadingGrades ? (
              <p className="text-sm text-muted-foreground">Cargando...</p>
            ) : !reportCard?.length ? (
              <p className="text-sm text-muted-foreground py-4">No hay calificaciones registradas en este periodo todavía.</p>
            ) : (
              <div className="divide-y rounded-lg border">
                {reportCard.map((entry: any) => (
                  <div key={entry.id} className="flex items-center justify-between px-3 py-2">
                    <span className="text-sm">{entry.subject?.name}</span>
                    <Badge variant="outline">{entry.grade ?? "—"}</Badge>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="attendance" className="space-y-3 pt-4">
            {loadingAttendance ? (
              <p className="text-sm text-muted-foreground">Cargando...</p>
            ) : !attendance?.length ? (
              <p className="text-sm text-muted-foreground py-4">No hay registros de asistencia todavía.</p>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  {presentCount} de {totalAttendance} registros como presente (últimos {totalAttendance}).
                </p>
                <div className="divide-y rounded-lg border max-h-80 overflow-y-auto">
                  {attendance.map((a: any) => (
                    <div key={a.id} className="flex items-center justify-between px-3 py-2 text-sm">
                      <span>{a.courseName} — {format(new Date(a.date), "d 'de' MMMM", { locale: es })}</span>
                      <Badge variant={a.status === "present" ? "default" : "destructive"}>
                        {a.status === "present" ? "Presente" : a.status === "late" ? "Tarde" : a.status === "excused" ? "Excusado" : "Ausente"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="observations" className="space-y-3 pt-4">
            {loadingObs ? (
              <p className="text-sm text-muted-foreground">Cargando...</p>
            ) : !observations?.length ? (
              <p className="text-sm text-muted-foreground py-4">No hay anotaciones en el observador todavía.</p>
            ) : (
              <div className="space-y-2">
                {(() => {
                  const typeConfig: Record<string, { label: string; variant: any }> = {
                    positive: { label: "Positiva", variant: "default" },
                    negative: { label: "Negativa", variant: "destructive" },
                    commitment: { label: "Compromiso", variant: "outline" },
                    followup: { label: "Seguimiento", variant: "secondary" },
                  };
                  return observations.map((o: any) => (
                    <div key={o.id} className="rounded-lg border p-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <Badge variant={typeConfig[o.type]?.variant || "outline"}>
                          {typeConfig[o.type]?.label || o.type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(o.createdAt), "d MMM yyyy", { locale: es })}
                        </span>
                      </div>
                      <p className="text-sm font-medium">{o.title}</p>
                      <p className="text-sm text-muted-foreground">{o.description}</p>
                    </div>
                  ));
                })()}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
