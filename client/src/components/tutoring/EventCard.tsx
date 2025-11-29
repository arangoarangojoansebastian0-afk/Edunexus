import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Clock,
  Users,
  Video,
  MapPin,
  CheckCircle,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { EventWithHost } from "@shared/schema";
import { getFullName, getInitials, formatRole } from "@/lib/authUtils";

interface EventCardProps {
  event: EventWithHost;
  onBook?: (eventId: string) => void;
  onCancel?: (eventId: string) => void;
  isBooked?: boolean;
  currentUserId?: string;
}

const subjectColors: Record<string, string> = {
  Matemáticas: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  Ciencias: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  Historia: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  Lenguaje: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  Inglés: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  Física: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
  Química: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
};

export function EventCard({
  event,
  onBook,
  onCancel,
  isBooked = false,
  currentUserId,
}: EventCardProps) {
  const hostName = getFullName(event.host.firstName, event.host.lastName);
  const hostInitials = getInitials(event.host.firstName, event.host.lastName);
  const participantCount = event._count?.participants || 0;
  const isFull = participantCount >= (event.maxParticipants || 1);
  const isHost = currentUserId === event.hostId;
  const startDate = new Date(event.startTime);
  const endDate = new Date(event.endTime);
  const isPast = endDate < new Date();

  return (
    <Card className="hover-elevate" data-testid={`event-card-${event.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg line-clamp-2">{event.title}</h3>
            {event.subject && (
              <Badge
                variant="secondary"
                className={`mt-2 ${subjectColors[event.subject] || ""}`}
              >
                {event.subject}
              </Badge>
            )}
          </div>
          {isPast && (
            <Badge variant="outline" className="shrink-0">
              Finalizado
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pb-3 space-y-4">
        {event.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {event.description}
          </p>
        )}

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4 shrink-0" />
            <span>{format(startDate, "EEEE, d 'de' MMMM", { locale: es })}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4 shrink-0" />
            <span>
              {format(startDate, "HH:mm")} - {format(endDate, "HH:mm")}
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4 shrink-0" />
            <span>
              {participantCount} {event.maxParticipants ? `/ ${event.maxParticipants}` : "/ Sin límite"}{" "}
              {event.maxParticipants === 1 ? "participante" : "participantes"}
            </span>
          </div>
          {event.locationUrl && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Video className="h-4 w-4 shrink-0" />
              <span className="truncate">Videollamada disponible</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 pt-2 border-t">
          <Avatar className="h-9 w-9">
            <AvatarImage
              src={event.host.profileImageUrl || undefined}
              alt={hostName}
              className="object-cover"
            />
            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
              {hostInitials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{hostName}</p>
            <p className="text-xs text-muted-foreground">
              {formatRole(event.host.role)}
            </p>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-0">
        {isHost ? (
          <Button variant="outline" className="w-full" disabled>
            Tu asesoría
          </Button>
        ) : isPast ? (
          <Button variant="outline" className="w-full" disabled>
            Finalizado
          </Button>
        ) : isBooked ? (
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => onCancel?.(event.id)}
            data-testid="button-cancel-booking"
          >
            <CheckCircle className="h-4 w-4 text-green-500" />
            Reservado - Cancelar
          </Button>
        ) : isFull ? (
          <Button variant="outline" className="w-full" disabled>
            Sin cupos disponibles
          </Button>
        ) : (
          <Button
            className="w-full"
            onClick={() => onBook?.(event.id)}
            data-testid="button-book-event"
          >
            Reservar
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

export function EventCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="h-6 bg-muted rounded animate-pulse w-3/4" />
        <div className="h-5 bg-muted rounded animate-pulse w-20 mt-2" />
      </CardHeader>
      <CardContent className="pb-3 space-y-3">
        <div className="h-4 bg-muted rounded animate-pulse w-full" />
        <div className="h-4 bg-muted rounded animate-pulse w-2/3" />
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded animate-pulse w-40" />
          <div className="h-4 bg-muted rounded animate-pulse w-32" />
          <div className="h-4 bg-muted rounded animate-pulse w-36" />
        </div>
      </CardContent>
      <CardFooter>
        <div className="h-10 bg-muted rounded animate-pulse w-full" />
      </CardFooter>
    </Card>
  );
}
