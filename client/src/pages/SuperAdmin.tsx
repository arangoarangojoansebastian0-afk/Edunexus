import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Building2, Plus, Users, ShieldAlert, LogOut } from "lucide-react";

export default function SuperAdmin() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const [form, setForm] = useState({
    institutionName: "", institutionCode: "", emailAllowedDomain: "",
    adminFirstName: "", adminLastName: "", adminEmail: "", adminPassword: "",
  });

  const { data: institutions = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/super-admin/institutions"],
    enabled: user?.role === "super_admin",
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/super-admin/institutions", form);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/super-admin/institutions"] });
      toast({ title: "Colegio creado", description: `${form.institutionName} ya puede empezar a usar la plataforma.` });
      setOpen(false);
      setForm({ institutionName: "", institutionCode: "", emailAllowedDomain: "", adminFirstName: "", adminLastName: "", adminEmail: "", adminPassword: "" });
    },
    onError: (e: any) => toast({ title: "No se pudo crear el colegio", description: e.message, variant: "destructive" }),
  });

  if (user && user.role !== "super_admin") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-muted-foreground">
        <ShieldAlert className="h-10 w-10 opacity-40" />
        <p className="font-semibold">No tienes acceso a esta página</p>
      </div>
    );
  }

  const canSubmit = form.institutionName.trim() && form.institutionCode.trim() &&
    form.adminFirstName.trim() && form.adminLastName.trim() && form.adminEmail.trim() && form.adminPassword.length >= 8;

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="border-b bg-background px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="h-6 w-6 text-primary" />
          <h1 className="font-serif font-bold text-xl">Panel general — Todos los colegios</h1>
        </div>
        <Button variant="ghost" size="sm" onClick={async () => {
          await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
          window.location.href = "/login";
        }}>
          <LogOut className="h-4 w-4 mr-1.5" /> Salir
        </Button>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-lg">Colegios registrados</h2>
            <p className="text-sm text-muted-foreground">Cada colegio funciona de forma aislada — sus datos no se mezclan con los demás.</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-1.5" /> Nuevo colegio</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Crear nuevo colegio</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 space-y-1.5">
                    <Label>Nombre del colegio</Label>
                    <Input value={form.institutionName} onChange={(e) => setForm({ ...form, institutionName: e.target.value })} placeholder="Colegio San José" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Código único</Label>
                    <Input value={form.institutionCode} onChange={(e) => setForm({ ...form, institutionCode: e.target.value.toUpperCase() })} placeholder="SANJOSE" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Dominio de correo (opcional)</Label>
                    <Input value={form.emailAllowedDomain} onChange={(e) => setForm({ ...form, emailAllowedDomain: e.target.value })} placeholder="sanjose.edu.co" />
                  </div>
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm font-medium mb-2">Primer administrador del colegio</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Nombre</Label>
                      <Input value={form.adminFirstName} onChange={(e) => setForm({ ...form, adminFirstName: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Apellido</Label>
                      <Input value={form.adminLastName} onChange={(e) => setForm({ ...form, adminLastName: e.target.value })} />
                    </div>
                    <div className="col-span-2 space-y-1.5">
                      <Label>Correo</Label>
                      <Input type="email" value={form.adminEmail} onChange={(e) => setForm({ ...form, adminEmail: e.target.value })} />
                    </div>
                    <div className="col-span-2 space-y-1.5">
                      <Label>Contraseña temporal</Label>
                      <Input type="password" value={form.adminPassword} onChange={(e) => setForm({ ...form, adminPassword: e.target.value })} placeholder="Mínimo 8 caracteres" />
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button disabled={!canSubmit || createMutation.isPending} onClick={() => createMutation.mutate()}>
                  Crear colegio
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Cargando...</p>
        ) : institutions.length === 0 ? (
          <Card><CardContent className="py-10 text-center text-muted-foreground">
            Todavía no hay colegios creados.
          </CardContent></Card>
        ) : (
          <div className="grid gap-3">
            {institutions.map((inst: any) => (
              <Card key={inst.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center justify-between">
                    {inst.institutionName}
                    <span className="text-xs font-mono text-muted-foreground">{inst.institutionCode}</span>
                  </CardTitle>
                  {inst.emailAllowedDomain && (
                    <CardDescription>Dominio permitido: {inst.emailAllowedDomain}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Users className="h-3.5 w-3.5" /> {inst.userCount} usuario{inst.userCount === 1 ? "" : "s"}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
