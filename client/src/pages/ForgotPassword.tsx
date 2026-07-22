import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { GraduationCap, ArrowRight, ArrowLeft, MailCheck } from "lucide-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      // Siempre mostramos el mismo mensaje, exista o no la cuenta —
      // el backend responde igual a propósito por privacidad.
      setSent(true);
    } catch {
      toast({
        title: "Error",
        description: "Error de conexión. Intenta de nuevo.",
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
          <span className="font-serif font-bold text-2xl">EduNexus</span>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recuperar contraseña</CardTitle>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="text-center space-y-3 py-4">
                <MailCheck className="h-10 w-10 text-primary mx-auto" />
                <p className="text-sm text-muted-foreground">
                  Si <strong>{email}</strong> tiene una cuenta, te enviamos un enlace para restablecer tu contraseña. Revisa también la carpeta de spam.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Escribe tu correo y te enviaremos un enlace para restablecer tu contraseña.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    data-testid="input-forgot-email"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading} data-testid="button-forgot-submit">
                  {isLoading ? "Enviando..." : "Enviar enlace de recuperación"}
                  {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
              </form>
            )}

            <div className="mt-4 text-center text-sm">
              <Link href="/login" className="text-primary hover:underline inline-flex items-center gap-1">
                <ArrowLeft className="h-3 w-3" /> Volver a iniciar sesión
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
