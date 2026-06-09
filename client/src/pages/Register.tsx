import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuthContext } from "@/context/AuthContext";
import { GraduationCap, ArrowRight } from "lucide-react";

type Role = "student" | "teacher" | "director" | "coordinator" | "secretary" | "admin";

const roleOptions: { value: Role; label: string; description: string; needsCode: boolean }[] = [
  { value: "student",     label: "Estudiante",    description: "Acceso al aula y comunidad",         needsCode: false },
  { value: "teacher",     label: "Maestro",       description: "Gestión de cursos y calificaciones", needsCode: true  },
  { value: "coordinator", label: "Coordinador",   description: "Coordinación académica",             needsCode: true  },
  { value: "director",    label: "Director",      description: "Dirección de grupo o área",          needsCode: true  },
  { value: "secretary",   label: "Secretaria",    description: "Gestión administrativa",             needsCode: true  },
  { value: "admin",       label: "Administrador", description: "Control total del sistema",          needsCode: true  },
];

function codeLabel(role: Role): string {
  if (role === "teacher") return "Código de maestro";
  if (role === "admin")   return "Código de administrador";
  return "Código de acceso institucional";
}

function codePlaceholder(role: Role): string {
  if (role === "teacher") return "Código entregado por la institución";
  if (role === "admin")   return "Código de administrador del sistema";
  return "Código entregado por administración";
}

function codeHint(role: Role): string {
  if (role === "admin") return "Solo el rector o encargado TI tiene este código.";
  return "Solicita este código a la administración del colegio.";
}

export default function Register() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "student" as Role,
    accessCode: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { refetchUser } = useAuthContext();
  const [, navigate] = useLocation();

  const selectedRole = roleOptions.find((r) => r.value === formData.role)!;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast({ title: "Error", description: "Las contraseñas no coinciden", variant: "destructive" });
      return;
    }

    if (selectedRole.needsCode && !formData.accessCode) {
      toast({ title: "Error", description: "El código de acceso es requerido para este rol", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          accessCode: formData.accessCode || undefined,
        }),
      });

      if (res.ok) {
        await refetchUser();
        toast({ title: "Cuenta creada", description: `Bienvenido como ${selectedRole.label}` });
        navigate("/");
      } else {
        const data = await res.json();
        toast({ title: "Error", description: data.error || "No se pudo crear la cuenta", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Error de conexión", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-background p-4">
      <div className="w-full max-w-md space-y-6">

        <div className="flex items-center justify-center gap-2">
          <GraduationCap className="h-8 w-8 text-primary" />
          <span className="font-serif font-bold text-2xl">Comunidad Loyola</span>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Crear Cuenta</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Nombres */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nombre</Label>
                  <Input
                    id="firstName" name="firstName" placeholder="Juan"
                    value={formData.firstName} onChange={handleChange} required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Apellido</Label>
                  <Input
                    id="lastName" name="lastName" placeholder="Pérez"
                    value={formData.lastName} onChange={handleChange} required
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email" name="email" type="email" placeholder="tu@email.com"
                  value={formData.email} onChange={handleChange} required
                />
              </div>

              {/* Contraseñas */}
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password" name="password" type="password" placeholder="••••••••"
                  value={formData.password} onChange={handleChange} required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                <Input
                  id="confirmPassword" name="confirmPassword" type="password" placeholder="••••••••"
                  value={formData.confirmPassword} onChange={handleChange} required
                />
              </div>

              {/* Selector de rol */}
              <div className="space-y-2">
                <Label>Tipo de cuenta</Label>
                <div className="grid grid-cols-2 gap-2">
                  {roleOptions.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, role: r.value, accessCode: "" }))}
                      className={`text-left p-3 rounded-lg border transition-all ${
                        formData.role === r.value
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <p className="text-sm font-medium">{r.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{r.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Código de acceso — solo si el rol lo requiere */}
              {selectedRole.needsCode && (
                <div className="space-y-2">
                  <Label htmlFor="accessCode">{codeLabel(formData.role)}</Label>
                  <Input
                    id="accessCode"
                    name="accessCode"
                    type="password"
                    placeholder={codePlaceholder(formData.role)}
                    value={formData.accessCode}
                    onChange={handleChange}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    {codeHint(formData.role)}
                  </p>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creando cuenta..." : "Registrarse"}
                {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </form>

            <div className="mt-4 text-center text-sm">
              ¿Ya tienes cuenta?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Inicia sesión aquí
              </Link>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}