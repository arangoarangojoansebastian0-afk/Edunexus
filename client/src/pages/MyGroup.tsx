import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { AppLayout } from "@/components/layout/AppLayout";
import { EmptyState } from "@/components/EmptyState";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import {
  Users, MessageCircle, ClipboardList, Loader2, UserCheck, AlertTriangle, Info,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getFullName, getInitials } from "@/lib/authUtils";

interface RosterEntry {
  studentId: string;
  student: { id: string; firstName: string; lastName: string; email: string };
  parent: { id: string; firstName: string; lastName: string; email: string } | null;
  observationsCount: number;
  attendanceRate: number | null;
}

interface HomeroomGroup {
  id: string;
  name: string;
  grade: { name: string } | null;
  roster: RosterEntry[];
}

function attendanceBadgeColor(rate: number | null) {
  if (rate === null) return "bg-muted text-muted-foreground";
  if (rate >= 90) return "bg-green-100 text-green-700";
  if (rate >= 75) return "bg-yellow-100 text-yellow-700";
  return "bg-red-100 text-red-700";
}

function NewObservationDialog({
  groupId,
  student,
  open,
  onClose,
}: {
  groupId: string;
  student: RosterEntry["student"] | null;
  open: boolean;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [type, setType] = useState("positive");
  const [description, setDescription] = useState("");
  const [commitment, setCommitment] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", `/api/teacher/homeroom-groups/${groupId}/observations`, {
        studentId: student?.id,
        type,
        description,
        commitment: commitment || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/homeroom-groups"] });
      toast({ title: "Observación registrada" });
      setDescription("");
      setCommitment("");
      setType("positive");
      onClose();
    },
    onError: () => toast({ title: "Error al registrar la observación", variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Nueva observación {student ? `— ${getFullName(student.firstName, student.lastName)}` : ""}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Tipo</label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="positive">Positiva</SelectItem>
                <SelectItem value="negative">Negativa</SelectItem>
                <SelectItem value="neutral">Neutral / seguimiento</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Descripción</label>
            <Textarea
              className="mt-1 resize-none"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe lo sucedido..."
            />
          </div>
          <div>
            <label className="text-sm font-medium">Compromiso / seguimiento (opcional)</label>
            <Textarea
              className="mt-1 resize-none"
              rows={2}
              value={commitment}
              onChange={(e) => setCommitment(e.target.value)}
              placeholder="Ej: el estudiante se compromete a..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !description.trim()}
          >
            {mutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function GroupRoster({ group }: { group: HomeroomGroup }) {
  const [, navigate] = useLocation();
  const [obsStudent, setObsStudent] = useState<RosterEntry["student"] | null>(null);

  const atRisk = group.roster.filter(
    (r) => r.attendanceRate !== null && r.attendanceRate < 75
  ).length;

  return (
    <div className="space-y-4">
      {/* Resumen rápido */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-3 flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <div>
              <p className="text-lg font-bold leading-none">{group.roster.length}</p>
              <p className="text-xs text-muted-foreground">Estudiantes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <div>
              <p className="text-lg font-bold leading-none">{atRisk}</p>
              <p className="text-xs text-muted-foreground">Asistencia baja</p>
            </div>
          </CardContent>
        </Card>
        <Card className="hidden sm:block">
          <CardContent className="p-3 flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-amber-500" />
            <div>
              <p className="text-lg font-bold leading-none">
                {group.roster.reduce((sum, r) => sum + r.observationsCount, 0)}
              </p>
              <p className="text-xs text-muted-foreground">Observaciones totales</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Listado de estudiantes */}
      <div className="space-y-2">
        {group.roster.map((entry) => (
          <Card key={entry.student.id}>
            <CardContent className="p-3 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {getInitials(entry.student.firstName, entry.student.lastName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">
                    {getFullName(entry.student.firstName, entry.student.lastName)}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {entry.parent
                      ? `Acudiente: ${getFullName(entry.parent.firstName, entry.parent.lastName)}`
                      : "Sin acudiente vinculado"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className={attendanceBadgeColor(entry.attendanceRate)}>
                  {entry.attendanceRate !== null ? `${entry.attendanceRate}% asistencia` : "Sin registros"}
                </Badge>
                {entry.observationsCount > 0 && (
                  <Badge variant="outline">{entry.observationsCount} observ.</Badge>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setObsStudent(entry.student)}
                  data-testid={`button-new-observation-${entry.student.id}`}
                >
                  <ClipboardList className="h-3.5 w-3.5 mr-1.5" />
                  Observación
                </Button>
                {entry.parent && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/messages/${entry.parent!.id}`)}
                    data-testid={`button-message-parent-${entry.student.id}`}
                  >
                    <MessageCircle className="h-3.5 w-3.5 mr-1.5" />
                    Acudiente
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <NewObservationDialog
        groupId={group.id}
        student={obsStudent}
        open={!!obsStudent}
        onClose={() => setObsStudent(null)}
      />
    </div>
  );
}

export default function MyGroup() {
  const { data: groups, isLoading } = useQuery<HomeroomGroup[]>({
    queryKey: ["/api/teacher/homeroom-groups"],
  });

  return (
    <AppLayout>
      <div className="p-4 lg:p-6 max-w-4xl mx-auto space-y-4">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-primary" />
            Mi Grupo
          </h1>
          <p className="text-sm text-muted-foreground">
            Grupos donde eres director de grupo: asistencia, observaciones y contacto con acudientes.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !groups || groups.length === 0 ? (
          <EmptyState
            icon={Info}
            title="No tienes grupos a cargo"
            description="Cuando un directivo te asigne como director de un grado/grupo, aquí verás el listado completo de tus estudiantes."
          />
        ) : groups.length === 1 ? (
          <GroupRoster group={groups[0]} />
        ) : (
          <Tabs defaultValue={groups[0].id}>
            <TabsList>
              {groups.map((g) => (
                <TabsTrigger key={g.id} value={g.id}>{g.name}</TabsTrigger>
              ))}
            </TabsList>
            {groups.map((g) => (
              <TabsContent key={g.id} value={g.id} className="mt-4">
                <GroupRoster group={g} />
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </AppLayout>
  );
}
