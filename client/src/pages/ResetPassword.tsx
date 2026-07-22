import { useState } from "react";
import { useLocation, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { GraduationCap, ArrowRight, CheckCircle2 } from "lucide-react";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const token = new URLSearchParams(window.location.search).get("token") || "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ title: "Error", description: "Las contraseñas no coinciden.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setDone(true);
      } else {
        toast({ title: "Error", description: data.error || "No se pudo restablecer la contraseña.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Error de conexión. Intenta de nuevo.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center space-y-3">
            <p>Este enlace no es válido. Solicita uno nuevo desde la pantalla de recuperación.</p>
            <Link href="/forgot-password" className="text-primary hover:underline">Ir a recuperar contraseña</Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex items-center justify-center gap-2">
          <GraduationCap className="h-8 w-8 text-primary" />
          <span className="font-serif font-bold text-2xl">EduNexus</span>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Nueva contraseña</CardTitle>
          </CardHeader>
          <CardContent>
            {done ? (
              <div className="text-center space-y-3 py-4">
                <CheckCircle2 className="h-10 w-10 text-primary mx-auto" />
                <p className="text-sm text-muted-foreground">Tu contraseña fue actualizada.</p>
                <Button className="w-full" onClick={() => navigate("/login")} data-testid="button-goto-login">
                  Ir a iniciar sesión
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Nueva contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    data-testid="input-new-password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    data-testid="input-confirm-password"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading} data-testid="button-reset-submit">
                  {isLoading ? "Guardando..." : "Restablecer contraseña"}
                  {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
