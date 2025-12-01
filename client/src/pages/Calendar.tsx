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

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getEventsForDay = (day: Date) => {
    return events.filter((event) => isSameDay(new Date(event.startTime), day));
  };

  const selectedDateEvents = selectedDate ? getEventsForDay(selectedDate) : [];

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
                    const dayEvents = getEventsForDay(day);
                    const isSelected = selectedDate && isSameDay(day, selectedDate);
                    const isCurrentMonth = isSameMonth(day, currentDate);

                    return (
                      <button
                        key={day.toString()}
                        onClick={() => setSelectedDate(day)}
                        className={`aspect-square p-2 rounded-md text-sm font-medium transition-colors ${
                          !isCurrentMonth
                            ? "text-muted-foreground bg-muted/30"
                            : isSelected
                              ? "bg-primary text-primary-foreground"
                              : dayEvents.length > 0
                                ? "bg-primary/20 text-primary hover:bg-primary/30"
                                : "hover:bg-muted"
                        }`}
                        data-testid={`calendar-day-${format(day, "yyyy-MM-dd")}`}
                      >
                        <div className="flex flex-col items-center justify-center h-full gap-0.5">
                          <span>{format(day, "d")}</span>
                          {dayEvents.length > 0 && (
                            <span className="text-xs bg-primary/80 text-white rounded px-1">
                              {dayEvents.length}
                            </span>
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
                  {selectedDateEvents.length > 0 ? (
                    selectedDateEvents.map((event) => (
                      <div
                        key={event.id}
                        className="border rounded-lg overflow-hidden hover:bg-muted/50 transition-colors"
                        data-testid={`calendar-event-${event.id}`}
                      >
                        {event.imageUrl && (
                          <div className="w-full h-32 bg-muted">
                            <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="p-3">
                          <p className="font-medium text-sm mb-1">{event.title}</p>
                          <p className="text-xs text-muted-foreground mb-2">{event.subject}</p>
                        <div className="space-y-1 text-xs text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3" />
                            <span>
                              {format(new Date(event.startTime), "HH:mm")} -{" "}
                              {format(new Date(event.endTime), "HH:mm")}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="h-3 w-3" />
                            <span>{getFullName(event.host.firstName, event.host.lastName)}</span>
                          </div>
                          {event.locationUrl && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-3 w-3" />
                              <a
                                href={
                                  event.locationUrl.includes("http")
                                    ? event.locationUrl
                                    : `https://www.google.com/maps/search/${encodeURIComponent(event.locationUrl)}`
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline cursor-pointer"
                                data-testid={`link-calendar-event-location-${event.id}`}
                              >
                                {event.locationUrl.includes("http")
                                  ? new URL(event.locationUrl).hostname
                                  : event.locationUrl}
                              </a>
                            </div>
                          )}
                        </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      {selectedDate ? "No hay eventos este día" : "Selecciona un día para ver eventos"}
                    </p>
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
