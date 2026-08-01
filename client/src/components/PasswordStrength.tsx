import { cn } from "@/lib/utils";

export type StrengthLevel = 0 | 1 | 2 | 3 | 4;

/**
 * Calcula una fortaleza simple (0-4) basada en longitud y variedad de
 * caracteres. No pretende ser un análisis criptográfico riguroso, solo dar
 * una guía visual rápida al usuario mientras escribe.
 */
export function getPasswordStrength(password: string): StrengthLevel {
  if (!password) return 0;

  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  // Normalizamos a un máximo de 4
  return Math.min(score, 4) as StrengthLevel;
}

const LABELS: Record<StrengthLevel, string> = {
  0: "Muy débil",
  1: "Débil",
  2: "Aceptable",
  3: "Buena",
  4: "Fuerte",
};

const COLORS: Record<StrengthLevel, string> = {
  0: "bg-destructive",
  1: "bg-destructive",
  2: "bg-yellow-500",
  3: "bg-blue-500",
  4: "bg-green-600",
};

export function PasswordStrengthMeter({ password }: { password: string }) {
  if (!password) return null;
  const level = getPasswordStrength(password);

  return (
    <div className="space-y-1" data-testid="password-strength-meter">
      <div className="flex gap-1 h-1.5">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              "flex-1 rounded-full bg-muted transition-colors",
              i < level && COLORS[level]
            )}
          />
        ))}
      </div>
      <p
        className={cn(
          "text-xs",
          level <= 1 ? "text-destructive" : "text-muted-foreground"
        )}
      >
        Seguridad: {LABELS[level]}
        {password.length < 6 && " · mínimo 6 caracteres"}
      </p>
    </div>
  );
}
