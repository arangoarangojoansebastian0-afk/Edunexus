import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { CalendarDays, Users, User, Clock } from "lucide-react";
import { getFullName } from "@/lib/authUtils";
import type { User as UserType } from "@shared/schema";

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
const DAY_MAP: Record<number, string> = {
  1: "Lunes", 2: "Martes", 3: "Miércoles", 4: "Jueves", 5: "Viernes", 6: "Sábado",
};

const SUBJECT_COLORS: Record<string, { bg: string; text: string }> = {
  Matemáticas: { bg: "#3b82f6", text: "#fff" },
  Español:     { bg: "#8b5cf6", text: "#fff" },
  Ciencias:    { bg: "#22c55e", text: "#fff" },
  Inglés:      { bg: "#f59e0b", text: "#fff" },
  Historia:    { bg: "#ef4444", text: "#fff" },
  Arte:        { bg: "#ec4899", text: "#fff" },
  Física:      { bg: "#06b6d4", text: "#fff" },
  Química:     { bg: "#f97316", text: "#fff" },
  Biología:    { bg: "#10b981", text: "#fff" },
  Educación:   { bg: "#6366f1", text: "#fff" },
  Música:      { bg: "#a855f7", text: "#fff" },
  Tecnología:  { bg: "#14b8a6", text: "#fff" },
};

function getSubjectStyle(name: string): { bg: string; text: string } {
  for (const [key, style] of Object.entries(SUBJECT_COLORS)) {
    if (name?.toLowerCase().includes(key.toLowerCase())) return style;
  }
  return { bg: "#6366f1", text: "#fff" };
}

function ScheduleGrid({ schedules, mode }: { schedules: any[]; mode: "group" | "teacher" }) {
  const usedHours = Array.from(new Set(schedules.map((s) => s.startTime))).sort();
  const displayHours = usedHours.length > 0
    ? usedHours
    : ["07:00","08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00"];

  const getCell = (day: string, hour: string) =>
    schedules.filter((s) => {
      const dayName = DAY_MAP[s.dayOfWeek] || "";
      return dayName === day && s.startTime <= hour && (s.endTime > hour || s.startTime === hour);
    });

  if (schedules.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
        <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
          <CalendarDays className="h-8 w-8 opacity-30" />
        </div>
        <p className="text-sm font-medium">No hay horarios registrados</p>
        <p className="text-xs opacity-60">Selecciona un grupo o docente para ver su horario</p>
      </div>
    );
  }

  return (
    <div className="overflow-auto">
      <div className="min-w-[640px]">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              <th className="w-16 p-2 text-left text-muted-foreground font-medium border-b border-r bg-muted/40 rounded-tl-lg">
                <Clock className="h-3.5 w-3.5" />
              </th>
              {DAYS.map((d) => (
                <th key={d} className="p-2.5 text-center font-semibold border-b border-r last:border-r-0 bg-muted/40 text-sm">
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayHours.map((hour, rowIdx) => (
              <tr key={hour} className={`border-b last:border-b-0 ${rowIdx % 2 === 0 ? "" : "bg-muted/10"}`}>
                <td className="p-2 text-muted-foreground border-r font-mono text-center align-top pt-3 text-[11px] font-medium">
                  {hour}
                </td>
                {DAYS.map((day) => {
                  const cells = getCell(day, hour);
                  return (
                    <td key={day} className="p-1 border-r last:border-r-0 align-top min-w-[120px] h-[60px]">
                      {cells.map((s: any, i: number) => {
                        const style = getSubjectStyle(s.subjectName || "");
                        return (
                          <div
                            key={i}
                            className="rounded-lg p-2 mb-0.5 text-xs leading-tight shadow-sm"
                            style={{ backgroundColor: style.bg + "e0", color: style.text }}
                          >
                            <p className="font-semibold truncate">{s.subjectName || "—"}</p>
                            <p className="opacity-80 truncate text-[10px] mt-0.5">
                              {mode === "group"
                                ? `${s.teacherFirstName || ""} ${s.teacherLastName || ""}`.trim()
                                : s.groupName || s.groupId}
                            </p>
                            {s.room && <p className="opacity-60 truncate text-[10px]">📍 {s.room}</p>}
                          </div>
                        );
                      })}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function Schedules() {
  const [viewMode, setViewMode] = useState<"group" | "teacher">("group");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState("");

  const { data: academicGroups = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/academic-groups"],
  });
  const { data: teachers = [] } = useQuery<UserType[]>({
    queryKey: ["/api/admin/users", "teacher"],
  });

  const { data: schedules = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/schedules", viewMode, selectedGroup, selectedTeacher],
    queryFn: () => {
      const p = new URLSearchParams();
      if (viewMode === "group" && selectedGroup) p.set("groupId", selectedGroup);
      if (viewMode === "teacher" && selectedTeacher) p.set("teacherId", selectedTeacher);
      return fetch(`/api/admin/schedules?${p}`, { credentials: "include" })
        .then((r) => r.ok ? r.json() : [])
        .then((d) => Array.isArray(d) ? d : []);
    },
  });

  const teacherList = (teachers as UserType[]).filter((u) => u.role === "teacher");
  const selectedGroupName = (academicGroups as any[]).find((g: any) => g.id === selectedGroup)?.name;
  const selectedTeacherObj = teacherList.find((t) => t.id === selectedTeacher);

  const title = viewMode === "group"
    ? selectedGroupName ? `Horario — ${selectedGroupName}` : "Horarios por Grupo"
    : selectedTeacherObj
      ? `Horario — ${getFullName(selectedTeacherObj.firstName, selectedTeacherObj.lastName)}`
      : "Horarios por Docente";

  return (
    <AppLayout title="Horarios" showSearch={false}>
      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <CalendarDays className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Horarios institucionales</h1>
              <p className="text-xs text-muted-foreground">Vista semanal por grupo o docente</p>
            </div>
          </div>
          {(selectedGroup || selectedTeacher) && (
            <Badge variant="secondary" className="text-xs px-3 py-1">
              {schedules.length} clase{schedules.length !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>

        {/* Controles */}
        <Card>
          <CardContent className="p-4 flex flex-wrap gap-3 items-center">
            {/* Toggle grupo / docente */}
            <div className="flex rounded-lg border overflow-hidden text-sm bg-muted/30">
              <button
                className={`flex items-center gap-1.5 px-4 py-2 transition-all duration-150 ${
                  viewMode === "group"
                    ? "bg-primary text-primary-foreground font-medium shadow-sm"
                    : "text-muted-foreground hover:bg-muted"
                }`}
                onClick={() => { setViewMode("group"); setSelectedTeacher(""); }}
              >
                <Users className="h-4 w-4" />
                Por grupo
              </button>
              <button
                className={`flex items-center gap-1.5 px-4 py-2 transition-all duration-150 ${
                  viewMode === "teacher"
                    ? "bg-primary text-primary-foreground font-medium shadow-sm"
                    : "text-muted-foreground hover:bg-muted"
                }`}
                onClick={() => { setViewMode("teacher"); setSelectedGroup(""); }}
              >
                <User className="h-4 w-4" />
                Por docente
              </button>
            </div>

            {viewMode === "group" ? (
              <Select value={selectedGroup || "__all__"} onValueChange={(v) => setSelectedGroup(v === "__all__" ? "" : v)}>
                <SelectTrigger className="w-52">
                  <SelectValue placeholder="Seleccionar grupo..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todos los grupos</SelectItem>
                  {(academicGroups as any[]).map((g: any) => (
                    <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Select value={selectedTeacher || "__all__"} onValueChange={(v) => setSelectedTeacher(v === "__all__" ? "" : v)}>
                <SelectTrigger className="w-56">
                  <SelectValue placeholder="Seleccionar docente..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todos los docentes</SelectItem>
                  {teacherList.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {getFullName(t.firstName, t.lastName)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </CardContent>
        </Card>

        {/* Grilla */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              {title}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 md:p-4">
            {isLoading ? (
              <div className="p-4 space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-64 w-full" />
              </div>
            ) : (
              <ScheduleGrid schedules={schedules} mode={viewMode} />
            )}
          </CardContent>
        </Card>

        {/* Grid de grupos o docentes */}
        {!selectedGroup && !selectedTeacher && viewMode === "group" && (academicGroups as any[]).length > 0 && (
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-3">Acceso rápido por grupo</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {(academicGroups as any[]).map((g: any) => (
                <button key={g.id} onClick={() => setSelectedGroup(g.id)} className="text-left group">
                  <Card className="hover:border-primary/50 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{g.name}</p>
                        <p className="text-xs text-muted-foreground">Ver horario →</p>
                      </div>
                    </CardContent>
                  </Card>
                </button>
              ))}
            </div>
          </div>
        )}

        {!selectedGroup && !selectedTeacher && viewMode === "teacher" && teacherList.length > 0 && (
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-3">Acceso rápido por docente</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {teacherList.map((t) => (
                <button key={t.id} onClick={() => setSelectedTeacher(t.id)} className="text-left group">
                  <Card className="hover:border-green-500/50 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-pointer">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-green-500/10 flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
                        <User className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{getFullName(t.firstName, t.lastName)}</p>
                        <p className="text-xs text-muted-foreground">Ver horario →</p>
                      </div>
                    </CardContent>
                  </Card>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
