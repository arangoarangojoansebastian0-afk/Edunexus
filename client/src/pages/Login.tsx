import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuthContext } from "@/context/AuthContext";
import { GraduationCap, ArrowRight } from "lucide-react";

export default function Login() {
  const [identifier, setIdentifier] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isNameMode, setIsNameMode] = useState(false);
  const { toast } = useToast();
  const { refetchUser } = useAuthContext();
  const [, navigate] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const body = isNameMode 
        ? { email: identifier, lastName, password }
        : { email: identifier, password };

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        await refetchUser();
        toast({
          title: "Sesión iniciada",
          description: "Bienvenido a Comunidad Loyola",
        });
        navigate("/");
      } else {
        const data = await res.json();
        toast({
          title: "Error",
          description: data.error || "No se pudo iniciar sesión",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error de conexión",
        variant: "destructive",
      });
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
            <CardTitle>Iniciar Sesión</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex gap-2 mb-4">
                <Button
                  type="button"
                  variant={!isNameMode ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => {
                    setIsNameMode(false);
                    setLastName("");
                  }}
                >
                  Por Email
                </Button>
                <Button
                  type="button"
                  variant={isNameMode ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setIsNameMode(true)}
                >
                  Por Nombre
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="identifier">
                  {isNameMode ? "Nombre" : "Email"}
                </Label>
                <Input
                  id="identifier"
                  placeholder={isNameMode ? "Tu nombre" : "tu@email.com"}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                  data-testid={isNameMode ? "input-firstname" : "input-email"}
                />
              </div>

              {isNameMode && (
                <div className="space-y-2">
                  <Label htmlFor="lastname">Apellido</Label>
                  <Input
                    id="lastname"
                    placeholder="Tu apellido"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    data-testid="input-lastname"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  data-testid="input-password"
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || (isNameMode && !lastName)}
                data-testid="button-login"
              >
                {isLoading ? "Iniciando..." : "Iniciar Sesión"}
                {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </form>

            <div className="mt-4 text-center text-sm">
              ¿No tienes cuenta?{" "}
              <Link href="/register" className="text-primary hover:underline">
                Regístrate aquí
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
