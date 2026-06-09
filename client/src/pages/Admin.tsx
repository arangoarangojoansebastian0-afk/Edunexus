import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getFullName, getInitials, formatRole } from "@/lib/authUtils";
import { useLocation } from "wouter";
import { useEffect } from "react";
import {
  Shield, Users, Flag, FileText, Award, Palette, BookOpen,
  ClipboardList, Calendar, BarChart2, Key, GraduationCap,
  Plus, Trash2, Edit, CheckCircle, XCircle, Eye, Ban,
  RefreshCw, UserX, UserCheck, Save, School,
} from "lucide-react";
import { BadgeManager } from "@/components/admin/BadgeManager";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { User, Report } from "@shared/schema";

// ─── Helpers ────────────────────────────────────────────────────────────────
function randomCode(prefix: string) {
  return `${prefix}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}

// ─── Sub-componentes por tab ─────────────────────────────────────────────────

function TabApariencia() {
  const { toast } = useToast();
  const { data: config, isLoading } = useQuery<any>({ queryKey: ["/api/admin/institution"] });
  const [form, setForm] = useState({ institutionName: "", logoUrl: "", evaluationType: "quantitative", passingGrade: "3.0" });

  useEffect(() => {
    if (config) setForm({ institutionName: config.institutionName || "", logoUrl: config.logoUrl || "", evaluationType: config.evaluationType || "quantitative", passingGrade: config.passingGrade || "3.0" });
  }, [config]);

  const save = useMutation({
    mutationFn: () => apiRequest("PATCH", "/api/admin/institution", form),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/institution"] }); toast({ title: "Guardado", description: "Configuración actualizada." }); },
    onError: () => toast({ title: "Error", description: "No se pudo guardar.", variant: "destructive" }),
  });

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  return (
    <div className="space-y-6 max-w-xl">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Palette className="h-5 w-5" /> Identidad del colegio</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nombre del colegio</Label>
            <Input placeholder="Ej: Colegio Loyola" value={form.institutionName} onChange={e => setForm(p => ({ ...p, institutionName: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>URL del logo</Label>
            <Input placeholder="https://..." value={form.logoUrl} onChange={e => setForm(p => ({ ...p, logoUrl: e.target.value }))} />
            {form.logoUrl && <img src={form.logoUrl} alt="Logo" className="h-16 mt-2 rounded border object-contain" />}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><BarChart2 className="h-5 w-5" /> Sistema evaluativo</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo de evaluación</Label>
            <Select value={form.evaluationType} onValueChange={v => setForm(p => ({ ...p, evaluationType: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="quantitative">Cuantitativo (numérico)</SelectItem>
                <SelectItem value="qualitative">Cualitativo (conceptual)</SelectItem>
                <SelectItem value="mixed">Mixto</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Nota mínima aprobatoria</Label>
            <Input placeholder="Ej: 3.0" value={form.passingGrade} onChange={e => setForm(p => ({ ...p, passingGrade: e.target.value }))} />
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

function TabMaterias() {
  const { toast } = useToast();
  const { data: subjects = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/admin/subjects"] });
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ code: "", name: "", description: "", color: "#6366f1" });

  const save = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/subjects", editing ? { ...form, id: editing.id } : form),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/subjects"] }); setShowForm(false); setEditing(null); setForm({ code: "", name: "", description: "", color: "#6366f1" }); toast({ title: editing ? "Materia actualizada" : "Materia creada" }); },
    onError: () => toast({ title: "Error", variant: "destructive" }),
  });

  const del = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/subjects/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/subjects"] }); toast({ title: "Materia eliminada" }); },
  });

  function openEdit(s: any) { setEditing(s); setForm({ code: s.code, name: s.name, description: s.description || "", color: s.color || "#6366f1" }); setShowForm(true); }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{subjects.length} materias registradas</p>
        <Button size="sm" onClick={() => { setEditing(null); setForm({ code: "", name: "", description: "", color: "#6366f1" }); setShowForm(true); }}>
          <Plus className="h-4 w-4 mr-1" /> Nueva materia
        </Button>
      </div>

      {isLoading ? <Skeleton className="h-40 w-full" /> : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Color</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subjects.map((s: any) => (
                <TableRow key={s.id}>
                  <TableCell><div className="w-5 h-5 rounded-full border" style={{ background: s.color || "#6366f1" }} /></TableCell>
                  <TableCell className="font-mono text-sm">{s.code}</TableCell>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell><Badge variant={s.active ? "default" : "secondary"}>{s.active ? "Activa" : "Inactiva"}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(s)}><Edit className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => del.mutate(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Editar materia" : "Nueva materia"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Código</Label><Input placeholder="MAT01" value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Color</Label><Input type="color" value={form.color} onChange={e => setForm(p => ({ ...p, color: e.target.value }))} className="h-9 px-2" /></div>
            </div>
            <div className="space-y-1"><Label>Nombre</Label><Input placeholder="Matemáticas" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
            <div className="space-y-1"><Label>Descripción</Label><Textarea placeholder="Descripción opcional..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending || !form.code || !form.name}>{save.isPending ? "Guardando..." : "Guardar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TabAniosPeriodos() {
  const { toast } = useToast();
  const { data: years = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/admin/academic-years"] });
  const [selectedYear, setSelectedYear] = useState<any>(null);
  const [showYearForm, setShowYearForm] = useState(false);
  const [showPeriodForm, setShowPeriodForm] = useState(false);
  const [yearForm, setYearForm] = useState({ year: new Date().getFullYear(), startDate: "", endDate: "" });
  const [periodForm, setPeriodForm] = useState({ name: "", startDate: "", endDate: "" });

  const { data: periods = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/academic-years", selectedYear?.id, "periods"],
    queryFn: () => fetch(`/api/admin/academic-years/${selectedYear.id}/periods`, { credentials: "include" }).then(r => r.json()),
    enabled: !!selectedYear,
  });

  const createYear = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/academic-years", { year: yearForm.year, startDate: yearForm.startDate || undefined, endDate: yearForm.endDate || undefined }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/academic-years"] }); setShowYearForm(false); toast({ title: "Año creado" }); },
  });

  const activateYear = useMutation({
    mutationFn: (id: string) => apiRequest("PATCH", `/api/admin/academic-years/${id}/activate`, {}),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/academic-years"] }); toast({ title: "Año activado" }); },
  });

  const deleteYear = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/academic-years/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/academic-years"] }); toast({ title: "Año eliminado" }); },
  });

  const createPeriod = useMutation({
    mutationFn: () => apiRequest("POST", `/api/admin/academic-years/${selectedYear.id}/periods`, { name: periodForm.name, startDate: periodForm.startDate, endDate: periodForm.endDate }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/academic-years", selectedYear?.id, "periods"] }); setShowPeriodForm(false); toast({ title: "Periodo creado" }); },
  });

  const activatePeriod = useMutation({
    mutationFn: (id: string) => apiRequest("PATCH", `/api/admin/periods/${id}/activate`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/academic-years", selectedYear?.id, "periods"] }),
  });

  const deletePeriod = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/periods/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/academic-years", selectedYear?.id, "periods"] }),
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Años */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="font-medium flex items-center gap-2"><Calendar className="h-4 w-4" /> Años académicos</h3>
          <Button size="sm" onClick={() => setShowYearForm(true)}><Plus className="h-4 w-4 mr-1" /> Nuevo</Button>
        </div>
        {isLoading ? <Skeleton className="h-32 w-full" /> : years.map((y: any) => (
          <Card key={y.id} className={`cursor-pointer transition-all ${selectedYear?.id === y.id ? "border-primary" : ""}`} onClick={() => setSelectedYear(y)}>
            <CardContent className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-semibold">{y.year}</span>
                {y.isActive && <Badge variant="default" className="text-xs">Activo</Badge>}
              </div>
              <div className="flex gap-1">
                {!y.isActive && <Button size="icon" variant="ghost" onClick={e => { e.stopPropagation(); activateYear.mutate(y.id); }}><CheckCircle className="h-4 w-4 text-green-600" /></Button>}
                <Button size="icon" variant="ghost" onClick={e => { e.stopPropagation(); deleteYear.mutate(y.id); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Periodos */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="font-medium flex items-center gap-2"><ClipboardList className="h-4 w-4" /> Periodos {selectedYear ? `— ${selectedYear.year}` : ""}</h3>
          {selectedYear && <Button size="sm" onClick={() => setShowPeriodForm(true)}><Plus className="h-4 w-4 mr-1" /> Nuevo</Button>}
        </div>
        {!selectedYear ? (
          <p className="text-sm text-muted-foreground">Selecciona un año para ver sus periodos.</p>
        ) : periods.map((p: any) => (
          <Card key={p.id}>
            <CardContent className="p-3 flex items-center justify-between">
              <div>
                <p className="font-medium">{p.name}</p>
                <p className="text-xs text-muted-foreground">{p.startDate?.slice(0, 10)} → {p.endDate?.slice(0, 10)}</p>
              </div>
              <div className="flex gap-1 items-center">
                {p.isActive && <Badge variant="default" className="text-xs">Activo</Badge>}
                {!p.isActive && <Button size="icon" variant="ghost" onClick={() => activatePeriod.mutate(p.id)}><CheckCircle className="h-4 w-4 text-green-600" /></Button>}
                <Button size="icon" variant="ghost" onClick={() => deletePeriod.mutate(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialogs */}
      <Dialog open={showYearForm} onOpenChange={setShowYearForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nuevo año académico</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label>Año</Label><Input type="number" value={yearForm.year} onChange={e => setYearForm(p => ({ ...p, year: +e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Inicio</Label><Input type="date" value={yearForm.startDate} onChange={e => setYearForm(p => ({ ...p, startDate: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Fin</Label><Input type="date" value={yearForm.endDate} onChange={e => setYearForm(p => ({ ...p, endDate: e.target.value }))} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowYearForm(false)}>Cancelar</Button>
            <Button onClick={() => createYear.mutate()} disabled={createYear.isPending}>Crear año</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showPeriodForm} onOpenChange={setShowPeriodForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nuevo periodo</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label>Nombre del periodo</Label><Input placeholder="Periodo 1 / Primer bimestre..." value={periodForm.name} onChange={e => setPeriodForm(p => ({ ...p, name: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Inicio</Label><Input type="date" value={periodForm.startDate} onChange={e => setPeriodForm(p => ({ ...p, startDate: e.target.value }))} /></div>
              <div className="space-y-1"><Label>Fin</Label><Input type="date" value={periodForm.endDate} onChange={e => setPeriodForm(p => ({ ...p, endDate: e.target.value }))} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPeriodForm(false)}>Cancelar</Button>
            <Button onClick={() => createPeriod.mutate()} disabled={createPeriod.isPending || !periodForm.name}>Crear periodo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TabPersonas() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const { data: users = [], isLoading } = useQuery<User[]>({ queryKey: ["/api/admin/users", roleFilter] });

  const expel = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/admin/users/${id}/expel`, {}),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] }); toast({ title: "Estudiante expulsado" }); },
  });

  const block = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/admin/users/${id}/block`, {}),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] }); toast({ title: "Usuario bloqueado" }); },
  });

  const deletePermanent = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/users/${id}/permanent`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] }); toast({ title: "Usuario eliminado permanentemente" }); },
  });

  const changeRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: string }) => apiRequest("PATCH", `/api/admin/users/${id}/role`, { role }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] }); toast({ title: "Rol actualizado" }); },
  });

  const filtered = (users as User[]).filter(u => {
    if (roleFilter !== "all" && u.role !== roleFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <Input placeholder="Buscar por nombre o email..." value={search} onChange={e => setSearch(e.target.value)} className="flex-1" />
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los roles</SelectItem>
            <SelectItem value="student">Estudiantes</SelectItem>
            <SelectItem value="teacher">Maestros</SelectItem>
            <SelectItem value="coordinator">Coordinadores</SelectItem>
            <SelectItem value="director">Directores</SelectItem>
            <SelectItem value="secretary">Secretarias</SelectItem>
            <SelectItem value="admin">Administradores</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? <Skeleton className="h-64 w-full" /> : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(u => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={u.profileImageUrl || undefined} />
                        <AvatarFallback className="text-xs">{getInitials(u.firstName, u.lastName)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{getFullName(u.firstName, u.lastName)}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select value={u.role} onValueChange={role => changeRole.mutate({ id: u.id, role })}>
                      <SelectTrigger className="h-7 text-xs w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Estudiante</SelectItem>
                        <SelectItem value="teacher">Maestro</SelectItem>
                        <SelectItem value="coordinator">Coordinador</SelectItem>
                        <SelectItem value="director">Director</SelectItem>
                        <SelectItem value="secretary">Secretaria</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Badge variant={(u as any).isBlocked ? "destructive" : "default"} className="text-xs">
                      {(u as any).isBlocked ? "Bloqueado" : "Activo"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost"><Shield className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => block.mutate(u.id)} className="gap-2">
                          <Ban className="h-4 w-4" /> Bloquear cuenta
                        </DropdownMenuItem>
                        {u.role === "student" && (
                          <DropdownMenuItem onClick={() => expel.mutate(u.id)} className="gap-2 text-amber-600">
                            <UserX className="h-4 w-4" /> Expulsar del colegio
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => { if (confirm("¿Eliminar permanentemente?")) deletePermanent.mutate(u.id); }} className="gap-2 text-destructive">
                          <Trash2 className="h-4 w-4" /> Eliminar definitivamente
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

function TabCodigos() {
  const { toast } = useToast();
  const { data: teacherCodesData = [], isLoading: loadingT } = useQuery<any[]>({ queryKey: ["/api/admin/codes/teacher"] });
  const { data: staffCodesData = [], isLoading: loadingS } = useQuery<any[]>({ queryKey: ["/api/admin/codes/staff"] });
  const [newTeacherCode, setNewTeacherCode] = useState("");
  const [newStaffCode, setNewStaffCode] = useState({ code: "", role: "coordinator" });

  const createTeacher = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/codes/teacher", { code: newTeacherCode }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/codes/teacher"] }); setNewTeacherCode(""); toast({ title: "Código de maestro creado" }); },
  });

  const deleteTeacher = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/codes/teacher/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/codes/teacher"] }); toast({ title: "Código eliminado" }); },
  });

  const createStaff = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/codes/staff", newStaffCode),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/codes/staff"] }); setNewStaffCode({ code: "", role: "coordinator" }); toast({ title: "Código creado" }); },
  });

  const deleteStaff = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/codes/staff/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/codes/staff"] }); toast({ title: "Código eliminado" }); },
  });

  const roleLabel: Record<string, string> = { teacher: "Maestro", coordinator: "Coordinador", director: "Director", secretary: "Secretaria", admin: "Administrador" };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Códigos de maestro */}
      <div className="space-y-3">
        <h3 className="font-medium flex items-center gap-2"><Key className="h-4 w-4" /> Códigos de maestro</h3>
        <div className="flex gap-2">
          <Input placeholder="Ej: TEACH-2024" value={newTeacherCode} onChange={e => setNewTeacherCode(e.target.value)} />
          <Button size="icon" variant="outline" onClick={() => setNewTeacherCode(randomCode("TCH"))} title="Generar"><RefreshCw className="h-4 w-4" /></Button>
          <Button onClick={() => createTeacher.mutate()} disabled={!newTeacherCode || createTeacher.isPending}><Plus className="h-4 w-4" /></Button>
        </div>
        {loadingT ? <Skeleton className="h-24 w-full" /> : (
          <div className="space-y-2">
            {(teacherCodesData as any[]).map((c: any) => (
              <div key={c.id} className="flex items-center justify-between p-2 rounded-lg border bg-muted/30">
                <code className="text-sm font-mono">{c.code}</code>
                <Button size="icon" variant="ghost" onClick={() => deleteTeacher.mutate(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            ))}
            {teacherCodesData.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Sin códigos creados</p>}
          </div>
        )}
      </div>

      {/* Códigos de staff */}
      <div className="space-y-3">
        <h3 className="font-medium flex items-center gap-2"><Key className="h-4 w-4" /> Códigos de directivos</h3>
        <div className="flex gap-2">
          <Input placeholder="Código" value={newStaffCode.code} onChange={e => setNewStaffCode(p => ({ ...p, code: e.target.value }))} className="flex-1" />
          <Button size="icon" variant="outline" onClick={() => setNewStaffCode(p => ({ ...p, code: randomCode("STF") }))} title="Generar"><RefreshCw className="h-4 w-4" /></Button>
        </div>
        <div className="flex gap-2">
          <Select value={newStaffCode.role} onValueChange={v => setNewStaffCode(p => ({ ...p, role: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="coordinator">Coordinador</SelectItem>
              <SelectItem value="director">Director</SelectItem>
              <SelectItem value="secretary">Secretaria</SelectItem>
              <SelectItem value="admin">Administrador</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => createStaff.mutate()} disabled={!newStaffCode.code || createStaff.isPending}><Plus className="h-4 w-4 mr-1" />Crear</Button>
        </div>
        {loadingS ? <Skeleton className="h-24 w-full" /> : (
          <div className="space-y-2">
            {(staffCodesData as any[]).map((c: any) => (
              <div key={c.id} className="flex items-center justify-between p-2 rounded-lg border bg-muted/30">
                <div>
                  <code className="text-sm font-mono">{c.code}</code>
                  <Badge variant="outline" className="ml-2 text-xs">{roleLabel[c.role] || c.role}</Badge>
                </div>
                <Button size="icon" variant="ghost" onClick={() => deleteStaff.mutate(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            ))}
            {staffCodesData.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Sin códigos creados</p>}
          </div>
        )}
      </div>
    </div>
  );
}

function TabMatriculas() {
  const { toast } = useToast();
  const { data: years = [] } = useQuery<any[]>({ queryKey: ["/api/admin/academic-years"] });
  const { data: groups = [] } = useQuery<any[]>({ queryKey: ["/api/admin/academic-groups"] });
  const { data: users = [] } = useQuery<User[]>({ queryKey: ["/api/admin/users", "student"] });
  const [selectedYear, setSelectedYear] = useState("");
  const { data: enrollments = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/enrollments", selectedYear],
    queryFn: () => fetch(`/api/admin/enrollments${selectedYear ? `?yearId=${selectedYear}` : ""}`, { credentials: "include" }).then(r => r.json()),
  });
  const [form, setForm] = useState({ studentId: "", groupId: "", academicYearId: "", studentCode: "" });
  const [showForm, setShowForm] = useState(false);

  const students = (users as User[]).filter(u => u.role === "student");

  const create = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/enrollments", form),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/enrollments"] }); setShowForm(false); toast({ title: "Matrícula creada" }); },
    onError: () => toast({ title: "Error al matricular", variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/enrollments/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/enrollments"] }); toast({ title: "Matrícula eliminada" }); },
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Filtrar por año" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos los años</SelectItem>
            {(years as any[]).map((y: any) => <SelectItem key={y.id} value={y.id}>{y.year}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button size="sm" onClick={() => setShowForm(true)}><Plus className="h-4 w-4 mr-1" /> Matricular estudiante</Button>
      </div>

      {isLoading ? <Skeleton className="h-64 w-full" /> : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Estudiante</TableHead>
                <TableHead>Grupo</TableHead>
                <TableHead>Código</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(enrollments as any[]).map((e: any) => (
                <TableRow key={e.enrollment?.id || e.id}>
                  <TableCell className="font-medium">{getFullName(e.student?.firstName, e.student?.lastName)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{e.enrollment?.groupId || "—"}</TableCell>
                  <TableCell><code className="text-xs">{e.enrollment?.studentCode || "—"}</code></TableCell>
                  <TableCell>
                    <Button size="icon" variant="ghost" onClick={() => remove.mutate(e.enrollment?.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {enrollments.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Sin matrículas registradas</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader><DialogTitle>Matricular estudiante</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Estudiante</Label>
              <Select value={form.studentId} onValueChange={v => setForm(p => ({ ...p, studentId: v }))}>
                <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                <SelectContent>
                  {students.map(s => <SelectItem key={s.id} value={s.id}>{getFullName(s.firstName, s.lastName)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Grupo</Label>
              <Select value={form.groupId} onValueChange={v => setForm(p => ({ ...p, groupId: v }))}>
                <SelectTrigger><SelectValue placeholder="Seleccionar grupo..." /></SelectTrigger>
                <SelectContent>
                  {(groups as any[]).map((g: any) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Año académico</Label>
              <Select value={form.academicYearId} onValueChange={v => setForm(p => ({ ...p, academicYearId: v }))}>
                <SelectTrigger><SelectValue placeholder="Seleccionar año..." /></SelectTrigger>
                <SelectContent>
                  {(years as any[]).map((y: any) => <SelectItem key={y.id} value={y.id}>{y.year}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Código de estudiante (opcional)</Label>
              <Input placeholder="Ej: 2024-001" value={form.studentCode} onChange={e => setForm(p => ({ ...p, studentCode: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button onClick={() => create.mutate()} disabled={create.isPending || !form.studentId || !form.groupId || !form.academicYearId}>Matricular</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Componente principal ────────────────────────────────────────────────────
export default function Admin() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [reportStatusFilter, setReportStatusFilter] = useState("pending");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");

  useEffect(() => {
    if (user && user.role !== "admin" && user.role !== "teacher" && user.role !== "director" && user.role !== "coordinator") {
      toast({ title: "Acceso denegado", description: "No tienes permisos.", variant: "destructive" });
      setLocation("/");
    }
  }, [user, setLocation, toast]);

  const isAdmin = user?.role === "admin";

  const { data: stats } = useQuery<any>({ queryKey: ["/api/admin/stats"], enabled: isAdmin });
  const { data: reports = [], isLoading: reportsLoading } = useQuery<Report[]>({ queryKey: ["/api/admin/reports", reportStatusFilter], enabled: isAdmin });
  const { data: pendingFiles = [], isLoading: filesLoading } = useQuery<any[]>({ queryKey: ["/api/admin/files/pending"], enabled: isAdmin });

  const resolveReport = useMutation({
    mutationFn: ({ reportId, action, notes }: { reportId: string; action: string; notes: string }) =>
      apiRequest("POST", `/api/admin/reports/${reportId}/resolve`, { action, notes }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/reports"] }); setSelectedReport(null); setReviewNotes(""); },
  });

  const approveFile = useMutation({
    mutationFn: (id: string) => apiRequest("POST", `/api/admin/files/${id}/approve`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/files/pending"] }),
  });

  const rejectFile = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/files/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/files/pending"] }),
  });

  return (
    <AppLayout>
      <div className="container mx-auto p-4 max-w-6xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" /> Panel de Administración
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Gestión completa de la institución</p>
        </div>

        {isAdmin && stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: "Usuarios", value: stats.totalUsers, icon: Users },
              { label: "Posts", value: stats.totalPosts, icon: FileText },
              { label: "Reportes", value: stats.pendingReports, icon: Flag },
              { label: "Archivos pendientes", value: stats.pendingFiles, icon: School },
            ].map(({ label, value, icon: Icon }) => (
              <Card key={label}>
                <CardContent className="p-4 flex items-center gap-3">
                  <Icon className="h-8 w-8 text-primary opacity-80" />
                  <div>
                    <p className="text-2xl font-bold">{value ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Tabs defaultValue="apariencia">
          <TabsList className="flex-wrap h-auto gap-1 mb-4">
            {isAdmin && <>
              <TabsTrigger value="apariencia"><Palette className="h-4 w-4 mr-1" />Apariencia</TabsTrigger>
              <TabsTrigger value="materias"><BookOpen className="h-4 w-4 mr-1" />Materias</TabsTrigger>
              <TabsTrigger value="anios"><Calendar className="h-4 w-4 mr-1" />Años y periodos</TabsTrigger>
              <TabsTrigger value="matriculas"><ClipboardList className="h-4 w-4 mr-1" />Matrículas</TabsTrigger>
              <TabsTrigger value="personas"><Users className="h-4 w-4 mr-1" />Personas</TabsTrigger>
              <TabsTrigger value="codigos"><Key className="h-4 w-4 mr-1" />Códigos</TabsTrigger>
              <TabsTrigger value="reportes"><Flag className="h-4 w-4 mr-1" />Reportes</TabsTrigger>
              <TabsTrigger value="archivos"><FileText className="h-4 w-4 mr-1" />Archivos</TabsTrigger>
              <TabsTrigger value="insignias"><Award className="h-4 w-4 mr-1" />Insignias</TabsTrigger>
            </>}
            {!isAdmin && (
              <TabsTrigger value="reportes"><Flag className="h-4 w-4 mr-1" />Reportes</TabsTrigger>
            )}
          </TabsList>

          {isAdmin && <>
            <TabsContent value="apariencia" className="mt-4"><TabApariencia /></TabsContent>
            <TabsContent value="materias" className="mt-4"><TabMaterias /></TabsContent>
            <TabsContent value="anios" className="mt-4"><TabAniosPeriodos /></TabsContent>
            <TabsContent value="matriculas" className="mt-4"><TabMatriculas /></TabsContent>
            <TabsContent value="personas" className="mt-4"><TabPersonas /></TabsContent>
            <TabsContent value="codigos" className="mt-4"><TabCodigos /></TabsContent>
          </>}

          <TabsContent value="reportes" className="mt-4">
            <div className="flex gap-2 mb-4">
              {["pending", "resolved", "dismissed"].map(s => (
                <Button key={s} size="sm" variant={reportStatusFilter === s ? "default" : "outline"} onClick={() => setReportStatusFilter(s)}>
                  {s === "pending" ? "Pendientes" : s === "resolved" ? "Resueltos" : "Descartados"}
                </Button>
              ))}
            </div>
            {reportsLoading ? <Skeleton className="h-48 w-full" /> : (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead><TableHead>Razón</TableHead><TableHead>Estado</TableHead><TableHead>Fecha</TableHead><TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(reports as Report[]).map(r => (
                      <TableRow key={r.id}>
                        <TableCell><Badge variant="outline" className="capitalize">{r.targetType}</Badge></TableCell>
                        <TableCell className="max-w-xs truncate">{r.reason}</TableCell>
                        <TableCell><Badge variant={r.status === "pending" ? "secondary" : "default"}>{r.status}</Badge></TableCell>
                        <TableCell className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(r.createdAt), { addSuffix: true, locale: es })}</TableCell>
                        <TableCell><Button size="icon" variant="ghost" onClick={() => setSelectedReport(r)}><Eye className="h-4 w-4" /></Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="archivos" className="mt-4">
            {filesLoading ? <Skeleton className="h-48 w-full" /> : (
              <div className="space-y-3">
                {(pendingFiles as any[]).map((f: any) => (
                  <Card key={f.id}>
                    <CardContent className="p-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <FileText className="h-6 w-6 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{f.fileName}</p>
                          <p className="text-xs text-muted-foreground">{f.subject} · {(f.fileSize / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => approveFile.mutate(f.id)}><CheckCircle className="h-4 w-4 mr-1" />Aprobar</Button>
                        <Button size="sm" variant="outline" onClick={() => rejectFile.mutate(f.id)}><XCircle className="h-4 w-4 mr-1" />Rechazar</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {pendingFiles.length === 0 && <p className="text-center text-muted-foreground py-8">Sin archivos pendientes</p>}
              </div>
            )}
          </TabsContent>

          <TabsContent value="insignias" className="mt-4">
            <Card><CardHeader><CardTitle className="flex items-center gap-2"><Award className="h-5 w-5" />Gestionar Insignias</CardTitle></CardHeader><CardContent><BadgeManager /></CardContent></Card>
          </TabsContent>
        </Tabs>

        {/* Dialog reporte */}
        <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Revisar Reporte</DialogTitle></DialogHeader>
            {selectedReport && (
              <div className="space-y-3">
                <div><p className="text-sm font-medium mb-1">Tipo</p><Badge variant="outline" className="capitalize">{selectedReport.targetType}</Badge></div>
                <div><p className="text-sm font-medium mb-1">Razón</p><p className="text-sm text-muted-foreground">{selectedReport.reason}</p></div>
                <div><p className="text-sm font-medium mb-1">Notas</p><Textarea placeholder="Agrega notas..." value={reviewNotes} onChange={e => setReviewNotes(e.target.value)} /></div>
              </div>
            )}
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => selectedReport && resolveReport.mutate({ reportId: selectedReport.id, action: "dismiss", notes: reviewNotes })}>Descartar</Button>
              <Button variant="destructive" onClick={() => selectedReport && resolveReport.mutate({ reportId: selectedReport.id, action: "delete", notes: reviewNotes })}><Trash2 className="h-4 w-4 mr-1" />Eliminar contenido</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}