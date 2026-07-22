import { useState, useEffect, Component, type ReactNode } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getFullName, getInitials } from "@/lib/authUtils";
import { useLocation } from "wouter";
import {
  LayoutDashboard, School, Settings2, BookOpen, GraduationCap,
  Users, UserCheck, ClipboardList, Calendar, Key, BarChart2,
  Clock, Eye, BookMarked, Plus, Trash2, Edit, CheckCircle,
  XCircle, Save, RefreshCw, AlertTriangle, TrendingUp,
  UserX, FileText, Bell, Layers, Monitor, Award, Shield, Link2,
} from "lucide-react";
import type { User } from "@shared/schema";
 
// ─── ERROR BOUNDARY ──────────────────────────────────────────────────────────
class TabErrorBoundary extends Component<
  { children: ReactNode; tabId: string },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error) {
    console.error("[Admin tab error]", this.props.tabId, error);
  }
  componentDidUpdate(prevProps: { tabId: string }) {
    if (prevProps.tabId !== this.props.tabId) {
      this.setState({ hasError: false, error: undefined });
    }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
          <AlertTriangle className="h-8 w-8 text-amber-500" />
          <p className="text-sm font-medium">Error al cargar esta sección</p>
          <p className="text-xs max-w-sm text-center opacity-70">
            {this.state.error?.message || "Error desconocido"}
          </p>
          <Button size="sm" variant="outline" onClick={() => this.setState({ hasError: false })}>
            <RefreshCw className="h-3 w-3 mr-1" /> Reintentar
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────
 
function randomCode(prefix: string) {
  return `${prefix}-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
}
 
function StatCard({
  icon: Icon,
  label,
  value,
  color = "text-primary",
  onClick,
}: {
  icon: any;
  label: string;
  value: any;
  color?: string;
  onClick?: () => void;
}) {
  return (
    <Card
      className={onClick ? "cursor-pointer hover:border-primary/50 transition-colors" : ""}
      onClick={onClick}
    >
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`p-2 rounded-lg bg-muted ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-bold leading-none">{value ?? "—"}</p>
          <p className="text-xs text-muted-foreground mt-1">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
 
// ─── DASHBOARD ───────────────────────────────────────────────────────────────
 
function TabDashboard() {
  const { data: stats, isLoading } = useQuery<any>({
    queryKey: ["/api/admin/institutional-stats"],
  });
  const [openPanel, setOpenPanel] = useState<null | "attendance" | "performance" | "atrisk" | "activity">(null);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  const mainStats = [
    { icon: Users, label: "Estudiantes", value: stats?.students, color: "text-blue-600" },
    { icon: UserCheck, label: "Docentes", value: stats?.teachers, color: "text-green-600" },
    { icon: Award, label: "Directivos", value: stats?.staff, color: "text-purple-600" },
    { icon: BookOpen, label: "Materias", value: stats?.subjects, color: "text-orange-600" },
    { icon: GraduationCap, label: "Grados", value: stats?.grades, color: "text-red-600" },
    { icon: Layers, label: "Grupos", value: stats?.groups, color: "text-cyan-600" },
    { icon: ClipboardList, label: "Matrículas", value: stats?.enrollments, color: "text-yellow-600" },
    { icon: Monitor, label: "Cursos Classroom", value: stats?.courses, color: "text-indigo-600" },
    { icon: FileText, label: "Actividades", value: stats?.activities, color: "text-pink-600" },
    { icon: Bell, label: "Observaciones", value: stats?.observations, color: "text-teal-600" },
  ];

  const indicators = [
    {
      panelKey: "attendance" as const,
      label: "Asistencia promedio",
      value: stats?.attendanceRate ? `${stats.attendanceRate}%` : "—",
      icon: CheckCircle,
      color: "text-green-600",
    },
    {
      panelKey: "performance" as const,
      label: "Rendimiento académico",
      value: stats?.avgGrade ?? "—",
      icon: TrendingUp,
      color: "text-blue-600",
    },
    {
      panelKey: "atrisk" as const,
      label: "Estudiantes en riesgo",
      value: stats?.atRisk ?? "—",
      icon: AlertTriangle,
      color: "text-amber-600",
    },
    {
      panelKey: "activity" as const,
      label: "Actividad reciente (7d)",
      value: stats?.recentActivity ?? "—",
      icon: BarChart2,
      color: "text-purple-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Totales institucionales
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {mainStats.map((s) => (
            <StatCard key={s.label} {...s} />
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Indicadores de gestión
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {indicators.map((s) => (
            <StatCard key={s.label} icon={s.icon} label={s.label} value={s.value} color={s.color} onClick={() => setOpenPanel(s.panelKey)} />
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">Haz clic en un indicador para ver el detalle.</p>
      </div>

      <AttendancePanel open={openPanel === "attendance"} onOpenChange={(o) => setOpenPanel(o ? "attendance" : null)} />
      <PerformancePanel open={openPanel === "performance"} onOpenChange={(o) => setOpenPanel(o ? "performance" : null)} />
      <AtRiskPanel open={openPanel === "atrisk"} onOpenChange={(o) => setOpenPanel(o ? "atrisk" : null)} />
      <RecentActivityPanel open={openPanel === "activity"} onOpenChange={(o) => setOpenPanel(o ? "activity" : null)} />
    </div>
  );
}

// ─── PANEL: Asistencia promedio por periodo o semana ──────────────────────────

function AttendancePanel({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [groupBy, setGroupBy] = useState<"week" | "period">("week");
  const { data, isLoading } = useQuery<{ label: string; rate: number }[]>({
    queryKey: ["/api/admin/indicators/attendance-trend", groupBy],
    queryFn: () => fetch(`/api/admin/indicators/attendance-trend?groupBy=${groupBy}`, { credentials: "include" }).then(r => r.ok ? r.json() : []),
    enabled: open,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-600" /> Asistencia promedio institucional</DialogTitle>
        </DialogHeader>
        <div className="flex gap-2 mb-2">
          <Button size="sm" variant={groupBy === "week" ? "default" : "outline"} onClick={() => setGroupBy("week")}>Por semana</Button>
          <Button size="sm" variant={groupBy === "period" ? "default" : "outline"} onClick={() => setGroupBy("period")}>Por periodo</Button>
        </div>
        {isLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : !data?.length ? (
          <p className="text-sm text-muted-foreground text-center py-8">No hay registros de asistencia todavía.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{groupBy === "week" ? "Semana" : "Periodo"}</TableHead>
                <TableHead className="text-right">Asistencia</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => (
                <TableRow key={row.label}>
                  <TableCell className="text-sm">{row.label}</TableCell>
                  <TableCell className="text-right font-semibold">{row.rate}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── PANEL: Rendimiento académico por materia y por grupo ─────────────────────

function PerformancePanel({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { data, isLoading } = useQuery<{ bySubject: any[]; byGroup: any[] }>({
    queryKey: ["/api/admin/indicators/performance"],
    enabled: open,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-blue-600" /> Rendimiento académico</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Por materia</h3>
              {!data?.bySubject?.length ? (
                <p className="text-sm text-muted-foreground py-4">Sin calificaciones registradas.</p>
              ) : (
                <Table>
                  <TableHeader><TableRow><TableHead>Materia</TableHead><TableHead className="text-right">Prom.</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {data.bySubject.map((s: any) => (
                      <TableRow key={s.subjectId}>
                        <TableCell className="text-sm">{s.subjectName}</TableCell>
                        <TableCell className="text-right font-semibold">{(s.avgGrade / 10).toFixed(1)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Por grupo</h3>
              {!data?.byGroup?.length ? (
                <p className="text-sm text-muted-foreground py-4">Sin calificaciones registradas.</p>
              ) : (
                <Table>
                  <TableHeader><TableRow><TableHead>Grupo</TableHead><TableHead className="text-right">Prom.</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {data.byGroup.map((g: any) => (
                      <TableRow key={g.groupId}>
                        <TableCell className="text-sm">{g.groupName}</TableCell>
                        <TableCell className="text-right font-semibold">{(g.avgGrade / 10).toFixed(1)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── PANEL: Estudiantes en riesgo (detalle con motivo) ─────────────────────────

function AtRiskPanel({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { data, isLoading } = useQuery<{ student: User; reason: string; detail: string }[]>({
    queryKey: ["/api/admin/indicators/at-risk"],
    enabled: open,
  });

  const reasonColor: Record<string, string> = {
    "Bajo rendimiento académico": "text-red-600",
    "Ausentismo": "text-amber-600",
    "Observación grave": "text-purple-600",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-600" /> Estudiantes en riesgo</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : !data?.length ? (
          <p className="text-sm text-muted-foreground text-center py-8">No hay estudiantes en riesgo identificados actualmente.</p>
        ) : (
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {data.map((item, i) => (
              <Card key={`${item.student.id}-${i}`}>
                <CardContent className="p-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{getInitials(item.student.firstName, item.student.lastName)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{getFullName(item.student.firstName, item.student.lastName)}</p>
                      <p className={`text-xs ${reasonColor[item.reason] || "text-muted-foreground"}`}>{item.reason}</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground text-right max-w-[40%]">{item.detail}</span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── PANEL: Actividad reciente, filtrable por grado/grupo ──────────────────────

function RecentActivityPanel({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [gradeId, setGradeId] = useState("");
  const [groupId, setGroupId] = useState("");
  const { data: grades = [] } = useQuery<any[]>({ queryKey: ["/api/admin/grades"], enabled: open });
  const { data: groups = [] } = useQuery<any[]>({ queryKey: ["/api/admin/academic-groups"], enabled: open });

  const { data, isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/indicators/recent-activity", gradeId, groupId],
    queryFn: () => {
      const params = new URLSearchParams();
      if (gradeId) params.set("gradeId", gradeId);
      if (groupId) params.set("groupId", groupId);
      return fetch(`/api/admin/indicators/recent-activity?${params}`, { credentials: "include" }).then(r => r.ok ? r.json() : []);
    },
    enabled: open,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><BarChart2 className="h-4 w-4 text-purple-600" /> Actividad reciente (últimos 7 días)</DialogTitle>
        </DialogHeader>
        <div className="flex gap-2 mb-2">
          <Select value={gradeId || "__all__"} onValueChange={(v) => { setGradeId(v === "__all__" ? "" : v); setGroupId(""); }}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Filtrar por grado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todos los grados</SelectItem>
              {grades.map((g: any) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={groupId || "__all__"} onValueChange={(v) => setGroupId(v === "__all__" ? "" : v)}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Filtrar por grupo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todos los grupos</SelectItem>
              {groups.map((g: any) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {isLoading ? (
          <Skeleton className="h-48 w-full" />
        ) : !data?.length ? (
          <p className="text-sm text-muted-foreground text-center py-8">No hay actividades creadas en los últimos 7 días.</p>
        ) : (
          <div className="space-y-2 max-h-[55vh] overflow-y-auto">
            {data.map((act: any) => (
              <Card key={act.id}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{act.title}</p>
                    <Badge variant="outline" className="text-xs">{act.subject}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {act.courseName} · {new Date(act.createdAt).toLocaleDateString("es-CO")}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── CONFIGURACIÓN DEL COLEGIO ────────────────────────────────────────────────


function TabConfigColegio() {
  const { toast } = useToast();
  const { data: config, isLoading } = useQuery<any>({
    queryKey: ["/api/admin/institution"],
  });
  const [form, setForm] = useState({
    institutionName: "",
    institutionCode: "",
    logoUrl: "",
    bannerUrl: "",
    primaryColor: "#4f46e5",
    secondaryColor: "#06b6d4",
    description: "",
  });
 
  useEffect(() => {
    if (config) {
      setForm({
        institutionName: config.institutionName || "",
        institutionCode: config.institutionCode || "",
        logoUrl: config.logoUrl || "",
        bannerUrl: config.bannerUrl || "",
        primaryColor: config.primaryColor || "#4f46e5",
        secondaryColor: config.secondaryColor || "#06b6d4",
        description: config.description || "",
      });
    }
  }, [config]);
 
  const save = useMutation({
    mutationFn: () => apiRequest("PATCH", "/api/admin/institution", form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/institution"] });
      toast({ title: "Configuración guardada", description: "Los cambios se reflejarán en toda la plataforma." });
    },
    onError: () => toast({ title: "Error al guardar", variant: "destructive" }),
  });
 
  if (isLoading) return <Skeleton className="h-64 w-full" />;
 
  return (
    <div className="space-y-6 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <School className="h-5 w-5" /> Identidad institucional
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Nombre del colegio</Label>
              <Input
                placeholder="EduNexus"
                value={form.institutionName}
                onChange={(e) => setForm((p) => ({ ...p, institutionName: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Código institucional</Label>
              <Input
                placeholder="ICFES o interno"
                value={form.institutionCode}
                onChange={(e) => setForm((p) => ({ ...p, institutionCode: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Descripción institucional</Label>
            <Textarea
              placeholder="Misión, visión o lema..."
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>URL del logo</Label>
              <Input
                placeholder="https://..."
                value={form.logoUrl}
                onChange={(e) => setForm((p) => ({ ...p, logoUrl: e.target.value }))}
              />
              {form.logoUrl && (
                <img
                  src={form.logoUrl}
                  alt="Logo"
                  className="h-16 mt-2 rounded border object-contain"
                />
              )}
            </div>
            <div className="space-y-1">
              <Label>URL del banner</Label>
              <Input
                placeholder="https://..."
                value={form.bannerUrl}
                onChange={(e) => setForm((p) => ({ ...p, bannerUrl: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>
 
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" /> Colores institucionales
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Color principal</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form.primaryColor}
                  onChange={(e) => setForm((p) => ({ ...p, primaryColor: e.target.value }))}
                  className="w-12 h-10 rounded cursor-pointer border"
                />
                <code className="text-sm text-muted-foreground">{form.primaryColor}</code>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Color secundario</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form.secondaryColor}
                  onChange={(e) => setForm((p) => ({ ...p, secondaryColor: e.target.value }))}
                  className="w-12 h-10 rounded cursor-pointer border"
                />
                <code className="text-sm text-muted-foreground">{form.secondaryColor}</code>
              </div>
            </div>
          </div>
          <div
            className="rounded-lg p-4 flex items-center gap-3 text-white text-sm font-medium"
            style={{ background: `linear-gradient(135deg, ${form.primaryColor}, ${form.secondaryColor})` }}
          >
            <School className="h-5 w-5" />
            {form.institutionName || "Nombre del colegio"} — Vista previa
          </div>
        </CardContent>
      </Card>
 
      <Button onClick={() => save.mutate()} disabled={save.isPending} className="w-full">
        <Save className="h-4 w-4 mr-2" />
        {save.isPending ? "Guardando..." : "Guardar cambios"}
      </Button>
    </div>
  );
}
 
// ─── CONFIGURACIÓN ACADÉMICA ──────────────────────────────────────────────────
 
function TabConfigAcademica() {
  const { toast } = useToast();
  const { data: config, isLoading } = useQuery<any>({
    queryKey: ["/api/admin/institution"],
  });
  const [form, setForm] = useState({
    evaluationType: "quantitative",
    passingGrade: "3.0",
    gradeScale: "1.0 - 5.0",
    qualitativeScale: "Bajo,Básico,Alto,Superior",
    emailAllowedDomain: "",
    gcClientId: "",
    gcClientSecret: "",
  });
 
  const { data: years = [], isLoading: loadingYears } = useQuery<any[]>({
    queryKey: ["/api/admin/academic-years"],
  });
 
  useEffect(() => {
    if (config) {
      setForm({
        evaluationType: config.evaluationType || "quantitative",
        passingGrade: config.passingGrade || "3.0",
        gradeScale: config.gradeScale || "1.0 - 5.0",
        qualitativeScale: config.qualitativeScale || "Bajo,Básico,Alto,Superior",
        emailAllowedDomain: config.emailAllowedDomain || "",
        gcClientId: config.gcClientId || "",
        gcClientSecret: config.gcClientSecret || "",
      });
    }
  }, [config]);
 
  const save = useMutation({
    mutationFn: () => apiRequest("PATCH", "/api/admin/institution", form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/institution"] });
      toast({ title: "Configuración académica guardada" });
    },
    onError: () => toast({ title: "Error al guardar", variant: "destructive" }),
  });
 
  const [showYearForm, setShowYearForm] = useState(false);
  const [showPeriodForm, setShowPeriodForm] = useState(false);
  const [selectedYear, setSelectedYear] = useState<any>(null);
  const [yearForm, setYearForm] = useState({ year: new Date().getFullYear(), startDate: "", endDate: "" });
  const [periodForm, setPeriodForm] = useState({ name: "", startDate: "", endDate: "" });
 
  const { data: periods = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/academic-years", selectedYear?.id, "periods"],
    queryFn: () =>
      fetch(`/api/admin/academic-years/${selectedYear.id}/periods`, {
        credentials: "include",
      }).then((r) => r.ok ? r.json() : []).then((d) => Array.isArray(d) ? d : []),
    enabled: !!selectedYear,
  });
 
  const createYear = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/admin/academic-years", {
        year: yearForm.year,
        startDate: yearForm.startDate || undefined,
        endDate: yearForm.endDate || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/academic-years"] });
      setShowYearForm(false);
      toast({ title: "Año académico creado" });
    },
  });
 
  const activateYear = useMutation({
    mutationFn: (id: string) => apiRequest("PATCH", `/api/admin/academic-years/${id}/activate`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/academic-years"] });
      toast({ title: "Año activado" });
    },
  });
 
  const deleteYear = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/academic-years/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/academic-years"] });
      toast({ title: "Año eliminado" });
    },
  });
 
  const createPeriod = useMutation({
    mutationFn: () =>
      apiRequest("POST", `/api/admin/academic-years/${selectedYear.id}/periods`, {
        name: periodForm.name,
        startDate: periodForm.startDate,
        endDate: periodForm.endDate,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/academic-years", selectedYear?.id, "periods"],
      });
      setShowPeriodForm(false);
      setPeriodForm({ name: "", startDate: "", endDate: "" });
      toast({ title: "Periodo creado" });
    },
  });
 
  const activatePeriod = useMutation({
    mutationFn: (id: string) => apiRequest("PATCH", `/api/admin/periods/${id}/activate`, {}),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/academic-years", selectedYear?.id, "periods"],
      }),
  });
 
  const deletePeriod = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/periods/${id}`),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/academic-years", selectedYear?.id, "periods"],
      }),
  });
 
  if (isLoading) return <Skeleton className="h-64 w-full" />;
 
  return (
    <div className="space-y-6">
      {/* Sistema evaluativo */}
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart2 className="h-5 w-5" /> Sistema evaluativo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label>Tipo de evaluación</Label>
              <Select
                value={form.evaluationType}
                onValueChange={(v) => setForm((p) => ({ ...p, evaluationType: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quantitative">Cuantitativo</SelectItem>
                  <SelectItem value="qualitative">Cualitativo</SelectItem>
                  <SelectItem value="mixed">Mixto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Nota mínima aprobatoria</Label>
              <Input
                placeholder="3.0"
                value={form.passingGrade}
                onChange={(e) => setForm((p) => ({ ...p, passingGrade: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Escala de valoración</Label>
              <Input
                placeholder="1.0 - 5.0"
                value={form.gradeScale}
                onChange={(e) => setForm((p) => ({ ...p, gradeScale: e.target.value }))}
              />
            </div>
          </div>
          {/* Escala cualitativa — solo si evaluationType no es quantitative */}
          {form.evaluationType !== "quantitative" && (
            <div className="space-y-1 pt-2">
              <Label>Niveles de valoración cualitativa</Label>
              <Input
                placeholder="Bajo,Básico,Alto,Superior"
                value={form.qualitativeScale}
                onChange={(e) => setForm((p) => ({ ...p, qualitativeScale: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                Separa los niveles con comas, de menor a mayor. Se usarán en boletines y aulas virtuales.
              </p>
            </div>
          )}
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {save.isPending ? "Guardando..." : "Guardar sistema evaluativo"}
          </Button>
        </CardContent>
      </Card>

      {/* Restricción de dominio de correo */}
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" /> Restricción de dominio de correo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label>Dominio institucional permitido</Label>
            <Input
              placeholder="iecolegioloyola.edu.co"
              value={form.emailAllowedDomain}
              onChange={(e) => setForm((p) => ({ ...p, emailAllowedDomain: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground">
              Si defines un dominio, solo correos con ese dominio podrán registrarse en tu institución.
              Déjalo vacío para no restringir.
            </p>
          </div>
          <Button onClick={() => save.mutate()} disabled={save.isPending} variant="outline">
            <Save className="h-4 w-4 mr-2" />
            Guardar restricción de dominio
          </Button>
        </CardContent>
      </Card>

      {/* Google Classroom — credenciales OAuth */}
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5 text-green-600" /> Google Classroom — credenciales OAuth
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Configura las credenciales de tu proyecto en Google Cloud Console para que los docentes puedan conectar su Google Classroom.
            El <strong>Authorized Redirect URI</strong> debe ser: <code className="bg-muted px-1 py-0.5 rounded text-xs">/api/classroom/google/callback</code>
          </p>
          <div className="space-y-1">
            <Label>Google Client ID</Label>
            <Input
              placeholder="xxxxx.apps.googleusercontent.com"
              value={form.gcClientId}
              onChange={(e) => setForm((p) => ({ ...p, gcClientId: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label>Google Client Secret</Label>
            <Input
              type="password"
              placeholder="GOCSPX-..."
              value={form.gcClientSecret}
              onChange={(e) => setForm((p) => ({ ...p, gcClientSecret: e.target.value }))}
            />
          </div>
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            <Save className="h-4 w-4 mr-2" />
            Guardar credenciales de Google
          </Button>
        </CardContent>
      </Card>
 
      {/* Años académicos y periodos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Años académicos
            </h3>
            <Button size="sm" onClick={() => setShowYearForm(true)}>
              <Plus className="h-4 w-4 mr-1" /> Nuevo
            </Button>
          </div>
          {loadingYears ? (
            <Skeleton className="h-32 w-full" />
          ) : (
            <div className="space-y-2">
              {(years as any[]).map((y: any) => (
                <Card
                  key={y.id}
                  className={`cursor-pointer transition-all hover:border-primary/50 ${
                    selectedYear?.id === y.id ? "border-primary" : ""
                  }`}
                  onClick={() => setSelectedYear(y)}
                >
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{y.year}</span>
                      {y.isActive && (
                        <Badge className="text-xs bg-green-100 text-green-700 border-green-200">
                          Activo
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-1">
                      {!y.isActive && (
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Activar"
                          onClick={(e) => {
                            e.stopPropagation();
                            activateYear.mutate(y.id);
                          }}
                        >
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteYear.mutate(y.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {years.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Sin años académicos
                </p>
              )}
            </div>
          )}
        </div>
 
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold flex items-center gap-2">
              <ClipboardList className="h-4 w-4" /> Periodos{" "}
              {selectedYear ? `— ${selectedYear.year}` : ""}
            </h3>
            {selectedYear && (
              <Button size="sm" onClick={() => setShowPeriodForm(true)}>
                <Plus className="h-4 w-4 mr-1" /> Nuevo
              </Button>
            )}
          </div>
          {!selectedYear ? (
            <p className="text-sm text-muted-foreground">Selecciona un año para ver sus periodos.</p>
          ) : (
            <div className="space-y-2">
              {(periods as any[]).map((p: any) => (
                <Card key={p.id}>
                  <CardContent className="p-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.startDate?.slice(0, 10)} → {p.endDate?.slice(0, 10)}
                      </p>
                    </div>
                    <div className="flex gap-1 items-center">
                      {p.isActive && (
                        <Badge className="text-xs bg-green-100 text-green-700 border-green-200">
                          Activo
                        </Badge>
                      )}
                      {!p.isActive && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => activatePeriod.mutate(p.id)}
                        >
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deletePeriod.mutate(p.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {periods.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Sin periodos para este año
                </p>
              )}
            </div>
          )}
        </div>
      </div>
 
      {/* Dialogs */}
      <Dialog open={showYearForm} onOpenChange={setShowYearForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo año académico</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Año</Label>
              <Input
                type="number"
                value={yearForm.year}
                onChange={(e) => setYearForm((p) => ({ ...p, year: +e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Fecha inicio</Label>
                <Input
                  type="date"
                  value={yearForm.startDate}
                  onChange={(e) => setYearForm((p) => ({ ...p, startDate: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Fecha fin</Label>
                <Input
                  type="date"
                  value={yearForm.endDate}
                  onChange={(e) => setYearForm((p) => ({ ...p, endDate: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowYearForm(false)}>
              Cancelar
            </Button>
            <Button onClick={() => createYear.mutate()} disabled={createYear.isPending}>
              Crear año
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
 
      <Dialog open={showPeriodForm} onOpenChange={setShowPeriodForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo periodo académico</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Nombre del periodo</Label>
              <Input
                placeholder="Periodo 1 / Primer bimestre..."
                value={periodForm.name}
                onChange={(e) => setPeriodForm((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Inicio</Label>
                <Input
                  type="date"
                  value={periodForm.startDate}
                  onChange={(e) => setPeriodForm((p) => ({ ...p, startDate: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Fin</Label>
                <Input
                  type="date"
                  value={periodForm.endDate}
                  onChange={(e) => setPeriodForm((p) => ({ ...p, endDate: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPeriodForm(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => createPeriod.mutate()}
              disabled={createPeriod.isPending || !periodForm.name}
            >
              Crear periodo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
 
// ─── MATERIAS ─────────────────────────────────────────────────────────────────
 
function TabMaterias() {
  const { toast } = useToast();
  const { data: subjects = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/subjects"],
  });
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ code: "", name: "", description: "", color: "#6366f1" });
 
  const save = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/admin/subjects", editing ? { ...form, id: editing.id } : form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subjects"] });
      setShowForm(false);
      setEditing(null);
      setForm({ code: "", name: "", description: "", color: "#6366f1" });
      toast({ title: editing ? "Materia actualizada" : "Materia creada" });
    },
    onError: () => toast({ title: "Error al guardar", variant: "destructive" }),
  });
 
  const toggleActive = useMutation({
  mutationFn: (s: any) =>
    apiRequest("POST", `/api/admin/subjects/${s.id}/toggle`, { active: !s.active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subjects"] });
      toast({ title: "Estado actualizado" });
    },
  });
 
  const del = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/subjects/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/subjects"] });
      toast({ title: "Materia eliminada" });
    },
  });
 
  function openEdit(s: any) {
    setEditing(s);
    setForm({ code: s.code, name: s.name, description: s.description || "", color: s.color || "#6366f1" });
    setShowForm(true);
  }
 
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{subjects.length} materias registradas</p>
        <Button
          size="sm"
          onClick={() => {
            setEditing(null);
            setForm({ code: "", name: "", description: "", color: "#6366f1" });
            setShowForm(true);
          }}
        >
          <Plus className="h-4 w-4 mr-1" /> Nueva materia
        </Button>
      </div>
 
      {isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Color</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(subjects as any[]).map((s: any) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <div
                      className="w-6 h-6 rounded-full border shadow-sm"
                      style={{ background: s.color || "#6366f1" }}
                    />
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{s.code}</code>
                  </TableCell>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                    {s.description || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={s.active ? "default" : "secondary"}>
                      {s.active ? "Activa" : "Inactiva"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(s)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        title={s.active ? "Desactivar" : "Activar"}
                        onClick={() => toggleActive.mutate(s)}
                      >
                        {s.active ? (
                          <XCircle className="h-4 w-4 text-amber-500" />
                        ) : (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => del.mutate(s.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {subjects.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Sin materias registradas
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}
 
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar materia" : "Nueva materia"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Código</Label>
                <Input
                  placeholder="MAT01"
                  value={form.code}
                  onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={form.color}
                    onChange={(e) => setForm((p) => ({ ...p, color: e.target.value }))}
                    className="w-10 h-9 rounded border cursor-pointer"
                  />
                  <code className="text-xs text-muted-foreground">{form.color}</code>
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Nombre</Label>
              <Input
                placeholder="Matemáticas"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Descripción</Label>
              <Textarea
                placeholder="Descripción opcional..."
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => save.mutate()}
              disabled={save.isPending || !form.code || !form.name}
            >
              {save.isPending ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
 
// ─── GRADOS Y GRUPOS ──────────────────────────────────────────────────────────
 
function TabGradosGrupos() {
  const { toast } = useToast();
  const { data: grades = [], isLoading: loadingGrades } = useQuery<any[]>({
    queryKey: ["/api/admin/grades"],
  });
  const { data: academicGroups = [], isLoading: loadingGroups } = useQuery<any[]>({
    queryKey: ["/api/admin/academic-groups"],
  });
 
  const [showGradeForm, setShowGradeForm] = useState(false);
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [gradeForm, setGradeForm] = useState({ name: "", level: 1 });
  const [groupForm, setGroupForm] = useState({ name: "", gradeId: "" });
 
  const createGrade = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/grades", gradeForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/grades"] });
      setShowGradeForm(false);
      setGradeForm({ name: "", level: 1 });
      toast({ title: "Grado creado" });
    },
    onError: () => toast({ title: "Error al crear grado", variant: "destructive" }),
  });
 
  const deleteGrade = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/grades/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/grades"] });
      toast({ title: "Grado eliminado" });
    },
  });
 
  const createGroup = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/academic-groups", groupForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/academic-groups"] });
      setShowGroupForm(false);
      setGroupForm({ name: "", gradeId: "" });
      toast({ title: "Grupo creado" });
    },
    onError: () => toast({ title: "Error al crear grupo", variant: "destructive" }),
  });
 
  const deleteGroup = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/academic-groups/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/academic-groups"] });
      toast({ title: "Grupo eliminado" });
    },
  });
 
  const gradeById = (id: string) => (grades as any[]).find((g: any) => g.id === id);
 
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Grados */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold flex items-center gap-2">
            <GraduationCap className="h-4 w-4" /> Grados ({grades.length})
          </h3>
          <Button size="sm" onClick={() => setShowGradeForm(true)}>
            <Plus className="h-4 w-4 mr-1" /> Nuevo grado
          </Button>
        </div>
        {loadingGrades ? (
          <Skeleton className="h-40 w-full" />
        ) : (
          <div className="space-y-2">
            {(grades as any[])
              .sort((a: any, b: any) => a.level - b.level)
              .map((g: any) => (
                <div
                  key={g.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/40 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                      {g.level}
                    </div>
                    <span className="font-medium">{g.name}</span>
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => deleteGrade.mutate(g.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            {grades.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Sin grados</p>
            )}
          </div>
        )}
      </div>
 
      {/* Grupos */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold flex items-center gap-2">
            <Layers className="h-4 w-4" /> Grupos ({academicGroups.length})
          </h3>
          <Button size="sm" onClick={() => setShowGroupForm(true)}>
            <Plus className="h-4 w-4 mr-1" /> Nuevo grupo
          </Button>
        </div>
        {loadingGroups ? (
          <Skeleton className="h-40 w-full" />
        ) : (
          <div className="space-y-2">
            {(academicGroups as any[]).map((g: any) => (
              <div
                key={g.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/40 transition"
              >
                <div>
                  <p className="font-medium">{g.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {gradeById(g.gradeId)?.name || "Sin grado asignado"}
                  </p>
                </div>
                <Button size="icon" variant="ghost" onClick={() => deleteGroup.mutate(g.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
            {academicGroups.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Sin grupos</p>
            )}
          </div>
        )}
      </div>
 
      {/* Dialogs */}
      <Dialog open={showGradeForm} onOpenChange={setShowGradeForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo grado</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Nombre del grado</Label>
              <Input
                placeholder="Ej: Sexto, Décimo, Once..."
                value={gradeForm.name}
                onChange={(e) => setGradeForm((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Nivel (orden)</Label>
              <Input
                type="number"
                min={0}
                value={gradeForm.level}
                onChange={(e) => setGradeForm((p) => ({ ...p, level: +e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGradeForm(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => createGrade.mutate()}
              disabled={createGrade.isPending || !gradeForm.name}
            >
              Crear grado
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
 
      <Dialog open={showGroupForm} onOpenChange={setShowGroupForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo grupo académico</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Nombre del grupo</Label>
              <Input
                placeholder="Ej: 6A, 10B, 11C..."
                value={groupForm.name}
                onChange={(e) => setGroupForm((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Grado</Label>
              <Select
                value={groupForm.gradeId}
                onValueChange={(v) => setGroupForm((p) => ({ ...p, gradeId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar grado..." />
                </SelectTrigger>
                <SelectContent>
                  {(grades as any[]).map((g: any) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGroupForm(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => createGroup.mutate()}
              disabled={createGroup.isPending || !groupForm.name || !groupForm.gradeId}
            >
              Crear grupo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
 
// ─── DOCENTES ─────────────────────────────────────────────────────────────────
 
function TabDocentes() {
  const { toast } = useToast();
  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users", "teacher"],
  });
  const { data: subjects = [] } = useQuery<any[]>({ queryKey: ["/api/admin/subjects"] });
  const { data: academicGroups = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/academic-groups"],
  });
  const [search, setSearch] = useState("");
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [assignForm, setAssignForm] = useState({ subjectId: "", groupId: "" });
 
  const teachers = (users as User[]).filter((u) => u.role === "teacher");
  const filtered = teachers.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q)
    );
  });
 
  const deactivate = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/admin/users/${id}/block`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Docente desactivado" });
    },
  });
 
  const assign = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/admin/teacher-assignments", {
        teacherId: selectedTeacher?.id,
        subjectId: assignForm.subjectId,
        groupId: assignForm.groupId,
      }),
    onSuccess: () => {
      setShowAssignForm(false);
      setAssignForm({ subjectId: "", groupId: "" });
      toast({ title: "Asignación creada" });
    },
    onError: () => toast({ title: "Error en asignación", variant: "destructive" }),
  });
 
  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <Input
          placeholder="Buscar docente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        <Badge variant="outline" className="px-3 py-1.5 text-sm">
          {filtered.length} docentes
        </Badge>
      </div>
 
      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Docente</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-32">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={u.profileImageUrl || undefined} />
                        <AvatarFallback className="text-xs">
                          {getInitials(u.firstName, u.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{getFullName(u.firstName, u.lastName)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                  <TableCell>
                    <Badge variant={(u as any).blocked ? "destructive" : "default"}>
                      {(u as any).blocked ? "Inactivo" : "Activo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedTeacher(u);
                          setShowAssignForm(true);
                        }}
                      >
                        <BookMarked className="h-3 w-3 mr-1" /> Asignar
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Desactivar"
                        onClick={() => deactivate.mutate(u.id)}
                      >
                        <UserX className="h-4 w-4 text-amber-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    Sin docentes registrados
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}
 
      <Dialog open={showAssignForm} onOpenChange={setShowAssignForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Asignar carga académica — {getFullName(selectedTeacher?.firstName, selectedTeacher?.lastName)}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Docente → Materia → Grupo</p>
            <div className="space-y-1">
              <Label>Materia</Label>
              <Select
                value={assignForm.subjectId}
                onValueChange={(v) => setAssignForm((p) => ({ ...p, subjectId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar materia..." />
                </SelectTrigger>
                <SelectContent>
                  {(subjects as any[]).map((s: any) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Grupo</Label>
              <Select
                value={assignForm.groupId}
                onValueChange={(v) => setAssignForm((p) => ({ ...p, groupId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar grupo..." />
                </SelectTrigger>
                <SelectContent>
                  {(academicGroups as any[]).map((g: any) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssignForm(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => assign.mutate()}
              disabled={assign.isPending || !assignForm.subjectId || !assignForm.groupId}
            >
              Crear asignación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
 
// ─── ESTUDIANTES ──────────────────────────────────────────────────────────────
 
function TabEstudiantes() {
  const { toast } = useToast();
  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users", "student"],
  });
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
 
  const students = (users as User[]).filter((u) => u.role === "student");
  const filtered = students.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q)
    );
  });
 
  const expel = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/admin/users/${id}/expel`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Estudiante retirado" });
    },
  });
 
  const reintegrate = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/admin/users/${id}/reintegrate`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Estudiante reintegrado" });
    },
  });
 
  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <Input
          placeholder="Buscar estudiante..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        <Badge variant="outline" className="px-3 py-1.5 text-sm">
          {filtered.length} estudiantes
        </Badge>
      </div>
 
      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Estudiante</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-36">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={u.profileImageUrl || undefined} />
                        <AvatarFallback className="text-xs">
                          {getInitials(u.firstName, u.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{getFullName(u.firstName, u.lastName)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                  <TableCell>
                    <Badge variant={(u as any).blocked ? "destructive" : "default"}>
                      {(u as any).blocked ? "Retirado" : "Activo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        title="Ver historial"
                        onClick={() => setSelectedStudent(u)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {(u as any).blocked ? (
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Reintegrar"
                          onClick={() => reintegrate.mutate(u.id)}
                        >
                          <UserCheck className="h-4 w-4 text-green-600" />
                        </Button>
                      ) : (
                        <Button
                          size="icon"
                          variant="ghost"
                          title="Retirar"
                          onClick={() => expel.mutate(u.id)}
                        >
                          <UserX className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    Sin estudiantes registrados
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}
 
      <Dialog open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Historial — {getFullName(selectedStudent?.firstName, selectedStudent?.lastName)}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <Avatar className="h-12 w-12">
                <AvatarImage src={selectedStudent?.profileImageUrl || undefined} />
                <AvatarFallback>
                  {getInitials(selectedStudent?.firstName, selectedStudent?.lastName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">
                  {getFullName(selectedStudent?.firstName, selectedStudent?.lastName)}
                </p>
                <p className="text-sm text-muted-foreground">{selectedStudent?.email}</p>
                <Badge variant="outline" className="text-xs mt-1">
                  Estudiante
                </Badge>
              </div>
            </div>
            <p className="text-sm text-muted-foreground text-center py-4">
              El historial académico completo estará disponible próximamente (boletines, observaciones, matrículas).
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedStudent(null)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
 
// ─── MATRÍCULAS ───────────────────────────────────────────────────────────────
 
function TabMatriculas() {
  const { toast } = useToast();
  const { data: years = [] } = useQuery<any[]>({ queryKey: ["/api/admin/academic-years"] });
  const { data: academicGroups = [] } = useQuery<any[]>({ queryKey: ["/api/admin/academic-groups"] });
  const { data: grades = [] } = useQuery<any[]>({ queryKey: ["/api/admin/grades"] });
  const { data: teachers = [] } = useQuery<any[]>({ queryKey: ["/api/admin/users", "teacher"] });
  const { data: subjects = [] } = useQuery<any[]>({ queryKey: ["/api/admin/subjects"] });
  const { data: allUsers = [] } = useQuery<User[]>({ queryKey: ["/api/admin/users", "student"] });
  const [selectedYear, setSelectedYear] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: enrollments = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/enrollments", selectedYear],
    queryFn: () =>
      fetch(
        `/api/admin/enrollments${selectedYear ? `?yearId=${selectedYear}` : ""}`,
        { credentials: "include" }
      ).then((r) => r.ok ? r.json() : []).then((d) => Array.isArray(d) ? d : []),
  });

  const students = (allUsers as User[]).filter((u) => (u as any).role === "student");
  const teacherList = (teachers as any[]).filter((u: any) => u.role === "teacher");

  const emptyForm = {
    studentId: "", groupId: "", academicYearId: "", studentCode: "",
    enrollmentNumber: "", enrollmentDate: "", status: "enrolled",
    enrollmentType: "new", campus: "", schedule: "morning", level: "secondary",
    previousSchool: "", previousGrade: "", previousYear: "",
    transferFromOtherSchool: false, studentStatus: "regular",
    promotionStatus: "pending", academicObservation: "",
    classroomTeacherId: "", assignedClassroom: "",
    disciplinaryStatus: "", academicCommitments: "", coexistenceCommitments: "",
  };
  const [form, setForm] = useState(emptyForm);
  const set = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

  const create = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/enrollments", form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/enrollments"] });
      setShowForm(false); setForm(emptyForm);
      toast({ title: "Matrícula creada correctamente" });
    },
    onError: () => toast({ title: "Error al matricular", variant: "destructive" }),
  });

  const update = useMutation({
    mutationFn: () => apiRequest("PATCH", `/api/admin/enrollments/${editingId}`, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/enrollments"] });
      setShowForm(false); setEditingId(null); setForm(emptyForm);
      toast({ title: "Matrícula actualizada" });
    },
    onError: () => toast({ title: "Error al actualizar", variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/enrollments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/enrollments"] });
      toast({ title: "Matrícula eliminada" });
    },
  });

  const statusLabel: Record<string, string> = {
    enrolled: "Activa", withdrawn: "Retirada", cancelled: "Cancelada",
    graduated: "Graduado", transferred: "Transferido",
  };
  const statusVariant: Record<string, any> = {
    enrolled: "default", withdrawn: "destructive", cancelled: "destructive",
    graduated: "secondary", transferred: "outline",
  };

  const openEdit = (e: any) => {
    const en = e.enrollment || e;
    setForm({
      studentId: en.studentId || "", groupId: en.groupId || "",
      academicYearId: en.academicYearId || "", studentCode: en.studentCode || "",
      enrollmentNumber: en.enrollmentNumber || "", enrollmentDate: en.enrollmentDate?.slice(0, 10) || "",
      status: en.status || "enrolled", enrollmentType: en.enrollmentType || "new",
      campus: en.campus || "", schedule: en.schedule || "morning",
      level: en.level || "secondary", previousSchool: en.previousSchool || "",
      previousGrade: en.previousGrade || "", previousYear: en.previousYear || "",
      transferFromOtherSchool: en.transferFromOtherSchool || false,
      studentStatus: en.studentStatus || "regular", promotionStatus: en.promotionStatus || "pending",
      academicObservation: en.academicObservation || "",
      classroomTeacherId: en.classroomTeacherId || "", assignedClassroom: en.assignedClassroom || "",
      disciplinaryStatus: en.disciplinaryStatus || "",
      academicCommitments: en.academicCommitments || "",
      coexistenceCommitments: en.coexistenceCommitments || "",
    });
    setEditingId(en.id);
    setShowForm(true);
  };

  const selectedGroup = (academicGroups as any[]).find((g: any) => g.id === form.groupId);
  const groupSubjects = (subjects as any[]);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex justify-between items-center gap-3 flex-wrap">
        <Select value={selectedYear || "__all__"} onValueChange={(v) => setSelectedYear(v === "__all__" ? "" : v)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por año..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todos los años</SelectItem>
            {(years as any[]).map((y: any) => (
              <SelectItem key={y.id} value={y.id}>{y.year}{y.isActive && " ✓"}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(true); }}>
          <Plus className="h-4 w-4 mr-1" /> Nueva matrícula
        </Button>
      </div>

      {/* Tabla de matrículas */}
      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N° Matrícula</TableHead>
                <TableHead>Estudiante</TableHead>
                <TableHead>Grado / Grupo</TableHead>
                <TableHead>Jornada</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(Array.isArray(enrollments) ? enrollments : []).map((e: any) => {
                const en = e.enrollment || e;
                const st = e.student;
                const grp = (academicGroups as any[]).find((g: any) => g.id === en.groupId);
                return (
                  <TableRow key={en.id}>
                    <TableCell>
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                        {en.enrollmentNumber || en.studentCode || "—"}
                      </code>
                    </TableCell>
                    <TableCell className="font-medium">
                      {st ? getFullName(st.firstName, st.lastName) : en.studentId}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {grp?.name || en.groupId || "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground capitalize">
                      {{ morning: "Mañana", afternoon: "Tarde", full: "Completa" }[en.schedule as string] || "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {{ new: "Nuevo ingreso", returning: "Antiguo", transfer: "Transferencia" }[en.enrollmentType as string] || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[en.status] || "outline"}>
                        {statusLabel[en.status] || en.status || "—"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(e)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => remove.mutate(en.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {enrollments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                    Sin matrículas registradas
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Formulario de matrícula (Dialog amplio) */}
      <Dialog open={showForm} onOpenChange={(o) => { setShowForm(o); if (!o) { setEditingId(null); setForm(emptyForm); } }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar matrícula" : "Nueva matrícula"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* 1. Información de matrícula */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 border-b pb-1">
                1. Información de matrícula
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Estudiante</Label>
                  <Select value={form.studentId} onValueChange={(v) => set("studentId", v)}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                    <SelectContent>
                      {students.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{getFullName(s.firstName, s.lastName)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Número de matrícula</Label>
                  <Input placeholder="MAT-2026-00045 (auto si vacío)" value={form.enrollmentNumber} onChange={(e) => set("enrollmentNumber", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Año escolar</Label>
                  <Select value={form.academicYearId} onValueChange={(v) => set("academicYearId", v)}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar año..." /></SelectTrigger>
                    <SelectContent>
                      {(years as any[]).map((y: any) => (
                        <SelectItem key={y.id} value={y.id}>{y.year}{y.isActive && " ✓"}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Fecha de matrícula</Label>
                  <Input type="date" value={form.enrollmentDate} onChange={(e) => set("enrollmentDate", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Estado de matrícula</Label>
                  <Select value={form.status} onValueChange={(v) => set("status", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="enrolled">Activa</SelectItem>
                      <SelectItem value="withdrawn">Retirada</SelectItem>
                      <SelectItem value="cancelled">Cancelada</SelectItem>
                      <SelectItem value="graduated">Graduado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Tipo de matrícula</Label>
                  <Select value={form.enrollmentType} onValueChange={(v) => set("enrollmentType", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">Nuevo ingreso</SelectItem>
                      <SelectItem value="returning">Antiguo estudiante</SelectItem>
                      <SelectItem value="transfer">Transferencia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* 2. Ubicación escolar */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 border-b pb-1">
                2. Ubicación escolar
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Sede</Label>
                  <Select value={form.campus} onValueChange={(v) => set("campus", v)}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar sede..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="principal">Principal</SelectItem>
                      <SelectItem value="secondary">Secundaria</SelectItem>
                      <SelectItem value="rural">Rural</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Jornada</Label>
                  <Select value={form.schedule} onValueChange={(v) => set("schedule", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">Mañana</SelectItem>
                      <SelectItem value="afternoon">Tarde</SelectItem>
                      <SelectItem value="full">Completa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Nivel</Label>
                  <Select value={form.level} onValueChange={(v) => set("level", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="preschool">Preescolar</SelectItem>
                      <SelectItem value="primary">Primaria</SelectItem>
                      <SelectItem value="secondary">Secundaria</SelectItem>
                      <SelectItem value="media">Media</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Grupo</Label>
                  <Select value={form.groupId} onValueChange={(v) => set("groupId", v)}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar grupo..." /></SelectTrigger>
                    <SelectContent>
                      {(academicGroups as any[]).map((g: any) => (
                        <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* 3. Información del año anterior */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 border-b pb-1">
                3. Información del año anterior
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 col-span-2 flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="transferCheck"
                    checked={!!form.transferFromOtherSchool}
                    onChange={(e) => set("transferFromOtherSchool", e.target.checked)}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="transferCheck">Viene de otra institución</Label>
                </div>
                <div className="space-y-1">
                  <Label>Colegio anterior</Label>
                  <Input placeholder="Ej: Colegio San José" value={form.previousSchool} onChange={(e) => set("previousSchool", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Último grado cursado</Label>
                  <Select value={form.previousGrade} onValueChange={(v) => set("previousGrade", v)}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                    <SelectContent>
                      {["Transición","Primero","Segundo","Tercero","Cuarto","Quinto",
                        "Sexto","Séptimo","Octavo","Noveno","Décimo","Undécimo"].map((g) => (
                        <SelectItem key={g} value={g}>{g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Último año aprobado</Label>
                  <Input type="number" placeholder="Ej: 2025" value={form.previousYear} onChange={(e) => set("previousYear", e.target.value)} />
                </div>
              </div>
            </div>

            {/* 4. Situación académica */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 border-b pb-1">
                4. Situación académica
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Estado del estudiante</Label>
                  <Select value={form.studentStatus} onValueChange={(v) => set("studentStatus", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="regular">Regular</SelectItem>
                      <SelectItem value="repeating">Repitente</SelectItem>
                      <SelectItem value="new">Nuevo</SelectItem>
                      <SelectItem value="transferred">Transferido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Promoción</Label>
                  <Select value={form.promotionStatus} onValueChange={(v) => set("promotionStatus", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="promoted">Promovido</SelectItem>
                      <SelectItem value="not_promoted">No promovido</SelectItem>
                      <SelectItem value="pending">Pendiente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1 col-span-2">
                  <Label>Observación académica</Label>
                  <Textarea
                    placeholder="Ej: El estudiante ingresa a grado 8° con rendimiento académico satisfactorio."
                    value={form.academicObservation}
                    onChange={(e) => set("academicObservation", e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
            </div>

            {/* 5. Director de grupo */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 border-b pb-1">
                5. Director de grupo
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Director de grupo</Label>
                  <Select value={form.classroomTeacherId} onValueChange={(v) => set("classroomTeacherId", v)}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar docente..." /></SelectTrigger>
                    <SelectContent>
                      {teacherList.map((t: any) => (
                        <SelectItem key={t.id} value={t.id}>{getFullName(t.firstName, t.lastName)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Salón asignado</Label>
                  <Input placeholder="Ej: 8-A" value={form.assignedClassroom} onChange={(e) => set("assignedClassroom", e.target.value)} />
                </div>
              </div>
            </div>

            {/* 6. Asignaturas del grado (solo lectura, desde horarios) */}
            {groupSubjects.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 border-b pb-1">
                  6. Asignaturas del grado
                </h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Asignatura</TableHead>
                      <TableHead>Código</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupSubjects.slice(0, 10).map((s: any) => (
                      <TableRow key={s.id}>
                        <TableCell className="text-sm font-medium">{s.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{s.code || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* 7. Convivencia */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 border-b pb-1">
                7. Información de convivencia (opcional)
              </h3>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>Estado disciplinario</Label>
                  <Input placeholder="Ej: Sin antecedentes" value={form.disciplinaryStatus} onChange={(e) => set("disciplinaryStatus", e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Compromisos académicos</Label>
                  <Textarea placeholder="Compromisos académicos del estudiante..." value={form.academicCommitments} onChange={(e) => set("academicCommitments", e.target.value)} rows={2} />
                </div>
                <div className="space-y-1">
                  <Label>Compromisos de convivencia</Label>
                  <Textarea placeholder="Compromisos de convivencia..." value={form.coexistenceCommitments} onChange={(e) => set("coexistenceCommitments", e.target.value)} rows={2} />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyForm); }}>
              Cancelar
            </Button>
            <Button
              onClick={() => editingId ? update.mutate() : create.mutate()}
              disabled={(editingId ? update.isPending : create.isPending) || !form.studentId || !form.groupId || !form.academicYearId}
            >
              {editingId ? "Guardar cambios" : "Registrar matrícula"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


// ─── CÓDIGOS INSTITUCIONALES ──────────────────────────────────────────────────
 
function TabCodigos() {
  const { toast } = useToast();
  const { data: teacherCodesData = [], isLoading: loadingT } = useQuery<any[]>({
    queryKey: ["/api/admin/codes/teacher"],
  });
  const { data: staffCodesData = [], isLoading: loadingS } = useQuery<any[]>({
    queryKey: ["/api/admin/codes/staff"],
  });
  const [newTeacherCode, setNewTeacherCode] = useState("");
  const [newStaffCode, setNewStaffCode] = useState({ code: "", role: "coordinator" });
 
  const createTeacher = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/codes/teacher", { code: newTeacherCode }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/codes/teacher"] });
      setNewTeacherCode("");
      toast({ title: "Código docente creado" });
    },
    onError: () => toast({ title: "Error al crear código", variant: "destructive" }),
  });
 
  const deleteTeacher = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/codes/teacher/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/codes/teacher"] });
      toast({ title: "Código eliminado" });
    },
  });
 
  const createStaff = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/codes/staff", newStaffCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/codes/staff"] });
      setNewStaffCode({ code: "", role: "coordinator" });
      toast({ title: "Código directivo creado" });
    },
    onError: () => toast({ title: "Error al crear código", variant: "destructive" }),
  });
 
  const deleteStaff = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/codes/staff/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/codes/staff"] });
      toast({ title: "Código eliminado" });
    },
  });
 
  const roleLabel: Record<string, string> = {
    teacher: "Docente",
    coordinator: "Coordinador",
    director: "Director",
    secretary: "Secretaria",
    admin: "Administrador",
  };
 
  const roleColors: Record<string, string> = {
    teacher: "bg-blue-100 text-blue-700",
    coordinator: "bg-purple-100 text-purple-700",
    director: "bg-red-100 text-red-700",
    secretary: "bg-green-100 text-green-700",
    admin: "bg-orange-100 text-orange-700",
  };
 
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Códigos docentes */}
      <div className="space-y-3">
        <h3 className="font-semibold flex items-center gap-2">
          <Key className="h-4 w-4" /> Códigos de docentes
        </h3>
        <div className="flex gap-2">
          <Input
            placeholder="DOC-2026-001"
            value={newTeacherCode}
            onChange={(e) => setNewTeacherCode(e.target.value)}
            className="flex-1"
          />
          <Button
            size="icon"
            variant="outline"
            title="Generar código"
            onClick={() => setNewTeacherCode(randomCode("DOC"))}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => createTeacher.mutate()}
            disabled={!newTeacherCode || createTeacher.isPending}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {loadingT ? (
          <Skeleton className="h-32 w-full" />
        ) : (
          <div className="space-y-2">
            {(teacherCodesData as any[]).map((c: any) => (
              <div
                key={c.id}
                className="flex items-center justify-between p-2.5 rounded-lg border bg-card"
              >
                <div className="flex items-center gap-2">
                  <code className="text-sm font-mono">{c.code}</code>
                  {c.teacherId ? (
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                      En uso
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">
                      Disponible
                    </Badge>
                  )}
                </div>
                <Button size="icon" variant="ghost" onClick={() => deleteTeacher.mutate(c.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
            {teacherCodesData.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Sin códigos</p>
            )}
          </div>
        )}
      </div>
 
      {/* Códigos directivos */}
      <div className="space-y-3">
        <h3 className="font-semibold flex items-center gap-2">
          <Key className="h-4 w-4" /> Códigos de directivos
        </h3>
        <div className="flex gap-2">
          <Input
            placeholder="DIR-2026-001"
            value={newStaffCode.code}
            onChange={(e) => setNewStaffCode((p) => ({ ...p, code: e.target.value }))}
            className="flex-1"
          />
          <Button
            size="icon"
            variant="outline"
            title="Generar"
            onClick={() =>
              setNewStaffCode((p) => ({
                ...p,
                code: randomCode(p.role.substring(0, 3).toUpperCase()),
              }))
            }
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex gap-2">
          <Select
            value={newStaffCode.role}
            onValueChange={(v) => setNewStaffCode((p) => ({ ...p, role: v }))}
          >
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="coordinator">Coordinador</SelectItem>
              <SelectItem value="director">Director</SelectItem>
              <SelectItem value="secretary">Secretaria</SelectItem>
              <SelectItem value="admin">Administrador</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={() => createStaff.mutate()}
            disabled={!newStaffCode.code || createStaff.isPending}
          >
            <Plus className="h-4 w-4 mr-1" /> Crear
          </Button>
        </div>
        {loadingS ? (
          <Skeleton className="h-32 w-full" />
        ) : (
          <div className="space-y-2">
            {(staffCodesData as any[]).map((c: any) => (
              <div
                key={c.id}
                className="flex items-center justify-between p-2.5 rounded-lg border bg-card"
              >
                <div className="flex items-center gap-2">
                  <code className="text-sm font-mono">{c.code}</code>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      roleColors[c.role] || "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {roleLabel[c.role] || c.role}
                  </span>
                </div>
                <Button size="icon" variant="ghost" onClick={() => deleteStaff.mutate(c.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
            {staffCodesData.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Sin códigos</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
 
// ─── HORARIOS ─────────────────────────────────────────────────────────────────
 
function TabHorarios() {
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<"group" | "teacher">("group");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"schedule" | "info">("schedule");

  const { data: subjects = [] } = useQuery<any[]>({ queryKey: ["/api/admin/subjects"] });
  const { data: academicGroups = [] } = useQuery<any[]>({ queryKey: ["/api/admin/academic-groups"] });
  const { data: teachers = [] } = useQuery<User[]>({ queryKey: ["/api/admin/users", "teacher"] });
  const { data: institutionInfo } = useQuery<any>({ queryKey: ["/api/institution-info"] });

  const { data: schedules = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/schedules", viewMode, selectedGroup, selectedTeacher],
    queryFn: () => {
      const p = new URLSearchParams();
      if (viewMode === "group" && selectedGroup) p.set("groupId", selectedGroup);
      if (viewMode === "teacher" && selectedTeacher) p.set("teacherId", selectedTeacher);
      return fetch(`/api/admin/schedules?${p}`, { credentials: "include" })
        .then((r) => r.ok ? r.json() : []).then((d) => Array.isArray(d) ? d : []);
    },
  });

  const [form, setForm] = useState({ groupId: "", subjectId: "", teacherId: "", day: "Lunes", startTime: "", endTime: "", room: "" });
  const setF = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const [infoForm, setInfoForm] = useState({ mission: "", vision: "", hymn: "", coexistenceManualText: "", coexistenceManualUrl: "", peiUrl: "", academicCalendarUrl: "", internalRegulationsUrl: "" });
  const setI = (k: string, v: string) => setInfoForm((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    if (institutionInfo) {
      setInfoForm({
        mission: institutionInfo.mission || "",
        vision: institutionInfo.vision || "",
        hymn: institutionInfo.hymn || "",
        coexistenceManualText: institutionInfo.coexistenceManualText || "",
        coexistenceManualUrl: institutionInfo.coexistenceManualUrl || "",
        peiUrl: institutionInfo.peiUrl || "",
        academicCalendarUrl: institutionInfo.academicCalendarUrl || "",
        internalRegulationsUrl: institutionInfo.internalRegulationsUrl || "",
      });
    }
  }, [institutionInfo]);

  const create = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/schedules", form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/schedules"] });
      setShowForm(false);
      setForm({ groupId: "", subjectId: "", teacherId: "", day: "Lunes", startTime: "", endTime: "", room: "" });
      toast({ title: "Horario creado correctamente" });
    },
    onError: (err: any) => {
      const msg = err?.message || "Error al guardar el horario";
      toast({ title: "Error al guardar", description: msg, variant: "destructive" });
    },
  });

  const del = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/schedules/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/schedules"] }); toast({ title: "Horario eliminado" }); },
  });

  const saveInfo = useMutation({
    mutationFn: () => apiRequest("PATCH", "/api/admin/institution-info", infoForm),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/institution-info"] }); toast({ title: "Información guardada" }); },
    onError: () => toast({ title: "Error al guardar", variant: "destructive" }),
  });

  const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
  const DAY_MAP: Record<string, string> = { 1: "Lunes", 2: "Martes", 3: "Miércoles", 4: "Jueves", 5: "Viernes", 6: "Sábado" };
  // Horas escolares típicas
  const HOURS = ["06:00","07:00","08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00"];

  const subjectName = (id: string) => (subjects as any[]).find((s: any) => s.id === id)?.name || "—";
  const subjectColor = (id: string) => (subjects as any[]).find((s: any) => s.id === id)?.color || "#6366f1";
  const groupName = (id: string) => (academicGroups as any[]).find((g: any) => g.id === id)?.name || "—";
  const teacherName = (id: string) => {
    const t = (teachers as User[]).find((u) => u.id === id);
    return t ? getFullName(t.firstName, t.lastName) : "—";
  };

  // Organizar horarios como grilla: día x hora
  const getCell = (day: string, hour: string) =>
    (Array.isArray(schedules) ? schedules : []).filter((s: any) => {
      const dayName = DAY_MAP[s.dayOfWeek] || s.day || "";
      return dayName === day && s.startTime <= hour && (s.endTime > hour || s.startTime === hour);
    });

  // Horas que realmente tienen clases
  const usedHours = Array.from(new Set((Array.isArray(schedules) ? schedules : []).map((s: any) => s.startTime))).sort();
  const displayHours = usedHours.length > 0 ? usedHours : HOURS.slice(1, 9);

  return (
    <div className="space-y-4">
      {/* Sub-tabs: Horarios | Información institucional */}
      <div className="flex gap-1 border-b">
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "schedule" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          onClick={() => setActiveTab("schedule")}
        >
          Horarios
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === "info" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          onClick={() => setActiveTab("info")}
        >
          Información institucional
        </button>
      </div>

      {activeTab === "schedule" && (
        <div className="space-y-4">
          {/* Toolbar */}
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="flex gap-2 items-center flex-wrap">
              {/* Toggle vista por grupo / docente */}
              <div className="flex rounded-md border overflow-hidden text-sm">
                <button
                  className={`px-3 py-1.5 ${viewMode === "group" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}
                  onClick={() => setViewMode("group")}
                >
                  Por grupo
                </button>
                <button
                  className={`px-3 py-1.5 ${viewMode === "teacher" ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}
                  onClick={() => setViewMode("teacher")}
                >
                  Por docente
                </button>
              </div>

              {viewMode === "group" ? (
                <Select value={selectedGroup || "__all__"} onValueChange={(v) => setSelectedGroup(v === "__all__" ? "" : v)}>
                  <SelectTrigger className="w-44"><SelectValue placeholder="Todos los grupos" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Todos los grupos</SelectItem>
                    {(academicGroups as any[]).map((g: any) => (
                      <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Select value={selectedTeacher || "__all__"} onValueChange={(v) => setSelectedTeacher(v === "__all__" ? "" : v)}>
                  <SelectTrigger className="w-48"><SelectValue placeholder="Todos los docentes" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Todos los docentes</SelectItem>
                    {(teachers as User[]).filter((u) => u.role === "teacher").map((u) => (
                      <SelectItem key={u.id} value={u.id}>{getFullName(u.firstName, u.lastName)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <Button size="sm" onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-1" /> Agregar clase
            </Button>
          </div>

          {/* Grilla tipo ASC */}
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <Card className="overflow-auto">
              <div className="min-w-[700px]">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr>
                      <th className="w-16 p-2 text-left text-muted-foreground font-medium border-b border-r bg-muted/30">Hora</th>
                      {DAYS.map((d) => (
                        <th key={d} className="p-2 text-center font-semibold border-b border-r last:border-r-0 bg-muted/30">{d}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {displayHours.map((hour) => (
                      <tr key={hour} className="border-b last:border-b-0">
                        <td className="p-2 text-muted-foreground border-r font-mono text-center align-top pt-2">{hour}</td>
                        {DAYS.map((day) => {
                          const cells = getCell(day, hour);
                          return (
                            <td key={day} className="p-1 border-r last:border-r-0 align-top min-w-[120px] h-14">
                              {cells.map((s: any) => (
                                <div
                                  key={s.id}
                                  className="rounded p-1.5 mb-0.5 text-white text-xs leading-tight relative group cursor-default"
                                  style={{ backgroundColor: subjectColor(s.subjectId) + "cc" }}
                                >
                                  <p className="font-semibold truncate">{subjectName(s.subjectId)}</p>
                                  {viewMode === "group" ? (
                                    <p className="opacity-80 truncate">{teacherName(s.teacherId)}</p>
                                  ) : (
                                    <p className="opacity-80 truncate">{groupName(s.groupId)}</p>
                                  )}
                                  {s.room && <p className="opacity-70">{s.room}</p>}
                                  <button
                                    className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 bg-black/30 rounded p-0.5"
                                    onClick={() => del.mutate(s.id)}
                                  >
                                    <XCircle className="h-3 w-3" />
                                  </button>
                                </div>
                              ))}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                    {displayHours.length === 0 && (
                      <tr>
                        <td colSpan={6} className="text-center text-muted-foreground py-12">
                          Sin horarios registrados. Agrega una clase para comenzar.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {activeTab === "info" && (
        <div className="space-y-5 max-w-3xl">
          <p className="text-sm text-muted-foreground">
            Esta información es visible para todos los miembros de la institución (estudiantes, docentes, padres).
          </p>

          {[
            { key: "mission", label: "Misión", multiline: true, placeholder: "Misión de la institución..." },
            { key: "vision", label: "Visión", multiline: true, placeholder: "Visión de la institución..." },
            { key: "hymn", label: "Himno institucional", multiline: true, placeholder: "Letra del himno..." },
            { key: "coexistenceManualText", label: "Manual de convivencia (texto)", multiline: true, placeholder: "Resumen o texto completo del manual de convivencia..." },
          ].map(({ key, label, multiline, placeholder }) => (
            <div key={key} className="space-y-1">
              <Label>{label}</Label>
              <Textarea
                rows={multiline ? 4 : 2}
                placeholder={placeholder}
                value={(infoForm as any)[key]}
                onChange={(e) => setI(key, e.target.value)}
              />
            </div>
          ))}

          <div className="grid grid-cols-2 gap-4">
            {[
              { key: "coexistenceManualUrl", label: "Manual de convivencia (PDF)" },
              { key: "peiUrl", label: "PEI (Proyecto Educativo Institucional)" },
              { key: "academicCalendarUrl", label: "Calendario académico" },
              { key: "internalRegulationsUrl", label: "Reglamento interno" },
            ].map(({ key, label }) => (
              <div key={key} className="space-y-1">
                <Label>{label}</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="https://... o sube un PDF"
                    value={(infoForm as any)[key]}
                    onChange={(e) => setI(key, e.target.value)}
                    className="flex-1 text-xs"
                  />
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept=".pdf"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const fd = new FormData();
                        fd.append("file", file);
                        fd.append("field", key);
                        try {
                          const res = await fetch("/api/admin/institution-docs/upload", {
                            method: "POST", body: fd, credentials: "include",
                          });
                          if (!res.ok) throw new Error("Error al subir");
                          const data = await res.json();
                          setI(key, data.url);
                          toast({ title: "PDF subido correctamente" });
                        } catch {
                          toast({ title: "Error al subir el PDF", variant: "destructive" });
                        }
                      }}
                    />
                    <span className="inline-flex items-center justify-center h-9 px-3 rounded-md border border-input bg-background hover:bg-muted text-xs cursor-pointer whitespace-nowrap">
                      Subir
                    </span>
                  </label>
                </div>
                {(infoForm as any)[key] && (
                  <a href={(infoForm as any)[key]} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline flex items-center gap-1 mt-0.5">
                    <FileText className="h-3 w-3" /> Ver archivo actual
                  </a>
                )}
              </div>
            ))}
          </div>

          <Button onClick={() => saveInfo.mutate()} disabled={saveInfo.isPending}>
            <Save className="h-4 w-4 mr-1" />
            {saveInfo.isPending ? "Guardando..." : "Guardar información"}
          </Button>
        </div>
      )}

      {/* Dialog agregar horario */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Agregar clase al horario</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Grupo</Label>
                <Select value={form.groupId} onValueChange={(v) => setF("groupId", v)}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                  <SelectContent>
                    {(academicGroups as any[]).map((g: any) => (
                      <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Materia</Label>
                <Select value={form.subjectId} onValueChange={(v) => setF("subjectId", v)}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                  <SelectContent>
                    {(subjects as any[]).map((s: any) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Docente</Label>
              <Select value={form.teacherId} onValueChange={(v) => setF("teacherId", v)}>
                <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                <SelectContent>
                  {(teachers as User[]).filter((u) => u.role === "teacher").map((u) => (
                    <SelectItem key={u.id} value={u.id}>{getFullName(u.firstName, u.lastName)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>Día</Label>
                <Select value={form.day} onValueChange={(v) => setF("day", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DAYS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Hora inicio</Label>
                <Input type="time" value={form.startTime} onChange={(e) => setF("startTime", e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Hora fin</Label>
                <Input type="time" value={form.endTime} onChange={(e) => setF("endTime", e.target.value)} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Salón (opcional)</Label>
              <Input placeholder="Ej: Aula 201" value={form.room} onChange={(e) => setF("room", e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button onClick={() => create.mutate()} disabled={create.isPending || !form.groupId || !form.subjectId || !form.teacherId || !form.startTime || !form.endTime}>
              Guardar horario
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}



// ─── OBSERVADOR DEL ESTUDIANTE ────────────────────────────────────────────────
 
function TabVinculosPadres() {
  const { toast } = useToast();
  const { data: links = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/parent-links"],
  });

  const respond = useMutation({
    mutationFn: ({ id, approve }: { id: string; approve: boolean }) =>
      apiRequest("POST", `/api/admin/parent-links/${id}/respond`, { approve }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/parent-links"] });
      toast({ title: "Actualizado" });
    },
    onError: () => toast({ title: "Error al actualizar", variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/parent-links/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/parent-links"] });
      toast({ title: "Vínculo eliminado" });
    },
  });

  const statusConfig: Record<string, { label: string; variant: any }> = {
    pending: { label: "Pendiente", variant: "outline" },
    approved: { label: "Aprobado", variant: "default" },
    rejected: { label: "Rechazado", variant: "destructive" },
  };

  if (isLoading) return <p className="text-sm text-muted-foreground">Cargando...</p>;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Link2 className="h-5 w-5" /> Vínculos padres/acudientes ↔ estudiantes
        </h2>
        <p className="text-sm text-muted-foreground">
          Cuando un padre se registra y da el correo de su hijo/a, aparece aquí como pendiente. Normalmente lo aprueba
          el propio estudiante desde su perfil, pero para primaria (o si el estudiante no responde) puedes aprobarlo tú directamente.
        </p>
      </div>

      {!links.length ? (
        <p className="text-sm text-muted-foreground py-6 text-center">No hay solicitudes de vínculo todavía.</p>
      ) : (
        <div className="divide-y rounded-lg border">
          {links.map((link: any) => (
            <div key={link.id} className="flex items-center justify-between gap-3 px-4 py-3 flex-wrap">
              <div className="min-w-0">
                <p className="text-sm font-medium">
                  {link.parentFirstName} {link.parentLastName}
                  <span className="text-muted-foreground font-normal"> ({link.parentEmail})</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  → hijo/a: {link.studentFirstName} {link.studentLastName}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant={statusConfig[link.status]?.variant || "outline"}>
                  {statusConfig[link.status]?.label || link.status}
                </Badge>
                {link.status === "pending" && (
                  <>
                    <Button size="sm" variant="outline" className="text-red-600" onClick={() => respond.mutate({ id: link.id, approve: false })}>
                      Rechazar
                    </Button>
                    <Button size="sm" onClick={() => respond.mutate({ id: link.id, approve: true })}>
                      Aprobar
                    </Button>
                  </>
                )}
                <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-red-600" onClick={() => remove.mutate(link.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TabObservador() {
  const { toast } = useToast();
  const { data: users = [] } = useQuery<User[]>({ queryKey: ["/api/admin/users", "student"] });
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const { data: observations = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/observations", selectedStudentId],
    queryFn: () =>
      fetch(
        `/api/admin/observations${selectedStudentId ? `?studentId=${selectedStudentId}` : ""}`,
        { credentials: "include" }
      ).then((r) => r.ok ? r.json() : []).then((d) => Array.isArray(d) ? d : []),
  });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    studentId: "",
    type: "positive",
    description: "",
    commitment: "",
    followUp: "",
  });
 
  const students = (users as User[]).filter((u) => u.role === "student");
 
  const create = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/observations", form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/observations"] });
      setShowForm(false);
      setForm({ studentId: "", type: "positive", description: "", commitment: "", followUp: "" });
      toast({ title: "Observación registrada" });
    },
    onError: () => toast({ title: "Error al guardar", variant: "destructive" }),
  });
 
  const del = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/observations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/observations"] });
      toast({ title: "Observación eliminada" });
    },
  });
 
  const typeConfig: Record<string, { label: string; variant: any; color: string }> = {
    positive: { label: "Positiva", variant: "default", color: "text-green-600" },
    negative: { label: "Negativa", variant: "destructive", color: "text-red-600" },
    commitment: { label: "Compromiso", variant: "outline", color: "text-blue-600" },
    followup: { label: "Seguimiento", variant: "secondary", color: "text-purple-600" },
  };
 
  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-center">
        <Select value={selectedStudentId || "__all__"} onValueChange={(v) => setSelectedStudentId(v === "__all__" ? "" : v)}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Filtrar por estudiante..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">Todos los estudiantes</SelectItem>
            {students.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {getFullName(s.firstName, s.lastName)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-1" /> Nueva observación
        </Button>
      </div>
 
      {isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : (
        <div className="space-y-3">
          {(Array.isArray(observations) ? observations : []).map((obs: any) => (
            <Card key={obs.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={typeConfig[obs.type]?.variant || "outline"}>
                        {typeConfig[obs.type]?.label || obs.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {obs.studentName || "Estudiante"} ·{" "}
                        {obs.createdAt ? new Date(obs.createdAt).toLocaleDateString("es-CO") : ""}
                      </span>
                    </div>
                    <p className="text-sm">{obs.description}</p>
                    {obs.commitment && (
                      <p className="text-xs text-muted-foreground mt-1">
                        <span className="font-medium">Compromiso:</span> {obs.commitment}
                      </p>
                    )}
                    {obs.followUp && (
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium">Seguimiento:</span> {obs.followUp}
                      </p>
                    )}
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => del.mutate(obs.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {observations.length === 0 && (
            <div className="text-center text-muted-foreground py-12">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p>Sin observaciones registradas</p>
            </div>
          )}
        </div>
      )}
 
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva observación</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Estudiante</Label>
                <Select
                  value={form.studentId}
                  onValueChange={(v) => setForm((p) => ({ ...p, studentId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {getFullName(s.firstName, s.lastName)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Tipo</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => setForm((p) => ({ ...p, type: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="positive">Positiva</SelectItem>
                    <SelectItem value="negative">Negativa</SelectItem>
                    <SelectItem value="commitment">Compromiso</SelectItem>
                    <SelectItem value="followup">Seguimiento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Descripción</Label>
              <Textarea
                placeholder="Descripción de la observación..."
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="space-y-1">
              <Label>Compromiso (opcional)</Label>
              <Input
                placeholder="Acuerdo o compromiso adquirido..."
                value={form.commitment}
                onChange={(e) => setForm((p) => ({ ...p, commitment: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Seguimiento (opcional)</Label>
              <Input
                placeholder="Fecha o nota de seguimiento..."
                value={form.followUp}
                onChange={(e) => setForm((p) => ({ ...p, followUp: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => create.mutate()}
              disabled={create.isPending || !form.studentId || !form.description}
            >
              Guardar observación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
 
// ─── BOLETINES ────────────────────────────────────────────────────────────────
 
function TabBoletines() {
  const { data: years = [] } = useQuery<any[]>({ queryKey: ["/api/admin/academic-years"] });
  const { data: academicGroups = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/academic-groups"],
  });
  const { data: periods = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/periods"],
  });
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("");
 
  const { data: reportData, isLoading } = useQuery<any>({
    queryKey: ["/api/admin/report-cards", selectedYear, selectedGroup, selectedPeriod],
    queryFn: () => {
      const params = new URLSearchParams();
      if (selectedYear) params.set("yearId", selectedYear);
      if (selectedGroup) params.set("groupId", selectedGroup);
      if (selectedPeriod) params.set("periodId", selectedPeriod);
      return fetch(`/api/admin/report-cards?${params}`, { credentials: "include" }).then((r) =>
        r.json()
      );
    },
    enabled: !!(selectedYear && selectedGroup),
  });
 
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" /> Filtros de boletín
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label>Año académico</Label>
              <Select value={selectedYear || "__all__"} onValueChange={(v) => setSelectedYear(v === "__all__" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar año..." />
                </SelectTrigger>
                <SelectContent>
                  {(years as any[]).map((y: any) => (
                    <SelectItem key={y.id} value={y.id}>
                      {y.year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Grupo</Label>
              <Select value={selectedGroup || "__all__"} onValueChange={(v) => setSelectedGroup(v === "__all__" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar grupo..." />
                </SelectTrigger>
                <SelectContent>
                  {(academicGroups as any[]).map((g: any) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Periodo</Label>
              <Select value={selectedPeriod || "__all__"} onValueChange={(v) => setSelectedPeriod(v === "__all__" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los periodos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todos</SelectItem>
                  {(periods as any[]).map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
 
      {!selectedYear || !selectedGroup ? (
        <div className="text-center text-muted-foreground py-12">
          <BarChart2 className="h-8 w-8 mx-auto mb-2 opacity-40" />
          <p>Selecciona año y grupo para ver los boletines</p>
        </div>
      ) : isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : (
        <div className="space-y-4">
          {/* Acciones de exportación del consolidado del grupo seleccionado */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const params = new URLSearchParams({ groupId: selectedGroup });
                if (selectedPeriod) params.set("periodId", selectedPeriod);
                window.open(`/api/admin/report-cards/export/excel?${params}`, "_blank");
              }}
            >
              <Layers className="h-4 w-4 mr-1" /> Descargar Excel
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const params = new URLSearchParams({ groupId: selectedGroup });
                if (selectedPeriod) params.set("periodId", selectedPeriod);
                window.open(`/api/admin/report-cards/export/pdf?${params}`, "_blank");
              }}
            >
              <FileText className="h-4 w-4 mr-1" /> Descargar PDF
            </Button>
          </div>
 
          {/* Tabla de notas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground font-normal">
                Notas del grupo —{" "}
                {(academicGroups as any[]).find((g: any) => g.id === selectedGroup)?.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {reportData?.students?.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Estudiante</TableHead>
                      {reportData?.subjects?.map((s: any) => (
                        <TableHead key={s.id} className="text-xs">
                          {s.name}
                        </TableHead>
                      ))}
                      <TableHead>Promedio</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.students.map((student: any) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium text-sm">
                          {getFullName(student.firstName, student.lastName)}
                        </TableCell>
                        {reportData?.subjects?.map((s: any) => (
                          <TableCell key={s.id} className="text-center text-sm">
                            {student.grades?.[s.id] ?? "—"}
                          </TableCell>
                        ))}
                        <TableCell className="font-semibold text-center">
                          {student.average ?? "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No hay datos de calificaciones para los filtros seleccionados.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
 
// ─── CLASSROOM (vista admin) ──────────────────────────────────────────────────
 
function TabClassroom() {
  const { toast } = useToast();
  const { data: courses = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/classroom/courses/all"],
    queryFn: () => fetch("/api/classroom/courses/all", { credentials: "include" }).then(r => r.json()).then(d => Array.isArray(d) ? d : []),
  });
  const { data: teachers = [] } = useQuery<any[]>({ queryKey: ["/api/admin/users", "teacher"] });
  const { data: academicGroups = [] } = useQuery<any[]>({ queryKey: ["/api/admin/academic-groups"] });
  const { data: gradesList = [] } = useQuery<any[]>({ queryKey: ["/api/admin/grades"] });
  const { data: subjects = [] } = useQuery<any[]>({ queryKey: ["/api/admin/subjects"] });
  const { data: years = [] } = useQuery<any[]>({ queryKey: ["/api/admin/academic-years"] });
  const { data: institution } = useQuery<any>({ queryKey: ["/api/admin/institution"] });
  const [showForm, setShowForm] = useState(false);
  const [selectedYearId, setSelectedYearId] = useState("");
  const { data: periods = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/academic-years", selectedYearId, "periods"],
    enabled: !!selectedYearId,
  });

  const [form, setForm] = useState({
    name: "", subject: "", teacherId: "", gradeId: "", groupId: "",
    academicYearId: "", academicPeriodId: "", semester: "", description: "",
  });

  const teacherList = (teachers as any[]).filter((u: any) => u.role === "teacher");
  const activeYear = (years as any[]).find((y: any) => y.isActive);

  const create = useMutation({
    mutationFn: () => apiRequest("POST", "/api/classroom/courses", {
      name: form.name,
      subject: form.subject,
      teacherId: form.teacherId,
      description: form.description,
      academicGroupId: form.groupId,   // academic group (10-1, etc)
      academicPeriodId: form.academicPeriodId,
      evaluationType: institution?.evaluationType || "quantitative",
      qualitativeScale: institution?.qualitativeScale,
      gradeScale: institution?.gradeScale,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classroom/courses/all"] });
      setShowForm(false);
      setForm({ name: "", subject: "", teacherId: "", gradeId: "", groupId: "",
        academicYearId: "", academicPeriodId: "", semester: "", description: "" });
      toast({ title: "Aula virtual creada" });
    },
    onError: (e: any) => toast({ title: "Error al crear el aula", description: e.message, variant: "destructive" }),
  });

  const toggleActive = useMutation({
    mutationFn: (c: any) => apiRequest("PATCH", `/api/classroom/courses/${c.id}`, { isActive: !c.isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/classroom/courses/all"] }),
  });

  const deleteCourse = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/classroom/courses/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/classroom/courses/all"] }),
  });

  const evalLabel = institution?.evaluationType === "qualitative" ? "Cualitativo"
    : institution?.evaluationType === "mixed" ? "Mixto" : "Cuantitativo";

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-muted-foreground">{(courses as any[]).length} aulas registradas</p>
          <p className="text-xs text-muted-foreground">
            Sistema evaluativo: <span className="font-medium text-foreground">{evalLabel}</span>
            {institution?.gradeScale ? ` (${institution.gradeScale})` : ""}
            {institution?.qualitativeScale ? ` — ${institution.qualitativeScale}` : ""}
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" /> Nueva aula
        </Button>
      </div>

      {isLoading ? <Skeleton className="h-48 w-full" /> : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Aula</TableHead>
                <TableHead>Materia</TableHead>
                <TableHead>Docente</TableHead>
                <TableHead>Grupo</TableHead>
                <TableHead>Periodo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(courses as any[]).map((c: any) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-sm">{c.subject}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {c.teacher ? getFullName(c.teacher.firstName, c.teacher.lastName) : "—"}
                  </TableCell>
                  <TableCell>{c.groupName || c.grade || "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{c.periodName || "—"}</TableCell>
                  <TableCell>
                    <Badge
                      variant={c.isActive ? "default" : "secondary"}
                      className="cursor-pointer"
                      onClick={() => toggleActive.mutate(c)}
                    >
                      {c.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button size="icon" variant="ghost" onClick={() => deleteCourse.mutate(c.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {(courses as any[]).length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Sin aulas registradas. Crea la primera.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nueva aula virtual</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            {/* Info del sistema evaluativo */}
            <div className="rounded-lg bg-primary/5 border border-primary/20 px-3 py-2 text-xs text-primary">
              Sistema evaluativo: <strong>{evalLabel}</strong>
              {institution?.gradeScale ? ` · ${institution.gradeScale}` : ""}
              {institution?.qualitativeScale ? ` · Niveles: ${institution.qualitativeScale}` : ""}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1">
                <Label>Nombre del aula *</Label>
                <Input placeholder="Ej: Matemáticas 10-1 — P1 2025"
                  value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Materia *</Label>
                <Select value={form.subject} onValueChange={v => setForm(p => ({ ...p, subject: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                  <SelectContent>
                    {(subjects as any[]).map((s: any) => (
                      <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Docente *</Label>
                <Select value={form.teacherId} onValueChange={v => setForm(p => ({ ...p, teacherId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                  <SelectContent>
                    {teacherList.map((t: any) => (
                      <SelectItem key={t.id} value={t.id}>{getFullName(t.firstName, t.lastName)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Grado</Label>
                <Select value={form.gradeId} onValueChange={v => setForm(p => ({ ...p, gradeId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                  <SelectContent>
                    {(gradesList as any[]).map((g: any) => (
                      <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Grupo</Label>
                <Select value={form.groupId} onValueChange={v => setForm(p => ({ ...p, groupId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                  <SelectContent>
                    {(academicGroups as any[]).map((g: any) => (
                      <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Año académico</Label>
                <Select value={form.academicYearId || activeYear?.id || ""}
                  onValueChange={v => { setForm(p => ({ ...p, academicYearId: v })); setSelectedYearId(v); }}>
                  <SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger>
                  <SelectContent>
                    {(years as any[]).map((y: any) => (
                      <SelectItem key={y.id} value={y.id}>{y.year}{y.isActive ? " (activo)" : ""}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Periodo académico</Label>
                <Select value={form.academicPeriodId} onValueChange={v => setForm(p => ({ ...p, academicPeriodId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecciona año primero..." /></SelectTrigger>
                  <SelectContent>
                    {(periods as any[]).map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}{p.isActive ? " ✓" : ""}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1">
                <Label>Descripción (opcional)</Label>
                <Textarea placeholder="Descripción del aula..." rows={2} className="resize-none"
                  value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button onClick={() => create.mutate()} disabled={create.isPending || !form.name || !form.subject || !form.teacherId}>
              {create.isPending ? "Creando..." : "Crear aula"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
 
// ─── BIBLIOTECA INSTITUCIONAL ─────────────────────────────────────────────────
 
function TabBiblioteca() {
  const { toast } = useToast();
  const { data: files = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/library"],
  });
  const [search, setSearch] = useState("");
 
  const filtered = (files as any[]).filter((f: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      f.fileName?.toLowerCase().includes(q) ||
      f.subject?.toLowerCase().includes(q) ||
      f.description?.toLowerCase().includes(q)
    );
  });
 
  const toggleApprove = useMutation({
    mutationFn: (f: any) =>
      apiRequest(f.approved ? "DELETE" : "POST", `/api/admin/files/${f.id}/approve`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/library"] });
      toast({ title: "Acceso actualizado" });
    },
  });
 
  const del = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/files/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/library"] });
      toast({ title: "Archivo eliminado" });
    },
  });
 
  return (
    <div className="space-y-4">
      <Input
        placeholder="Buscar archivos..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
 
      {isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Archivo</TableHead>
                <TableHead>Materia</TableHead>
                <TableHead>Visibilidad</TableHead>
                <TableHead>Acceso</TableHead>
                <TableHead>Tamaño</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((f: any) => (
                <TableRow key={f.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">{f.fileName}</span>
                    </div>
                    {f.description && (
                      <p className="text-xs text-muted-foreground truncate max-w-xs">
                        {f.description}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{f.subject || "—"}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        f.visibility === "public"
                          ? "default"
                          : f.visibility === "group"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {f.visibility === "public"
                        ? "Público"
                        : f.visibility === "group"
                        ? "Grupo"
                        : "Privado"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={f.approved}
                        onCheckedChange={() => toggleApprove.mutate(f)}
                      />
                      <span className="text-xs text-muted-foreground">
                        {f.approved ? "Aprobado" : "Pendiente"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {(f.fileSize / 1024 / 1024).toFixed(2)} MB
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <a href={f.fileUrl} target="_blank" rel="noopener noreferrer">
                        <Button size="icon" variant="ghost">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </a>
                      <Button size="icon" variant="ghost" onClick={() => del.mutate(f.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Sin archivos
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
 
function TabAuditoria() {
  const { data: logs = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/audit-logs"],
  });

  const actionLabels: Record<string, string> = {
    expel_student: "Expulsó a un estudiante",
    delete_user_permanent: "Eliminó un usuario permanentemente",
    create_observation: "Creó una observación",
    delete_observation: "Eliminó una observación",
    create_super_admin: "Creó un super administrador",
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" /> Bitácora de auditoría
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Registro de acciones administrativas sensibles: quién, qué y cuándo. Cubre expulsiones, borrados
            permanentes, observaciones y creación de super administradores — se irá ampliando a más acciones.
          </p>
          {isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : logs.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              <Shield className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p>Todavía no hay acciones registradas.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Quién</TableHead>
                  <TableHead>Acción</TableHead>
                  <TableHead>Detalles</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log: any) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString("es-CO")}
                    </TableCell>
                    <TableCell className="text-sm">{log.actorName || "—"}</TableCell>
                    <TableCell className="text-sm">{actionLabels[log.action] || log.action}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {log.entityId ? `${log.entityType || "registro"}: ${log.entityId.slice(0, 8)}...` : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── NAVEGACIÓN DE TABS ───────────────────────────────────────────────────────
 
const TAB_SECTIONS = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    component: TabDashboard,
  },
  {
    id: "colegio",
    label: "Colegio",
    icon: School,
    component: TabConfigColegio,
  },
  {
    id: "academica",
    label: "Académico",
    icon: Settings2,
    component: TabConfigAcademica,
  },
  {
    id: "materias",
    label: "Materias",
    icon: BookOpen,
    component: TabMaterias,
  },
  {
    id: "grados",
    label: "Grados/Grupos",
    icon: GraduationCap,
    component: TabGradosGrupos,
  },
  {
    id: "docentes",
    label: "Docentes",
    icon: UserCheck,
    component: TabDocentes,
  },
  {
    id: "estudiantes",
    label: "Estudiantes",
    icon: Users,
    component: TabEstudiantes,
  },
  {
    id: "matriculas",
    label: "Matrículas",
    icon: ClipboardList,
    component: TabMatriculas,
  },
  {
    id: "horarios",
    label: "Horarios",
    icon: Clock,
    component: TabHorarios,
  },
  {
    id: "observador",
    label: "Observador",
    icon: Eye,
    component: TabObservador,
  },
  {
    id: "vinculos-padres",
    label: "Padres/Acudientes",
    icon: Link2,
    component: TabVinculosPadres,
  },
  {
    id: "boletines",
    label: "Boletines",
    icon: BarChart2,
    component: TabBoletines,
  },
  {
    id: "classroom",
    label: "Classroom",
    icon: Monitor,
    component: TabClassroom,
  },
  {
    id: "biblioteca",
    label: "Biblioteca",
    icon: BookMarked,
    component: TabBiblioteca,
  },
  {
    id: "codigos",
    label: "Códigos",
    icon: Key,
    component: TabCodigos,
  },
  {
    id: "auditoria",
    label: "Auditoría",
    icon: Shield,
    component: TabAuditoria,
  },
];
 
// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
 
export default function InstitutionalAdmin() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("dashboard");
 
  const allowedRoles = ["admin", "director", "coordinator", "secretary"];
 
  useEffect(() => {
    if (user && !allowedRoles.includes(user.role)) {
      toast({
        title: "Acceso denegado",
        description: "No tienes permisos para este panel.",
        variant: "destructive",
      });
      setLocation("/");
    }
  }, [user, setLocation, toast]);
 
  const { data: institutionConfig } = useQuery<any>({
    queryKey: ["/api/admin/institution"],
  });
 
  const ActiveComponent =
    TAB_SECTIONS.find((t) => t.id === activeTab)?.component || TabDashboard;
 
  return (
    <AppLayout>
      <div className="flex min-h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col w-56 border-r bg-card/50 py-4 px-2 flex-shrink-0">
          {/* Institution header */}
          <div className="px-3 mb-4">
            {institutionConfig?.logoUrl && (
              <img
                src={institutionConfig.logoUrl}
                alt="Logo"
                className="h-8 object-contain mb-2"
              />
            )}
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">
              {institutionConfig?.institutionName || "Panel Institucional"}
            </p>
          </div>
 
          <nav className="flex-1 space-y-0.5">
            {TAB_SECTIONS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all ${
                    isActive
                      ? "bg-primary text-primary-foreground font-medium"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </nav>
 
          <div className="px-3 pt-3 border-t">
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            <Badge variant="outline" className="text-xs mt-1 capitalize">
              {user?.role}
            </Badge>
          </div>
        </aside>
 
        {/* Mobile tabs */}
        <div className="lg:hidden w-full">
          <div className="border-b bg-card px-4 py-2 overflow-x-auto">
            <div className="flex gap-1 min-w-max">
              {TAB_SECTIONS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-all ${
                      activeTab === tab.id
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <Icon className="h-3 w-3" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
 
        {/* Main content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {/* Page header */}
          <div className="mb-6">
            <h1 className="text-xl font-bold flex items-center gap-2">
              {(() => {
                const tab = TAB_SECTIONS.find((t) => t.id === activeTab);
                const Icon = tab?.icon || LayoutDashboard;
                return (
                  <>
                    <Icon className="h-5 w-5 text-primary" />
                    {tab?.label}
                  </>
                );
              })()}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {institutionConfig?.institutionName
                ? `${institutionConfig.institutionName} · Panel administrativo`
                : "Panel administrativo institucional"}
            </p>
          </div>
 
          <TabErrorBoundary tabId={activeTab}>
            <ActiveComponent />
          </TabErrorBoundary>
        </main>
      </div>
    </AppLayout>
  );
}
 