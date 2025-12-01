import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Award, Plus, Lock } from "lucide-react";
import type { Badge as BadgeType, User } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";

export function BadgeManager() {
  const { user } = useAuth();
  const { toast } = useToast();

  if (user?.role !== "teacher" && user?.role !== "admin") {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Lock className="h-4 w-4" />
        <p>Solo los profesores y administradores pueden gestionar insignias.</p>
      </div>
    );
  }
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedBadgeId, setSelectedBadgeId] = useState<string>("");
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [badgeName, setBadgeName] = useState("");
  const [badgeDesc, setBadgeDesc] = useState("");
  const [badgeColor, setBadgeColor] = useState("#3b82f6");

  const { data: badges, isLoading: badgesLoading } = useQuery<BadgeType[]>({
    queryKey: ["/api/badges"],
  });

  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users", "all"],
  });

  const createBadgeMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/badges", {
        name: badgeName,
        description: badgeDesc,
        color: badgeColor,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/badges"] });
      setBadgeName("");
      setBadgeDesc("");
      setBadgeColor("#3b82f6");
      setIsCreateOpen(false);
      toast({
        title: "Insignia creada",
        description: "La insignia ha sido creada exitosamente.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo crear la insignia.",
        variant: "destructive",
      });
    },
  });

  const assignBadgeMutation = useMutation({
    mutationFn: async () => {
      if (!selectedUserId || !selectedBadgeId) return;
      await apiRequest("POST", `/api/users/${selectedUserId}/badges/${selectedBadgeId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", selectedUserId, "badges"] });
      setSelectedUserId("");
      setSelectedBadgeId("");
      setIsAssignOpen(false);
      toast({
        title: "Insignia asignada",
        description: "La insignia ha sido asignada al estudiante.",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Error",
        description: err?.message || "No se pudo asignar la insignia.",
        variant: "destructive",
      });
    },
  });

  return (
    <Tabs defaultValue="create" className="w-full">
      <TabsList>
        <TabsTrigger value="create">Crear Insignia</TabsTrigger>
        <TabsTrigger value="assign">Asignar a Estudiante</TabsTrigger>
      </TabsList>

      <TabsContent value="create" className="space-y-4">
        <div className="space-y-4">
          {badges && badges.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  Insignias Disponibles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {badges.map((badge) => (
                    <div
                      key={badge.id}
                      className="flex items-center gap-3 p-3 rounded-lg border"
                    >
                      <Award
                        className="h-8 w-8"
                        style={{ color: badge.color || "#3b82f6" }}
                      />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{badge.name}</p>
                        <p className="text-xs text-muted-foreground">{badge.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" data-testid="button-create-badge">
                <Plus className="h-4 w-4" />
                Nueva Insignia
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Nueva Insignia</DialogTitle>
                <DialogDescription>
                  Las insignias son recompensas educativas que otorgas a los estudiantes.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Nombre</label>
                  <Input
                    placeholder="ej: Matemático Experto"
                    value={badgeName}
                    onChange={(e) => setBadgeName(e.target.value)}
                    data-testid="input-badge-name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Descripción</label>
                  <Input
                    placeholder="ej: Dominio de álgebra avanzado"
                    value={badgeDesc}
                    onChange={(e) => setBadgeDesc(e.target.value)}
                    data-testid="input-badge-description"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={badgeColor}
                      onChange={(e) => setBadgeColor(e.target.value)}
                      className="h-10 w-20 rounded border cursor-pointer"
                      data-testid="input-badge-color"
                    />
                    <Input
                      value={badgeColor}
                      onChange={(e) => setBadgeColor(e.target.value)}
                      placeholder="#000000"
                      data-testid="input-badge-color-hex"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={() => createBadgeMutation.mutate()}
                  disabled={!badgeName || createBadgeMutation.isPending}
                  data-testid="button-save-badge"
                >
                  Crear Insignia
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </TabsContent>

      <TabsContent value="assign" className="space-y-4">
        <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="button-assign-badge">
              <Plus className="h-4 w-4" />
              Asignar Insignia
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Asignar Insignia a Estudiante</DialogTitle>
              <DialogDescription>
                Selecciona un estudiante e insignia para otorgar.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Estudiante</label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger data-testid="select-student">
                    <SelectValue placeholder="Selecciona un estudiante" />
                  </SelectTrigger>
                  <SelectContent>
                    {users?.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.firstName} {user.lastName} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Insignia</label>
                <Select value={selectedBadgeId} onValueChange={setSelectedBadgeId}>
                  <SelectTrigger data-testid="select-badge">
                    <SelectValue placeholder="Selecciona una insignia" />
                  </SelectTrigger>
                  <SelectContent>
                    {badges?.map((badge) => (
                      <SelectItem key={badge.id} value={badge.id}>
                        {badge.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAssignOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                onClick={() => assignBadgeMutation.mutate()}
                disabled={!selectedUserId || !selectedBadgeId || assignBadgeMutation.isPending}
                data-testid="button-confirm-assign"
              >
                Asignar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </TabsContent>
    </Tabs>
  );
}
