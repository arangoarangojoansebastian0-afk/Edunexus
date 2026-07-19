import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserCheck, Check, X } from "lucide-react";

interface LinkRequest {
  id: string;
  parentId: string;
  parentFirstName: string;
  parentLastName: string;
  parentEmail: string;
  createdAt: string;
}

export function ParentLinkRequests() {
  const { toast } = useToast();

  const { data: requests } = useQuery<LinkRequest[]>({
    queryKey: ["/api/students/me/link-requests"],
  });

  const respondMutation = useMutation({
    mutationFn: async ({ id, approve }: { id: string; approve: boolean }) => {
      await apiRequest("POST", `/api/students/me/link-requests/${id}/respond`, { approve });
    },
    onSuccess: (_data, variables) => {
      toast({ title: variables.approve ? "Vínculo aprobado" : "Solicitud rechazada" });
      queryClient.invalidateQueries({ queryKey: ["/api/students/me/link-requests"] });
    },
  });

  if (!requests?.length) return null;

  return (
    <Card className="border-amber-300 bg-amber-50/50 dark:bg-amber-950/10">
      <CardContent className="p-4 space-y-3">
        {requests.map((r) => (
          <div key={r.id} className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2 min-w-0">
              <UserCheck className="h-4 w-4 text-amber-600 shrink-0" />
              <p className="text-sm min-w-0">
                <span className="font-medium">{r.parentFirstName} {r.parentLastName}</span>
                {" "}({r.parentEmail}) quiere vincularse como tu acudiente.
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-red-600 hover:text-red-700"
                onClick={() => respondMutation.mutate({ id: r.id, approve: false })}
              >
                <X className="h-3.5 w-3.5" /> Rechazar
              </Button>
              <Button
                size="sm"
                className="gap-1.5"
                onClick={() => respondMutation.mutate({ id: r.id, approve: true })}
              >
                <Check className="h-3.5 w-3.5" /> Aprobar
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
