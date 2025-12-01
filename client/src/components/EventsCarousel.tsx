import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronLeft, ChevronRight, Clock, MapPin } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { getFullName, getInitials } from "@/lib/authUtils";
import type { EventWithHost } from "@shared/schema";

export function EventsCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const { data: events, isLoading } = useQuery<EventWithHost[]>({
    queryKey: ["/api/events"],
  });

  // Sort by date and filter upcoming events
  const upcomingEvents = events
    ? events.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    : [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Eventos Próximos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-32 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  if (!upcomingEvents || upcomingEvents.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Eventos Próximos</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">No hay eventos próximos</p>
        </CardContent>
      </Card>
    );
  }

  const current = upcomingEvents[currentIndex];
  const hostName = getFullName(current.host.firstName, current.host.lastName);
  const hostInitials = getInitials(current.host.firstName, current.host.lastName);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? upcomingEvents.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === upcomingEvents.length - 1 ? 0 : prev + 1));
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Eventos Próximos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-3">
            {current.imageUrl && (
              <div className="w-full aspect-video rounded-lg overflow-hidden bg-muted">
                <img src={current.imageUrl} alt={current.title} className="w-full h-full object-cover" />
              </div>
            )}
            <div>
              <h3 className="font-semibold text-base">{current.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{current.subject}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-primary" />
                <span>
                  {format(new Date(current.startTime), "d MMM yyyy", { locale: es })} •{" "}
                  {format(new Date(current.startTime), "HH:mm")} -{" "}
                  {format(new Date(current.endTime), "HH:mm")}
                </span>
              </div>

              {current.locationUrl && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-primary" />
                  <a
                    href={
                      current.locationUrl.includes("http")
                        ? current.locationUrl
                        : `https://www.google.com/maps/search/${encodeURIComponent(current.locationUrl)}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline cursor-pointer"
                    data-testid="link-event-location"
                  >
                    {current.locationUrl.includes("http")
                      ? new URL(current.locationUrl).hostname
                      : current.locationUrl}
                  </a>
                </div>
              )}
            </div>

            {current.description && (
              <p className="text-sm text-muted-foreground">{current.description}</p>
            )}

            <div className="flex items-center gap-2 pt-2 border-t">
              <Avatar className="h-7 w-7">
                <AvatarImage src={current.host.profileImageUrl || undefined} alt={hostName} />
                <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                  {hostInitials}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground">
                Organiza <span className="font-medium text-foreground">{hostName}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handlePrev}
              data-testid="button-prev-event"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs text-muted-foreground">
              {currentIndex + 1} / {upcomingEvents.length}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleNext}
              data-testid="button-next-event"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
