import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { getFullName, getInitials } from "@/lib/authUtils";
import type { RecognitionWithUsers } from "@shared/schema";

export function RecognitionsCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const { data: recognitions, isLoading } = useQuery<RecognitionWithUsers[]>({
    queryKey: ["/api/recognitions"],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Reconocimientos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-32 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  if (!recognitions || recognitions.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Reconocimientos</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">No hay reconocimientos aún</p>
        </CardContent>
      </Card>
    );
  }

  const current = recognitions[currentIndex];
  const createdByName = getFullName(current.createdBy.firstName, current.createdBy.lastName);
  const createdByInitials = getInitials(current.createdBy.firstName, current.createdBy.lastName);
  const recipientName = getFullName(current.recipient.firstName, current.recipient.lastName);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? recognitions.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === recognitions.length - 1 ? 0 : prev + 1));
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Reconocimientos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {current.imageUrl && (
            <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-muted">
              <img
                src={current.imageUrl}
                alt="Recognition"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Reconocimiento para <span className="font-semibold text-foreground">@{recipientName.toLowerCase().replace(/\s/g, "")}</span>
            </p>
            <p className="text-sm font-medium">{current.content}</p>
            <div className="flex items-center gap-2 pt-2">
              <Avatar className="h-7 w-7">
                <AvatarImage src={current.createdBy.profileImageUrl || undefined} alt={createdByName} />
                <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                  {createdByInitials}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-muted-foreground">
                de <span className="font-medium text-foreground">{createdByName}</span>
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(current.createdAt), { addSuffix: true, locale: es })}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handlePrev}
              data-testid="button-prev-recognition"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs text-muted-foreground">
              {currentIndex + 1} / {recognitions.length}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={handleNext}
              data-testid="button-next-recognition"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
