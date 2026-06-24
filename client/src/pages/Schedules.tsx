import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Calendar, Users, User } from "lucide-react";
import { getFullName } from "@/lib/authUtils";
import type { User as UserType } from "@shared/schema";

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
const DAY_MAP: Record<number, string> = {
  1: "Lunes", 2: "Martes", 3: "Miércoles", 4: "Jueves", 5: "Viernes", 6: "Sábado",
};

function getSubjectColor(name: string): string {
  const colors: Record<string, string> = {
    Matemáticas: "#3b82f6", Español: "#8b5cf6", Ciencias: "#22c55e",
    Inglés: "#f59e0b", Historia: "#ef4444", Arte: "#ec4899",
    Física: "#06b6d4", Química: "#f97316", Biología: "#10b981",
    Educación: "#6366f1", Música: "#a855f7", Tecnología: "#14b8a6",
  };
  for (const [key, color] of Object.entries(colors)) {
    if (name?.toLowerCase().includes(key.toLowerCase())) return color;
  }
  return "#6366f1";
}

function ScheduleGrid({
  schedules,
  mode,
}: {
  schedules: any[];
  mode: "group" | "teacher";
}) {
  const usedHours = Array.from(
    new Set(schedules.map((s) => s.startTime))
  ).sort();
  const displayHours = usedHours.length > 0 ? usedHours : ["07:00","08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00"];

  const getCell = (day: string, hour: string) =>
    schedules.filter((s) => {
      const dayName = DAY_MAP[s.dayOfWeek] || "";
      return dayName === day && s.startTime <= hour && (s.endTime > hour || s.startTime === hour);
    });

  if (schedules.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
        <Calendar className="h-10 w-10 opacity-30" />
        <p className="text-sm">No hay horarios registrados</p>
      </div>
    );
  }

  return (
    <div className="overflow-auto">
      <div className="min-w-[640px]">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              <th className="w-14 p-2 text-left text-muted-foreground font-medium border-b border-r bg-muted/40">Hora</th>
              {DAYS.map((d) => (
                <th key={d} className="p-2 text-center font-semibold border-b border-r last:border-r-0 bg-muted/40 text-sm">
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {displayHours.map((hour) => (
              <tr key={hour} className="border-b last:border-b-0">
                <td className="p-2 text-muted-foreground border-r font-mono text-center align-top pt-2.5 text-xs">
                  {hour}
                </td>
                {DAYS.map((day) => {
                  const cells = getCell(day, hour);
                  return (
                    <td key={day} className="p-1 border-r last:border-r-0 align-top min-w-[110px] h-14">
                      {cells.map((s: any, i: number) => {
                        const color = s.subjectColor || getSubjectColor(s.subjectName || "");
                        return (
                          <div
                            key={i}
                            className="rounded-md p-1.5 mb-0.5 text-white text-xs leading-tight"
                            style={{ backgroundColor: color + "dd" }}
                          >
                            <p className="font-semibold truncate">{s.subjectName || "—"}</p>
                            {mode === "group" ? (
                              <p className="opacity-85 truncate">
                                {s.teacherFirstName} {s.teacherLastName}
                              </p>
                            ) : (
                              <p className="opacity-85 truncate">{s.groupName || s.groupId}</p>
                            )}
                            {s.room && <p className="opacity-70 truncate">📍 {s.room}</p>}
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
        <div className="flex items-center gap-3">
          <Calendar className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold">Horarios institucionales</h1>
        </div>

        {/* Controles */}
        <Card>
          <CardContent className="p-4 flex flex-wrap gap-3 items-center">
            {/* Toggle grupo / docente */}
            <div className="flex rounded-lg border overflow-hidden text-sm">
              <button
                className={`flex items-center gap-1.5 px-4 py-2 transition-colors ${
                  viewMode === "group"
                    ? "bg-primary text-primary-foreground"
                    : "bg-background hover:bg-muted text-muted-foreground"
                }`}
                onClick={() => { setViewMode("group"); setSelectedTeacher(""); }}
              >
                <Users className="h-4 w-4" />
                Por grupo
              </button>
              <button
                className={`flex items-center gap-1.5 px-4 py-2 transition-colors ${
                  viewMode === "teacher"
                    ? "bg-primary text-primary-foreground"
                    : "bg-background hover:bg-muted text-muted-foreground"
                }`}
                onClick={() => { setViewMode("teacher"); setSelectedGroup(""); }}
              >
                <User className="h-4 w-4" />
                Por docente
              </button>
            </div>

            {viewMode === "group" ? (
              <Select
                value={selectedGroup || "__all__"}
                onValueChange={(v) => setSelectedGroup(v === "__all__" ? "" : v)}
              >
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
              <Select
                value={selectedTeacher || "__all__"}
                onValueChange={(v) => setSelectedTeacher(v === "__all__" ? "" : v)}
              >
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

            {(selectedGroup || selectedTeacher) && (
              <Badge variant="secondary" className="text-xs">
                {schedules.length} clase{schedules.length !== 1 ? "s" : ""}
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* Grilla */}
        <Card>
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              {title}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ScheduleGrid schedules={schedules} mode={viewMode} />
            )}
          </CardContent>
        </Card>

        {/* Lista de todos los grupos (resumen rápido) */}
        {!selectedGroup && !selectedTeacher && viewMode === "group" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {(academicGroups as any[]).map((g: any) => (
              <button
                key={g.id}
                onClick={() => setSelectedGroup(g.id)}
                className="text-left"
              >
                <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{g.name}</p>
                      <p className="text-xs text-muted-foreground">Ver horario</p>
                    </div>
                  </CardContent>
                </Card>
              </button>
            ))}
          </div>
        )}

        {/* Lista de todos los docentes (resumen rápido) */}
        {!selectedGroup && !selectedTeacher && viewMode === "teacher" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {teacherList.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTeacher(t.id)}
                className="text-left"
              >
                <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <User className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{getFullName(t.firstName, t.lastName)}</p>
                      <p className="text-xs text-muted-foreground">Ver horario</p>
                    </div>
                  </CardContent>
                </Card>
              </button>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
