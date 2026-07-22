import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, CheckCircle2, XCircle, Loader2 } from "lucide-react";

export default function VerifyEmail() {
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) {
      setStatus("error");
      setError("Enlace inválido.");
      return;
    }
    fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) setStatus("ok");
        else {
          setStatus("error");
          setError(data.error || "No se pudo verificar el correo.");
        }
      })
      .catch(() => {
        setStatus("error");
        setError("Error de conexión.");
      });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex items-center justify-center gap-2">
          <GraduationCap className="h-8 w-8 text-primary" />
          <span className="font-serif font-bold text-2xl">EduNexus</span>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Verificación de correo</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-3 py-4">
            {status === "loading" && (
              <>
                <Loader2 className="h-10 w-10 text-primary mx-auto animate-spin" />
                <p className="text-sm text-muted-foreground">Verificando tu correo...</p>
              </>
            )}
            {status === "ok" && (
              <>
                <CheckCircle2 className="h-10 w-10 text-primary mx-auto" />
                <p className="text-sm text-muted-foreground">Tu correo quedó verificado.</p>
                <Link href="/" className="text-primary hover:underline text-sm">Ir a la plataforma</Link>
              </>
            )}
            {status === "error" && (
              <>
                <XCircle className="h-10 w-10 text-destructive mx-auto" />
                <p className="text-sm text-muted-foreground">{error}</p>
                <Link href="/" className="text-primary hover:underline text-sm">Ir a la plataforma</Link>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
