export function isUnauthorizedError(error: Error): boolean {
  return /^401: .*Unauthorized/.test(error.message);
}

export function redirectToLogin(): void {
  window.location.href = "/api/login";
}

export function redirectToLogout(): void {
  window.location.href = "/api/logout";
}

export function getFullName(firstName?: string | null, lastName?: string | null): string {
  const parts = [firstName, lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : "Usuario";
}

export function getInitials(firstName?: string | null, lastName?: string | null): string {
  const first = firstName?.charAt(0)?.toUpperCase() || "";
  const last = lastName?.charAt(0)?.toUpperCase() || "";
  return first + last || "U";
}

export function isEmailFromLoyola(email?: string | null): boolean {
  if (!email) return false;
  return (
    email.endsWith("@gmail.com") ||
    email.endsWith("@iecolegioloyola.edu.co")
  );
}

export function formatRole(role: string): string {
  const roleMap: Record<string, string> = {
    student: "Estudiante",
    teacher: "Profesor",
    admin: "Administrador",
  };
  return roleMap[role] || role;
}

export function formatGrade(grade?: string | null): string {
  if (!grade) return "Sin asignar";
  return `${grade}° Grado`;
}
