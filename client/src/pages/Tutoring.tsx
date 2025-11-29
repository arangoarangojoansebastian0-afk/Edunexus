import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { EventCard, EventCardSkeleton } from "@/components/tutoring/EventCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/EmptyState";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import {
  Search,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  Video,
} from "lucide-react";
import type { EventWithHost } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { format, addHours, setHours, setMinutes } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

const subjects = [
  "Matemáticas",
  "Ciencias",
  "Historia",
  "Lenguaje",
  "Inglés",
  "Física",
  "Química",
  "Biología",
];

const createEventSchema = z.object({
  title: z.string().min(5, "El título debe tener al menos 5 caracteres"),
  description: z.string().optional(),
  subject: z.string().min(1, "Selecciona una materia"),
  date: z.date({ required_error: "Selecciona una fecha" }),
  startHour: z.string().min(1, "Selecciona la hora de inicio"),
  duration: z.string().min(1, "Selecciona la duración"),
  maxParticipants: z.string().optional(),
  participantsType: z.enum(["limited", "unlimited"]).default("limited"),
  locationUrl: z.string().url("Ingresa un enlace válido").optional().or(z.literal("")),
}).refine(
  (data) => data.participantsType === "unlimited" || (data.maxParticipants && data.maxParticipants.trim() !== ""),
  {
    message: "Especifica el número máximo de participantes",
    path: ["maxParticipants"],
  }
);

type CreateEventForm = z.infer<typeof createEventSchema>;

const hours = Array.from({ length: 12 }, (_, i) => {
  const hour = i + 7;
  return { value: hour.toString(), label: `${hour}:00` };
});

const durations = [
  { value: "30", label: "30 minutos" },
  { value: "60", label: "1 hora" },
  { value: "90", label: "1 hora 30 min" },
  { value: "120", label: "2 horas" },
];

export default function Tutoring() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("available");
  const [searchQuery, setSearchQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const form = useForm<CreateEventForm>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      title: "",
      description: "",
      subject: "",
      startHour: "",
      duration: "60",
      maxParticipants: "5",
      participantsType: "limited",
      locationUrl: "",
    },
  });

  const { data: events, isLoading, refetch: refetchEvents } = useQuery<EventWithHost[]>({
    queryKey: ["/api/events"],
    refetchInterval: 3000,
  });

  const { data: myEvents, refetch: refetchMyEvents } = useQuery<EventWithHost[]>({
    queryKey: ["/api/events/my"],
    refetchInterval: 3000,
  });

  const { data: myBookings, refetch: refetchMyBookings } = useQuery<EventWithHost[]>({
    queryKey: ["/api/events/booked"],
    refetchInterval: 3000,
  });

  const bookedEventIds = new Set(myBookings?.map((e) => e.id) || []);

  const filteredEvents = events?.filter((event) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (
        !event.title.toLowerCase().includes(query) &&
        !event.subject?.toLowerCase().includes(query)
      ) {
        return false;
      }
    }
    if (subjectFilter !== "all" && event.subject !== subjectFilter) return false;
    return true;
  });

  const createEventMutation = useMutation({
    mutationFn: async (data: CreateEventForm) => {
      const startTime = setMinutes(
        setHours(data.date, parseInt(data.startHour)),
        0
      );
      const endTime = addHours(startTime, parseInt(data.duration) / 60);

      await apiRequest("POST", "/api/events", {
        title: data.title,
        description: data.description || null,
        subject: data.subject,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        maxParticipants: data.participantsType === "unlimited" ? null : parseInt(data.maxParticipants || "1"),
        locationUrl: data.locationUrl || null,
      });
    },
    onSuccess: () => {
      refetchEvents();
      refetchMyEvents();
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      setIsCreateOpen(false);
      form.reset();
      toast({
        title: "Asesoría creada",
        description: "Tu asesoría ha sido publicada exitosamente.",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Sesión expirada",
          description: "Iniciando sesión nuevamente...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "No se pudo crear la asesoría. Intenta de nuevo.",
        variant: "destructive",
      });
    },
  });

  const bookEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      await apiRequest("POST", `/api/events/${eventId}/book`);
    },
    onSuccess: () => {
      refetchEvents();
      refetchMyBookings();
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({
        title: "Reserva confirmada",
        description: "Has reservado tu lugar en esta asesoría.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "No se pudo reservar. Intenta de nuevo.",
        variant: "destructive",
      });
    },
  });

  const cancelBookingMutation = useMutation({
    mutationFn: async (eventId: string) => {
      await apiRequest("DELETE", `/api/events/${eventId}/book`);
    },
    onSuccess: () => {
      refetchEvents();
      refetchMyBookings();
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({
        title: "Reserva cancelada",
        description: "Tu reserva ha sido cancelada.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "No se pudo cancelar la reserva. Intenta de nuevo.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CreateEventForm) => {
    createEventMutation.mutate(data);
  };

  return (
    <AppLayout title="Asesorías">
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="font-serif text-2xl font-bold">Asesorías</h1>
              <p className="text-muted-foreground">
                Solicita o brinda tutorías académicas
              </p>
            </div>
            {user?.verified && (
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2" data-testid="button-create-event">
                    <Plus className="h-4 w-4" />
                    Ofrecer Asesoría
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Crear Nueva Asesoría</DialogTitle>
                    <DialogDescription>
                      Ofrece una sesión de tutoría para ayudar a otros estudiantes.
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Título</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Ej: Repaso de ecuaciones cuadráticas"
                                {...field}
                                data-testid="input-event-title"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="subject"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Materia</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger data-testid="select-event-subject">
                                  <SelectValue placeholder="Selecciona la materia" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {subjects.map((subject) => (
                                  <SelectItem key={subject} value={subject}>
                                    {subject}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Fecha</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "justify-start text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                    data-testid="button-select-date"
                                  >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {field.value
                                      ? format(field.value, "PPP", { locale: es })
                                      : "Selecciona la fecha"}
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) => date < new Date()}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="startHour"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Hora de inicio</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-start-hour">
                                    <SelectValue placeholder="Hora" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {hours.map((hour) => (
                                    <SelectItem key={hour.value} value={hour.value}>
                                      {hour.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="duration"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Duración</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-duration">
                                    <SelectValue placeholder="Duración" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {durations.map((duration) => (
                                    <SelectItem key={duration.value} value={duration.value}>
                                      {duration.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="space-y-3">
                        <FormField
                          control={form.control}
                          name="participantsType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Límite de participantes</FormLabel>
                              <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="radio"
                                    value="limited"
                                    checked={field.value === "limited"}
                                    onChange={(e) => field.onChange(e.target.value)}
                                    data-testid="radio-limited"
                                  />
                                  <span className="text-sm">Con límite</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="radio"
                                    value="unlimited"
                                    checked={field.value === "unlimited"}
                                    onChange={(e) => field.onChange(e.target.value)}
                                    data-testid="radio-unlimited"
                                  />
                                  <span className="text-sm">Sin límite</span>
                                </label>
                              </div>
                            </FormItem>
                          )}
                        />

                        {form.watch("participantsType") === "limited" && (
                          <FormField
                            control={form.control}
                            name="maxParticipants"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Número máximo de participantes</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min="1"
                                    max="999"
                                    placeholder="Ej: 5"
                                    {...field}
                                    data-testid="input-max-participants"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                      </div>

                      <FormField
                        control={form.control}
                        name="locationUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Enlace de videollamada (opcional)</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Video className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  placeholder="https://meet.google.com/..."
                                  className="pl-9"
                                  {...field}
                                  data-testid="input-location-url"
                                />
                              </div>
                            </FormControl>
                            <FormDescription>
                              Enlace de Google Meet, Zoom, etc.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Descripción (opcional)</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Describe los temas que cubrirás..."
                                {...field}
                                data-testid="input-event-description"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsCreateOpen(false)}
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="submit"
                          disabled={createEventMutation.isPending}
                          data-testid="button-submit-event"
                        >
                          {createEventMutation.isPending ? "Creando..." : "Crear Asesoría"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="available" data-testid="tab-available">
                Disponibles
              </TabsTrigger>
              <TabsTrigger value="my-bookings" data-testid="tab-my-bookings">
                Mis Reservas ({myBookings?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="my-events" data-testid="tab-my-events">
                Mis Asesorías ({myEvents?.length || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="available" className="space-y-6">
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Buscar asesorías..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                    data-testid="input-search-events"
                  />
                </div>
                <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                  <SelectTrigger className="w-full sm:w-48" data-testid="select-subject-filter">
                    <SelectValue placeholder="Todas las materias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las materias</SelectItem>
                    {subjects.map((subject) => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Events Grid */}
              {isLoading ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <EventCardSkeleton key={i} />
                  ))}
                </div>
              ) : filteredEvents && filteredEvents.length > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredEvents.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      currentUserId={user?.id}
                      isBooked={bookedEventIds.has(event.id)}
                      onBook={(id) => bookEventMutation.mutate(id)}
                      onCancel={(id) => cancelBookingMutation.mutate(id)}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={CalendarIcon}
                  title="No hay asesorías disponibles"
                  description={
                    searchQuery
                      ? "No se encontraron asesorías con esos criterios."
                      : "Sé el primero en ofrecer una asesoría."
                  }
                  action={
                    user?.verified
                      ? {
                          label: "Ofrecer Asesoría",
                          onClick: () => setIsCreateOpen(true),
                        }
                      : undefined
                  }
                />
              )}
            </TabsContent>

            <TabsContent value="my-bookings" className="space-y-6">
              {myBookings && myBookings.length > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myBookings.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      currentUserId={user?.id}
                      isBooked={true}
                      onCancel={(id) => cancelBookingMutation.mutate(id)}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={CalendarIcon}
                  title="No tienes reservas"
                  description="Explora las asesorías disponibles y reserva tu lugar."
                  action={{
                    label: "Ver Asesorías",
                    onClick: () => setActiveTab("available"),
                  }}
                />
              )}
            </TabsContent>

            <TabsContent value="my-events" className="space-y-6">
              {myEvents && myEvents.length > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {myEvents.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      currentUserId={user?.id}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={CalendarIcon}
                  title="No has creado asesorías"
                  description="Comparte tu conocimiento ofreciendo asesorías."
                  action={
                    user?.verified
                      ? {
                          label: "Ofrecer Asesoría",
                          onClick: () => setIsCreateOpen(true),
                        }
                      : undefined
                  }
                />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}
