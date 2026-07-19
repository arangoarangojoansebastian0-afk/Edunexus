import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ShieldPlus, Loader2 } from "lucide-react";

export default function SetupSuperAdmin() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    setupKey: "", email: "", password: "", firstName: "", lastName: "",
  });

  const canSubmit = form.setupKey.trim() && form.email.trim() && form.password.length >= 8 &&
    form.firstName.trim() && form.lastName.trim();

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/setup/super-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error inesperado");

      toast({ title: "Super administrador creado", description: "Ya iniciaste sesión con esa cuenta." });
      setLocation("/");
    } catch (err) {
      toast({
        variant: "destructive",
        title: "No se pudo crear",
        description: err instanceof Error ? err.message : "Error inesperado",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2 mb-1">
            <ShieldPlus className="h-5 w-5 text-primary" />
            <CardTitle>Configurar Super Administrador</CardTitle>
          </div>
          <CardDescription>
            Página de un solo uso: crea la primera cuenta con acceso a todos los colegios de la plataforma.
            Se desactiva automáticamente en cuanto exista una.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Clave de configuración</Label>
            <Input
              type="password"
              value={form.setupKey}
              onChange={(e) => setForm({ ...form, setupKey: e.target.value })}
              placeholder="SUPER_ADMIN_SETUP_KEY"
            />
            <p className="text-xs text-muted-foreground">La que configuraste como variable de entorno en Render.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Nombre</Label>
              <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Apellido</Label>
              <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Correo</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Contraseña</Label>
            <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Mínimo 8 caracteres" />
          </div>
          <Button className="w-full gap-2" disabled={!canSubmit || isLoading} onClick={handleSubmit}>
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            Crear Super Administrador
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
