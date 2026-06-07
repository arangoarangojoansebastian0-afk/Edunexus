import { useState, useRef } from "react";
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
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getFullName, getInitials } from "@/lib/authUtils";
import {
  ArrowLeft, Plus, ClipboardList, Users, BarChart3, CalendarCheck,
  Loader2, Send, BookOpen, GraduationCap, Clock, CheckCircle2,
  AlertCircle, FileText, Award, UserCheck, Paperclip, X, Download,
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
      <DialogContent className="max-w-md">
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

// ─── Grade Dialog ─────────────────────────────────────────────────────────────

function GradeDialog({
  submission,
  maxScore,
  open,
  onClose,
}: {
  submission: SubmissionWithStudent | null;
  maxScore: number;
  open: boolean;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [grade, setGrade] = useState("");
  const [feedback, setFeedback] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      apiRequest("PATCH", `/api/classroom/submissions/${submission!.id}/grade`, {
        grade: Number(grade),
        feedback,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/classroom/activities"] });
      toast({ title: "Calificación guardada" });
      onClose();
    },
    onError: () => toast({ title: "Error al calificar", variant: "destructive" }),
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
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

          {/* Student attachments */}
          {submission?.attachments && submission.attachments.length > 0 && (
            <div className="rounded-md bg-muted/50 p-3">
              <p className="text-xs font-medium text-muted-foreground mb-1.5">Archivos entregados:</p>
              <div className="flex flex-wrap gap-1.5">
                {submission.attachments.map((url, i) => (
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

          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium">Nota (máx. {maxScore})</label>
              <Input
                type="number"
                min={0}
                max={maxScore}
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="mt-1"
                placeholder="0"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Retroalimentación</label>
            <Textarea
              className="mt-1 resize-none"
              rows={3}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Comentarios para el estudiante..."
            />
          </div>
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
        <Tabs defaultValue="activities">
          <TabsList className="flex-wrap h-auto gap-1">
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
            <TabsTrigger value="attendance">
              <CalendarCheck className="h-4 w-4 mr-1.5" />
              Asistencia
            </TabsTrigger>
          </TabsList>

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
                            {activity.attachments && activity.attachments.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {activity.attachments.map((url, i) => (
                                  <a
                                    key={i}
                                    href={url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-muted text-xs hover:bg-muted/80"
                                  >
                                    <Download className="h-3 w-3" />
                                    Archivo {i + 1}
                                  </a>
                                ))}
                              </div>
                            )}
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                              <span className="flex items-center gap-1">
                                <Award className="h-3.5 w-3.5" />
                                {activity.maxScore} pts
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
                                            {sub.grade}/{activity.maxScore}
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
            {!students || students.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="font-medium">No hay estudiantes inscritos</p>
              </div>
            ) : (
              <div className="space-y-2">
                {students.map(({ student }) => (
                  <Card key={student.id}>
                    <CardContent className="p-3 flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={student.profileImageUrl || undefined} />
                        <AvatarFallback className="text-sm">
                          {getInitials(student.firstName, student.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">
                          {getFullName(student.firstName, student.lastName)}
                        </p>
                      </div>
                      <Badge variant="secondary" className="ml-auto text-xs no-default-active-elevate">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Inscrito
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
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
                              /{a.maxScore}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {students.map(({ student }) => (
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
                          {activityList.map((a) => (
                            <td key={a.id} className="p-2 text-center text-muted-foreground">
                              —
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
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
        open={!!gradeSubmission}
        onClose={() => setGradeSubmission(null)}
      />
    </AppLayout>
  );
}
