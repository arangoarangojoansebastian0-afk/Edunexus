import { FileViewer } from "@/components/FileViewer";
import { useState, useRef, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useInstitutionSettings } from "@/hooks/useInstitutionSettings";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getFullName, getInitials } from "@/lib/authUtils";
import { EmptyState } from "@/components/EmptyState";
import { ActivityComments } from "@/components/ActivityComments";
import { CreatePostCard } from "@/components/posts/CreatePostCard";
import { PostCard } from "@/components/posts/PostCard";
import type { PostWithAuthor } from "@shared/schema";
import {
  ArrowLeft, Plus, ClipboardList, Users, BarChart3, CalendarCheck,
  Loader2, Send, BookOpen, GraduationCap, Clock, CheckCircle2,
  AlertCircle, FileText, Award, UserCheck, Paperclip, X, Download, Monitor,
  MessageSquare,
} from "lucide-react";
import { format, isPast } from "date-fns";
import { es } from "date-fns/locale";
import type { CourseWithTeacher, Activity, SubmissionWithStudent, AttendanceWithStudent } from "@shared/schema";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function FileChip({ name, onRemove }: { name: string; onRemove?: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted text-xs font-medium max-w-xs">
      <Paperclip className="h-3 w-3 shrink-0" />
      <span className="truncate">{name}</span>
      {onRemove && (
        <button type="button" onClick={onRemove} className="shrink-0 hover:text-destructive">
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}

// ─── Create Activity ──────────────────────────────────────────────────────────

const createActivitySchema = z.object({
  title: z.string().min(2, "Título requerido"),
  description: z.string().optional(),
  type: z.enum(["assignment", "project", "quiz", "exam"]),
  maxScore: z.coerce.number().min(1).max(1000).default(100),
  dueDate: z.string().optional(),
  isPublished: z.boolean().default(false),
});
type CreateActivityForm = z.infer<typeof createActivitySchema>;

const ACTIVITY_LABELS: Record<string, string> = {
  assignment: "Tarea",
  project: "Proyecto",
  quiz: "Quiz",
  exam: "Examen",
};

function CreateActivityDialog({
  courseId,
  open,
  onClose,
}: {
  courseId: string;
  open: boolean;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const form = useForm<CreateActivityForm>({
    resolver: zodResolver(createActivitySchema),
    defaultValues: {
      title: "",
      description: "",
      type: "assignment",
      maxScore: 100,
      dueDate: "",
      isPublished: true,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: CreateActivityForm) => {
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("type", data.type);
      formData.append("maxScore", String(data.maxScore));
      formData.append("isPublished", String(data.isPublished));
      if (data.description) formData.append("description", data.description);
      if (data.dueDate) formData.append("dueDate", new Date(data.dueDate).toISOString());
      attachments.forEach((f) => formData.append("attachments", f));

      const res = await fetch(`/api/classroom/courses/${courseId}/activities`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (!res.ok) throw new Error("Error al crear");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classroom/courses", courseId, "activities"] });
      toast({ title: "Actividad creada" });
      form.reset();
      setAttachments([]);
      onClose();
    },
    onError: () => toast({ title: "Error al crear actividad", variant: "destructive" }),
  });

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    setAttachments((prev) => [...prev, ...Array.from(files)]);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva actividad</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título *</FormLabel>
                  <FormControl><Input placeholder="Ej: Taller de álgebra" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {Object.entries(ACTIVITY_LABELS).map(([v, l]) => (
                          <SelectItem key={v} value={v}>{l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="maxScore"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Puntaje máximo</FormLabel>
                    <FormControl><Input type="number" min={1} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha límite</FormLabel>
                  <FormControl><Input type="datetime-local" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instrucciones</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe qué deben entregar..." className="resize-none" rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Attachments */}
            <div>
              <FormLabel>Archivos adjuntos (opcional)</FormLabel>
              <div className="mt-1.5 space-y-2">
                {attachments.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {attachments.map((f, i) => (
                      <FileChip
                        key={i}
                        name={f.name}
                        onRemove={() => setAttachments((prev) => prev.filter((_, j) => j !== i))}
                      />
                    ))}
                  </div>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileRef.current?.click()}
                >
                  <Paperclip className="h-3.5 w-3.5 mr-1.5" />
                  Adjuntar archivos
                </Button>
                <input
                  ref={fileRef}
                  type="file"
                  multiple
                  className="hidden"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={(e) => addFiles(e.target.files)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Crear
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Submit Activity ──────────────────────────────────────────────────────────

function SubmitDialog({
  activity,
  open,
  onClose,
}: {
  activity: Activity | null;
  open: boolean;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append("content", content);
      files.forEach((f) => formData.append("attachments", f));

      const res = await fetch(`/api/classroom/activities/${activity!.id}/submit`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (!res.ok) throw new Error("Error al entregar");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classroom/activities", activity!.id, "submissions"] });
      toast({ title: "Entrega realizada correctamente" });
      setContent("");
      setFiles([]);
      onClose();
    },
    onError: () => toast({ title: "Error al entregar", variant: "destructive" }),
  });

  const addFiles = (fl: FileList | null) => {
    if (!fl) return;
    setFiles((prev) => [...prev, ...Array.from(fl)]);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Entregar: {activity?.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {/* Show activity attachments if any */}
          {activity?.attachments && activity.attachments.length > 0 && (
            <div className="rounded-md bg-muted/50 p-3">
              <p className="text-xs font-medium text-muted-foreground mb-1.5">Archivos del docente:</p>
              <div className="flex flex-wrap gap-1.5">
                {activity.attachments.map((url, i) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-background border text-xs hover:bg-muted"
                  >
                    <Download className="h-3 w-3" />
                    Archivo {i + 1}
                  </a>
                ))}
              </div>
            </div>
          )}

          <Textarea
            placeholder="Escribe tu respuesta aquí..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
            className="resize-none"
          />

          {/* Student file attachments */}
          <div>
            <p className="text-xs font-medium mb-1.5">Adjuntar archivos (opcional)</p>
            {files.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {files.map((f, i) => (
                  <FileChip
                    key={i}
                    name={f.name}
                    onRemove={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                  />
                ))}
              </div>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileRef.current?.click()}
            >
              <Paperclip className="h-3.5 w-3.5 mr-1.5" />
              Adjuntar
            </Button>
            <input
              ref={fileRef}
              type="file"
              multiple
              className="hidden"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={(e) => addFiles(e.target.files)}
            />
          </div>
        </div>

        {activity?.id && user?.id && (
          <div className="border-t pt-3">
            <ActivityComments activityId={activity.id} studentId={user.id} currentUserId={user.id} />
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || (!content.trim() && files.length === 0)}
          >
            {mutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Entregar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Grade Dialog (soporta cuantitativo, cualitativo, mixto) ──────────────────

function GradeDialog({
  submission,
  maxScore,
  courseId,
  open,
  onClose,
}: {
  submission: SubmissionWithStudent | null;
  maxScore: number;
  courseId: string;
  open: boolean;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [grade, setGrade] = useState("");
  const [feedback, setFeedback] = useState("");

  // Leer sistema evaluativo de la institución
  const { data: institution } = useInstitutionSettings();
  const evaluationType = institution?.evaluationType || "quantitative";
  const qualitativeScale = (institution?.qualitativeScale || "Bajo,Básico,Alto,Superior")
    .split(",").map((l: string) => l.trim()).filter(Boolean);

  const mutation = useMutation({
    mutationFn: () =>
      apiRequest("PATCH", `/api/classroom/submissions/${submission!.id}/grade`, {
        grade,  // siempre string — el backend acepta varchar
        feedback,
      }),
    onSuccess: () => {
      // OJO: la grilla de calificaciones del curso usa una queryKey distinta
      // ("all-submissions"), no solo "activities" — si no se invalida también,
      // la nota se guarda bien en la BD pero la vista se queda con el dato viejo.
      queryClient.invalidateQueries({ queryKey: ["/api/classroom/activities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/classroom/courses", courseId, "all-submissions"] });
      queryClient.invalidateQueries({ predicate: (q) => q.queryKey[0] === "/api/classroom/activities" && q.queryKey[2] === "submissions" });
      toast({ title: "Calificación guardada" });
      setGrade(""); setFeedback("");
      onClose();
    },
    onError: () => toast({ title: "Error al calificar", variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Calificar a {submission ? getFullName(submission.student.firstName, submission.student.lastName) : ""}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {submission?.content && (
            <div className="rounded-md bg-muted p-3 text-sm">
              <p className="font-medium text-xs text-muted-foreground mb-1">Respuesta del estudiante:</p>
              <p className="whitespace-pre-wrap">{submission.content}</p>
            </div>
          )}

          {submission?.attachments && submission.attachments.length > 0 && (
            <div className="rounded-md bg-muted/50 p-3">
              <p className="text-xs font-medium text-muted-foreground mb-1.5">Archivos entregados:</p>
              <div className="flex flex-wrap gap-1.5">
                {submission.attachments.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-background border text-xs hover:bg-muted">
                    <Download className="h-3 w-3" />Archivo {i + 1}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Selector de nota según sistema evaluativo */}
          <div className="space-y-1">
            {evaluationType === "qualitative" ? (
              <>
                <label className="text-sm font-medium">Valoración cualitativa</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {qualitativeScale.map((level: string) => (
                    <button key={level} type="button"
                      onClick={() => setGrade(level)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                        grade === level
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted text-muted-foreground border-transparent hover:border-primary/40"
                      }`}>
                      {level}
                    </button>
                  ))}
                </div>
              </>
            ) : evaluationType === "mixed" ? (
              <>
                <label className="text-sm font-medium">Nota</label>
                <div className="flex flex-wrap gap-2 mt-1 mb-2">
                  {qualitativeScale.map((level: string) => (
                    <button key={level} type="button" onClick={() => setGrade(level)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                        grade === level ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-transparent hover:border-primary/40"
                      }`}>{level}</button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mb-1">O ingresa una nota numérica:</p>
                <Input placeholder={`0 – ${maxScore}`} value={grade} onChange={(e) => setGrade(e.target.value)} />
              </>
            ) : (
              <>
                <label className="text-sm font-medium">
                  Nota {institution?.gradeScale ? `(${institution.gradeScale})` : `(máx. ${maxScore})`}
                </label>
                <Input
                  type="number" min={0} max={maxScore}
                  value={grade} onChange={(e) => setGrade(e.target.value)}
                  className="mt-1" placeholder="0"
                />
              </>
            )}
          </div>

          <div>
            <label className="text-sm font-medium">Retroalimentación</label>
            <Textarea className="mt-1 resize-none" rows={3} value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Comentarios para el estudiante..." />
          </div>

          {submission?.activityId && submission?.studentId && (
            <div className="border-t pt-3">
              <ActivityComments
                activityId={submission.activityId}
                studentId={submission.studentId}
                currentUserId={user?.id}
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || !grade}>
            {mutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Guardar nota
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Attendance Tab ───────────────────────────────────────────────────────────

function AttendanceTab({
  courseId,
  isTeacher,
  students,
}: {
  courseId: string;
  isTeacher: boolean;
  students: { student: { id: string; firstName: string | null; lastName: string | null; profileImageUrl: string | null } }[];
}) {
  const { toast } = useToast();
  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [selectedTime, setSelectedTime] = useState("07:00");
  const [attendanceMap, setAttendanceMap] = useState<Record<string, string>>({});

  const { data: records } = useQuery<AttendanceWithStudent[]>({
    queryKey: ["/api/classroom/courses", courseId, "attendance", selectedDate],
    queryFn: () =>
      fetch(`/api/classroom/courses/${courseId}/attendance?date=${selectedDate}`, {
        credentials: "include",
      }).then((r) => r.json()),
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", `/api/classroom/courses/${courseId}/attendance`, {
        records: Object.entries(attendanceMap).map(([studentId, status]) => ({
          studentId,
          status,
          date: new Date(`${selectedDate}T${selectedTime}:00`).toISOString(),
        })),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classroom/courses", courseId, "attendance"] });
      setAttendanceMap({});
      toast({ title: "Asistencia guardada" });
    },
    onError: () => toast({ title: "Error al guardar asistencia", variant: "destructive" }),
  });

  // Mark all present shortcut
  const markAllPresent = () => {
    const all: Record<string, string> = {};
    students.forEach(({ student }) => { all[student.id] = "present"; });
    setAttendanceMap(all);
  };

  const statusColor: Record<string, string> = {
    present: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    absent: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    late: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
    excused: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  };
  const statusLabel: Record<string, string> = {
    present: "Presente",
    absent: "Ausente",
    late: "Tarde",
    excused: "Excusado",
  };

  const getStatus = (studentId: string) => {
    if (attendanceMap[studentId]) return attendanceMap[studentId];
    const record = records?.find((r) => r.studentId === studentId);
    return record?.status || "";
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">Fecha:</label>
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setAttendanceMap({});
            }}
            className="w-auto"
          />
        </div>
        {isTeacher && (
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Hora:</label>
            <Input
              type="time"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              className="w-28"
            />
          </div>
        )}
        {isTeacher && students.length > 0 && (
          <Button size="sm" variant="outline" onClick={markAllPresent}>
            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
            Todos presentes
          </Button>
        )}
        {isTeacher && Object.keys(attendanceMap).length > 0 && (
          <Button size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <UserCheck className="h-4 w-4 mr-2" />
            )}
            Guardar asistencia
          </Button>
        )}
      </div>

      {/* Summary badges */}
      {records && records.length > 0 && (
        <div className="flex gap-2 flex-wrap text-xs">
          {(["present", "absent", "late", "excused"] as const).map((s) => {
            const count = records.filter((r) => r.status === s).length;
            if (count === 0) return null;
            return (
              <span key={s} className={`px-2 py-0.5 rounded-full font-medium ${statusColor[s]}`}>
                {statusLabel[s]}: {count}
              </span>
            );
          })}
        </div>
      )}

      {students.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          No hay estudiantes inscritos en este curso
        </p>
      ) : (
        <div className="space-y-2">
          {students.map(({ student }) => {
            const status = getStatus(student.id);
            return (
              <div
                key={student.id}
                className="flex items-center justify-between p-3 rounded-md border"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={student.profileImageUrl || undefined} />
                    <AvatarFallback className="text-xs">
                      {getInitials(student.firstName, student.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">
                    {getFullName(student.firstName, student.lastName)}
                  </span>
                </div>
                {isTeacher ? (
                  <Select
                    value={status}
                    onValueChange={(v) =>
                      setAttendanceMap((prev) => ({ ...prev, [student.id]: v }))
                    }
                  >
                    <SelectTrigger className="w-32 h-8 text-xs">
                      <SelectValue placeholder="Marcar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusLabel).map(([v, l]) => (
                        <SelectItem key={v} value={v}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  status ? (
                    <Badge className={`text-xs no-default-active-elevate ${statusColor[status]}`}>
                      {statusLabel[status]}
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">Sin registro</span>
                  )
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

// ─── Students Tab con "Añadir grupo completo" ────────────────────────────────

function StudentsTab({ courseId, students, canManage }: {
  courseId: string;
  students: any[];
  canManage: boolean;
}) {
  const { toast } = useToast();
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [enrolling, setEnrolling] = useState(false);

  const { data: academicGroups = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/academic-groups"],
    enabled: canManage,
  });

  const enrollGroup = async () => {
    if (!selectedGroupId) return;
    setEnrolling(true);
    try {
      const res = await fetch(`/api/classroom/courses/${courseId}/enroll-group`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId: selectedGroupId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error");
      toast({
        title: `${data.enrolled} estudiante${data.enrolled !== 1 ? "s" : ""} añadido${data.enrolled !== 1 ? "s" : ""}`,
        description: data.skipped > 0 ? `${data.skipped} ya estaban inscritos` : undefined,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/classroom/courses", courseId, "students"] });
      setSelectedGroupId("");
    } catch (e: any) {
      toast({ title: "Error al añadir grupo", description: e.message, variant: "destructive" });
    }
    setEnrolling(false);
  };

  const removeStudent = useMutation({
    mutationFn: (studentId: string) =>
      fetch(`/api/classroom/courses/${courseId}/students/${studentId}`, {
        method: "DELETE", credentials: "include",
      }).then(r => { if (!r.ok) throw new Error(); }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classroom/courses", courseId, "students"] });
      toast({ title: "Estudiante eliminado del aula" });
    },
    onError: () => toast({ title: "Error al eliminar", variant: "destructive" }),
  });

  const groupName = (academicGroups as any[]).find(g => g.id === selectedGroupId)?.name;

  return (
    <div className="space-y-4">
      {/* Añadir grupo completo — solo docente/admin */}
      {canManage && (
        <Card className="border-dashed">
          <CardContent className="p-4">
            <p className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Añadir grupo completo al aula
            </p>
            <div className="flex gap-2">
              <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Selecciona un grupo..." />
                </SelectTrigger>
                <SelectContent>
                  {(academicGroups as any[]).map((g: any) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}
                      {students.some(s => s.student?.groupId === g.id) && (
                        <span className="ml-2 text-xs text-muted-foreground">(parcial)</span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={enrollGroup}
                disabled={!selectedGroupId || enrolling}
                className="shrink-0"
              >
                {enrolling ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                {enrolling ? "Añadiendo..." : groupName ? `Añadir ${groupName}` : "Añadir grupo"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Todos los estudiantes matriculados en ese grupo se inscribirán automáticamente. Los que ya estén inscritos se omiten.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Lista de estudiantes */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground font-medium">
          {students.length} estudiante{students.length !== 1 ? "s" : ""} inscrito{students.length !== 1 ? "s" : ""}
        </p>
      </div>

      {students.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed rounded-xl">
          <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-40" />
          <p className="font-medium text-muted-foreground">Sin estudiantes inscritos</p>
          {canManage && (
            <p className="text-xs text-muted-foreground mt-1">Usa el selector de arriba para añadir un grupo completo</p>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-2">
          {students.map(({ student }: any) => (
            <Card key={student.id} className="group hover:border-primary/30 transition-colors">
              <CardContent className="p-3 flex items-center gap-3">
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarImage src={student.profileImageUrl || undefined} />
                  <AvatarFallback className="text-sm">
                    {getInitials(student.firstName, student.lastName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {getFullName(student.firstName, student.lastName)}
                  </p>
                  {student.email && (
                    <p className="text-xs text-muted-foreground truncate">{student.email}</p>
                  )}
                </div>
                {canManage ? (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    onClick={() => removeStudent.mutate(student.id)}
                    title="Eliminar del aula"
                  >
                    <X className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                ) : (
                  <Badge variant="secondary" className="text-xs shrink-0">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Inscrito
                  </Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}


// ─── Google Classroom Tab ─────────────────────────────────────────────────────

function GoogleClassroomTab({ courseId, course }: { courseId: string; course: any }) {
  const { toast } = useToast();
  const [syncing, setSyncing] = useState(false);
  const [announcing, setAnnouncing] = useState(false);
  const [announcementText, setAnnouncementText] = useState("");

  const { data: gcStatus, refetch: refetchStatus } = useQuery<{ connected: boolean; email?: string }>({
    queryKey: ["/api/classroom/google/status"],
  });

  const { data: gcCourses = [] } = useQuery<any[]>({
    queryKey: ["/api/classroom/google/courses"],
    enabled: gcStatus?.connected === true,
  });

  const { data: institution } = useInstitutionSettings();
  const { data: academicGroups = [] } = useQuery<any[]>({ queryKey: ["/api/admin/academic-groups"] });
  const { data: subjects = [] } = useQuery<any[]>({ queryKey: ["/api/admin/subjects"] });
  const { data: periods = [] } = useQuery<any[]>({ queryKey: ["/api/admin/periods"] });

  const [linkedGcCourse, setLinkedGcCourse] = useState("");
  const [syncGroupId, setSyncGroupId] = useState("");
  const [syncSubjectId, setSyncSubjectId] = useState("");
  const [syncPeriodId, setSyncPeriodId] = useState("");

  // Al volver del consentimiento de Google, el callback redirige aquí mismo
  // con ?gc_connected=1 o ?gc_error=... — lo detectamos y refrescamos el estado.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get("gc_connected");
    const error = params.get("gc_error");
    if (connected) {
      refetchStatus();
      toast({ title: "Google Classroom conectado" });
      params.delete("gc_connected");
      const clean = `${window.location.pathname}${params.toString() ? `?${params}` : ""}`;
      window.history.replaceState({}, "", clean);
    } else if (error) {
      toast({ title: "Error al conectar Google Classroom", description: error, variant: "destructive" });
      params.delete("gc_error");
      const clean = `${window.location.pathname}${params.toString() ? `?${params}` : ""}`;
      window.history.replaceState({}, "", clean);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const connectGC = async () => {
    const res = await fetch("/api/classroom/google/auth-url?" + new URLSearchParams({
      returnTo: window.location.pathname,
    }));
    const { url } = await res.json();
    // Redirigir en la misma pestaña: abrir en popup con window.open provocaba
    // about:blank porque la navegación ocurría fuera del gesto de usuario síncrono.
    window.location.href = url;
  };

  const disconnectGC = useMutation({
    mutationFn: () => apiRequest("DELETE", "/api/classroom/google/disconnect"),
    onSuccess: () => { refetchStatus(); toast({ title: "Google Classroom desconectado" }); },
  });

  const linkCourse = useMutation({
    mutationFn: () => {
      const gc = (gcCourses as any[]).find((c: any) => c.id === linkedGcCourse);
      return apiRequest("POST", "/api/classroom/google/link", {
        courseId, gcCourseId: linkedGcCourse, gcCourseName: gc?.name,
      });
    },
    onSuccess: () => toast({ title: "Curso vinculado con Google Classroom" }),
    onError: () => toast({ title: "Error al vincular", variant: "destructive" }),
  });

  const syncStudents = async () => {
    if (!linkedGcCourse || !syncGroupId) {
      toast({ title: "Selecciona un curso de GC y un grupo", variant: "destructive" }); return;
    }
    setSyncing(true);
    try {
      const res = await fetch(`/api/classroom/google/sync-students/${linkedGcCourse}`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId: syncGroupId }),
      });
      const data = await res.json();
      toast({ title: `${data.invited} estudiantes invitados, ${data.errors} errores` });
    } catch { toast({ title: "Error al sincronizar estudiantes", variant: "destructive" }); }
    setSyncing(false);
  };

  const syncGrades = async () => {
    if (!linkedGcCourse || !syncSubjectId || !syncPeriodId || !syncGroupId) {
      toast({ title: "Completa todos los campos para sincronizar notas", variant: "destructive" }); return;
    }
    setSyncing(true);
    try {
      const res = await fetch(`/api/classroom/google/sync-grades/${linkedGcCourse}`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectId: syncSubjectId, groupId: syncGroupId, academicPeriodId: syncPeriodId,
          evaluationType: institution?.evaluationType || "quantitative",
          qualitativeScale: institution?.qualitativeScale || "Bajo,Básico,Alto,Superior",
          gradeScale: institution?.gradeScale || "1.0-5.0",
        }),
      });
      const data = await res.json();
      toast({ title: `${data.synced} calificaciones sincronizadas al boletín` });
    } catch { toast({ title: "Error al sincronizar notas", variant: "destructive" }); }
    setSyncing(false);
  };

  const sendAnnouncement = async () => {
    if (!linkedGcCourse || !announcementText.trim()) return;
    setAnnouncing(true);
    try {
      await fetch(`/api/classroom/google/announce/${linkedGcCourse}`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: announcementText }),
      });
      toast({ title: "Comunicado publicado en Google Classroom" });
      setAnnouncementText("");
    } catch { toast({ title: "Error al publicar", variant: "destructive" }); }
    setAnnouncing(false);
  };

  if (!gcStatus?.connected) {
    return (
      <Card>
        <CardContent className="py-12 text-center space-y-4">
          <div className="h-16 w-16 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto">
            <Monitor className="h-8 w-8 text-green-600" />
          </div>
          <div>
            <p className="font-semibold text-lg">Conecta Google Classroom</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
              Sincroniza tus clases, estudiantes y notas entre este sistema y Google Classroom con un clic.
            </p>
          </div>
          <Button onClick={connectGC} className="bg-green-600 hover:bg-green-700">
            <Monitor className="h-4 w-4 mr-2" />
            Conectar con Google
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Estado conexión */}
      <Card>
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Monitor className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-sm">Conectado a Google Classroom</p>
              <p className="text-xs text-muted-foreground">{gcStatus.email}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => disconnectGC.mutate()}>
            Desconectar
          </Button>
        </CardContent>
      </Card>

      {/* Vincular curso */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <p className="font-semibold text-sm">Vincular con curso de GC</p>
          <div className="flex gap-2">
            <Select value={linkedGcCourse} onValueChange={setLinkedGcCourse}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Selecciona un curso de Google Classroom..." />
              </SelectTrigger>
              <SelectContent>
                {(gcCourses as any[]).map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => linkCourse.mutate()} disabled={!linkedGcCourse || linkCourse.isPending}>
              Vincular
            </Button>
          </div>
        </CardContent>
      </Card>

      {linkedGcCourse && (
        <>
          {/* Sincronizar estudiantes */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <p className="font-semibold text-sm">Añadir estudiantes del grupo al curso de GC</p>
              <div className="flex gap-2">
                <Select value={syncGroupId} onValueChange={setSyncGroupId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Selecciona el grupo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {(academicGroups as any[]).map((g: any) => (
                      <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={syncStudents} disabled={syncing || !syncGroupId} className="bg-blue-600 hover:bg-blue-700">
                  {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4 mr-1" />}
                  Invitar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Invita a todos los estudiantes del grupo vía su correo institucional.
              </p>
            </CardContent>
          </Card>

          {/* Sincronizar notas */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div>
                <p className="font-semibold text-sm">Sincronizar notas al boletín</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Sistema: <strong>{institution?.evaluationType === "qualitative" ? "Cualitativo" : institution?.evaluationType === "mixed" ? "Mixto" : "Cuantitativo"}</strong>
                  {institution?.evaluationType !== "quantitative" && ` — ${institution?.qualitativeScale || "Bajo,Básico,Alto,Superior"}`}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Select value={syncSubjectId} onValueChange={setSyncSubjectId}>
                  <SelectTrigger><SelectValue placeholder="Materia..." /></SelectTrigger>
                  <SelectContent>
                    {(subjects as any[]).map((s: any) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={syncPeriodId} onValueChange={setSyncPeriodId}>
                  <SelectTrigger><SelectValue placeholder="Periodo..." /></SelectTrigger>
                  <SelectContent>
                    {(periods as any[]).map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={syncGrades} disabled={syncing || !syncSubjectId || !syncPeriodId || !syncGroupId}
                className="w-full bg-indigo-600 hover:bg-indigo-700">
                {syncing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <BarChart3 className="h-4 w-4 mr-2" />}
                Importar notas de GC → Boletín
              </Button>
            </CardContent>
          </Card>

          {/* Comunicados */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <p className="font-semibold text-sm">Publicar comunicado en GC</p>
              <Textarea
                value={announcementText}
                onChange={(e) => setAnnouncementText(e.target.value)}
                placeholder="Escribe el comunicado para los estudiantes en Google Classroom..."
                rows={3} className="resize-none"
              />
              <Button onClick={sendAnnouncement} disabled={announcing || !announcementText.trim()}
                className="w-full" variant="outline">
                {announcing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                Publicar en Google Classroom
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}


export default function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const [showCreateActivity, setShowCreateActivity] = useState(false);
  const [submitActivity, setSubmitActivity] = useState<Activity | null>(null);
  const [gradeSubmission, setGradeSubmission] = useState<SubmissionWithStudent | null>(null);
  const [gradingActivity, setGradingActivity] = useState<Activity | null>(null);
  const [selectedSubmissions, setSelectedSubmissions] = useState<string | null>(null);

  // Necesario para que la tabla de Calificaciones muestre el sistema
  // evaluativo real (cuantitativo/cualitativo/mixto) en vez de asumir
  // siempre "/100" sin importar cómo esté configurado el colegio.
  const { data: institution } = useInstitutionSettings();

  const { data: course, isLoading } = useQuery<CourseWithTeacher>({
    queryKey: ["/api/classroom/courses", id],
    queryFn: () =>
      fetch(`/api/classroom/courses/${id}`, { credentials: "include" }).then((r) => r.json()),
  });

  const { data: activityList } = useQuery<Activity[]>({
    queryKey: ["/api/classroom/courses", id, "activities"],
    queryFn: () =>
      fetch(`/api/classroom/courses/${id}/activities`, { credentials: "include" }).then((r) => r.json()),
    enabled: !!id,
  });

  const { data: students } = useQuery<{ id: string; student: { id: string; firstName: string | null; lastName: string | null; profileImageUrl: string | null } }[]>({
    queryKey: ["/api/classroom/courses", id, "students"],
    queryFn: () =>
      fetch(`/api/classroom/courses/${id}/students`, { credentials: "include" }).then((r) => r.json()),
    enabled: !!id,
  });

  const { data: activitySubmissions } = useQuery<SubmissionWithStudent[]>({
    queryKey: ["/api/classroom/activities", selectedSubmissions, "submissions"],
    queryFn: () =>
      fetch(`/api/classroom/activities/${selectedSubmissions}/submissions`, {
        credentials: "include",
      }).then((r) => r.json()),
    enabled: !!selectedSubmissions,
  });

  // Todas las entregas del curso para la matriz de calificaciones
  const { data: allSubmissions = [] } = useQuery<SubmissionWithStudent[]>({
    queryKey: ["/api/classroom/courses", id, "all-submissions"],
    queryFn: () =>
      fetch(`/api/classroom/courses/${id}/submissions`, { credentials: "include" })
        .then((r) => r.ok ? r.json() : []),
    enabled: !!id && (user?.role === "teacher" || user?.role === "admin"),
  });

  // ─── Tablón de publicaciones del curso ───────────────────────────────
  const { data: boardPosts, isLoading: boardLoading } = useQuery<PostWithAuthor[]>({
    queryKey: ["/api/classroom/courses", id, "board"],
    queryFn: () =>
      fetch(`/api/classroom/courses/${id}/board`, { credentials: "include" }).then((r) => r.json()),
    enabled: !!id,
  });

  const createBoardPostMutation = useMutation({
    mutationFn: async ({ content, files }: { content: string; files?: File[] }) => {
      if (files && files.length > 0) {
        const formData = new FormData();
        formData.append("content", content);
        files.forEach((f) => formData.append("attachments", f));
        const res = await fetch(`/api/classroom/courses/${id}/board`, {
          method: "POST",
          credentials: "include",
          body: formData,
        });
        if (!res.ok) throw new Error("Error al publicar");
      } else {
        await apiRequest("POST", `/api/classroom/courses/${id}/board`, { content });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classroom/courses", id, "board"] });
      toast({ title: "Publicado", description: "Tu publicación ya está en el tablón del curso." });
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo publicar en el tablón.", variant: "destructive" });
    },
  });

  const deleteBoardPostMutation = useMutation({
    mutationFn: async (postId: string) => {
      await apiRequest("DELETE", `/api/posts/${postId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classroom/courses", id, "board"] });
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo eliminar la publicación.", variant: "destructive" });
    },
  });

  const isTeacher = user?.role === "teacher" || user?.role === "admin";
  const isOwner = course?.teacherId === user?.id;
  const canManage = isTeacher && isOwner;

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-6 space-y-6 max-w-5xl mx-auto">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AppLayout>
    );
  }

  if (!course) {
    return (
      <AppLayout>
        <div className="p-6 text-center py-20">
          <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium">Curso no encontrado</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/classroom")}>
            Volver al aula
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={course.name}>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Back + Header */}
        <div>
          <Button variant="ghost" size="sm" onClick={() => navigate("/classroom")} className="mb-3 -ml-2">
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Volver al aula
          </Button>
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <Badge variant="secondary" className="no-default-active-elevate">{course.subject}</Badge>
                {course.grade && <Badge variant="outline" className="no-default-active-elevate">{course.grade}</Badge>}
                {course.semester && (
                  <span className="text-sm text-muted-foreground">{course.semester}</span>
                )}
              </div>
              <h2 className="text-2xl font-bold">{course.name}</h2>
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                <GraduationCap className="h-4 w-4" />
                <span>{course.teacher.firstName} {course.teacher.lastName}</span>
                {course._count && (
                  <>
                    <span>·</span>
                    <Users className="h-4 w-4" />
                    <span>{course._count.students} estudiantes</span>
                  </>
                )}
              </div>
              {course.description && (
                <p className="mt-2 text-sm text-muted-foreground max-w-2xl">{course.description}</p>
              )}
            </div>
          </div>
        </div>

        <Separator />

        {/* Tabs */}
        <Tabs defaultValue="board">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="board">
              <MessageSquare className="h-4 w-4 mr-1.5" />
              Tablón
            </TabsTrigger>
            <TabsTrigger value="activities">
              <ClipboardList className="h-4 w-4 mr-1.5" />
              Actividades
            </TabsTrigger>
            <TabsTrigger value="students">
              <Users className="h-4 w-4 mr-1.5" />
              Estudiantes
            </TabsTrigger>
            {isTeacher && (
              <TabsTrigger value="grades">
                <BarChart3 className="h-4 w-4 mr-1.5" />
                Calificaciones
              </TabsTrigger>
            )}
            {isTeacher && (
              <TabsTrigger value="google-classroom">
                <Monitor className="h-4 w-4 mr-1.5" />
                Google Classroom
              </TabsTrigger>
            )}
            <TabsTrigger value="attendance">
              <CalendarCheck className="h-4 w-4 mr-1.5" />
              Asistencia
            </TabsTrigger>
          </TabsList>

          {/* Tablón de publicaciones */}
          <TabsContent value="board" className="space-y-4 mt-4">
            <CreatePostCard
              onSubmit={(content, files) => createBoardPostMutation.mutate({ content, files })}
              isSubmitting={createBoardPostMutation.isPending}
              placeholder={isTeacher ? "Publica un anuncio para tu clase..." : "Comparte algo con tu curso..."}
            />

            {boardLoading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4" />
                  </CardContent>
                </Card>
              ))
            ) : boardPosts && boardPosts.length > 0 ? (
              boardPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUserId={user?.id}
                  likesCount={(post as any)._count?.reactions || 0}
                  commentsCount={(post as any)._count?.comments || 0}
                  onDelete={
                    post.authorId === user?.id || isTeacher
                      ? (postId) => deleteBoardPostMutation.mutate(postId)
                      : undefined
                  }
                />
              ))
            ) : (
              <EmptyState
                icon={MessageSquare}
                title="Sin publicaciones todavía"
                description="Aquí aparecerán los anuncios y publicaciones de este curso."
              />
            )}
          </TabsContent>

          {/* Activities Tab */}
          <TabsContent value="activities" className="space-y-4 mt-4">
            {canManage && (
              <div className="flex justify-end">
                <Button onClick={() => setShowCreateActivity(true)} data-testid="button-new-activity">
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva actividad
                </Button>
              </div>
            )}
            {!activityList || activityList.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="font-medium">No hay actividades aún</p>
                {canManage && (
                  <Button className="mt-3" variant="outline" onClick={() => setShowCreateActivity(true)}>
                    Crear primera actividad
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {activityList.map((activity) => {
                  const isOverdue = activity.dueDate && isPast(new Date(activity.dueDate));
                  return (
                    <Card key={activity.id} data-testid={`card-activity-${activity.id}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <Badge variant="outline" className="text-xs no-default-active-elevate">
                                {ACTIVITY_LABELS[activity.type] || activity.type}
                              </Badge>
                              {!activity.isPublished && (
                                <Badge variant="secondary" className="text-xs no-default-active-elevate">
                                  Borrador
                                </Badge>
                              )}
                            </div>
                            <h4 className="font-semibold">{activity.title}</h4>
                            {activity.description && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {activity.description}
                              </p>
                            )}
                            {/* Activity attachments */}
                            <FileViewer urls={activity.attachments || []} />

                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                              <span className="flex items-center gap-1">
                                <Award className="h-3.5 w-3.5" />
                                {institution?.evaluationType === "qualitative"
                                  ? (institution?.qualitativeScale || "Cualitativo")
                                  : `${activity.maxScore} pts`}
                              </span>
                              {activity.dueDate && (
                                <span
                                  className={`flex items-center gap-1 ${
                                    isOverdue ? "text-destructive" : ""
                                  }`}
                                >
                                  <Clock className="h-3.5 w-3.5" />
                                  Entrega:{" "}
                                  {format(new Date(activity.dueDate), "dd MMM yyyy, HH:mm", { locale: es })}
                                  {isOverdue && " (vencida)"}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {canManage ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedSubmissions(
                                    selectedSubmissions === activity.id ? null : activity.id
                                  );
                                  setGradingActivity(activity);
                                }}
                                data-testid={`button-view-submissions-${activity.id}`}
                              >
                                <ClipboardList className="h-3.5 w-3.5 mr-1.5" />
                                Entregas
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => setSubmitActivity(activity)}
                                data-testid={`button-submit-${activity.id}`}
                              >
                                <Send className="h-3.5 w-3.5 mr-1.5" />
                                Entregar
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Submissions panel (teacher) */}
                        {canManage &&
                          selectedSubmissions === activity.id &&
                          activitySubmissions && (
                            <div className="mt-4 border-t pt-4">
                              <h5 className="text-sm font-semibold mb-3">
                                Entregas ({activitySubmissions.length})
                              </h5>
                              {activitySubmissions.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                  Ningún estudiante ha entregado aún
                                </p>
                              ) : (
                                <div className="space-y-2">
                                  {activitySubmissions.map((sub) => (
                                    <div
                                      key={sub.id}
                                      className="flex items-center justify-between p-2 rounded-md bg-muted/50"
                                    >
                                      <div className="flex items-center gap-2">
                                        <Avatar className="h-7 w-7">
                                          <AvatarImage src={sub.student.profileImageUrl || undefined} />
                                          <AvatarFallback className="text-xs">
                                            {getInitials(sub.student.firstName, sub.student.lastName)}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div>
                                          <p className="text-sm font-medium">
                                            {getFullName(sub.student.firstName, sub.student.lastName)}
                                          </p>
                                          <p className="text-xs text-muted-foreground">
                                            {format(new Date(sub.submittedAt), "dd MMM, HH:mm", { locale: es })}
                                          </p>
                                          {sub.attachments && sub.attachments.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-0.5">
                                              {sub.attachments.map((url, i) => (
                                                <a
                                                  key={i}
                                                  href={url}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="inline-flex items-center gap-0.5 text-xs text-primary hover:underline"
                                                >
                                                  <Paperclip className="h-3 w-3" />
                                                  Archivo {i + 1}
                                                </a>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {sub.grade != null ? (
                                          <Badge variant="secondary" className="no-default-active-elevate">
                                            {institution?.evaluationType === "qualitative"
                                              ? sub.grade
                                              : `${sub.grade}/${activity.maxScore}`}
                                          </Badge>
                                        ) : (
                                          <Badge variant="outline" className="no-default-active-elevate">
                                            Sin calificar
                                          </Badge>
                                        )}
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => setGradeSubmission(sub)}
                                        >
                                          Calificar
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Students Tab */}
          <TabsContent value="students" className="mt-4">
            <StudentsTab
              courseId={id!}
              students={students || []}
              canManage={canManage}
            />
          </TabsContent>

          {/* Grades Tab (teacher only) */}
          {isTeacher && (
            <TabsContent value="grades" className="mt-4">
              {!activityList || activityList.length === 0 ? (
                <div className="text-center py-12">
                  <BarChart3 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="font-medium">No hay actividades para calificar</p>
                </div>
              ) : !students || students.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground text-sm">No hay estudiantes inscritos</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 font-semibold">Estudiante</th>
                        {activityList.map((a) => (
                          <th key={a.id} className="text-center p-2 font-semibold min-w-24">
                            <div className="truncate max-w-24" title={a.title}>
                              {a.title}
                            </div>
                            <div className="text-xs text-muted-foreground font-normal">
                              {institution?.evaluationType === "qualitative"
                                ? (institution?.qualitativeScale || "Cualitativo")
                                : `/${a.maxScore}`}
                            </div>
                          </th>
                        ))}
                        <th className="text-center p-2 font-semibold min-w-16 text-primary">Prom.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map(({ student }) => {
                        const studentSubs = (allSubmissions as SubmissionWithStudent[])
                          .filter((s) => s.studentId === student.id);
                        const numericGrades = studentSubs
                          .map((s) => parseFloat(String(s.grade)))
                          .filter((g) => !isNaN(g));
                        const avg = numericGrades.length > 0
                          ? (numericGrades.reduce((a,b) => a+b, 0) / numericGrades.length).toFixed(1)
                          : null;
                        return (
                          <tr key={student.id} className="border-b hover-elevate">
                            <td className="p-2">
                              <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback className="text-xs">
                                    {getInitials(student.firstName, student.lastName)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-medium">
                                  {getFullName(student.firstName, student.lastName)}
                                </span>
                              </div>
                            </td>
                            {activityList.map((a) => {
                              const sub = studentSubs.find((s) => s.activityId === a.id);
                              const g = sub?.grade;
                              const numeric = g != null ? parseFloat(String(g)) : NaN;
                              const pct = !isNaN(numeric) ? numeric / a.maxScore : null;
                              const color = pct == null ? "" : pct >= 0.8 ? "text-green-600" : pct >= 0.6 ? "text-amber-600" : "text-red-500";
                              return (
                                <td key={a.id} className="p-2 text-center">
                                  {g != null ? (
                                    <span className={`font-medium text-sm ${color}`}>{g}</span>
                                  ) : sub ? (
                                    <span className="text-xs text-muted-foreground italic">Sin nota</span>
                                  ) : (
                                    <span className="text-muted-foreground">—</span>
                                  )}
                                </td>
                              );
                            })}
                            <td className="p-2 text-center font-semibold text-sm">
                              {avg ?? <span className="text-muted-foreground">—</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>
          )}

          {/* Google Classroom Tab */}
          {isTeacher && (
            <TabsContent value="google-classroom" className="mt-4">
              <GoogleClassroomTab courseId={id!} course={course} />
            </TabsContent>
          )}

          {/* Attendance Tab */}
          <TabsContent value="attendance" className="mt-4">
            <AttendanceTab
              courseId={id!}
              isTeacher={canManage}
              students={students || []}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      {canManage && (
        <CreateActivityDialog
          courseId={id!}
          open={showCreateActivity}
          onClose={() => setShowCreateActivity(false)}
        />
      )}

      <SubmitDialog
        activity={submitActivity}
        open={!!submitActivity}
        onClose={() => setSubmitActivity(null)}
      />

      <GradeDialog
        submission={gradeSubmission}
        maxScore={gradingActivity?.maxScore || 100}
        courseId={id}
        open={!!gradeSubmission}
        onClose={() => setGradeSubmission(null)}
      />
    </AppLayout>
  );
}
