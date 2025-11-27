import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/EmptyState";
import { Bell } from "lucide-react";

export default function Notifications() {
  return (
    <AppLayout title="Notificaciones">
      <div className="max-w-2xl mx-auto p-4 md:p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notificaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <EmptyState
              icon={Bell}
              title="Sin notificaciones"
              description="Cuando tengas nuevas notificaciones, aparecerán aquí."
            />
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
