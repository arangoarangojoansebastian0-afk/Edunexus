import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronLeft, ChevronRight, Clock, User, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, startOfWeek, endOfWeek, addWeeks, subWeeks, addDays, subDays, getISODay } from "date-fns";
import { es } from "date-fns/locale";
import { getFullName } from "@/lib/authUtils";
import type { EventWithHost } from "@shared/schema";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";

type CalendarView = "month" | "week" | "day" | "agenda";

export default function Calendar() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [view, setView] = useState<CalendarView>("month");

  const { data: events = [], isLoading, isError: eventsError, refetch: refetchEvents } = useQuery<EventWithHost[]>({
    queryKey: ["/api/events"],
  });

  // Tareas con fecha de entrega de todas las aulas del usuario
  const { data: activities = [], isLoading: activitiesLoading, isError: activitiesError, refetch: refetchActivities } = useQuery<any[]>({
    queryKey: ["/api/classroom/my-activities"],
    queryFn: async () => {
      const response = await fetch("/api/classroom/my-activities", { credentials: "include" });
      if (!response.ok) throw new Error("No se pudieron cargar las actividades");
      return response.json();
    },
  });
  const { data: schedules = [], isLoading: schedulesLoading, isError: schedulesError, refetch: refetchSchedules } = useQuery<any[]>({
    queryKey: ["/api/admin/schedules"],
    enabled: Boolean(user?.institutionId),
  });

  useEffect(() => {
    const eventId = new URLSearchParams(window.location.search).get("event");
    if (!eventId || events.length === 0) return;
    const event = events.find((candidate) => candidate.id === eventId);
    if (!event) return;
    const eventDate = new Date(event.startTime);
    setCurrentDate(eventDate);
    setSelectedDate(eventDate);
    setView("day");
  }, [events]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({
    start: startOfWeek(monthStart, { weekStartsOn: 1 }),
    end: endOfWeek(monthEnd, { weekStartsOn: 1 }),
  });
  const visibleDays = view === "month"
    ? daysInMonth
    : view === "week"
      ? eachDayOfInterval({ start: startOfWeek(currentDate, { weekStartsOn: 1 }), end: endOfWeek(currentDate, { weekStartsOn: 1 }) })
      : view === "day"
        ? [currentDate]
        : eachDayOfInterval({ start: currentDate, end: addDays(currentDate, 29) });

  const getEventsForDay = (day: Date) => {
    const evts = (events as any[]).filter((event) => isSameDay(new Date(event.startTime), day));
    const acts = (activities as any[]).filter((a) => a.dueDate && isSameDay(new Date(a.dueDate), day));
    const classes = (schedules as any[]).filter((schedule) => Number(schedule.dayOfWeek) === getISODay(day));
    return {
      events: evts,
      tasks: acts,
      classes,
      total: evts.length + acts.length + classes.length,
    };
  };

  const selectedDayData = selectedDate ? getEventsForDay(selectedDate) : { events: [], tasks: [], classes: [], total: 0 };

  const changeRange = (direction: -1 | 1) => {
    setCurrentDate((date) => view === "month"
      ? direction < 0 ? subMonths(date, 1) : addMonths(date, 1)
      : view === "week"
        ? direction < 0 ? subWeeks(date, 1) : addWeeks(date, 1)
        : direction < 0 ? subDays(date, view === "agenda" ? 30 : 1) : addDays(date, view === "agenda" ? 30 : 1));
  };

  const rangeTitle = view === "month"
    ? format(currentDate, "MMMM yyyy", { locale: es })
    : view === "week"
      ? `${format(visibleDays[0], "d MMM", { locale: es })} – ${format(visibleDays[6], "d MMM yyyy", { locale: es })}`
      : view === "agenda"
        ? `${format(visibleDays[0], "d MMM", { locale: es })} – ${format(visibleDays[visibleDays.length - 1], "d MMM yyyy", { locale: es })}`
        : format(currentDate, "EEEE d MMMM yyyy", { locale: es });

  const renderDayItems = (day: Date) => {
    const dayData = getEventsForDay(day);
    return (
      <div className="space-y-2">
        {dayData.events.map((event: any) => (
          <div key={event.id} className="rounded-md border bg-card p-2 text-left">
            <span className="text-[10px] font-medium text-primary">Evento · {format(new Date(event.startTime), "HH:mm")}</span>
            <p className="truncate text-sm font-medium">{event.title}</p>
          </div>
        ))}
        {dayData.tasks.map((activity: any) => (
          <Link key={activity.id} href={`/classroom/${activity.courseId}`}>
            <div className="rounded-md border border-amber-200 bg-amber-50 p-2 text-left transition-colors hover:bg-amber-100 dark:border-amber-900 dark:bg-amber-950/30 dark:hover:bg-amber-950/50">
              <span className="text-[10px] font-medium text-amber-700 dark:text-amber-400">Entrega · {format(new Date(activity.dueDate), "HH:mm")}</span>
              <p className="truncate text-sm font-medium">{activity.title}</p>
              {activity.courseName && <p className="truncate text-xs text-muted-foreground">{activity.courseName}</p>}
            </div>
          </Link>
        ))}
        {dayData.classes.map((schedule: any) => (
          <div key={schedule.id} className="rounded-md border border-violet-200 bg-violet-50 p-2 text-left dark:border-violet-900 dark:bg-violet-950/30">
            <span className="text-[10px] font-medium text-violet-700 dark:text-violet-400">Clase · {schedule.startTime}–{schedule.endTime}</span>
            <p className="truncate text-sm font-medium">{schedule.subjectName || schedule.groupName}</p>
            <p className="truncate text-xs text-muted-foreground">{schedule.groupName}{schedule.room ? ` · ${schedule.room}` : ""}</p>
          </div>
        ))}
        {!dayData.total && <p className="py-2 text-xs text-muted-foreground">Sin actividades</p>}
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="space-y-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">Calendario educativo</h1>
            <p className="text-sm text-muted-foreground">Eventos, asesorías y fechas de entrega</p>
          </div>
          <div className="flex flex-wrap gap-1" role="group" aria-label="Vista del calendario">
            {(["month", "week", "day", "agenda"] as CalendarView[]).map((calendarView) => (
              <Button key={calendarView} size="sm" variant={view === calendarView ? "default" : "outline"}
                aria-pressed={view === calendarView} onClick={() => setView(calendarView)}>
                {{ month: "Mes", week: "Semana", day: "Día", agenda: "Agenda" }[calendarView]}
              </Button>
            ))}
          </div>
        </div>

        {isLoading || activitiesLoading || schedulesLoading ? (
          <div className="flex items-center justify-center min-h-96">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
          {(eventsError || activitiesError || schedulesError) && (
            <Card className="flex flex-wrap items-center justify-between gap-3 border-destructive/40 p-4">
              <p className="text-sm text-muted-foreground">No se pudo cargar parte del calendario.</p>
              <Button variant="outline" size="sm" onClick={() => {
                if (eventsError) void refetchEvents();
                if (activitiesError) void refetchActivities();
                if (schedulesError) void refetchSchedules();
              }}>Reintentar</Button>
            </Card>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar */}
            <div className="lg:col-span-2">
              <Card className="p-6">
                {/* Month Navigation */}
                <div className="flex items-center justify-between mb-6">
                  <Button
                    variant="outline"
                    size="icon"
                  onClick={() => changeRange(-1)}
                  aria-label="Periodo anterior"
                  data-testid="button-prev-month"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <h2 className="text-center text-base font-semibold capitalize sm:text-xl">{rangeTitle}</h2>
                  <Button
                    variant="outline"
                    size="icon"
                  onClick={() => changeRange(1)}
                  aria-label="Periodo siguiente"
                  data-testid="button-next-month"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                {view === "month" && <>
                <div className="mb-2 grid grid-cols-7 gap-2">
                  {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((day) => (
                    <div key={day} className="text-center text-sm font-semibold text-muted-foreground p-2">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-2">
                  {visibleDays.map((day) => {
                    const dayData = getEventsForDay(day);
                    const isSelected = selectedDate && isSameDay(day, selectedDate);
                    const isCurrentMonth = isSameMonth(day, currentDate);
                    const hasItems = dayData.total > 0;

                    return (
                      <button
                        key={day.toString()}
                        onClick={() => setSelectedDate(day)}
                        aria-label={`${format(day, "d MMMM yyyy", { locale: es })}, ${dayData.total} elementos`}
                        className={`min-h-12 rounded-md p-1 text-sm font-medium transition-colors sm:aspect-square sm:p-2 ${
                          !isCurrentMonth
                            ? "text-muted-foreground bg-muted/30"
                            : isSelected
                              ? "bg-primary text-primary-foreground"
                              : hasItems
                                ? "bg-primary/10 hover:bg-primary/20"
                                : "hover:bg-muted"
                        }`}
                        data-testid={`calendar-day-${format(day, "yyyy-MM-dd")}`}
                      >
                        <div className="flex flex-col items-center justify-center h-full gap-0.5">
                          <span>{format(day, "d")}</span>
                          {hasItems && (
                            <div className="flex gap-0.5">
                              {dayData.events.length > 0 && (
                                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                              )}
                              {dayData.tasks.length > 0 && (
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                              )}
                              {dayData.classes.length > 0 && (
                                <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                              )}
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
                </>}

                {(view === "week" || view === "day") && (
                  <div className={`grid gap-3 ${view === "week" ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" : "grid-cols-1"}`}>
                    {visibleDays.map((day) => (
                      <section key={day.toISOString()} className="min-w-0 rounded-lg border p-3" aria-label={format(day, "EEEE d MMMM", { locale: es })}>
                        <button className="mb-3 font-semibold capitalize hover:text-primary" onClick={() => { setSelectedDate(day); setView("day"); setCurrentDate(day); }}>
                          {format(day, view === "week" ? "EEE d MMM" : "EEEE d MMMM", { locale: es })}
                          <span className="ml-2 text-xs font-normal text-muted-foreground">{getEventsForDay(day).total}</span>
                        </button>
                        {renderDayItems(day)}
                      </section>
                    ))}
                  </div>
                )}

                {view === "agenda" && (
                  <div className="max-h-[65vh] space-y-4 overflow-y-auto pr-1">
                    {visibleDays.filter((day) => getEventsForDay(day).total > 0).map((day) => (
                      <section key={day.toISOString()} className="grid grid-cols-1 gap-2 border-b pb-4 sm:grid-cols-[8rem_1fr]">
                        <button className="h-fit text-left text-sm font-semibold capitalize hover:text-primary" onClick={() => { setSelectedDate(day); setView("day"); setCurrentDate(day); }}>
                          {format(day, "EEE d MMM", { locale: es })}
                        </button>
                        {renderDayItems(day)}
                      </section>
                    ))}
                    {!visibleDays.some((day) => getEventsForDay(day).total > 0) && (
                      <p className="py-10 text-center text-sm text-muted-foreground">No hay eventos ni fechas de entrega en este periodo.</p>
                    )}
                  </div>
                )}
              </Card>
            </div>

            {/* Events for selected date */}
            <div className="lg:col-span-1">
              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-4">
                  {selectedDate
                    ? format(selectedDate, "dd MMMM yyyy", { locale: es })
                    : "Selecciona una fecha"}
                </h3>

                <div className="space-y-3">
                  {!selectedDate ? (
                    <p className="text-sm text-muted-foreground text-center py-8">Selecciona un día para ver eventos y tareas</p>
                      ) : selectedDayData.total === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No hay eventos, clases ni tareas para este día</p>
                  ) : (
                    <>
                      {/* Eventos */}
                      {(selectedDayData.events as any[]).map((event: any) => (
                        <div key={event.id} className="border rounded-lg overflow-hidden hover:bg-muted/50 transition-colors" data-testid={`calendar-event-${event.id}`}>
                          {event.imageUrl && (
                            <div className="w-full h-32 bg-muted">
                              <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
                            </div>
                          )}
                          <div className="p-3">
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">Evento</span>
                            </div>
                            <p className="font-medium text-sm mb-1">{event.title}</p>
                            <div className="space-y-1 text-xs text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <Clock className="h-3 w-3" />
                                {format(new Date(event.startTime), "HH:mm")} — {format(new Date(event.endTime), "HH:mm")}
                              </div>
                              {event.host && (
                                <div className="flex items-center gap-2">
                                  <User className="h-3 w-3" />
                                  {getFullName(event.host.firstName, event.host.lastName)}
                                </div>
                              )}
                              {event.locationUrl && (
                                <div className="flex items-center gap-2">
                                  <MapPin className="h-3 w-3" />
                                  <a href={event.locationUrl.includes("http") ? event.locationUrl : `https://www.google.com/maps/search/${encodeURIComponent(event.locationUrl)}`}
                                    target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                    {event.locationUrl.includes("http") ? new URL(event.locationUrl).hostname : event.locationUrl}
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      {(selectedDayData.classes as any[]).map((schedule: any) => (
                        <div key={schedule.id} className="rounded-lg border border-violet-200 p-3 dark:border-violet-900">
                          <span className="text-[10px] font-medium text-violet-700 dark:text-violet-400">Clase</span>
                          <p className="font-medium text-sm">{schedule.subjectName || schedule.groupName}</p>
                          <p className="text-xs text-muted-foreground">{schedule.startTime}–{schedule.endTime} · {schedule.groupName}{schedule.room ? ` · ${schedule.room}` : ""}</p>
                          {schedule.teacherFirstName && <p className="mt-1 text-xs text-muted-foreground">{schedule.teacherFirstName} {schedule.teacherLastName || ""}</p>}
                        </div>
                      ))}
                      {/* Tareas */}
                      {(selectedDayData.tasks as any[]).map((act: any) => (
                        <div key={act.id} className="border border-amber-200 dark:border-amber-800 rounded-lg p-3 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-colors">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-[10px] bg-amber-500/10 text-amber-600 px-1.5 py-0.5 rounded font-medium">Tarea</span>
                            {act.courseName && <span className="text-[10px] text-muted-foreground">{act.courseName}</span>}
                          </div>
                          <p className="font-medium text-sm">{act.title}</p>
                          {act.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{act.description}</p>}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1.5">
                            <Clock className="h-3 w-3 text-amber-500" />
                            Entrega: {format(new Date(act.dueDate), "HH:mm")}
                            {act.maxScore && <span className="ml-2">· {act.maxScore} pts</span>}
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </Card>
            </div>
          </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
