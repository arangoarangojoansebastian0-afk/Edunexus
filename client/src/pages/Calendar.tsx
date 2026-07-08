import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronLeft, ChevronRight, Clock, User, MapPin } from "lucide-react";
import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import { getFullName } from "@/lib/authUtils";
import type { EventWithHost } from "@shared/schema";

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const { data: events = [], isLoading } = useQuery<EventWithHost[]>({
    queryKey: ["/api/events"],
  });

  // Tareas con fecha de entrega de todas las aulas del usuario
  const { data: activities = [] } = useQuery<any[]>({
    queryKey: ["/api/classroom/my-activities"],
    queryFn: () => fetch("/api/classroom/my-activities", { credentials: "include" })
      .then(r => r.ok ? r.json() : []).catch(() => []),
  });

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getEventsForDay = (day: Date) => {
    const evts = (events as any[]).filter((event) => isSameDay(new Date(event.startTime), day));
    const acts = (activities as any[]).filter((a) => a.dueDate && isSameDay(new Date(a.dueDate), day));
    return {
      events: evts,
      tasks: acts,
      total: evts.length + acts.length,
    };
  };

  const selectedDayData = selectedDate ? getEventsForDay(selectedDate) : { events: [], tasks: [], total: 0 };

  const previousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  return (
    <AppLayout>
      <div className="space-y-6 p-6">
        <h1 className="text-3xl font-bold">Calendario de Eventos y Asesorías</h1>

        {isLoading ? (
          <div className="flex items-center justify-center min-h-96">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar */}
            <div className="lg:col-span-2">
              <Card className="p-6">
                {/* Month Navigation */}
                <div className="flex items-center justify-between mb-6">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={previousMonth}
                    data-testid="button-prev-month"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <h2 className="text-xl font-semibold">
                    {format(currentDate, "MMMM yyyy", { locale: es })}
                  </h2>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={nextMonth}
                    data-testid="button-next-month"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                {/* Day headers */}
                <div className="grid grid-cols-7 gap-2 mb-2">
                  {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((day) => (
                    <div key={day} className="text-center text-sm font-semibold text-muted-foreground p-2">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-2">
                  {daysInMonth.map((day) => {
                    const dayData = getEventsForDay(day);
                    const isSelected = selectedDate && isSameDay(day, selectedDate);
                    const isCurrentMonth = isSameMonth(day, currentDate);
                    const hasItems = dayData.total > 0;

                    return (
                      <button
                        key={day.toString()}
                        onClick={() => setSelectedDate(day)}
                        className={`aspect-square p-2 rounded-md text-sm font-medium transition-colors ${
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
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
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
                    <p className="text-sm text-muted-foreground text-center py-8">No hay eventos ni tareas para este día</p>
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
        )}
      </div>
    </AppLayout>
  );
}
